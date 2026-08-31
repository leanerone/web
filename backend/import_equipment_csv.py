"""
机台数据 CSV 导入脚本 (SQLite 本地开发用)

用途:
    - 从 PANJOB 库导出 EQUIPMENTINFO 为 CSV (ADS 右键表 → Export Data → CSV)
    - 用本脚本导入到 SQLite 的 EQUIPMENTINFO 表
    - 替换 init_db.py 的 8 条样本数据为真实量产数据

使用:
    cd backend
    python import_equipment_csv.py equipment_export.csv

CSV 列名支持 (自动识别, 大小写不敏感):
    EQUIPMENT / equipment          → equipment (主键)
    EQUIPMENTTYPE / equipment_type → equipment_type
    EQUIPMENTMODEL / equipment_model → equipment_model
    LINE / line
    CCSERVER / cc_server
    AREA / area
    MOXA / moxa
    NPORT / nport
    NPORTIP / nport_ip
    NPORTCOM / nport_com
    CHARGEMAN / chargeman
    SMIF1NPORTIP / smif1_nport_ip
    SMIF2NPORTIP / smif2_nport_ip
    SMIF3NPORTIP / smif3_nport_ip
    SMIF4NPORTIP / smif4_nport_ip
    OS / os
    SRVTYPE / srv_type
    SOURCECODE / source_code

选项:
    --replace  清空现有机台数据后重新导入 (默认: 跳过已存在的 equipment)
"""
import sys
import csv
import json
import os
import argparse
from database.session import SessionLocal, engine
from database.models import Equipment
from database import Base


# CSV 列名 → 模型属性名 映射 (大小写不敏感, 支持多种命名)
COLUMN_MAP = {
    # CSV 列名 (upper)           : 模型属性
    "EQUIPMENT":                  "equipment",
    "EQUIPMENTTYPE":              "equipment_type",
    "EQUIPMENTMODEL":             "equipment_model",
    "LINE":                       "line",
    "CCSERVER":                   "cc_server",
    "AREA":                       "area",
    "MOXA":                       "moxa",
    "NPORT":                      "nport",
    "NPORTIP":                    "nport_ip",
    "NPORTCOM":                   "nport_com",
    "CHARGEMAN":                  "chargeman",
    "SMIF1NPORTIP":               "smif1_nport_ip",
    "SMIF2NPORTIP":               "smif2_nport_ip",
    "SMIF3NPORTIP":               "smif3_nport_ip",
    "SMIF4NPORTIP":               "smif4_nport_ip",
    "OS":                         "os",
    "SRVTYPE":                    "srv_type",
    "SOURCECODE":                 "source_code",
}


def normalize_header(h: str) -> str:
    """CSV 表头归一化: 去空格/引号/下划线, 转大写"""
    return h.strip().strip('"').strip("'").replace("_", "").upper()


def parse_row(row: dict) -> dict:
    """CSV 行 → Equipment 模型属性 dict"""
    result = {}
    for csv_col, value in row.items():
        norm = normalize_header(csv_col)
        if norm in COLUMN_MAP:
            attr = COLUMN_MAP[norm]
            # 空字符串转 None (与 Oracle NULL 一致)
            result[attr] = value.strip() if value and value.strip() else None
    return result


def import_csv(csv_path: str, replace: bool = False):
    """导入 CSV 到 EQUIPMENTINFO 表

    优化: 先读取全部 CSV 到内存并按 equipment 去重, 再批量插入
          避免 auto-flush 触发的 UNIQUE constraint 冲突
    """
    # 确保表存在
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        if replace:
            deleted = db.query(Equipment).delete()
            db.commit()
            print(f"已清空 {deleted} 条现有机台数据 (--replace 模式)")

        with open(csv_path, "r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            print(f"CSV 列名: {reader.fieldnames}")
            print("-" * 60)

            # 1. 读取全部行到内存, 按 equipment 去重 (后覆盖前)
            rows_dict = {}
            total_lines = 0
            empty_skipped = 0
            for row in reader:
                total_lines += 1
                data = parse_row(row)
                eq_name = data.get("equipment")
                if not eq_name:
                    empty_skipped += 1
                    continue
                rows_dict[eq_name] = data  # 去重: 后出现的覆盖先出现的

            dup_count = total_lines - len(rows_dict) - empty_skipped
            print(f"CSV 共 {total_lines} 行 | 去重 {dup_count} 条 | 空主键 {empty_skipped} 条 | 待导入 {len(rows_dict)} 条")

            # 2. 批量插入 (不在循环内 query, 避免 auto-flush 问题)
            if not replace:
                # 非替换模式: 先查出已存在的 equipment, 跳过
                existing_eqs = set(
                    r[0] for r in db.query(Equipment.equipment).filter(
                        Equipment.equipment.in_(list(rows_dict.keys()))
                    ).all()
                )
            else:
                existing_eqs = set()  # 替换模式: 已清空, 全部新增

            inserted = 0
            skipped = 0
            for eq_name, data in rows_dict.items():
                if eq_name in existing_eqs:
                    skipped += 1
                else:
                    db.add(Equipment(**data))
                    inserted += 1

            db.commit()

        print("-" * 60)
        print(f"导入完成: 新增 {inserted} | 跳过 {skipped}")
        total = db.query(Equipment).count()
        print(f"EQUIPMENTINFO 表当前共 {total} 条机台数据")

        # 生成 Git Source 分组映射表: 按 (equipment_type, equipment_model) 去重并编号
        # 说明: SOURCECODE 字段保留 0/1/2 产线区分含义不变;
        #       Git 源码按 EquipmentType+Model 区分, 这里生成编号表供参考,
        #       前端 Git Source 配置的映射 key 实际使用 "equipment_type|equipment_model" 字符串.
        print("=" * 60)
        print("Git Source 分组表 (按 EquipmentType + EquipmentModel 区分)")
        print("=" * 60)
        all_rows = db.query(Equipment).all()
        groups: dict[str, dict] = {}  # key "type|model" -> {type, model, count, source_codes}
        for eq in all_rows:
            t = (eq.equipment_type or "").strip()
            m = (eq.equipment_model or "").strip()
            if not t and not m:
                continue
            key = f"{t}|{m}"
            if key not in groups:
                groups[key] = {"type": t, "model": m, "count": 0, "source_codes": set()}
            groups[key]["count"] += 1
            sc = (eq.source_code or "").strip()
            if sc:
                groups[key]["source_codes"].add(sc)

        # 按数量降序排序后分配编号 (1, 2, 3, ...)
        sorted_groups = sorted(groups.items(), key=lambda kv: (-kv[1]["count"], kv[0]))
        print(f"{'编号':<6}{'EquipmentType':<20}{'EquipmentModel':<30}{'数量':<8}{'SOURCECODE'}")
        print("-" * 90)
        source_group_map = {}
        for idx, (key, info) in enumerate(sorted_groups, start=1):
            sc_str = "/".join(sorted(info["source_codes"])) if info["source_codes"] else "-"
            print(f"{idx:<6}{info['type']:<20}{info['model']:<30}{info['count']:<8}{sc_str}")
            source_group_map[str(idx)] = {
                "key": key,
                "equipment_type": info["type"],
                "equipment_model": info["model"],
                "count": info["count"],
                "source_codes": sorted(info["source_codes"]),
            }

        # 写入 source_group_map.json 供前端 Git Source 配置参考
        out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "source_group_map.json")
        with open(out_path, "w", encoding="utf-8") as jf:
            json.dump(source_group_map, jf, ensure_ascii=False, indent=2)
        print("-" * 90)
        print(f"共 {len(source_group_map)} 种 EquipmentType+Model 组合")
        print(f"映射表已写入: {out_path}")
        print("提示: 前端 Git Source 配置的 key 使用 'EquipmentType|EquipmentModel' 字符串,")
        print("      可点击配置弹窗内'从机台填充'按钮自动生成映射行, 再为每行填入 Git 子路径即可。")

    except FileNotFoundError:
        print(f"错误: 文件不存在 {csv_path}")
        sys.exit(1)
    except Exception as e:
        db.rollback()
        print(f"错误: {e}")
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="导入 CSV 机台数据到 SQLite EQUIPMENTINFO 表")
    parser.add_argument("csv_file", help="CSV 文件路径 (从 PANJOB 导出)")
    parser.add_argument("--replace", action="store_true", help="清空现有数据后重新导入 (默认跳过已存在)")
    args = parser.parse_args()

    print("=" * 60)
    print("机台数据 CSV 导入 (SQLite 本地开发用)")
    print(f"文件: {args.csv_file}")
    print(f"模式: {'替换' if args.replace else '跳过已存在'}")
    print("=" * 60)

    import_csv(args.csv_file, replace=args.replace)


if __name__ == "__main__":
    main()

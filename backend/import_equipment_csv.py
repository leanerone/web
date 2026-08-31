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

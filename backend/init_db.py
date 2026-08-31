"""
SQLite 本地开发数据库初始化脚本

用途:
    - 不等 DBA 授权时, 本地用 SQLite 开发调试
    - 启动后 main.py 会自动 create_all 建表 + 初始化用户/设置/工作类别
    - 本脚本补充: 机台样本数据 + 项目/任务/需求种子数据 (幂等, 可反复执行)

使用:
    cd backend
    python init_db.py

切换 Oracle 时本脚本不执行 (用 init_oracle.sql 在 ADS 执行)
"""
from database import Base, engine
from database.models import Equipment, Project, Task, Requirement
from database.session import SessionLocal


def init_equipment_samples(db):
    """机台样本数据 — 模拟量产 EQUIPMENTINFO 真实格式 (18 列)

    仅用于本地开发演示。生产环境直接读取 PANJOB.EQUIPMENTINFO 真表,
    不需要本脚本插入机台数据。
    """
    if db.query(Equipment).count() > 0:
        print("  机台数据已存在, 跳过")
        return

    samples = [
        {"equipment": "CATEOX-57",  "equipment_type": "CATEOX",  "equipment_model": "ASM-8350V-LPT",   "line": "T13", "cc_server": "C01C225", "area": "TF", "moxa": "9600", "nport": "4001", "nport_ip": "10.20.30.101", "nport_com": "1", "chargeman": "S.Q",  "smif1_nport_ip": "10.20.30.201", "smif2_nport_ip": "10.20.30.202", "smif3_nport_ip": "", "smif4_nport_ip": "", "os": "Win2019", "srv_type": "DL380 G8", "source_code": "5"},
        {"equipment": "GATEOX-57",  "equipment_type": "GATEOX",  "equipment_model": "TEL-82800S",      "line": "T13", "cc_server": "C01C226", "area": "TF", "moxa": "9600", "nport": "4002", "nport_ip": "10.20.30.102", "nport_com": "2", "chargeman": "L.C",  "smif1_nport_ip": "10.20.30.203", "smif2_nport_ip": "10.20.30.204", "smif3_nport_ip": "", "smif4_nport_ip": "", "os": "Win2019", "srv_type": "DL380 G8", "source_code": "3"},
        {"equipment": "CPC-55",     "equipment_type": "CPC",     "equipment_model": "DNS-A8S2000",      "line": "T14", "cc_server": "C01C227", "area": "TF", "moxa": "9600", "nport": "4003", "nport_ip": "10.20.30.103", "nport_com": "3", "chargeman": "W.H",  "smif1_nport_ip": "10.20.30.205", "smif2_nport_ip": "",                  "smif3_nport_ip": "", "smif4_nport_ip": "", "os": "Win2012", "srv_type": "DL380 G9", "source_code": "1"},
        {"equipment": "TTOX-54",    "equipment_type": "TTOX",    "equipment_model": "Thermawave-OP5205T","line": "T14", "cc_server": "C01C228", "area": "DF", "moxa": "9600", "nport": "4004", "nport_ip": "10.20.30.104", "nport_com": "4", "chargeman": "S.Q",  "smif1_nport_ip": "10.20.30.206", "smif2_nport_ip": "",                  "smif3_nport_ip": "", "smif4_nport_ip": "", "os": "Win2019", "srv_type": "DL380 G8", "source_code": "4"},
        {"equipment": "PECVD-01",   "equipment_type": "PECVD",  "equipment_model": "ASM-Trident",      "line": "T15", "cc_server": "C01C229", "area": "TF", "moxa": "9600", "nport": "4005", "nport_ip": "10.20.30.105", "nport_com": "5", "chargeman": "L.C",  "smif1_nport_ip": "",                  "smif2_nport_ip": "",                  "smif3_nport_ip": "", "smif4_nport_ip": "", "os": None,       "srv_type": "DL380 G9", "source_code": "2"},
        {"equipment": "PECVD-02",   "equipment_type": "PECVD",  "equipment_model": "ASM-Trident",      "line": "T15", "cc_server": "C01C230", "area": "TF", "moxa": "9600", "nport": "4006", "nport_ip": "10.20.30.106", "nport_com": "6", "chargeman": "W.H",  "smif1_nport_ip": "",                  "smif2_nport_ip": "",                  "smif3_nport_ip": "", "smif4_nport_ip": "", "os": "Win2019", "srv_type": "DL380 G8", "source_code": "2"},
        {"equipment": "LITHO-01",   "equipment_type": "LITHO",  "equipment_model": "ASML-PAS5500",      "line": "T16", "cc_server": "C01C231", "area": "DF", "moxa": "115200","nport": "4007", "nport_ip": "10.20.30.107", "nport_com": "7", "chargeman": "S.Q",  "smif1_nport_ip": "10.20.30.207", "smif2_nport_ip": "10.20.30.208", "smif3_nport_ip": "", "smif4_nport_ip": "", "os": "Win2019", "srv_type": "DL380 G9", "source_code": ""},
        {"equipment": "ETCH-01",    "equipment_type": "ETCH",   "equipment_model": "Lam-2300",         "line": "T16", "cc_server": "C01C232", "area": "DF", "moxa": "9600", "nport": "4008", "nport_ip": "10.20.30.108", "nport_com": "8", "chargeman": "L.C",  "smif1_nport_ip": "",                  "smif2_nport_ip": "",                  "smif3_nport_ip": "", "smif4_nport_ip": "", "os": None,       "srv_type": "DL380 G8", "source_code": ""},
    ]

    for s in samples:
        db.add(Equipment(**s))
    db.commit()
    print(f"  插入 {len(samples)} 条机台样本数据")


def init_projects(db):
    """项目种子数据 — 与 Oracle init_oracle.sql 段 4.1 对齐"""
    if db.query(Project).count() > 0:
        print("  项目数据已存在, 跳过")
        return

    projects_data = [
        {"name": "机台驱动升级项目",   "description": "升级所有机台的驱动版本",  "progress": 65.0},
        {"name": "CIM系统优化",        "description": "优化CIM系统性能",        "progress": 40.0},
        {"name": "新项目设备接入",     "description": "新项目设备接入CIM系统",   "progress": 25.0},
        {"name": "自动化测试框架",     "description": "建立自动化测试框架",      "progress": 80.0},
        {"name": "数据采集系统",       "description": "升级数据采集系统",        "progress": 50.0},
    ]
    for p in projects_data:
        db.add(Project(**p))
    db.commit()
    print(f"  插入 {len(projects_data)} 条项目数据")


def init_tasks(db):
    """任务种子数据 — 与 Oracle init_oracle.sql 段 4.2 对齐"""
    if db.query(Task).count() > 0:
        print("  任务数据已存在, 跳过")
        return

    tasks_data = [
        {"project_id": 1, "title": "光刻机驱动开发",   "priority": "high"},
        {"project_id": 1, "title": "刻蚀机驱动测试",   "priority": "medium"},
        {"project_id": 2, "title": "数据库性能调优",   "priority": "high"},
        {"project_id": 2, "title": "API接口优化",      "priority": "medium"},
        {"project_id": 3, "title": "新设备调研",       "priority": "medium"},
        {"project_id": 4, "title": "测试用例编写",     "priority": "medium"},
        {"project_id": 4, "title": "测试框架部署",     "priority": "high"},
        {"project_id": 5, "title": "数据采集脚本开发", "priority": "high"},
    ]
    for t in tasks_data:
        db.add(Task(**t))
    db.commit()
    print(f"  插入 {len(tasks_data)} 条任务数据")


def init_requirements(db):
    """需求种子数据 — 与 Oracle init_oracle.sql 段 4.3 对齐

    equipment_name 留空, 等真实机台数据导入后由用户手动关联
    """
    if db.query(Requirement).count() > 0:
        print("  需求数据已存在, 跳过")
        return

    requirements_data = [
        {"title": "机台A驱动升级",   "description": "将机台A的驱动从v1升级到v2",   "priority": "high",     "project_id": 1, "status": "dev"},
        {"title": "新增机台配置项",   "description": "为机台新增配置项支持",       "priority": "medium",   "project_id": 1, "status": "dev"},
        {"title": "机台B上线",       "description": "新机台B上线部署",             "priority": "critical", "project_id": 3, "status": "deploying"},
        {"title": "报表功能优化",     "description": "优化现有报表功能",           "priority": "low",      "project_id": 2, "status": "testing"},
        {"title": "系统告警优化",     "description": "优化系统告警机制",           "priority": "medium",   "project_id": 2, "status": "completed"},
    ]
    for r in requirements_data:
        db.add(Requirement(**r))
    db.commit()
    print(f"  插入 {len(requirements_data)} 条需求数据")


def init_database():
    """SQLite 本地开发数据库初始化 (幂等, 可反复执行)"""
    print("=" * 60)
    print("SQLite 本地开发数据库初始化")
    print("=" * 60)

    # 1. 建表 (main.py 启动时也会自动建, 这里兜底)
    Base.metadata.create_all(bind=engine)
    print("[1/5] 建表完成 (13 张业务表 + EQUIPMENTINFO)")

    db = SessionLocal()
    try:
        # 2. 机台样本数据
        print("[2/5] 机台样本数据 (模拟量产 EQUIPMENTINFO 18 列)")
        init_equipment_samples(db)

        # 3. 项目种子数据
        print("[3/5] 项目种子数据")
        init_projects(db)

        # 4. 任务种子数据
        print("[4/5] 任务种子数据")
        init_tasks(db)

        # 5. 需求种子数据
        print("[5/5] 需求种子数据")
        init_requirements(db)
    finally:
        db.close()

    print("=" * 60)
    print("初始化完成! 启动后端: uvicorn main:app --reload")
    print("前端 /equipment 页面将显示 8 条样本机台数据")
    print()
    print("提示: 用户/系统设置/工作类别由 main.py 启动时自动初始化, 本脚本不重复处理")
    print("提示: 生产环境用 Oracle + init_oracle.sql, 不需要本脚本")
    print("=" * 60)


if __name__ == "__main__":
    init_database()

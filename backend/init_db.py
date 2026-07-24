from database import Base, engine
from database.models import EquipmentType, Equipment, Project, Task, Requirement, Report
from database.session import SessionLocal


def init_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    equipment_types = [
        {"name": "光刻机", "description": "光刻设备", "manufacturer": "ASML"},
        {"name": "刻蚀机", "description": "刻蚀设备", "manufacturer": "Applied Materials"},
        {"name": "薄膜沉积", "description": "薄膜沉积设备", "manufacturer": "Lam Research"},
        {"name": "离子注入", "description": "离子注入设备", "manufacturer": "Axcelis"},
        {"name": "CMP", "description": "化学机械抛光", "manufacturer": "Applied Materials"},
        {"name": "清洗机", "description": "晶圆清洗设备", "manufacturer": "TEL"},
        {"name": "检测设备", "description": "检测设备", "manufacturer": "KLA-Tencor"},
        {"name": "PECVD", "description": "等离子体增强化学气相沉积", "manufacturer": "TEL"},
    ]
    
    types = []
    for et in equipment_types:
        t = EquipmentType(name=et["name"], description=et["description"], manufacturer=et["manufacturer"])
        db.add(t)
        types.append(t)
    
    db.commit()
    
    equipments = []
    for i in range(10):
        for j, etype in enumerate(types):
            eq = Equipment(
                type_id=etype.id,
                name=f"{etype.name}-{i+1:03d}",
                location=f"Fab-{chr(65 + (i % 4))}/Bay-{((i // 4) % 5) + 1}",
                driver_version=f"v2.{i}.{j}",
            )
            db.add(eq)
            equipments.append(eq)
    
    db.commit()
    
    projects_data = [
        {"name": "机台驱动升级项目", "description": "升级所有机台的驱动版本", "progress": 65.0},
        {"name": "CIM系统优化", "description": "优化CIM系统性能", "progress": 40.0},
        {"name": "新项目设备接入", "description": "新项目设备接入CIM系统", "progress": 25.0},
        {"name": "自动化测试框架", "description": "建立自动化测试框架", "progress": 80.0},
        {"name": "数据采集系统", "description": "升级数据采集系统", "progress": 50.0},
    ]
    
    proj_list = []
    for p in projects_data:
        proj = Project(name=p["name"], description=p["description"], progress=p["progress"])
        db.add(proj)
        proj_list.append(proj)
    
    db.commit()
    
    tasks_data = [
        {"project_id": 1, "title": "光刻机驱动开发", "priority": "high"},
        {"project_id": 1, "title": "刻蚀机驱动测试", "priority": "medium"},
        {"project_id": 2, "title": "数据库性能调优", "priority": "high"},
        {"project_id": 2, "title": "API接口优化", "priority": "medium"},
        {"project_id": 3, "title": "新设备调研", "priority": "medium"},
        {"project_id": 4, "title": "测试用例编写", "priority": "medium"},
        {"project_id": 4, "title": "测试框架部署", "priority": "high"},
        {"project_id": 5, "title": "数据采集脚本开发", "priority": "high"},
    ]
    
    for t in tasks_data:
        task = Task(project_id=t["project_id"], title=t["title"], priority=t["priority"])
        db.add(task)
    
    db.commit()
    
    requirements_data = [
        {"title": "机台A驱动升级", "description": "将机台A的驱动从v1升级到v2", "priority": "high", "project_id": 1},
        {"title": "新增机台配置项", "description": "为机台新增配置项支持", "priority": "medium", "project_id": 1},
        {"title": "机台B上线", "description": "新机台B上线部署", "priority": "critical", "project_id": 3},
        {"title": "报表功能优化", "description": "优化现有报表功能", "priority": "low", "project_id": 2},
        {"title": "系统告警优化", "description": "优化系统告警机制", "priority": "medium", "project_id": 2},
    ]
    
    for r in requirements_data:
        req = Requirement(title=r["title"], description=r["description"], priority=r["priority"], project_id=r["project_id"])
        db.add(req)
    
    db.commit()
    
    db.close()
    print("数据库初始化完成")


if __name__ == "__main__":
    init_database()

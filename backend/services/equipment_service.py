from sqlalchemy import or_
from sqlalchemy.orm import Session
from database.models import Equipment, EquipmentType, Configuration


def get_equipment_types(db: Session):
    """机台类型列表 — Oracle 中是视图(从 EQUIPMENTINFO 去重)，SQLite 中是普通表"""
    return db.query(EquipmentType).all()


def get_equipment_by_name(db: Session, equipment: str):
    """按机台编号(EQUIPMENT 主键)查询 — 量产表只读"""
    return db.query(Equipment).filter(Equipment.equipment == equipment).first()


def get_all_equipment(
    db: Session,
    keyword: str = None,
    equipment_type: str = None,
    area: str = None,
    line: str = None,
    page: int = 1,
    limit: int = 1000,
):
    """查询量产 EQUIPMENTINFO — 只读，按量产字段筛选

    Args:
        keyword: 关键字 (匹配 EQUIPMENT / EQUIPMENTTYPE / EQUIPMENTMODEL / CCSERVER / CHARGEMAN / SOURCECODE)
        equipment_type: 机台类型 EQUIPMENTTYPE
        area: 厂区 AREA
        line: 产线 LINE
    """
    query = db.query(Equipment)
    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            or_(
                Equipment.equipment.ilike(kw),
                Equipment.equipment_type.ilike(kw),
                Equipment.equipment_model.ilike(kw),
                Equipment.cc_server.ilike(kw),
                Equipment.chargeman.ilike(kw),
                Equipment.source_code.ilike(kw),
            )
        )
    if equipment_type:
        query = query.filter(Equipment.equipment_type == equipment_type)
    if area:
        query = query.filter(Equipment.area == area)
    if line:
        query = query.filter(Equipment.line == line)

    total = query.count()
    rows = query.offset((page - 1) * limit).limit(limit).all()
    return rows, total


def get_configurations(db: Session, equipment_name: str):
    """按机台编号(equipment_name 外键) 查配置历史"""
    return db.query(Configuration).filter(Configuration.equipment_name == equipment_name).all()


def create_configuration(db: Session, equipment_name: str, config_key: str, config_value: str, version: str = None):
    """新增机台配置项 (只对 CONFIGURATIONS 表写，不碰 EQUIPMENTINFO)"""
    db_config = Configuration(
        equipment_name=equipment_name,
        config_key=config_key,
        config_value=config_value,
        version=version,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

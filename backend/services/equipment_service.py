from sqlalchemy.orm import Session
from database.models import Equipment, EquipmentType, EquipmentStatus, Configuration
from schemas.equipment import EquipmentCreate, EquipmentUpdate


def get_equipment_types(db: Session):
    return db.query(EquipmentType).all()


def get_equipment(db: Session, equipment_id: int):
    return db.query(Equipment).filter(Equipment.id == equipment_id).first()


def get_equipment_with_type(db: Session, equipment_id: int):
    return db.query(Equipment).join(EquipmentType).filter(Equipment.id == equipment_id).first()


def get_all_equipment(db: Session, keyword: str = None, status: str = None, type_id: int = None, page: int = 1, limit: int = 10):
    query = db.query(Equipment).join(EquipmentType)
    if keyword:
        query = query.filter(Equipment.name.contains(keyword))
    if status:
        query = query.filter(Equipment.status == status)
    if type_id:
        query = query.filter(Equipment.type_id == type_id)
    total = query.count()
    equipment = query.offset((page - 1) * limit).limit(limit).all()
    return equipment, total


def create_equipment(db: Session, equipment: EquipmentCreate):
    db_equipment = Equipment(
        type_id=equipment.type_id,
        name=equipment.name,
        location=equipment.location,
        driver_version=equipment.driver_version,
        installed_at=equipment.installed_at,
    )
    db.add(db_equipment)
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def update_equipment(db: Session, equipment_id: int, equipment: EquipmentUpdate):
    db_equipment = get_equipment(db, equipment_id)
    if not db_equipment:
        return None
    if equipment.name is not None:
        db_equipment.name = equipment.name
    if equipment.type_id is not None:
        db_equipment.type_id = equipment.type_id
    if equipment.location is not None:
        db_equipment.location = equipment.location
    if equipment.status is not None:
        db_equipment.status = EquipmentStatus(equipment.status)
    if equipment.driver_version is not None:
        db_equipment.driver_version = equipment.driver_version
    db.commit()
    db.refresh(db_equipment)
    return db_equipment


def delete_equipment(db: Session, equipment_id: int):
    db_equipment = get_equipment(db, equipment_id)
    if not db_equipment:
        return False
    db.delete(db_equipment)
    db.commit()
    return True


def get_configurations(db: Session, equipment_id: int):
    return db.query(Configuration).filter(Configuration.equipment_id == equipment_id).all()


def create_configuration(db: Session, equipment_id: int, config_key: str, config_value: str, version: str = None):
    db_config = Configuration(
        equipment_id=equipment_id,
        config_key=config_key,
        config_value=config_value,
        version=version,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config

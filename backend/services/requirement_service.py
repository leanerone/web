from sqlalchemy.orm import Session
from database.models import Requirement, RequirementStatus, RequirementPriority, ChangeRecord
from schemas.requirement import RequirementCreate, RequirementUpdate


def _enum_value(v) -> str:
    """str 枚举取原始值，避免 f-string 输出 'RequirementStatus.dev' 这类 repr"""
    return getattr(v, "value", v)


def get_requirements(db: Session, keyword: str = None, status: str = None, priority: str = None, project_id: int = None, equipment_name: str = None, page: int = 1, limit: int = 100):
    query = db.query(Requirement)
    if keyword:
        query = query.filter(Requirement.title.contains(keyword))
    if status:
        query = query.filter(Requirement.status == status)
    if priority:
        query = query.filter(Requirement.priority == priority)
    if project_id:
        query = query.filter(Requirement.project_id == project_id)
    if equipment_name:
        # equipment_name 存 JSON 数组字符串, 用 contains 做"包含某机台"匹配
        query = query.filter(Requirement.equipment_name.contains(equipment_name))
    total = query.count()
    requirements = query.order_by(Requirement.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return requirements, total


def get_requirement(db: Session, requirement_id: int):
    return db.query(Requirement).filter(Requirement.id == requirement_id).first()


def create_requirement(db: Session, requirement: RequirementCreate):
    db_requirement = Requirement(
        title=requirement.title,
        description=requirement.description,
        priority=RequirementPriority(requirement.priority) if requirement.priority else RequirementPriority.medium,
        status=RequirementStatus(requirement.status) if requirement.status else RequirementStatus.dev,
        project_id=requirement.project_id,
        equipment_name=requirement.equipment_name,
    )
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


def update_requirement(db: Session, requirement_id: int, requirement: RequirementUpdate):
    db_requirement = get_requirement(db, requirement_id)
    if not db_requirement:
        return None
    # 记录字段变更，最后统一写入 ChangeRecord
    changes: list[tuple[str, str]] = []
    if requirement.title is not None and requirement.title != db_requirement.title:
        changes.append(("标题", f"{db_requirement.title} → {requirement.title}"))
        db_requirement.title = requirement.title
    if requirement.description is not None and requirement.description != db_requirement.description:
        changes.append(("描述", "更新"))
        db_requirement.description = requirement.description
    if requirement.priority is not None and requirement.priority != db_requirement.priority:
        changes.append(("优先级", f"{_enum_value(db_requirement.priority)} → {_enum_value(requirement.priority)}"))
        db_requirement.priority = RequirementPriority(requirement.priority)
    if requirement.status is not None and requirement.status != db_requirement.status:
        changes.append(("状态", f"{_enum_value(db_requirement.status)} → {_enum_value(requirement.status)}"))
        db_requirement.status = RequirementStatus(requirement.status)
    if requirement.project_id is not None and requirement.project_id != db_requirement.project_id:
        changes.append(("关联项目", f"#{db_requirement.project_id} → #{requirement.project_id}"))
        db_requirement.project_id = requirement.project_id
    if requirement.equipment_name is not None and requirement.equipment_name != db_requirement.equipment_name:
        changes.append(("关联机台", "更新"))
        db_requirement.equipment_name = requirement.equipment_name
    if requirement.notes_url is not None:
        db_requirement.notes_url = requirement.notes_url
    if requirement.notes_doc_id is not None:
        db_requirement.notes_doc_id = requirement.notes_doc_id
    if changes:
        description = "；".join(f"{field}: {detail}" for field, detail in changes)
        db.add(ChangeRecord(
            requirement_id=db_requirement.id,
            change_type="自动记录",
            description=description,
        ))
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


def get_change_records(db: Session, requirement_id: int):
    return (
        db.query(ChangeRecord)
        .filter(ChangeRecord.requirement_id == requirement_id)
        .order_by(ChangeRecord.applied_at.desc(), ChangeRecord.id.desc())
        .all()
    )


def create_change_record(db: Session, requirement_id: int, record: "object") -> ChangeRecord:
    """record: schemas.requirement.ChangeRecordCreate"""
    db_record = ChangeRecord(
        requirement_id=requirement_id,
        change_type=record.change_type,
        description=record.description,
        file_path=record.file_path,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def delete_requirement(db: Session, requirement_id: int):
    db_requirement = get_requirement(db, requirement_id)
    if not db_requirement:
        return False
    db.delete(db_requirement)
    db.commit()
    return True

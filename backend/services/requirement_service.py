from sqlalchemy.orm import Session
from database.models import Requirement, RequirementStatus, RequirementPriority
from schemas.requirement import RequirementCreate, RequirementUpdate


def get_requirements(db: Session, keyword: str = None, status: str = None, priority: str = None, page: int = 1, limit: int = 10):
    query = db.query(Requirement)
    if keyword:
        query = query.filter(Requirement.title.contains(keyword))
    if status:
        query = query.filter(Requirement.status == status)
    if priority:
        query = query.filter(Requirement.priority == priority)
    total = query.count()
    requirements = query.offset((page - 1) * limit).limit(limit).all()
    return requirements, total


def get_requirement(db: Session, requirement_id: int):
    return db.query(Requirement).filter(Requirement.id == requirement_id).first()


def create_requirement(db: Session, requirement: RequirementCreate):
    db_requirement = Requirement(
        title=requirement.title,
        description=requirement.description,
        priority=RequirementPriority(requirement.priority) if requirement.priority else RequirementPriority.medium,
        equipment_id=requirement.equipment_id,
    )
    db.add(db_requirement)
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


def update_requirement(db: Session, requirement_id: int, requirement: RequirementUpdate):
    db_requirement = get_requirement(db, requirement_id)
    if not db_requirement:
        return None
    if requirement.title is not None:
        db_requirement.title = requirement.title
    if requirement.description is not None:
        db_requirement.description = requirement.description
    if requirement.priority is not None:
        db_requirement.priority = RequirementPriority(requirement.priority)
    if requirement.status is not None:
        db_requirement.status = RequirementStatus(requirement.status)
    if requirement.equipment_id is not None:
        db_requirement.equipment_id = requirement.equipment_id
    db.commit()
    db.refresh(db_requirement)
    return db_requirement


def delete_requirement(db: Session, requirement_id: int):
    db_requirement = get_requirement(db, requirement_id)
    if not db_requirement:
        return False
    db.delete(db_requirement)
    db.commit()
    return True

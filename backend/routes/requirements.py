from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.requirement_service import (
    get_requirements,
    get_requirement,
    create_requirement,
    update_requirement,
    delete_requirement,
    get_change_records,
    create_change_record,
)
from schemas.requirement import (
    RequirementCreate,
    RequirementUpdate,
    RequirementResponse,
    ChangeRecordCreate,
    ChangeRecordResponse,
)

router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("/")
def list_requirements(
    keyword: str = Query(None),
    status: str = Query(None),
    priority: str = Query(None),
    project_id: int = Query(None),
    equipment_name: str = Query(None, description="机台编号 (EQUIPMENTINFO.EQUIPMENT)"),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    requirements, total = get_requirements(db, keyword, status, priority, project_id, equipment_name, page, limit)
    return {
        "success": True,
        "data": [RequirementResponse.model_validate(r) for r in requirements],
        "total": total,
    }


@router.get("/{requirement_id}")
def get_requirement_detail(requirement_id: int, db: Session = Depends(get_db)):
    requirement = get_requirement(db, requirement_id)
    if not requirement:
        return {"success": False, "message": "需求不存在"}
    return {"success": True, "data": RequirementResponse.model_validate(requirement)}


@router.post("/")
def create_requirement_api(requirement: RequirementCreate, db: Session = Depends(get_db)):
    requirement = create_requirement(db, requirement)
    return {"success": True, "data": RequirementResponse.model_validate(requirement)}


@router.put("/{requirement_id}")
def update_requirement_api(requirement_id: int, requirement: RequirementUpdate, db: Session = Depends(get_db)):
    requirement = update_requirement(db, requirement_id, requirement)
    if not requirement:
        return {"success": False, "message": "需求不存在"}
    return {"success": True, "data": RequirementResponse.model_validate(requirement)}


@router.delete("/{requirement_id}")
def delete_requirement_api(requirement_id: int, db: Session = Depends(get_db)):
    success = delete_requirement(db, requirement_id)
    if not success:
        return {"success": False, "message": "需求不存在"}
    return {"success": True}


@router.get("/{requirement_id}/changes")
def list_change_records(requirement_id: int, db: Session = Depends(get_db)):
    if not get_requirement(db, requirement_id):
        return {"success": False, "message": "需求不存在"}
    records = get_change_records(db, requirement_id)
    return {
        "success": True,
        "data": [ChangeRecordResponse.model_validate(r) for r in records],
    }


@router.post("/{requirement_id}/changes")
def add_change_record(requirement_id: int, record: ChangeRecordCreate, db: Session = Depends(get_db)):
    if not get_requirement(db, requirement_id):
        return {"success": False, "message": "需求不存在"}
    created = create_change_record(db, requirement_id, record)
    return {"success": True, "data": ChangeRecordResponse.model_validate(created)}

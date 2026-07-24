from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.requirement_service import get_requirements, get_requirement, create_requirement, update_requirement, delete_requirement
from schemas.requirement import RequirementCreate, RequirementUpdate, RequirementResponse

router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("/")
def list_requirements(
    keyword: str = Query(None),
    status: str = Query(None),
    priority: str = Query(None),
    project_id: int = Query(None),
    equipment_id: int = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    requirements, total = get_requirements(db, keyword, status, priority, project_id, equipment_id, page, limit)
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

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.equipment_service import (
    get_equipment_types, get_equipment, get_all_equipment, create_equipment,
    update_equipment, delete_equipment, get_configurations
)
from schemas.equipment import (
    EquipmentTypeResponse, EquipmentCreate, EquipmentUpdate, EquipmentResponse, ConfigurationResponse
)

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("/types")
def list_equipment_types(db: Session = Depends(get_db)):
    types = get_equipment_types(db)
    return {"success": True, "data": [EquipmentTypeResponse.model_validate(t) for t in types]}


@router.get("/")
def list_equipment(
    keyword: str = Query(None),
    status: str = Query(None),
    type_id: int = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    equipment, total = get_all_equipment(db, keyword, status, type_id, page, limit)
    return {
        "success": True,
        "data": [EquipmentResponse.model_validate(e) for e in equipment],
        "total": total,
    }


@router.get("/{equipment_id}")
def get_equipment_detail(equipment_id: int, db: Session = Depends(get_db)):
    equipment = get_equipment_with_type(db, equipment_id)
    if not equipment:
        return {"success": False, "message": "机台不存在"}
    return {"success": True, "data": EquipmentResponse.model_validate(equipment)}


@router.post("/")
def create_equipment_api(equipment: EquipmentCreate, db: Session = Depends(get_db)):
    equipment = create_equipment(db, equipment)
    return {"success": True, "data": EquipmentResponse.model_validate(equipment)}


@router.put("/{equipment_id}")
def update_equipment_api(equipment_id: int, equipment: EquipmentUpdate, db: Session = Depends(get_db)):
    equipment = update_equipment(db, equipment_id, equipment)
    if not equipment:
        return {"success": False, "message": "机台不存在"}
    return {"success": True, "data": EquipmentResponse.model_validate(equipment)}


@router.delete("/{equipment_id}")
def delete_equipment_api(equipment_id: int, db: Session = Depends(get_db)):
    success = delete_equipment(db, equipment_id)
    if not success:
        return {"success": False, "message": "机台不存在"}
    return {"success": True}


@router.get("/{equipment_id}/configurations")
def get_equipment_configurations(equipment_id: int, db: Session = Depends(get_db)):
    configs = get_configurations(db, equipment_id)
    return {"success": True, "data": [ConfigurationResponse.model_validate(c) for c in configs]}


def get_equipment_with_type(db: Session, equipment_id: int):
    return get_equipment(db, equipment_id)

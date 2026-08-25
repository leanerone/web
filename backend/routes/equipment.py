from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.equipment_service import (
    get_equipment_types, get_equipment_by_name, get_all_equipment, get_configurations
)
from schemas.equipment import (
    EquipmentTypeResponse, EquipmentResponse, ConfigurationResponse
)

router = APIRouter(prefix="/equipment", tags=["equipment"])


@router.get("/types")
def list_equipment_types(db: Session = Depends(get_db)):
    """机台类型列表 (Oracle: 视图从 EQUIPMENTINFO 去重; SQLite: 普通表)"""
    types = get_equipment_types(db)
    return {"success": True, "data": [EquipmentTypeResponse.model_validate(t) for t in types]}


@router.get("/")
def list_equipment(
    keyword: str = Query(None, description="关键字: 机台编号/类型/型号/CC服务器/负责人/SOURCECODE"),
    equipment_type: str = Query(None, description="机台类型 EQUIPMENTTYPE"),
    area: str = Query(None, description="厂区 AREA"),
    line: str = Query(None, description="产线 LINE"),
    page: int = Query(1, ge=1),
    limit: int = Query(1000, ge=1, le=10000),
    db: Session = Depends(get_db),
):
    """机台列表 — 直接读取量产表 EQUIPMENTINFO，只读"""
    rows, total = get_all_equipment(db, keyword, equipment_type, area, line, page, limit)
    return {
        "success": True,
        "data": [EquipmentResponse.model_validate(e) for e in rows],
        "total": total,
    }


@router.get("/{equipment_name}/configurations")
def get_equipment_configurations(equipment_name: str, db: Session = Depends(get_db)):
    """机台配置项历史 (按 EQUIPMENT 主键查询)"""
    configs = get_configurations(db, equipment_name)
    return {"success": True, "data": [ConfigurationResponse.model_validate(c) for c in configs]}


@router.get("/{equipment_name}")
def get_equipment_detail(equipment_name: str, db: Session = Depends(get_db)):
    """机台详情 — 按 EQUIPMENT 主键(机台编号)查询

    量产表 EQUIPMENTINFO 只读，不提供 POST/PUT/DELETE。
    若需修改机台主数据，请直接在 MES/EAP 量产系统操作。
    """
    equipment = get_equipment_by_name(db, equipment_name)
    if not equipment:
        return {"success": False, "message": f"机台不存在: {equipment_name}"}
    return {"success": True, "data": EquipmentResponse.model_validate(equipment)}

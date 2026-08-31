from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from services.setting_service import (
    get_settings,
    get_setting,
    set_setting,
    delete_setting,
    get_ai_settings,
    save_ai_settings,
    test_ai_connection,
    get_notes_settings,
    save_notes_settings,
)
from schemas.setting import SettingResponse, AISettings, NotesSettings
from typing import List

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=List[SettingResponse])
def list_settings(category: str = None, db: Session = Depends(get_db)):
    settings = get_settings(db, category)
    return settings


@router.get("/{key}", response_model=SettingResponse)
def get_setting_detail(key: str, db: Session = Depends(get_db)):
    setting = get_setting(db, key)
    if not setting:
        return {"success": False, "message": "设置项不存在"}
    return setting


@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, value: str, description: str = None, category: str = "general", db: Session = Depends(get_db)):
    setting = set_setting(db, key, value, description, category)
    return setting


@router.delete("/{key}")
def delete_setting_by_key(key: str, db: Session = Depends(get_db)):
    success = delete_setting(db, key)
    return {"success": success}


@router.get("/ai/config")
def get_ai_config(db: Session = Depends(get_db)):
    settings = get_ai_settings(db)
    return {"success": True, "data": settings.model_dump()}


@router.post("/ai/config")
def update_ai_config(settings: AISettings, db: Session = Depends(get_db)):
    save_ai_settings(db, settings)
    return {"success": True, "message": "AI配置已保存"}


@router.post("/ai/test")
def test_ai_config(db: Session = Depends(get_db)):
    """用 DB 中已保存的 AI 配置发起连接测试"""
    result = test_ai_connection(db)
    return {"success": result.get("success", False), "data": result}


@router.get("/notes/config")
def get_notes_config(db: Session = Depends(get_db)):
    settings = get_notes_settings(db)
    return {"success": True, "data": settings.model_dump()}


@router.post("/notes/config")
def update_notes_config(settings: NotesSettings, db: Session = Depends(get_db)):
    save_notes_settings(db, settings)
    return {"success": True, "message": "Notes配置已保存"}

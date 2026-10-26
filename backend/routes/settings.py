from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
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
from typing import List, Optional

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingUpsertRequest(BaseModel):
    value: str
    description: Optional[str] = None
    category: str = "general"


@router.get("")
def list_settings(category: str = None, db: Session = Depends(get_db)):
    settings = get_settings(db, category)
    return {"success": True, "data": settings}


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


# 注意：静态路径路由必须声明在 /{key} 之前，否则 "ai"/"notes" 会被当作 key 捕获


@router.get("/{key}")
def get_setting_detail(key: str, db: Session = Depends(get_db)):
    setting = get_setting(db, key)
    if not setting:
        # 不能返回 {"success": False}——与 response_model 校验冲突会 500
        raise HTTPException(status_code=404, detail="设置项不存在")
    return {"success": True, "data": setting}


@router.put("/{key}")
def update_setting(key: str, body: SettingUpsertRequest, db: Session = Depends(get_db)):
    # 值走 request body，避免敏感配置进入 URL / 访问日志
    setting = set_setting(db, key, body.value, body.description, body.category)
    return {"success": True, "data": setting}


@router.delete("/{key}")
def delete_setting_by_key(key: str, db: Session = Depends(get_db)):
    success = delete_setting(db, key)
    return {"success": success}

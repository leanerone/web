from sqlalchemy.orm import Session
from database.models import SystemSetting
from schemas.setting import SettingCreate, SettingUpdate, AISettings, NotesSettings
from typing import List, Optional, Dict
import json


def get_settings(db: Session, category: str = None) -> List[SystemSetting]:
    query = db.query(SystemSetting)
    if category:
        query = query.filter(SystemSetting.category == category)
    return query.all()


def get_setting(db: Session, key: str) -> Optional[SystemSetting]:
    return db.query(SystemSetting).filter(SystemSetting.key == key).first()


def get_setting_value(db: Session, key: str, default: str = "") -> str:
    setting = get_setting(db, key)
    return setting.value if setting else default


def set_setting(db: Session, key: str, value: str, description: str = None, category: str = "general") -> SystemSetting:
    setting = get_setting(db, key)
    if setting:
        setting.value = value
        if description:
            setting.description = description
        if category:
            setting.category = category
    else:
        setting = SystemSetting(
            key=key,
            value=value,
            description=description or "",
            category=category or "general"
        )
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


def delete_setting(db: Session, key: str) -> bool:
    setting = get_setting(db, key)
    if not setting:
        return False
    db.delete(setting)
    db.commit()
    return True


def get_ai_settings(db: Session) -> AISettings:
    return AISettings(
        openai_api_key=get_setting_value(db, "openai_api_key", ""),
        openai_api_base=get_setting_value(db, "openai_api_base", "https://api.openai.com/v1"),
        ai_model=get_setting_value(db, "ai_model", "gpt-4o-mini"),
    )


def save_ai_settings(db: Session, settings: AISettings) -> None:
    set_setting(db, "openai_api_key", settings.openai_api_key, "OpenAI API Key", "ai")
    set_setting(db, "openai_api_base", settings.openai_api_base, "OpenAI API Base URL", "ai")
    set_setting(db, "ai_model", settings.ai_model, "AI Model Name", "ai")


def test_ai_connection(db: Session) -> dict:
    """用 DB 中保存的 AI 配置发起一次最小化测试请求, 返回连接是否可用。

    失败原因分类: 缺少 api_key / openai 库未安装 / 网络/鉴权错误 / 超时
    """
    import time
    ai = get_ai_settings(db)
    if not ai.openai_api_key:
        return {
            "success": False,
            "message": "未配置 API Key, 请先填写并保存 AI 配置",
            "model": ai.ai_model,
            "base_url": ai.openai_api_base,
        }
    try:
        from openai import OpenAI
    except ImportError:
        return {
            "success": False,
            "message": "后端未安装 openai 包 (pip install openai)",
            "model": ai.ai_model,
            "base_url": ai.openai_api_base,
        }

    client = OpenAI(api_key=ai.openai_api_key, base_url=ai.openai_api_base or None)
    start = time.time()
    try:
        resp = client.chat.completions.create(
            model=ai.ai_model or "gpt-4o-mini",
            messages=[
                {"role": "system", "content": "你是一个连接测试助手。"},
                {"role": "user", "content": "请回复: 连接成功"},
            ],
            max_tokens=20,
            temperature=0,
            timeout=30,
        )
        elapsed = round(time.time() - start, 2)
        reply = (resp.choices[0].message.content or "").strip() if resp.choices else ""
        return {
            "success": True,
            "message": f"连接成功 (耗时 {elapsed}s)",
            "model": ai.ai_model,
            "base_url": ai.openai_api_base,
            "reply": reply,
            "elapsed": elapsed,
        }
    except Exception as e:
        elapsed = round(time.time() - start, 2)
        # 常见错误归类提示
        msg = str(e)
        hint = ""
        if "401" in msg or "Incorrect API key" in msg or "Authentication" in msg:
            hint = " (API Key 无效或过期, 请检查 Key 是否正确)"
        elif "404" in msg or "model" in msg.lower() and "not found" in msg.lower():
            hint = " (模型名不存在或无权访问, 请检查 ai_model 设置)"
        elif "Connection" in msg or "connect" in msg.lower() or "timed out" in msg.lower():
            hint = " (无法连接到 API Base URL, 请检查地址/网络/代理)"
        return {
            "success": False,
            "message": f"请求失败 ({elapsed}s): {msg}{hint}",
            "model": ai.ai_model,
            "base_url": ai.openai_api_base,
            "elapsed": elapsed,
        }


def get_notes_settings(db: Session) -> NotesSettings:
    return NotesSettings(
        notes_server_url=get_setting_value(db, "notes_server_url", ""),
        notes_user=get_setting_value(db, "notes_user", ""),
        notes_password=get_setting_value(db, "notes_password", ""),
    )


def save_notes_settings(db: Session, settings: NotesSettings) -> None:
    set_setting(db, "notes_server_url", settings.notes_server_url, "HCL Notes Server URL", "notes")
    set_setting(db, "notes_user", settings.notes_user, "HCL Notes Username", "notes")
    set_setting(db, "notes_password", settings.notes_password, "HCL Notes Password", "notes")


def init_default_settings(db: Session):
    default_settings = [
        {"key": "system_name", "value": "CIM Work Manager", "description": "系统名称", "category": "general"},
        {"key": "openai_api_key", "value": "", "description": "OpenAI API Key", "category": "ai"},
        {"key": "openai_api_base", "value": "https://api.openai.com/v1", "description": "OpenAI API Base URL", "category": "ai"},
        {"key": "ai_model", "value": "gpt-4o-mini", "description": "AI Model Name", "category": "ai"},
        {"key": "notes_server_url", "value": "", "description": "HCL Notes Server URL", "category": "notes"},
        {"key": "notes_user", "value": "", "description": "HCL Notes Username", "category": "notes"},
        {"key": "notes_password", "value": "", "description": "HCL Notes Password", "category": "notes"},
    ]
    
    for setting_data in default_settings:
        existing = get_setting(db, setting_data["key"])
        if not existing:
            set_setting(
                db,
                setting_data["key"],
                setting_data["value"],
                setting_data["description"],
                setting_data["category"]
            )

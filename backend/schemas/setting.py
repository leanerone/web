from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = "general"


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


class SettingResponse(SettingBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AISettings(BaseModel):
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"


class NotesSettings(BaseModel):
    notes_server_url: str = ""
    notes_user: str = ""
    notes_password: str = ""

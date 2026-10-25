from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RequirementBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"


class RequirementCreate(RequirementBase):
    project_id: Optional[int] = None
    equipment_name: Optional[str] = None
    notes_url: Optional[str] = None
    notes_doc_id: Optional[int] = None


class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    project_id: Optional[int] = None
    equipment_name: Optional[str] = None
    notes_url: Optional[str] = None
    notes_doc_id: Optional[int] = None


class RequirementResponse(RequirementBase):
    id: int
    status: str
    project_id: Optional[int] = None
    equipment_name: Optional[str] = None
    notes_url: Optional[str] = None
    notes_doc_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChangeRecordCreate(BaseModel):
    change_type: str
    description: str
    file_path: Optional[str] = None


class ChangeRecordResponse(BaseModel):
    id: int
    requirement_id: int
    change_type: str
    description: str
    file_path: Optional[str] = None
    applied_at: datetime

    class Config:
        from_attributes = True

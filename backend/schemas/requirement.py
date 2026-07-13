from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class RequirementBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"


class RequirementCreate(RequirementBase):
    equipment_id: Optional[int] = None


class RequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    equipment_id: Optional[int] = None


class RequirementResponse(RequirementBase):
    id: int
    status: str
    equipment_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

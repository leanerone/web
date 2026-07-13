from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[date] = None


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[date] = None


class TaskResponse(TaskBase):
    id: int
    project_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

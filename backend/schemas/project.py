from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    progress: Optional[float] = None


class ProjectResponse(ProjectBase):
    id: int
    status: str
    progress: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class ReportBase(BaseModel):
    title: str
    report_date: date
    content: Optional[str] = None


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class ReportResponse(ReportBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

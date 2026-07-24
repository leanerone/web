from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List


class WorkCategoryBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = 0


class WorkCategoryCreate(WorkCategoryBase):
    pass


class WorkCategoryUpdate(WorkCategoryBase):
    name: Optional[str] = None
    code: Optional[str] = None


class WorkCategoryResponse(WorkCategoryBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkItemBase(BaseModel):
    title: str
    details: Optional[str] = None
    urgency: Optional[str] = "na"
    importance: Optional[str] = "na"
    status: Optional[str] = "pending"
    priority_score: Optional[float] = 0.0
    due_date: Optional[date] = None
    category_id: Optional[int] = None
    project_id: Optional[int] = None
    source_type: Optional[str] = "manual"
    source_url: Optional[str] = None
    ai_notes: Optional[str] = None


class WorkItemCreate(WorkItemBase):
    pass


class WorkItemUpdate(BaseModel):
    title: Optional[str] = None
    details: Optional[str] = None
    urgency: Optional[str] = None
    importance: Optional[str] = None
    status: Optional[str] = None
    priority_score: Optional[float] = None
    due_date: Optional[date] = None
    category_id: Optional[int] = None
    project_id: Optional[int] = None
    ai_notes: Optional[str] = None


class WorkItemResponse(WorkItemBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category: Optional[WorkCategoryResponse] = None

    class Config:
        from_attributes = True


class DailyPlanBase(BaseModel):
    plan_date: date
    items_order: Optional[str] = None
    ai_suggestions: Optional[str] = None
    summary: Optional[str] = None


class DailyPlanCreate(DailyPlanBase):
    user_id: Optional[int] = None


class DailyPlanResponse(DailyPlanBase):
    id: int
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkLogBase(BaseModel):
    work_item_id: int
    action: str
    description: Optional[str] = None


class WorkLogCreate(WorkLogBase):
    pass


class WorkLogResponse(WorkLogBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ImportTableRequest(BaseModel):
    table_text: str
    project_id: Optional[int] = None


class BatchWorkItemCreate(BaseModel):
    items: List[WorkItemCreate]


class PriorityUpdateRequest(BaseModel):
    urgency: Optional[str] = None
    importance: Optional[str] = None
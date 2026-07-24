from pydantic import BaseModel
from typing import Optional, List


class AIPlanRequest(BaseModel):
    input: str
    tasks: Optional[List[dict]] = None
    projects: Optional[List[dict]] = None


class AIPlanResponse(BaseModel):
    suggestions: List[str]
    plan: str


class AIOptimizeRequest(BaseModel):
    tasks: List[dict]


class AIOptimizeResponse(BaseModel):
    optimized_tasks: List[dict]
    suggestions: List[str]


class AIWeeklyReportRequest(BaseModel):
    start_date: str
    end_date: str
    projects: Optional[List[dict]] = None
    requirements: Optional[List[dict]] = None
    tasks: Optional[List[dict]] = None


class AIWeeklyReportResponse(BaseModel):
    content: str


class DailyStandupRequest(BaseModel):
    work_items: Optional[List[dict]] = None
    date: Optional[str] = None


class DailyStandupResponse(BaseModel):
    today_tasks: List[dict]
    overdue_tasks: List[dict]
    suggestions: List[str]
    summary: str


class SmartSortRequest(BaseModel):
    work_items: List[dict]
    strategy: Optional[str] = "priority"


class SmartSortResponse(BaseModel):
    sorted_items: List[dict]
    strategy: str
    explanation: str


class ReminderCheckRequest(BaseModel):
    work_items: Optional[List[dict]] = None
    date: Optional[str] = None


class ReminderCheckResponse(BaseModel):
    overdue_count: int
    high_priority_count: int
    reminders: List[dict]
    message: str

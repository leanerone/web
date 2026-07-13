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

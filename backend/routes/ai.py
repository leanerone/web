from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from services.ai_service import generate_work_plan, optimize_tasks, generate_weekly_report
from schemas.ai import AIPlanRequest, AIPlanResponse, AIOptimizeRequest, AIOptimizeResponse, AIWeeklyReportRequest, AIWeeklyReportResponse

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/plan", response_model=AIPlanResponse)
def ai_plan(request: AIPlanRequest):
    result = generate_work_plan(request.input, request.tasks, request.projects)
    return AIPlanResponse(
        suggestions=result.get("suggestions", []),
        plan=result.get("plan", "")
    )


@router.post("/optimize", response_model=AIOptimizeResponse)
def ai_optimize(request: AIOptimizeRequest):
    result = optimize_tasks(request.tasks)
    return AIOptimizeResponse(
        optimized_tasks=result.get("optimized_tasks", []),
        suggestions=result.get("suggestions", [])
    )


@router.post("/weekly-report", response_model=AIWeeklyReportResponse)
def ai_weekly_report(request: AIWeeklyReportRequest):
    result = generate_weekly_report(request.start_date, request.end_date, request.projects, request.requirements, request.tasks)
    return AIWeeklyReportResponse(
        content=result.get("content", "")
    )

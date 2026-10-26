from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from services.ai_service import (
    generate_work_plan, optimize_tasks, generate_weekly_report,
    generate_daily_standup, smart_sort_work_items, check_reminders
)
from services.setting_service import get_ai_settings
from schemas.ai import (
    AIPlanRequest, AIPlanResponse, AIOptimizeRequest, AIOptimizeResponse,
    AIWeeklyReportRequest, AIWeeklyReportResponse,
    DailyStandupRequest, DailyStandupResponse,
    SmartSortRequest, SmartSortResponse,
    ReminderCheckRequest, ReminderCheckResponse
)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/plan")
def ai_plan(request: AIPlanRequest, db: Session = Depends(get_db)):
    # 设置页保存的配置（DB）优先，.env 兜底
    result = generate_work_plan(request.input, request.tasks, request.projects, ai_config=get_ai_settings(db))
    return {"success": True, "data": result}


@router.post("/optimize")
def ai_optimize(request: AIOptimizeRequest, db: Session = Depends(get_db)):
    result = optimize_tasks(request.tasks, ai_config=get_ai_settings(db))
    return {"success": True, "data": result}


@router.post("/weekly-report")
def ai_weekly_report(request: AIWeeklyReportRequest, db: Session = Depends(get_db)):
    result = generate_weekly_report(
        request.start_date, request.end_date, request.projects, request.requirements, request.tasks,
        ai_config=get_ai_settings(db),
    )
    return {"success": True, "data": result}


@router.post("/daily-standup")
def ai_daily_standup(request: DailyStandupRequest, db: Session = Depends(get_db)):
    result = generate_daily_standup(request.work_items, request.date, ai_config=get_ai_settings(db))
    return {"success": True, "data": result}


@router.post("/smart-sort")
def ai_smart_sort(request: SmartSortRequest):
    result = smart_sort_work_items(request.work_items, request.strategy)
    return {"success": True, "data": result}


@router.post("/check-reminders")
def ai_check_reminders(request: ReminderCheckRequest):
    result = check_reminders(request.work_items, request.date)
    return {"success": True, "data": result}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.session import get_db
from services.dashboard_service import get_dashboard_stats
from schemas.dashboard import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats_api(db: Session = Depends(get_db)):
    return get_dashboard_stats(db)

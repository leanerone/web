from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.report_service import get_reports, get_report, create_report, update_report, delete_report
from schemas.report import ReportCreate, ReportUpdate, ReportResponse

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/")
def list_reports(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    reports, total = get_reports(db, page, limit)
    return {
        "success": True,
        "data": [ReportResponse.model_validate(r) for r in reports],
        "total": total,
    }


@router.get("/{report_id}")
def get_report_detail(report_id: int, db: Session = Depends(get_db)):
    report = get_report(db, report_id)
    if not report:
        return {"success": False, "message": "周报不存在"}
    return {"success": True, "data": ReportResponse.model_validate(report)}


@router.post("/")
def create_report_api(report: ReportCreate, db: Session = Depends(get_db)):
    report = create_report(db, report)
    return {"success": True, "data": ReportResponse.model_validate(report)}


@router.put("/{report_id}")
def update_report_api(report_id: int, report: ReportUpdate, db: Session = Depends(get_db)):
    report = update_report(db, report_id, report)
    if not report:
        return {"success": False, "message": "周报不存在"}
    return {"success": True, "data": ReportResponse.model_validate(report)}


@router.delete("/{report_id}")
def delete_report_api(report_id: int, db: Session = Depends(get_db)):
    success = delete_report(db, report_id)
    if not success:
        return {"success": False, "message": "周报不存在"}
    return {"success": True}

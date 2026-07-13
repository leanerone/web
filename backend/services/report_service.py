from sqlalchemy.orm import Session
from database.models import Report
from schemas.report import ReportCreate, ReportUpdate


def get_reports(db: Session, page: int = 1, limit: int = 10):
    query = db.query(Report).order_by(Report.report_date.desc())
    total = query.count()
    reports = query.offset((page - 1) * limit).limit(limit).all()
    return reports, total


def get_report(db: Session, report_id: int):
    return db.query(Report).filter(Report.id == report_id).first()


def create_report(db: Session, report: ReportCreate):
    db_report = Report(
        title=report.title,
        report_date=report.report_date,
        content=report.content,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def update_report(db: Session, report_id: int, report: ReportUpdate):
    db_report = get_report(db, report_id)
    if not db_report:
        return None
    if report.title is not None:
        db_report.title = report.title
    if report.content is not None:
        db_report.content = report.content
    db.commit()
    db.refresh(db_report)
    return db_report


def delete_report(db: Session, report_id: int):
    db_report = get_report(db, report_id)
    if not db_report:
        return False
    db.delete(db_report)
    db.commit()
    return True

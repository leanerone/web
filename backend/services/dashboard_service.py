from sqlalchemy import or_
from sqlalchemy.orm import Session
from database.models import Project, Equipment, Requirement, Task, ProjectStatus, TaskStatus, RequirementStatus
from datetime import date, timedelta


def get_dashboard_stats(db: Session):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    total_projects = db.query(Project).count()
    active_projects = db.query(Project).filter(Project.status == ProjectStatus.active).count()

    # EQUIPMENTINFO 没有 status 列，按 OS 字段派生:
    #   OS 含 'Win' (大小写不敏感) → online; 否则 → 非 online
    total_equipment = db.query(Equipment).count()
    online_equipment = db.query(Equipment).filter(
        or_(
            Equipment.os.ilike('Win%'),
            Equipment.os.ilike('%Win%'),
        )
    ).count()
    
    pending_requirements = db.query(Requirement).filter(Requirement.status == RequirementStatus.pending).count()
    
    completed_tasks = db.query(Task).filter(Task.status == TaskStatus.completed).count()
    
    weekly_tasks = db.query(Task).filter(Task.due_date >= week_start, Task.due_date <= today).count()
    
    total_tasks = db.query(Task).count()
    completion_rate = round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0.0
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_equipment": total_equipment,
        "online_equipment": online_equipment,
        "pending_requirements": pending_requirements,
        "completed_tasks": completed_tasks,
        "weekly_tasks": weekly_tasks,
        "completion_rate": completion_rate,
    }

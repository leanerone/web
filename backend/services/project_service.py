from sqlalchemy.orm import Session
from database.models import Project, ProjectStatus, Task, TaskStatus
from schemas.project import ProjectCreate, ProjectUpdate


def get_projects(db: Session, keyword: str = None, status: str = None, page: int = 1, limit: int = 10):
    query = db.query(Project)
    if keyword:
        query = query.filter(Project.name.contains(keyword))
    if status:
        query = query.filter(Project.status == status)
    total = query.count()
    projects = query.offset((page - 1) * limit).limit(limit).all()
    return projects, total


def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, project: ProjectCreate):
    db_project = Project(
        name=project.name,
        description=project.description,
        start_date=project.start_date,
        end_date=project.end_date,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    update_project_progress(db, db_project.id)
    return db_project


def update_project(db: Session, project_id: int, project: ProjectUpdate):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    if project.name is not None:
        db_project.name = project.name
    if project.description is not None:
        db_project.description = project.description
    if project.status is not None:
        db_project.status = ProjectStatus(project.status)
    if project.start_date is not None:
        db_project.start_date = project.start_date
    if project.end_date is not None:
        db_project.end_date = project.end_date
    if project.progress is not None:
        db_project.progress = project.progress
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if not db_project:
        return False
    db.delete(db_project)
    db.commit()
    return True


def update_project_progress(db: Session, project_id: int):
    project = get_project(db, project_id)
    if not project:
        return
    total_tasks = db.query(Task).filter(Task.project_id == project_id).count()
    completed_tasks = db.query(Task).filter(Task.project_id == project_id, Task.status == TaskStatus.completed).count()
    if total_tasks > 0:
        project.progress = round((completed_tasks / total_tasks) * 100, 2)
    else:
        project.progress = 0.0
    db.commit()

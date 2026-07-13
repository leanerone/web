from sqlalchemy.orm import Session
from database.models import Task, TaskStatus, TaskPriority
from schemas.task import TaskCreate, TaskUpdate
from services.project_service import update_project_progress


def get_tasks_by_project(db: Session, project_id: int):
    return db.query(Task).filter(Task.project_id == project_id).all()


def get_task(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()


def create_task(db: Session, task: TaskCreate):
    db_task = Task(
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        priority=TaskPriority(task.priority) if task.priority else TaskPriority.medium,
        due_date=task.due_date,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    update_project_progress(db, task.project_id)
    return db_task


def update_task(db: Session, task_id: int, task: TaskUpdate):
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    if task.title is not None:
        db_task.title = task.title
    if task.description is not None:
        db_task.description = task.description
    if task.status is not None:
        db_task.status = TaskStatus(task.status)
    if task.priority is not None:
        db_task.priority = TaskPriority(task.priority)
    if task.due_date is not None:
        db_task.due_date = task.due_date
    db.commit()
    db.refresh(db_task)
    update_project_progress(db, db_task.project_id)
    return db_task


def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    project_id = db_task.project_id
    db.delete(db_task)
    db.commit()
    update_project_progress(db, project_id)
    return True

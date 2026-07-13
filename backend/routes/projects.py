from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.project_service import get_projects, get_project, create_project, update_project, delete_project
from services.task_service import get_tasks_by_project, create_task, update_task, delete_task
from schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
def list_projects(
    keyword: str = Query(None),
    status: str = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    projects, total = get_projects(db, keyword, status, page, limit)
    return {
        "success": True,
        "data": [ProjectResponse.model_validate(p) for p in projects],
        "total": total,
    }


@router.get("/{project_id}")
def get_project_detail(project_id: int, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        return {"success": False, "message": "项目不存在"}
    return {"success": True, "data": ProjectResponse.model_validate(project)}


@router.post("/")
def create_project_api(project: ProjectCreate, db: Session = Depends(get_db)):
    project = create_project(db, project)
    return {"success": True, "data": ProjectResponse.model_validate(project)}


@router.put("/{project_id}")
def update_project_api(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    project = update_project(db, project_id, project)
    if not project:
        return {"success": False, "message": "项目不存在"}
    return {"success": True, "data": ProjectResponse.model_validate(project)}


@router.delete("/{project_id}")
def delete_project_api(project_id: int, db: Session = Depends(get_db)):
    success = delete_project(db, project_id)
    if not success:
        return {"success": False, "message": "项目不存在"}
    return {"success": True}


@router.get("/{project_id}/tasks")
def get_project_tasks(project_id: int, db: Session = Depends(get_db)):
    tasks = get_tasks_by_project(db, project_id)
    return {"success": True, "data": [TaskResponse.model_validate(t) for t in tasks]}


@router.post("/tasks")
def create_task_api(task: TaskCreate, db: Session = Depends(get_db)):
    task = create_task(db, task)
    return {"success": True, "data": TaskResponse.model_validate(task)}


@router.put("/tasks/{task_id}")
def update_task_api(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    task = update_task(db, task_id, task)
    if not task:
        return {"success": False, "message": "任务不存在"}
    return {"success": True, "data": TaskResponse.model_validate(task)}


@router.delete("/tasks/{task_id}")
def delete_task_api(task_id: int, db: Session = Depends(get_db)):
    success = delete_task(db, task_id)
    if not success:
        return {"success": False, "message": "任务不存在"}
    return {"success": True}

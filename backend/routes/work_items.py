from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from database.models import WorkCategory, WorkItem, DailyPlan, WorkLog
from schemas.work_items import (
    WorkCategoryCreate, WorkCategoryUpdate, WorkCategoryResponse,
    WorkItemCreate, WorkItemUpdate, WorkItemResponse,
    DailyPlanCreate, DailyPlanResponse,
    WorkLogResponse,
    ImportTableRequest
)
from services.work_item_service import (
    get_categories, get_category, create_category, update_category, delete_category,
    init_default_categories,
    get_work_items, get_work_item, create_work_item, update_work_item, delete_work_item,
    import_table,
    get_work_logs,
    get_daily_plan, save_daily_plan
)
from datetime import date

router = APIRouter(prefix="/work", tags=["work"])


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    return {"success": True, "data": get_categories(db)}


@router.post("/categories")
def create_category_api(data: WorkCategoryCreate, db: Session = Depends(get_db)):
    return {"success": True, "data": create_category(db, data)}


@router.put("/categories/{category_id}")
def update_category_api(category_id: int, data: WorkCategoryUpdate, db: Session = Depends(get_db)):
    category = update_category(db, category_id, data)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "data": category}


@router.delete("/categories/{category_id}")
def delete_category_api(category_id: int, db: Session = Depends(get_db)):
    success = delete_category(db, category_id)
    if not success:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True}


@router.post("/categories/init")
def init_categories(db: Session = Depends(get_db)):
    init_default_categories(db)
    return {"success": True, "message": "Default categories initialized"}


@router.get("/items")
def list_work_items(
    category_id: int = Query(None),
    status: str = Query(None),
    project_id: int = Query(None),
    urgency: str = Query(None),
    importance: str = Query(None),
    sort_by: str = Query("priority_score"),
    limit: int = Query(100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    return {"success": True, "data": get_work_items(db, category_id, status, project_id, urgency, importance, sort_by, limit, offset)}


@router.get("/items/{item_id}")
def get_work_item_api(item_id: int, db: Session = Depends(get_db)):
    item = get_work_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    return {"success": True, "data": item}


@router.post("/items")
def create_work_item_api(data: WorkItemCreate, db: Session = Depends(get_db)):
    return {"success": True, "data": create_work_item(db, data)}


@router.put("/items/{item_id}")
def update_work_item_api(item_id: int, data: WorkItemUpdate, db: Session = Depends(get_db)):
    item = update_work_item(db, item_id, data)
    if not item:
        raise HTTPException(status_code=404, detail="Work item not found")
    return {"success": True, "data": item}


@router.delete("/items/{item_id}")
def delete_work_item_api(item_id: int, db: Session = Depends(get_db)):
    success = delete_work_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Work item not found")
    return {"success": True}


@router.post("/import-table")
def import_table_api(data: ImportTableRequest, db: Session = Depends(get_db)):
    items = import_table(db, data)
    return {"success": True, "data": [WorkItemResponse.model_validate(item) for item in items], "count": len(items)}


@router.get("/items/{item_id}/logs")
def get_item_logs(item_id: int, db: Session = Depends(get_db)):
    return {"success": True, "data": get_work_logs(db, item_id)}


@router.get("/logs")
def get_all_logs(work_item_id: int = Query(None), db: Session = Depends(get_db)):
    return {"success": True, "data": get_work_logs(db, work_item_id)}


@router.get("/daily-plan")
def get_daily_plan_api(
    plan_date: date = Query(None),
    user_id: int = Query(None),
    db: Session = Depends(get_db)
):
    if not plan_date:
        plan_date = date.today()
    plan = get_daily_plan(db, plan_date, user_id)
    if not plan:
        return {"success": True, "data": None}
    return {"success": True, "data": plan}


@router.post("/daily-plan")
def save_daily_plan_api(data: DailyPlanCreate, db: Session = Depends(get_db)):
    return {"success": True, "data": save_daily_plan(db, data.plan_date, data.items_order, data.ai_suggestions, data.summary, data.user_id)}


@router.get("/stats")
def get_work_stats(db: Session = Depends(get_db)):
    total = db.query(WorkItem).count()
    pending = db.query(WorkItem).filter(WorkItem.status == "pending").count()
    in_progress = db.query(WorkItem).filter(WorkItem.status == "in_progress").count()
    completed = db.query(WorkItem).filter(WorkItem.status == "completed").count()
    blocked = db.query(WorkItem).filter(WorkItem.status == "blocked").count()
    
    urgent_count = db.query(WorkItem).filter(WorkItem.urgency == "high").count()
    important_count = db.query(WorkItem).filter(WorkItem.importance == "high").count()
    
    categories = db.query(WorkCategory).all()
    category_stats = []
    for cat in categories:
        count = db.query(WorkItem).filter(WorkItem.category_id == cat.id).count()
        category_stats.append({
            "id": cat.id,
            "name": cat.name,
            "code": cat.code,
            "icon": cat.icon,
            "color": cat.color,
            "count": count
        })
    
    return {
        "success": True,
        "data": {
            "total": total,
            "pending": pending,
            "in_progress": in_progress,
            "completed": completed,
            "blocked": blocked,
            "urgent_count": urgent_count,
            "important_count": important_count,
            "categories": category_stats
        }
    }

from sqlalchemy.orm import Session
from database.models import WorkCategory, WorkItem, DailyPlan, WorkLog
from schemas.work_items import (
    WorkCategoryCreate, WorkCategoryUpdate,
    WorkItemCreate, WorkItemUpdate,
    ImportTableRequest
)
from datetime import datetime, date
import json
import re


def get_categories(db: Session):
    return db.query(WorkCategory).order_by(WorkCategory.sort_order).all()


def get_category(db: Session, category_id: int):
    return db.query(WorkCategory).filter(WorkCategory.id == category_id).first()


def create_category(db: Session, data: WorkCategoryCreate):
    existing = db.query(WorkCategory).filter(WorkCategory.code == data.code).first()
    if existing:
        return existing
    category = WorkCategory(**data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: int, data: WorkCategoryUpdate):
    category = get_category(db, category_id)
    if not category:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int):
    category = get_category(db, category_id)
    if not category:
        return False
    db.delete(category)
    db.commit()
    return True


def init_default_categories(db: Session):
    default_categories = [
        {"name": "Operation/Follow up", "code": "operation", "description": "日常操作跟进", "icon": "🔄", "color": "#3B82F6", "sort_order": 1},
        {"name": "Requirement", "code": "requirement", "description": "需求跟进与管理", "icon": "📋", "color": "#8B5CF6", "sort_order": 2},
        {"name": "SIT", "code": "sit", "description": "系统集成测试", "icon": "🔬", "color": "#06B6D4", "sort_order": 3},
        {"name": "Place then GO", "code": "place_then_go", "description": "上线部署跟踪", "icon": "🚀", "color": "#10B981", "sort_order": 4},
        {"name": "AI开发", "code": "ai_dev", "description": "AI项目开发与部署", "icon": "🤖", "color": "#F59E0B", "sort_order": 5},
        {"name": "RCMS", "code": "rcms", "description": "RCMS系统测试", "icon": "🔧", "color": "#EF4444", "sort_order": 6},
        {"name": "Other", "code": "other", "description": "其他工作", "icon": "📦", "color": "#6B7280", "sort_order": 7},
        {"name": "System HandOver", "code": "handover", "description": "系统交接", "icon": "🔗", "color": "#EC4899", "sort_order": 8},
    ]
    for cat_data in default_categories:
        existing = db.query(WorkCategory).filter(WorkCategory.code == cat_data["code"]).first()
        if not existing:
            category = WorkCategory(**cat_data)
            db.add(category)
    db.commit()


def get_work_items(db: Session, category_id: int = None, status: str = None, 
                   project_id: int = None, urgency: str = None,
                   importance: str = None, sort_by: str = "priority_score",
                   limit: int = 100, offset: int = 0):
    query = db.query(WorkItem)
    if category_id:
        query = query.filter(WorkItem.category_id == category_id)
    if status:
        query = query.filter(WorkItem.status == status)
    if project_id:
        query = query.filter(WorkItem.project_id == project_id)
    if urgency:
        query = query.filter(WorkItem.urgency == urgency)
    if importance:
        query = query.filter(WorkItem.importance == importance)
    
    if sort_by == "priority_score":
        query = query.order_by(WorkItem.priority_score.desc())
    elif sort_by == "due_date":
        query = query.order_by(WorkItem.due_date.asc().nullslast())
    elif sort_by == "created_at":
        query = query.order_by(WorkItem.created_at.desc())
    else:
        query = query.order_by(WorkItem.priority_score.desc())
    
    return query.limit(limit).offset(offset).all()


def get_work_item(db: Session, item_id: int):
    return db.query(WorkItem).filter(WorkItem.id == item_id).first()


def create_work_item(db: Session, data: WorkItemCreate):
    item = WorkItem(**data.model_dump())
    item.priority_score = calculate_priority(item.urgency, item.importance)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_work_item(db: Session, item_id: int, data: WorkItemUpdate):
    item = get_work_item(db, item_id)
    if not item:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    item.priority_score = calculate_priority(item.urgency, item.importance)
    db.commit()
    db.refresh(item)
    _create_log(db, item_id, "update", f"更新工作项: {item.title}")
    return item


def delete_work_item(db: Session, item_id: int):
    item = get_work_item(db, item_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def calculate_priority(urgency: str, importance: str) -> float:
    score_map = {"na": 0, "low": 1, "medium": 2, "high": 3}
    urgency_score = score_map.get(urgency, 0)
    importance_score = score_map.get(importance, 0)
    return urgency_score * 1.5 + importance_score * 2


def import_table(db: Session, data: ImportTableRequest):
    lines = data.table_text.strip().split('\n')
    items = []
    current_category = None
    current_items = []
    
    for line in lines:
        line = line.strip()
        if not line or line == '|' or re.match(r'^[\s\-|]+$', line):
            continue
        
        cells = [c.strip() for c in line.split('|') if c.strip()]
        
        if len(cells) >= 4:
            category_name = cells[0] if cells[0] else current_category
            item_title = cells[1] if len(cells) > 1 else ""
            details = cells[2] if len(cells) > 2 else ""
            urgency = cells[3].lower() if len(cells) > 3 else "na"
            importance = cells[4].lower() if len(cells) > 4 else "na"
            
            if item_title and item_title != 'Items':
                current_category = category_name
                cat = _get_or_create_category(db, category_name)
                
                work_item = WorkItem(
                    category_id=cat.id if cat else None,
                    title=item_title,
                    details=details,
                    urgency=urgency if urgency in ['na', 'low', 'medium', 'high'] else 'na',
                    importance=importance if importance in ['na', 'low', 'medium', 'high'] else 'na',
                    status='pending',
                    source_type='table_import',
                    project_id=data.project_id
                )
                work_item.priority_score = calculate_priority(work_item.urgency, work_item.importance)
                current_items.append(work_item)
                
        elif len(cells) <= 2 and cells:
            potential_category = cells[0].strip().rstrip(':')
            if potential_category and potential_category not in ['Category', 'Operation', 'Requirement', 'SIT', 'Other', 'System']:
                cat = _get_or_create_category(db, potential_category)
                if cat:
                    current_category = potential_category
    
    if current_items:
        db.add_all(current_items)
        db.commit()
        for item in current_items:
            db.refresh(item)
    
    return current_items


def _get_or_create_category(db: Session, name: str):
    if not name:
        return None
    code = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
    existing = db.query(WorkCategory).filter(WorkCategory.code == code).first()
    if existing:
        return existing
    category = WorkCategory(
        name=name,
        code=code,
        description=f"自动创建的分类: {name}",
        icon="📁",
        color="#6B7280",
        sort_order=99
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def get_work_logs(db: Session, work_item_id: int = None):
    query = db.query(WorkLog)
    if work_item_id:
        query = query.filter(WorkLog.work_item_id == work_item_id)
    return query.order_by(WorkLog.created_at.desc()).all()


def _create_log(db: Session, work_item_id: int, action: str, description: str):
    log = WorkLog(
        work_item_id=work_item_id,
        action=action,
        description=description
    )
    db.add(log)
    db.commit()
    return log


def get_daily_plan(db: Session, plan_date: date, user_id: int = None):
    query = db.query(DailyPlan).filter(DailyPlan.plan_date == plan_date)
    if user_id:
        query = query.filter(DailyPlan.user_id == user_id)
    return query.first()


def save_daily_plan(db: Session, plan_date: date, items_order: str, 
                    ai_suggestions: str = None, summary: str = None,
                    user_id: int = None):
    plan = get_daily_plan(db, plan_date, user_id)
    if plan:
        plan.items_order = items_order
        plan.ai_suggestions = ai_suggestions
        plan.summary = summary
        plan.updated_at = datetime.now()
    else:
        plan = DailyPlan(
            plan_date=plan_date,
            user_id=user_id,
            items_order=items_order,
            ai_suggestions=ai_suggestions,
            summary=summary
        )
        db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
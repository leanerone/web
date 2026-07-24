from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from services.user_service import (
    get_users,
    get_user,
    get_user_by_username,
    create_user,
    update_user,
    delete_user,
)
from schemas.user import UserCreate, UserUpdate, UserResponse
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users(db: Session = Depends(get_db)):
    users = get_users(db)
    return {"success": True, "data": users}


@router.get("/{user_id}")
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"success": True, "data": user}


@router.post("")
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="用户名已存在")
    new_user = create_user(db, user)
    return {"success": True, "data": new_user}


@router.put("/{user_id}")
def update_user_detail(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    updated = update_user(db, user_id, user)
    if not updated:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"success": True, "data": updated}


@router.delete("/{user_id}")
def delete_user_by_id(user_id: int, db: Session = Depends(get_db)):
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="用户不存在")
    return {"success": True, "message": "用户已删除"}

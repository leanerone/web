"""认证路由

提供Windows认证SSO接口和token验证接口。
"""
import os
import socket
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.session import get_db
from database.models import User
from services.auth_service import (
    get_current_windows_user,
    generate_token,
    verify_token,
    verify_password,
    token_expires_at,
    JWT_EXPIRE_HOURS,
    KNOWN_USERS,
)
from services.user_service import get_user_by_username

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginResponse(BaseModel):
    success: bool
    user: dict
    token: str
    expires_at: str


class ManualLoginRequest(BaseModel):
    username: str
    password: Optional[str] = None


@router.get("/windows")
def windows_login(db: Session = Depends(get_db)):
    """Windows SSO登录

    自动获取当前Windows登录用户信息并返回token。

    注意：读到的是后端进程的账号（内网演示用途）。真正的域认证应接入
    Kerberos/SPNEGO，或由 IIS/nginx 等反向代理验证后传入 REMOTE_USER 头。
    用户以 users 表为准：已停用账号拒绝登录；首次登录自动建档。
    """
    identity = get_current_windows_user()
    username = identity["username"]

    db_user = get_user_by_username(db, username)
    if not db_user:
        # 首次 SSO：以 KNOWN_USERS 中的展示信息自动建档（无密码，仅可 SSO 登录）
        known = KNOWN_USERS.get(username.lower())
        if known:
            display_name, role, dept, team = known["name"], known["role"], known["department"], known["team"]
        else:
            display_name, role, dept, team = username, "engineer", "未分配", "EAP"
        db_user = User(
            username=username,
            display_name=display_name,
            role=role,
            department=dept,
            team=team,
            status="active",
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    elif db_user.status != "active":
        raise HTTPException(status_code=403, detail="账号已停用，请联系管理员")

    user = {
        "username": db_user.username,
        "display_name": db_user.display_name or db_user.username,
        "role": db_user.role or "user",
        "department": db_user.department or identity.get("department", "未分配"),
        "team": db_user.team or identity.get("team", "EAP"),
        "domain": identity.get("domain", "WORKGROUP"),
        "computer": identity.get("computer", ""),
        "login_at": identity.get("login_at", time.strftime("%Y-%m-%d %H:%M:%S")),
    }
    token = generate_token(user)
    return LoginResponse(
        success=True,
        user=user,
        token=token,
        expires_at=token_expires_at({"exp": time.time() + JWT_EXPIRE_HOURS * 3600}),
    )


@router.post("/login")
def manual_login(req: ManualLoginRequest, db: Session = Depends(get_db)):
    """手动登录（备用方案）

    校验 users 表中的密码哈希；角色/部门以数据库为准，
    未知用户或密码错误一律 401，不再按用户名推导角色。
    """
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="用户名不能为空")
    if not req.password:
        raise HTTPException(status_code=400, detail="请输入密码")

    db_user = get_user_by_username(db, username)
    if not db_user:
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    if not verify_password(req.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    user = {
        "username": db_user.username,
        "display_name": db_user.display_name or db_user.username,
        "role": db_user.role or "user",
        "department": db_user.department or "未分配",
        "team": db_user.team or "EAP",
        "domain": os.environ.get("USERDOMAIN") or "WORKGROUP",
        "computer": os.environ.get("COMPUTERNAME") or socket.gethostname(),
        "login_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    token = generate_token(user)
    return LoginResponse(
        success=True,
        user=user,
        token=token,
        expires_at=token_expires_at({"exp": time.time() + JWT_EXPIRE_HOURS * 3600}),
    )


@router.get("/verify")
def verify_auth(authorization: Optional[str] = Header(None)):
    """验证token是否有效"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证token")

    token = authorization.split(" ", 1)[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="token无效或已过期")

    return {"success": True, "user": payload}


@router.get("/users")
def list_known_users(db: Session = Depends(get_db)):
    """列出可登录用户（用于手动登录的下拉选择，不含密码信息）"""
    users = db.query(User).filter(User.status == "active").all()
    return {
        "success": True,
        "data": [
            {
                "username": u.username,
                "display_name": u.display_name,
                "role": u.role,
                "department": u.department,
                "team": u.team,
            }
            for u in users
        ],
    }

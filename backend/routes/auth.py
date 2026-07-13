"""认证路由

提供Windows认证SSO接口和token验证接口。
"""
from fastapi import APIRouter, Request, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from services.auth_service import (
    get_current_windows_user,
    generate_token,
    verify_token,
    KNOWN_USERS,
)
import time


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
def windows_login():
    """Windows SSO登录

    自动获取当前Windows登录用户信息并返回token。
    前端调用此接口即可完成免密登录。
    """
    user = get_current_windows_user()
    token = generate_token(user)
    expires_at = time.strftime(
        "%Y-%m-%d %H:%M:%S",
        time.localtime(time.time() + 8 * 3600),
    )
    return LoginResponse(
        success=True,
        user=user,
        token=token,
        expires_at=expires_at,
    )


@router.post("/login")
def manual_login(req: ManualLoginRequest):
    """手动登录（备用方案）

    在Windows SSO不可用时（如非Windows环境或跨域访问），
    可使用用户名登录。密码可选，企业内网默认信任。
    """
    username = req.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="用户名不能为空")

    user_info = KNOWN_USERS.get(username.lower(), {
        "name": username,
        "role": "engineer",
        "department": "未分配",
        "team": "EAP",
    })

    import os
    import socket
    user = {
        "username": username,
        "display_name": user_info["name"],
        "role": user_info["role"],
        "department": user_info["department"],
        "team": user_info["team"],
        "domain": os.environ.get("USERDOMAIN") or "WORKGROUP",
        "computer": os.environ.get("COMPUTERNAME") or socket.gethostname(),
        "login_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    token = generate_token(user)
    expires_at = time.strftime(
        "%Y-%m-%d %H:%M:%S",
        time.localtime(time.time() + 8 * 3600),
    )
    return LoginResponse(
        success=True,
        user=user,
        token=token,
        expires_at=expires_at,
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
def list_known_users():
    """列出已知用户（用于手动登录的下拉选择）"""
    users = [
        {"username": k, "display_name": v["name"], "role": v["role"], "department": v["department"], "team": v["team"]}
        for k, v in KNOWN_USERS.items()
    ]
    return {"success": True, "data": users}

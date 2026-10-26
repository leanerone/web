"""共享 FastAPI 依赖"""
from typing import Optional

from fastapi import Header, HTTPException

from services.auth_service import verify_token


def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """校验 Bearer token，返回 JWT payload（sub/name/role）。

    挂载到除 /auth 之外的所有业务路由上；未携带或无效 token 一律 401。
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未提供认证token")
    payload = verify_token(authorization.split(" ", 1)[1])
    if not payload:
        raise HTTPException(status_code=401, detail="token无效或已过期")
    return payload

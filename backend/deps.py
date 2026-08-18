"""FastAPI 依赖：JWT 鉴权

通过 `Depends(require_auth)` 强制接口校验 Bearer token，
修复"签发 token 但所有业务路由未受保护"的安全问题。
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from services.auth_service import verify_token

bearer_scheme = HTTPBearer(auto_error=False)


def require_auth(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """校验请求携带的 JWT，返回 payload；失败返回 401。"""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="token无效或已过期",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def require_admin(payload: dict = Depends(require_auth)) -> dict:
    """要求当前用户为管理员角色。"""
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return payload

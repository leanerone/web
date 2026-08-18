"""Windows认证服务

通过读取当前进程的Windows登录用户信息实现SSO（单点登录）。
适用于企业内网环境，后端服务运行在用户所在的Windows域中。
"""
import os
import getpass
import socket
import time
import jwt
from typing import Optional
from config.settings import settings


# 简单的用户数据库（实际应接入LDAP/AD）
# 这里列出常见的企业域用户角色
KNOWN_USERS = {
    "administrator": {"name": "管理员", "role": "admin", "department": "IT", "team": "CIM"},
    "eap.engineer": {"name": "EAP工程师", "role": "engineer", "department": "制造", "team": "EAP"},
    "cim.user": {"name": "CIM用户", "role": "user", "department": "制造", "team": "CIM"},
}

JWT_ALGORITHM = "HS256"


def _jwt_secret() -> str:
    return settings.jwt_secret


def _jwt_expire_hours() -> int:
    return settings.jwt_expire_hours


def get_current_windows_user() -> dict:
    """获取当前Windows登录用户信息

    优先级：
    1. USERNAME 环境变量
    2. USERPROFILE 环境变量解析
    3. getpass.getuser()
    4. socket.gethostname() 作为计算机账户
    """
    username = (
        os.environ.get("USERNAME")
        or os.environ.get("USER")
        or getpass.getuser()
        or "unknown"
    )

    computername = os.environ.get("COMPUTERNAME") or socket.gethostname()
    userdomain = os.environ.get("USERDOMAIN") or "WORKGROUP"

    # 查询已知用户信息
    user_info = KNOWN_USERS.get(username.lower(), {
        "name": username,
        "role": "engineer",
        "department": "未分配",
        "team": "EAP",
    })

    return {
        "username": username,
        "display_name": user_info["name"],
        "role": user_info["role"],
        "department": user_info["department"],
        "team": user_info["team"],
        "domain": userdomain,
        "computer": computername,
        "login_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }


def generate_token(user: dict) -> str:
    """生成JWT token"""
    payload = {
        "sub": user["username"],
        "name": user["display_name"],
        "role": user["role"],
        "iat": int(time.time()),
        "exp": int(time.time()) + _jwt_expire_hours() * 3600,
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """验证JWT token"""
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

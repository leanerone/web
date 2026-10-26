"""认证服务

- JWT 签发与校验：密钥从 config.Settings 读取，未配置时生成临时密钥（重启即失效）
- 密码哈希：PBKDF2-SHA256（标准库实现，无额外依赖）
- Windows SSO：读取后端进程的登录用户（内网演示用途；真正的域认证应接入
  Kerberos/SPNEGO 或由反向代理传入 REMOTE_USER）
"""
import os
import getpass
import socket
import time
import hashlib
import logging
import secrets
from typing import Optional

from config.settings import settings

logger = logging.getLogger("cim.auth")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = settings.jwt_expire_hours

# 简单的用户信息表（角色/部门展示用；账号密码以 users 表为准）
KNOWN_USERS = {
    "administrator": {"name": "管理员", "role": "admin", "department": "IT", "team": "CIM"},
    "eap.engineer": {"name": "EAP工程师", "role": "engineer", "department": "制造", "team": "EAP"},
    "cim.user": {"name": "CIM用户", "role": "user", "department": "制造", "team": "CIM"},
}

if settings.jwt_secret:
    JWT_SECRET = settings.jwt_secret
else:
    # 绝不把固定字符串硬编码进源码；临时密钥仅保证本次进程内 token 可用
    JWT_SECRET = secrets.token_hex(32)
    logger.warning(
        "未配置 JWT_SECRET，已生成临时密钥：服务重启后所有已发放 token 失效。"
        "生产环境请在 backend/.env 中设置 JWT_SECRET"
    )


# ── 密码哈希（PBKDF2-SHA256，格式: pbkdf2_sha256$<salt>$<digest>）──

_PBKDF2_ITERATIONS = 100_000


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${salt}${digest}"


def verify_password(password: str, stored: Optional[str]) -> bool:
    if not stored:
        return False
    try:
        _algo, salt, digest = stored.split("$")
    except ValueError:
        return False
    calc = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), _PBKDF2_ITERATIONS
    ).hex()
    return secrets.compare_digest(calc, digest)


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
        "exp": int(time.time()) + JWT_EXPIRE_HOURS * 3600,
    }
    return jwt_encode(payload)


def token_expires_at(payload: dict) -> str:
    """从 token payload 反解过期时间，避免与 JWT_EXPIRE_HOURS 两处魔数不同步"""
    exp = payload.get("exp")
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(exp or time.time()))


def jwt_encode(payload: dict) -> str:
    import jwt
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> Optional[dict]:
    """验证JWT token"""
    import jwt
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

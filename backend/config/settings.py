from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_type: str = "sqlite"
    sqlite_url: str = "./data/example_db.sqlite"
    oracle_user: str = ""
    oracle_password: str = ""
    oracle_dsn: str = ""
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    ai_model: str = "gpt-4o-mini"
    notes_server_url: str = ""
    notes_user: str = ""
    notes_password: str = ""

    # ── 认证 ──
    # JWT 签名密钥：生产环境必须通过 .env 配置；留空则启动时生成临时密钥
    # （重启后所有已发放 token 失效）
    jwt_secret: str = ""
    jwt_expire_hours: int = 8
    # 内置种子用户的默认密码（首次登录后请在「设置 → 成员」中修改）
    default_user_password: str = "cim123456"

    # ── 网络 ──
    # 允许的跨域来源，逗号分隔；"*" 表示全开放（仅限开发环境）
    cors_origins: str = "*"

    # ── 启动 ──
    # None = 自动：SQLite 模式建表+种子化，Oracle 模式跳过（由 DBA 执行 init_oracle.sql）
    # 显式设为 true/false 可覆盖
    init_db_on_startup: Optional[bool] = None

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

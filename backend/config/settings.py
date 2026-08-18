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

    # 认证与安全
    # 生产环境务必通过 .env 覆盖默认值，否则任意人可伪造 JWT
    jwt_secret: str = "cim-work-manager-secret-key-2026"
    jwt_expire_hours: int = 8
    # 允许的前端来源，逗号分隔；生产环境应限定为实际前端域名
    cors_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

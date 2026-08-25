from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_type: str = "sqlite"
    sqlite_url: str = "./data/example_db.sqlite"
    oracle_user: str = ""
    oracle_password: str = ""
    oracle_dsn: str = ""
    openai_api_key: str = ""
    openai_api_base: str = "https://api.openai.com/v1"
    notes_server_url: str = ""
    notes_user: str = ""
    notes_password: str = ""

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

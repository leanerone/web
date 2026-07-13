from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config.settings import settings


def get_database_url() -> str:
    if settings.database_type == "oracle":
        return f"oracle+oracledb://{settings.oracle_user}:{settings.oracle_password}@{settings.oracle_dsn}"
    else:
        return f"sqlite:///{settings.sqlite_url}"


engine = create_engine(get_database_url(), connect_args={"check_same_thread": False} if settings.database_type == "sqlite" else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

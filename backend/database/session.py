from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from urllib.parse import quote_plus

from config.settings import settings


def get_database_url() -> str:
    if settings.database_type == "oracle":
        # 密码含 @ / : / 等特殊字符时必须转义，否则 URL 解析失败
        return (
            f"oracle+oracledb://{quote_plus(settings.oracle_user)}:"
            f"{quote_plus(settings.oracle_password)}@{settings.oracle_dsn}"
        )
    return f"sqlite:///{settings.sqlite_url}"


_is_oracle = settings.database_type == "oracle"

engine = create_engine(
    get_database_url(),
    connect_args={"check_same_thread": False} if not _is_oracle else {},
    # Oracle 防火墙会掐闲置连接：预检 + 回收，避免长跑服务间歇性 ORA-03113
    pool_pre_ping=True,
    pool_recycle=1800,
    **({"pool_size": 5, "max_overflow": 10} if _is_oracle else {}),
)

if not _is_oracle:
    @event.listens_for(engine, "connect")
    def _enable_sqlite_fk(dbapi_connection, connection_record):
        """SQLite 默认不执行外键约束，必须显式开启，ondelete 才会生效"""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

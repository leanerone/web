import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from deps import get_current_user
from routes import projects, equipment, requirements, reports, ai, notes, dashboard, auth, users, settings as settings_router, work_items
from database import Base, engine
from database.session import SessionLocal
from config.settings import settings
from services.user_service import init_default_users
from services.setting_service import init_default_settings
from services.work_item_service import init_default_categories

logger = logging.getLogger("cim")

AUTH_DEPENDENCY = [Depends(get_current_user)]


def _ensure_sqlite_user_password_column():
    """create_all 不会给已存在的表加列：老 SQLite 库手动补 password_hash"""
    if settings.database_type == "oracle":
        return
    from sqlalchemy import text
    with engine.connect() as conn:
        cols = [row[1] for row in conn.exec_driver_sql("PRAGMA table_info(users)")]
        if "password_hash" not in cols:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            conn.commit()
            logger.info("users 表已补建 password_hash 列")


def _startup_init():
    # SQLite 文件的父目录不存在时 create_all 会直接报 unable to open database file
    if settings.database_type == "sqlite":
        from pathlib import Path
        Path(settings.sqlite_url).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    _ensure_sqlite_user_password_column()
    db = SessionLocal()
    try:
        init_default_users(db)
        init_default_settings(db)
        init_default_categories(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Oracle 生产模式下默认跳过（建表由 DBA 执行 init_oracle.sql，见 DEPLOY_ORACLE_SOP.md），
    # 需要时显式设置 INIT_DB_ON_STARTUP=true
    should_init = settings.init_db_on_startup
    if should_init is None:
        should_init = settings.database_type != "oracle"
    if should_init:
        try:
            _startup_init()
        except Exception:
            # 数据库暂不可达时不阻塞服务启动，接口按各自错误返回
            logger.exception("启动初始化失败（建表/种子数据）")
    yield


app = FastAPI(title="CIM Work Manager API", version="1.0.0", lifespan=lifespan)

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()] or ["*"]
_allow_all = "*" in _origins

app.add_middleware(
    CORSMiddleware,
    # "*" 与 allow_credentials=True 不能同时使用（浏览器规范禁止）
    allow_origins=_origins,
    allow_credentials=not _allow_all,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
# 业务路由统一挂鉴权：无有效 Bearer token 一律 401
app.include_router(users.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(projects.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(equipment.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(requirements.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(reports.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(ai.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(notes.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(dashboard.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(settings_router.router, prefix="/api", dependencies=AUTH_DEPENDENCY)
app.include_router(work_items.router, prefix="/api", dependencies=AUTH_DEPENDENCY)


@app.get("/")
def root():
    return {"message": "CIM Work Manager API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

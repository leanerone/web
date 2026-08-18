import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routes import projects, equipment, requirements, reports, ai, notes, dashboard, auth, users, settings as settings_router, work_items
from database import Base, engine
from database.session import SessionLocal
from config.settings import settings
from deps import require_auth
from services.user_service import init_default_users
from services.setting_service import init_default_settings
from services.work_item_service import init_default_categories

# 日志配置（全项目无日志的历史问题修复）
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("cim")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表并初始化种子数据。

    相较于在模块导入期执行，放在 lifespan 中可避免测试/reload 时重复执行，
    且异常能被日志捕获。
    """
    logger.info("初始化数据库表结构...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_default_users(db)
        init_default_settings(db)
        init_default_categories(db)
    except Exception:
        logger.exception("初始化种子数据失败")
        raise
    finally:
        db.close()
    logger.info("数据库初始化完成")
    yield
    logger.info("应用关闭")


app = FastAPI(title="CIM Work Manager API", version="1.0.0", lifespan=lifespan)

# CORS：来源由配置控制（生产环境应限定为实际前端域名）
allowed_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """全局异常处理器：避免堆栈泄露，统一返回 500。"""
    logger.exception("未处理异常: %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "message": "服务器内部错误"},
    )


app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(projects.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(equipment.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(requirements.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(reports.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(ai.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(notes.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(dashboard.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(settings_router.router, prefix="/api", dependencies=[Depends(require_auth)])
app.include_router(work_items.router, prefix="/api", dependencies=[Depends(require_auth)])


@app.get("/")
def root():
    return {"message": "CIM Work Manager API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import projects, equipment, requirements, reports, ai, notes, dashboard, auth, users, settings as settings_router, work_items
from database import Base, engine
from database.session import SessionLocal
from config.settings import settings
from services.user_service import init_default_users
from services.setting_service import init_default_settings
from services.work_item_service import init_default_categories

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    init_default_users(db)
    init_default_settings(db)
    init_default_categories(db)
finally:
    db.close()

app = FastAPI(title="CIM Work Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(requirements.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(work_items.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "CIM Work Manager API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import projects, equipment, requirements, reports, ai, notes, dashboard, auth
from database import Base, engine
from config.settings import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CIM Work Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(equipment.router, prefix="/api")
app.include_router(requirements.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "CIM Work Manager API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}

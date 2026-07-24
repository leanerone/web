from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class NotesDocumentResponse(BaseModel):
    id: int
    notes_id: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    url: Optional[str] = None
    project_id: Optional[int] = None
    sync_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotesImportRequest(BaseModel):
    project_id: Optional[int] = None
    notes_id: Optional[str] = None


class NotesUrlImportRequest(BaseModel):
    url: str
    project_id: Optional[int] = None

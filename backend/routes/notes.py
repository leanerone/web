from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from database.session import get_db
from services.notes_service import sync_notes, import_document, get_documents, get_document, parse_notes_url, import_by_url
from schemas.notes import NotesImportRequest, NotesDocumentResponse, NotesUrlImportRequest

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/sync")
def sync_notes_api(db: Session = Depends(get_db)):
    result = sync_notes(db)
    return {"success": True, "data": result}


@router.post("/import")
def import_notes_api(request: NotesImportRequest, db: Session = Depends(get_db)):
    docs = import_document(db, request)
    return {"success": True, "data": [NotesDocumentResponse.model_validate(d) for d in docs]}


@router.get("/documents")
def list_documents(project_id: int = Query(None), db: Session = Depends(get_db)):
    docs = get_documents(db, project_id)
    return {"success": True, "data": [NotesDocumentResponse.model_validate(d) for d in docs]}


@router.get("/documents/{document_id}")
def get_document_detail(document_id: int, db: Session = Depends(get_db)):
    doc = get_document(db, document_id)
    if not doc:
        return {"success": False, "message": "文档不存在"}
    return {"success": True, "data": NotesDocumentResponse.model_validate(doc)}


@router.post("/parse-url")
def parse_notes_url_api(request: dict):
    parsed = parse_notes_url(request.get('url', ''))
    return {"success": True, "data": parsed}


@router.post("/import-by-url")
def import_by_url_api(request: NotesUrlImportRequest, db: Session = Depends(get_db)):
    docs = import_by_url(db, request.url, request.project_id)
    return {"success": True, "data": [NotesDocumentResponse.model_validate(d) for d in docs]}

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.session import get_db
from services.notes_service import sync_notes, import_document, get_documents, get_document
from schemas.notes import NotesImportRequest, NotesDocumentResponse

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

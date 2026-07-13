from sqlalchemy.orm import Session
from database.models import NotesDocument, Project
from schemas.notes import NotesImportRequest
from datetime import datetime
from config.settings import settings


def get_documents(db: Session, project_id: int = None):
    query = db.query(NotesDocument)
    if project_id:
        query = query.filter(NotesDocument.project_id == project_id)
    return query.all()


def get_document(db: Session, document_id: int):
    return db.query(NotesDocument).filter(NotesDocument.id == document_id).first()


def sync_notes(db: Session):
    if settings.notes_server_url:
        return _sync_from_notes_server(db)
    else:
        return {"synced_count": 0}


def import_document(db: Session, request: NotesImportRequest):
    if settings.notes_server_url:
        return _import_from_notes_server(db, request)
    else:
        mock_doc = NotesDocument(
            notes_id=request.notes_id or "MOCK001",
            title="示例文档",
            content="这是从HCL Notes导入的示例文档内容...",
            url=f"{settings.notes_server_url}/document/{request.notes_id}",
            project_id=request.project_id,
            sync_at=datetime.now(),
        )
        db.add(mock_doc)
        db.commit()
        db.refresh(mock_doc)
        return [mock_doc]


def _sync_from_notes_server(db: Session):
    import requests
    
    try:
        response = requests.get(
            f"{settings.notes_server_url}/api/documents",
            auth=(settings.notes_user, settings.notes_password)
        )
        response.raise_for_status()
        documents = response.json()
        
        synced_count = 0
        for doc in documents:
            existing = db.query(NotesDocument).filter(NotesDocument.notes_id == doc.get('id')).first()
            if existing:
                existing.title = doc.get('title')
                existing.content = doc.get('content')
                existing.url = doc.get('url')
                existing.sync_at = datetime.now()
            else:
                new_doc = NotesDocument(
                    notes_id=doc.get('id'),
                    title=doc.get('title'),
                    content=doc.get('content'),
                    url=doc.get('url'),
                    sync_at=datetime.now(),
                )
                db.add(new_doc)
                synced_count += 1
        
        db.commit()
        return {"synced_count": synced_count}
    except Exception:
        return {"synced_count": 0}


def _import_from_notes_server(db: Session, request: NotesImportRequest):
    import requests
    
    try:
        url = f"{settings.notes_server_url}/api/documents/{request.notes_id}" if request.notes_id else f"{settings.notes_server_url}/api/documents"
        response = requests.get(url, auth=(settings.notes_user, settings.notes_password))
        response.raise_for_status()
        docs = response.json()
        
        imported = []
        for doc in docs:
            existing = db.query(NotesDocument).filter(NotesDocument.notes_id == doc.get('id')).first()
            if existing:
                existing.title = doc.get('title')
                existing.content = doc.get('content')
                existing.url = doc.get('url')
                existing.project_id = request.project_id
                existing.sync_at = datetime.now()
                imported.append(existing)
            else:
                new_doc = NotesDocument(
                    notes_id=doc.get('id'),
                    title=doc.get('title'),
                    content=doc.get('content'),
                    url=doc.get('url'),
                    project_id=request.project_id,
                    sync_at=datetime.now(),
                )
                db.add(new_doc)
                imported.append(new_doc)
        
        db.commit()
        return imported
    except Exception:
        return []

from sqlalchemy.orm import Session
from database.models import NotesDocument, Project
from schemas.notes import NotesImportRequest
from datetime import datetime
from config.settings import settings
import re


def parse_notes_url(notes_url: str):
    result = {
        'title': '',
        'database': '',
        'view': '',
        'document': '',
        'server': '',
        'replica_id': '',
        'view_id': '',
        'note_id': '',
        'original_url': notes_url,
    }
    
    title_match = re.match(r'^(.+?)\s*<NDL>', notes_url, re.DOTALL)
    if title_match:
        result['title'] = title_match.group(1).strip()
    
    ndl_content = re.search(r'<NDL>(.*?)</NDL>', notes_url, re.DOTALL)
    if ndl_content:
        ndl_text = ndl_content.group(1)
        
        replica_match = re.search(r'<REPLICA\s+([^>]+)>', ndl_text)
        if replica_match:
            result['replica_id'] = replica_match.group(1).strip()
        
        view_match = re.search(r'<VIEW\s+([^>]+)>', ndl_text)
        if view_match:
            result['view_id'] = view_match.group(1).strip()
        
        note_match = re.search(r'<NOTE\s+([^>]+)>', ndl_text)
        if note_match:
            result['note_id'] = note_match.group(1).strip()
        
        hint_match = re.search(r'<HINT>\s*([^<]+)\s*</HINT>', ndl_text)
        if hint_match:
            result['server'] = hint_match.group(1).strip()
        
        rem_match = re.search(r"<REM>(.*?)</REM>", ndl_text)
        if rem_match:
            rem_text = rem_match.group(1)
            db_match = re.search(r"Database\s*'([^']+)'", rem_text)
            if db_match:
                result['database'] = db_match.group(1)
            view_name_match = re.search(r"View\s*'([^']+)'", rem_text)
            if view_name_match:
                result['view'] = view_name_match.group(1)
            doc_name_match = re.search(r"Document\s*'([^']+)'", rem_text)
            if doc_name_match:
                result['document'] = doc_name_match.group(1)
    
    if not result['title'] and result['document']:
        result['title'] = result['document']
    
    return result


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


def import_by_url(db: Session, notes_url: str, project_id: int = None):
    parsed = parse_notes_url(notes_url)
    
    existing = db.query(NotesDocument).filter(NotesDocument.notes_id == parsed['note_id']).first()
    if existing:
        existing.title = parsed['title']
        existing.content = f"数据库: {parsed['database']}\n视图: {parsed['view']}\n服务器: {parsed['server']}\n\n这是通过Notes URL导入的文档，完整内容需要访问Notes客户端查看。"
        existing.url = f"notes://{parsed['server']}/{parsed['database']}/{parsed['view_id']}/{parsed['note_id']}"
        existing.project_id = project_id or existing.project_id
        existing.sync_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return [existing]
    
    new_doc = NotesDocument(
        notes_id=parsed['note_id'],
        title=parsed['title'],
        content=f"数据库: {parsed['database']}\n视图: {parsed['view']}\n服务器: {parsed['server']}\n\n这是通过Notes URL导入的文档，完整内容需要访问Notes客户端查看。",
        url=f"notes://{parsed['server']}/{parsed['database']}/{parsed['view_id']}/{parsed['note_id']}",
        project_id=project_id,
        sync_at=datetime.now(),
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return [new_doc]


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

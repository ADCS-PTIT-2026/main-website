import os
import secrets
from datetime import date, datetime
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from app.core.data_service import enabled
from app.core.dependency import RoleChecker, PermissionChecker
from app.db.session import get_db
from app.models.document import Document
from app.models.department import Department
from app.models.integration import CrawlerSourceMapping
from app.services.integration_service import enqueue_sync, enqueue_processing, sha256_file

router = APIRouter()


class SourceMapping(BaseModel):
    source_name: str = Field(min_length=1, max_length=500)
    section: str = Field(default='', max_length=200)
    department_id: UUID


@router.get('/crawler-source-mappings', dependencies=[Depends(RoleChecker(['admin']))])
def get_mappings(db: Session = Depends(get_db)):
    return [{'source_name': m.source_name, 'section': m.section, 'department_id': str(m.department_id)}
            for m in db.query(CrawlerSourceMapping).order_by(CrawlerSourceMapping.source_name, CrawlerSourceMapping.section)]


@router.put('/crawler-source-mappings', dependencies=[Depends(RoleChecker(['admin']))])
def put_mappings(mappings: list[SourceMapping], db: Session = Depends(get_db)):
    identities = set()
    for item in mappings:
        identity = (item.source_name.strip(), item.section.strip())
        if not identity[0] or identity in identities or not db.get(Department, item.department_id):
            raise HTTPException(422, 'Nguồn bị lặp hoặc phòng ban không hợp lệ')
        identities.add(identity)
    db.query(CrawlerSourceMapping).delete()
    for item in mappings:
        db.add(CrawlerSourceMapping(source_name=item.source_name.strip(), section=item.section.strip(), department_id=item.department_id))
    db.commit()
    return get_mappings(db)


class CrawlerIngest(BaseModel):
    document_id: UUID
    source_name: str = Field(min_length=1, max_length=500)
    source_url: str | None = None
    external_id: str | None = Field(default=None, max_length=500)
    section: str = Field(default='', max_length=200)
    filename: str = Field(min_length=1, max_length=500)
    file_path: str
    file_size: int = Field(ge=0)
    file_hash: str = Field(pattern=r'^[a-fA-F0-9]{64}$')
    extra_files: list[str | dict] = Field(default_factory=list, max_length=30)
    so_hieu_van_ban: str | None = None
    so_den: str | None = None
    trich_yeu: str | None = None
    co_quan_ban_hanh: str | None = None
    ngay_ban_hanh: date | None = None
    ngay_den: datetime | date | None = None
    loai_van_ban: str | None = None
    do_khan: str | None = None
    created_at: datetime | None = None


def crawler_file(path: str):
    root = Path(os.getenv('CRAWLER_FILE_ROOT', '/mnt/data2tb/adcs/uploads/crawler')).resolve()
    target = Path(path).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        raise HTTPException(422, 'Đường dẫn crawler không hợp lệ')
    if target.stat().st_size > int(os.getenv('TRANSLATION_MAX_BYTES', '52428800')):
        raise HTTPException(413, 'Tệp quá lớn')
    return target


@router.post('/documents/webhook/crawler-ingest', status_code=202)
def crawler_ingest(payload: CrawlerIngest, x_service_key: str | None = Header(None), db: Session = Depends(get_db)):
    expected = os.getenv('SERVICE_INTERNAL_KEY', '')
    if not expected:
        raise HTTPException(503, 'Chưa cấu hình khóa nội bộ')
    if not x_service_key or not secrets.compare_digest(x_service_key.encode(), expected.encode()):
        raise HTTPException(403, 'Khóa dịch vụ không hợp lệ')
    if not all(enabled(flag) for flag in ('CRAWLER_INGEST_ENABLED', 'INTEGRATION_WORKER_ENABLED', 'DS_SYNC_ENABLED')):
        raise HTTPException(503, 'Tiếp nhận crawler chưa được bật')
    target = crawler_file(payload.file_path)
    digest = sha256_file(target)
    if digest != payload.file_hash.lower() or target.stat().st_size != payload.file_size:
        raise HTTPException(422, 'Dung lượng hoặc SHA-256 không khớp')
    extras = []
    for extra in payload.extra_files:
        extra_path = extra if isinstance(extra, str) else extra.get('file_path') or extra.get('path')
        if not isinstance(extra_path, str):
            raise HTTPException(422, 'Tệp đính kèm thiếu đường dẫn')
        verified = crawler_file(extra_path)
        if isinstance(extra, dict) and extra.get('file_hash') and sha256_file(verified) != extra['file_hash'].lower():
            raise HTTPException(422, 'SHA-256 tệp đính kèm không khớp')
        extras.append(str(verified))
    # A short transaction serializes UUID, content and source identity checks.
    db.execute(text('SELECT pg_advisory_xact_lock(20261020, 2)'))
    existing = db.get(Document, payload.document_id)
    if existing:
        if existing.file_hash == digest and not existing.deleted_at:
            return {'document_id': str(existing.document_id), 'status': existing.status, 'already_received': True}
        raise HTTPException(409, detail={'error_code': 'UUID_CONFLICT', 'message': 'UUID đã được sử dụng'})
    identity = db.query(Document).filter(Document.deleted_at.is_(None))
    original = identity.filter(Document.file_hash == digest).first()
    if payload.external_id:
        original = original or identity.filter(Document.source_type == 'crawler', Document.source_name == payload.source_name.strip(),
                                                func.coalesce(Document.source_section, '') == payload.section.strip(),
                                                Document.external_id == payload.external_id).first()
    mapping = db.query(CrawlerSourceMapping).filter(
        CrawlerSourceMapping.source_name == payload.source_name.strip(),
        CrawlerSourceMapping.section.in_([payload.section.strip(), ''])
    ).order_by(func.length(CrawlerSourceMapping.section).desc()).first()
    doc = Document(document_id=payload.document_id, source_type='crawler', source_name=payload.source_name.strip(),
                   source_section=payload.section.strip(), source_url=payload.source_url, external_id=payload.external_id,
                   file_path=str(target), file_hash=digest, file_size_bytes=payload.file_size,
                   original_filename=payload.filename, extra_files=extras, priority=3,
                   assigned_department_id=mapping.department_id if mapping else None,
                   status='duplicate' if original else 'queued', is_chua_doc=True,
                   so_ky_hieu=payload.so_hieu_van_ban, so_den=payload.so_den, trich_yeu=payload.trich_yeu,
                   don_vi_ban_hanh=payload.co_quan_ban_hanh, ngay_van_ban=payload.ngay_ban_hanh,
                   ngay_den=payload.ngay_den, loai_van_ban_text=payload.loai_van_ban, do_khan=payload.do_khan)
    if payload.created_at:
        doc.created_at = payload.created_at
    db.add(doc)
    db.flush()
    if original:
        doc.duplicate_of = {'web_document_id': str(original.document_id)}
        doc.duplicate_reasons = ['same_file' if original.file_hash == digest else 'same_identity']
        doc.sync_status = 'skipped'
    else:
        enqueue_sync(db, doc, 'create')
        enqueue_processing(db, doc.document_id, priority=3)
    db.commit()
    if original:
        raise HTTPException(409, detail={'error_code': 'DUPLICATE', 'message': 'Đã ghi nhận tài liệu trùng', 'document_id': str(doc.document_id)})
    return {'document_id': str(doc.document_id), 'status': 'queued'}

@router.get('/documents/search-capabilities')
def search_capabilities(user=Depends(PermissionChecker('file.read'))):
    return {'data_service_search': enabled('DS_SEARCH_ENABLED') and enabled('DS_SEARCH_ACL_CONFIRMED')}


@router.get('/integration/status', dependencies=[Depends(RoleChecker(['admin']))])
def integration_status(db: Session = Depends(get_db)):
    from app.models.integration import IntegrationOutbox, ProcessingJob
    return {'outbox': [{'id': str(e.id), 'document_id': str(e.document_id), 'operation': e.operation,
                       'status': e.status, 'attempts': e.attempts, 'error_code': e.error_code}
                      for e in db.query(IntegrationOutbox).filter(IntegrationOutbox.status != 'done').order_by(IntegrationOutbox.created_at).limit(100)],
            'jobs': [{'id': str(j.id), 'kind': j.kind, 'reference_id': str(j.reference_id), 'status': j.status, 'error_code': j.error_code}
                     for j in db.query(ProcessingJob).filter(ProcessingJob.status.notin_(['done', 'cancelled'])).order_by(ProcessingJob.created_at).limit(100)],
            'unmapped_crawler': [{'document_id': str(d.document_id), 'source_name': d.source_name, 'section': d.source_section,
                                 'filename': d.original_filename, 'status': d.status}
                                for d in db.query(Document).filter(Document.source_type == 'crawler', Document.assigned_department_id.is_(None), Document.deleted_at.is_(None)).limit(100)]}


class Resolution(BaseModel):
    action: str = Field(pattern='^(resume|fail)$')


@router.post('/integration/jobs/{job_id}/resolve', dependencies=[Depends(RoleChecker(['admin']))])
def resolve_job(job_id: UUID, body: Resolution, db: Session = Depends(get_db)):
    from app.models.integration import ProcessingJob
    from app.models.translation import TranslationLog
    job = db.query(ProcessingJob).filter_by(id=job_id).with_for_update().first()
    if not job or job.status != 'needs_review':
        raise HTTPException(409, 'Chỉ giải quyết tác vụ đang cần đối soát')
    job.status, job.error_code = ('queued' if body.action == 'resume' else 'cancelled'), None
    if job.kind == 'document':
        record = db.get(Document, job.reference_id)
        if record and not record.deleted_at:
            record.status = 'queued' if body.action == 'resume' else 'failed'
            enqueue_sync(db, record)
    else:
        record = db.get(TranslationLog, job.reference_id)
        if record:
            record.status = 'pending' if body.action == 'resume' else 'failed'
            record.job_status = 'queued' if body.action == 'resume' else 'failed'
    db.commit()
    return {'status': job.status}


@router.post('/integration/outbox/{event_id}/retry', dependencies=[Depends(RoleChecker(['admin']))])
def retry_event(event_id: UUID, db: Session = Depends(get_db)):
    from datetime import timezone
    from app.models.integration import IntegrationOutbox
    event = db.get(IntegrationOutbox, event_id)
    if not event or event.status != 'failed':
        raise HTTPException(409, 'Sự kiện không ở trạng thái lỗi')
    event.status, event.attempts, event.error_code = 'pending', 0, None
    event.available_at = datetime.now(timezone.utc)
    db.commit()
    return {'status': 'pending'}


@router.get('/integration/processing-errors', dependencies=[Depends(RoleChecker(['admin']))])
def processing_errors(db: Session = Depends(get_db)):
    from app.models.processing_attempt import ProcessingAttempt
    rows = db.query(ProcessingAttempt).filter((ProcessingAttempt.error.isnot(None)) | ((ProcessingAttempt.warnings.isnot(None)) & (ProcessingAttempt.warnings != []))).order_by(ProcessingAttempt.started_at.desc()).limit(100).all()
    return [{'attempt_id': str(row.id), 'document_id': str(row.document_id), 'request_id': row.request_id,
             'status': row.status, 'error': row.error, 'warnings': row.warnings or [], 'started_at': row.started_at}
            for row in rows if row.error or row.warnings]

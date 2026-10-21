"""Transactional Web -> DS events. Callers commit document and event together."""
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from sqlalchemy import func, text
from fastapi.encoders import jsonable_encoder
from app.core.data_service import enabled
from app.models.integration import IntegrationOutbox, ProcessingJob
from app.models.document import Document
from app.models.department import Department


def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


FIELD_MAP = {
    'so_den': 'so_den',
    'so_ky_hieu': 'so_hieu_van_ban', 'trich_yeu': 'trich_yeu',
    'don_vi_ban_hanh': 'co_quan_ban_hanh', 'ngay_van_ban': 'ngay_ban_hanh',
    'ngay_den': 'ngay_den', 'ngay_het_han': 'ngay_het_han',
    'loai_van_ban_text': 'loai_van_ban', 'do_khan': 'do_khan',
    'nguoi_ky': 'nguoi_ky', 'chuc_vu_nguoi_ky': 'chuc_vu_nguoi_ky',
    'assigned_user_id': 'assigned_user_id', 'status': 'status', 'summary': 'summary',
    'key_points': 'key_points',
}


def metadata_payload(db, doc, fields=None):
    keys = FIELD_MAP.keys() if fields is None else fields
    payload = {FIELD_MAP[key]: getattr(doc, key) for key in keys if key in FIELD_MAP}
    if fields is None or 'assigned_department_id' in fields:
        department = db.get(Department, doc.assigned_department_id) if doc.assigned_department_id else None
        payload.update(assigned_department_code=department.code if department else None,
                       assigned_department_name=department.name if department else None)
    if 'status' in payload:
        payload['status'] = {'success': 'processed', 'pending': 'queued', 'needs_review': 'failed', 'error': 'failed'}.get(payload['status'], payload['status'])
    if fields is None and payload.get('trich_yeu') is None:
        payload.pop('trich_yeu', None)
    payload['updated_at'] = doc.updated_at or datetime.now(timezone.utc)
    return jsonable_encoder(payload)


def create_payload(db, doc):
    if not doc.file_hash and doc.file_path and Path(doc.file_path).is_file():
        doc.file_hash = sha256_file(doc.file_path)
    payload = metadata_payload(db, doc)
    payload.update(document_id=str(doc.document_id), filename=doc.original_filename,
                   file_path=doc.file_path, file_size=doc.file_size_bytes, file_hash=doc.file_hash,
                   source_type=doc.source_type or 'user_upload', priority=doc.priority or 1,
                   uploaded_by_user_id=str(doc.uploaded_by_user_id) if doc.uploaded_by_user_id else None,
                   created_at=jsonable_encoder(doc.created_at), so_ky_hieu=doc.so_ky_hieu)
    return payload


def enqueue_sync(db, doc, operation='metadata', fields=None, historical=False):
    if not enabled('DS_SYNC_ENABLED'):
        return
    db.flush()
    db.execute(text('SELECT pg_advisory_xact_lock(hashtext(:ref))'), {'ref': str(doc.document_id)})
    sequence = (db.query(func.max(IntegrationOutbox.sequence)).filter_by(document_id=doc.document_id).scalar() or 0) + 1
    doc.updated_at = datetime.now(timezone.utc)
    payload = metadata_payload(db, doc, fields)
    if operation == 'create':
        payload = create_payload(db, doc)
    if historical:
        payload['_historical'] = True
    if operation == 'delete':
        payload = {'file_path': doc.file_path, 'extra_files': doc.extra_files or []}
    db.add(IntegrationOutbox(document_id=doc.document_id, sequence=sequence,
                             operation=operation, payload=payload))
    doc.sync_version = sequence
    doc.sync_status = 'pending'


def enqueue_processing(db, reference_id, kind='document', priority=1):
    if enabled('INTEGRATION_WORKER_ENABLED'):
        db.add(ProcessingJob(reference_id=reference_id, kind=kind, priority=priority))


def mark_duplicate(doc, info):
    doc.status = 'duplicate'
    doc.duplicate_of = info.get('duplicate_of')
    doc.duplicate_reasons = info.get('duplicate_reasons') or []
    doc.possible_duplicates = info.get('possible_duplicates') or []


def document_public_state(db, doc, user):
    """Never expose another owner's duplicate reference or metadata without scope checks."""
    from app.crud.document import can_user_access_document
    from app.core.document_websocket import is_uuid
    ref = doc.duplicate_of
    original = None
    if isinstance(ref, dict):
        candidate = ref.get('web_document_id')
        if is_uuid(candidate):
            original = db.get(Document, candidate)
        elif ref.get('document_id'):
            original = db.query(Document).filter_by(ds_document_id=ref['document_id']).first()
    elif is_uuid(ref):
        original = db.get(Document, ref)
    visible = original and not original.deleted_at and can_user_access_document(original, user)
    return {'source_type': doc.source_type, 'source_name': doc.source_name,
            'sync_status': doc.sync_status, 'sync_warnings': doc.sync_warnings or [],
            'duplicate_document_id': str(original.document_id) if visible else None,
            'duplicate_reasons': doc.duplicate_reasons or [],
            'possible_duplicate_count': len(doc.possible_duplicates or [])}


def serialize_document(db, doc, user):
    from fastapi.encoders import jsonable_encoder
    payload = jsonable_encoder(doc)
    for private in ('duplicate_of', 'possible_duplicates', 'storage_info', 'file_path', 'extra_files'):
        payload.pop(private, None)
    payload.update(document_public_state(db, doc, user))
    return payload

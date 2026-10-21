"""After stopping the old worker: python -m app.commands.backfill_data_service.
Resumable, additive; never schedules existing processed documents for AI again.
"""
from uuid import UUID
from app.core.data_service import enabled
from app.db.session import SessionLocal
from app.models.document import Document
from app.models.translation import TranslationLog
from app.models.integration import IntegrationOutbox, ProcessingJob
from app.services.integration_service import enqueue_sync, enqueue_processing


def main():
    if not enabled('DS_SYNC_ENABLED') or not enabled('INTEGRATION_WORKER_ENABLED'):
        raise RuntimeError('Enable DS sync and standalone worker configuration before backfill')
    last = UUID(int=0)
    while True:
        with SessionLocal() as db:
            docs = db.query(Document).filter(Document.document_id > last, Document.deleted_at.is_(None), Document.status != 'duplicate').order_by(Document.document_id).limit(100).all()
            if not docs:
                break
            last = docs[-1].document_id
            for doc in docs:
                if not db.query(IntegrationOutbox).filter_by(document_id=doc.document_id).first():
                    enqueue_sync(db, doc, 'create', historical=True)
                    if doc.status in ('processed', 'approved', 'success'):
                        enqueue_sync(db, doc)
                if doc.status == 'queued' and not db.query(ProcessingJob).filter_by(reference_id=doc.document_id).first():
                    enqueue_processing(db, doc.document_id, priority=doc.priority or 1)
                elif doc.status == 'processing':
                    doc.status = 'needs_review'
                    job = db.query(ProcessingJob).filter_by(reference_id=doc.document_id).first()
                    if not job:
                        db.add(ProcessingJob(kind='document', reference_id=doc.document_id, priority=doc.priority or 1, status='needs_review'))
            db.commit()
    with SessionLocal() as db:
        for log in db.query(TranslationLog).filter(TranslationLog.status.in_(['pending', 'translating']), TranslationLog.input_path.is_(None)):
            log.status, log.job_status = 'failed', 'failed'
            log.error_code = 'LEGACY_INPUT_MISSING'
            log.error_message = 'Bản dịch cũ không lưu tệp đầu vào; vui lòng tải lại tài liệu'
        db.commit()


if __name__ == '__main__':
    main()

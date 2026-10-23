"""Standalone worker: python -m app.services.integration_worker.
A session advisory lock protects the global heavy-work slot across processes.
"""
import asyncio
import json
import os
import signal
from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import text
from app.core.data_service import data_service, enabled
from app.core.logger import logger
from app.db.session import SessionLocal, engine
from app.models.document import Document
from app.models.translation import TranslationLog
from app.models.integration import IntegrationOutbox, ProcessingJob
from app.services.integration_service import enqueue_sync, mark_duplicate, create_payload, metadata_payload


def now():
    return datetime.now(timezone.utc)


def clean_owned_file(db, path, doc):
    if not path:
        return
    root = Path('/mnt/data2tb/adcs/uploads').resolve()
    target = Path(path).resolve()
    used = db.query(Document).filter(Document.document_id != doc.document_id,
                                     Document.deleted_at.is_(None),
                                     (Document.file_path == str(target)) | Document.extra_files.contains([str(target)])).first()
    if target.is_relative_to(root) and target.is_file() and not used:
        target.unlink()


async def deliver_one():
    with SessionLocal() as db:
        # Earlier failed events block later events for this document.
        row = db.execute(text('''SELECT o.id FROM integration_outbox o
            WHERE o.status='pending' AND o.available_at<=now() AND NOT EXISTS (
                SELECT 1 FROM integration_outbox p WHERE p.document_id=o.document_id
                AND p.sequence<o.sequence AND p.status<>'done')
            ORDER BY o.created_at,o.sequence LIMIT 1 FOR UPDATE SKIP LOCKED''')).first()
        if not row:
            return
        event = db.get(IntegrationOutbox, row[0])
        event_id, ref, op, payload = event.id, event.document_id, event.operation, dict(event.payload)
        historical = payload.pop('_historical', False)
        doc = db.get(Document, ref)
        if op == 'metadata' and doc and doc.status == 'duplicate':
            event.status = 'done'
            doc.sync_status = 'skipped'
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(doc, 'updated_at')
            db.commit()
            return
    try:
        if op == 'create':
            result = (await data_service.post('/api/v1/documents/sync', json=payload)).json()
        elif op == 'delete':
            try:
                await data_service.delete(f'/api/v1/documents/{ref}')
            except HTTPException as exc:
                if exc.status_code != 404:
                    raise
            result = {}
        else:
            try:
                result = (await data_service.put(f'/api/v1/documents/{ref}/sync-metadata', json=payload)).json()
            except HTTPException as exc:
                if exc.status_code != 404:
                    raise
                with SessionLocal() as db:
                    doc = db.get(Document, ref)
                    if not doc or doc.deleted_at:
                        raise exc
                    restore = create_payload(db, doc)
                    restore_metadata = metadata_payload(db, doc)
                restored = (await data_service.post('/api/v1/documents/sync', json=restore)).json()
                if restored.get('is_duplicate'):
                    result = restored
                else:
                    result = (await data_service.put(f'/api/v1/documents/{ref}/sync-metadata', json=restore_metadata)).json()
        with SessionLocal() as db:
            event = db.get(IntegrationOutbox, event_id)
            doc = db.get(Document, ref)
            event.status = 'done'
            if doc:
                # Bookkeeping must not advance the business timestamp and cause endless reconciliation.
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(doc, 'updated_at')
                if op == 'create' or result.get('is_duplicate'):
                    if not result.get('is_duplicate') or historical:
                        doc.ds_document_id = result.get('ds_document_id')
                    doc.sync_warnings = result.get('warnings') or []
                    doc.possible_duplicates = result.get('possible_duplicates') or []
                    if result.get('is_duplicate') and historical:
                        doc.sync_warnings = [*doc.sync_warnings, 'HISTORICAL_DUPLICATE_REVIEW']
                    elif result.get('is_duplicate'):
                        mark_duplicate(doc, result)
                        job = db.query(ProcessingJob).filter_by(reference_id=ref).first()
                        if job:
                            job.status = 'cancelled'
                if op == 'delete':
                    clean_owned_file(db, payload.get('file_path'), doc)
                    for extra in payload.get('extra_files', []):
                        clean_owned_file(db, extra, doc)
                doc.sync_status = 'synced' if doc.sync_version == event.sequence else 'pending'
            db.commit()
    except HTTPException as exc:
        with SessionLocal() as db:
            event = db.get(IntegrationOutbox, event_id)
            event.attempts += 1
            detail = exc.detail if isinstance(exc.detail, dict) else {}
            event.error_code = detail.get('error_code', 'DS_ERROR')
            retryable = exc.status_code in (429, 502, 503, 504)
            if not retryable or event.attempts >= 10:
                event.status = 'failed'
            event.available_at = now() + timedelta(seconds=min(900, 2 ** event.attempts))
            doc = db.get(Document, event.document_id)
            if doc:
                doc.sync_status = 'error'
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(doc, 'updated_at')
            db.commit()

    except (ValueError, KeyError, TypeError, OSError) as exc:
        with SessionLocal() as db:
            event = db.get(IntegrationOutbox, event_id)
            event.status = 'failed'
            event.error_code = 'FILE_IO_ERROR' if isinstance(exc, OSError) else 'DS_BAD_RESPONSE'
            doc = db.get(Document, ref)
            if doc:
                doc.sync_status = 'error'
                from sqlalchemy.orm.attributes import flag_modified
                flag_modified(doc, 'updated_at')
            db.commit()


async def run_translation(ref):
    if not enabled('DS_TRANSLATION_JOBS_ENABLED') or not enabled('DS_JOB_IDEMPOTENCY_CONFIRMED'):
        raise HTTPException(503, 'Chưa xác nhận hợp đồng job dịch idempotent')
    with SessionLocal() as db:
        log = db.get(TranslationLog, ref)
        if not log or log.job_status == 'cancelled':
            return
        job_id = log.ds_job_id
        source, target, path, filename = log.source_language, log.target_language, log.input_path, log.filename
        log.status, log.job_status = 'translating', 'submitting'
        db.commit()
    if not job_id:
        if not path or not Path(path).is_file():
            raise HTTPException(422, detail={'error_code': 'INPUT_MISSING', 'message': 'Không tìm thấy tệp đầu vào; vui lòng tải lại'})
        with Path(path).open('rb') as stream:
            result = (await data_service.post('/api/v1/translate/jobs', files={'file': (filename, stream)},
                data={'source_lang': source, 'target_lang': target, 'external_ref': str(ref), 'priority': '2'})).json()
        job_id = UUID(result['job_id'])
        with SessionLocal() as db:
            log = db.get(TranslationLog, ref)
            log.ds_job_id = job_id
            log.job_status = 'queued'
            db.commit()
    while True:
        snapshot = (await data_service.get(f'/api/v1/translate/jobs/{job_id}')).json()
        status = snapshot['status']
        with SessionLocal() as db:
            job = db.query(ProcessingJob).filter_by(reference_id=ref).with_for_update().first()
            log = db.get(TranslationLog, ref)
            if not log or not job:
                return
            if job.status == 'cancelled':
                log.status = log.job_status = 'cancelled'
                db.commit()
                return
            log.job_status, log.step = status, snapshot.get('step')
            progress = snapshot.get('progress') or {}
            log.progress_done, log.progress_total = progress.get('done', 0), progress.get('total', 0)
            log.queue_position = snapshot.get('queue_position')
            log.error_code, log.error_message = snapshot.get('error_code'), snapshot.get('error_message')
            if status in ('failed', 'cancelled'):
                log.status = status
            db.commit()
        if status in ('failed', 'cancelled'):
            return
        if status == 'success':
            response = await data_service.get(f'/api/v1/translate/jobs/{job_id}/result', timeout=120)
            root = Path(os.getenv('TRANSLATION_DOWNLOAD_DIR', 'static/downloads')).resolve()
            root.mkdir(parents=True, exist_ok=True)
            destination = root / f'translated_{ref}.docx'
            temporary = destination.with_suffix('.part')
            temporary.write_bytes(response.content)
            temporary.replace(destination)
            with SessionLocal() as db:
                log = db.get(TranslationLog, ref)
                log.result_file_url, log.status, log.job_status = str(destination), 'success', 'success'
                db.commit()
            return
        await asyncio.sleep(3)


async def run_heavy(job_id):
    with SessionLocal() as db:
        job = db.get(ProcessingJob, job_id)
        ref, kind = job.reference_id, job.kind
    try:
        if kind == 'translation':
            await run_translation(ref)
        else:
            from app.services.document_queue_service import document_queue
            await document_queue.semaphore.acquire()
            await document_queue._process_single_document(str(ref))
        with SessionLocal() as db:
            job = db.get(ProcessingJob, job_id)
            if not job:
                return
            doc = db.get(Document, ref) if kind == 'document' else None
            if doc and doc.status not in ('processed', 'approved', 'duplicate'):
                if doc.status == 'queued':
                    job.status = 'queued'
                    job.error_code = 'RETRYING'
                elif doc.status == 'failed':
                    job.status, job.error_code = 'failed', 'AI_RESULT_FAILED'
                else:
                    job.status, job.error_code = 'needs_review', 'AI_RESULT_UNCERTAIN'
                    doc.status = 'needs_review'
            else:
                job.status = 'done'
                job.error_code = None
            job.lease_until = None
            db.execute(text("SELECT pg_notify('adcs_events', :body)"), {'body': json.dumps({'reference_id': str(ref), 'kind': kind})})
            db.commit()
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        with SessionLocal() as db:
            job = db.get(ProcessingJob, job_id)
            if not job:
                return
            detail = exc.detail if isinstance(exc, HTTPException) and isinstance(exc.detail, dict) else {}
            retry = kind == 'translation' and isinstance(exc, HTTPException) and exc.status_code in (429, 502, 503, 504)
            # Preserve the global slot during transient DS failures until the old job is resolved.
            permanent = kind == 'translation' and isinstance(exc, HTTPException) and exc.status_code in (400, 413, 415, 422)
            job.status = 'retry_wait' if retry else ('done' if permanent else 'needs_review')
            job.error_code = detail.get('error_code', 'WORKER_ERROR')
            job.lease_until = now() + timedelta(seconds=30) if retry else None
            if kind == 'translation':
                log = db.get(TranslationLog, ref)
                if log:
                    log.error_code = job.error_code
                    log.error_message = detail.get('message', 'Tác vụ cần được kiểm tra trước khi tiếp tục')
                    log.job_status = 'retry_wait' if retry else ('failed' if permanent else 'needs_review')
                    log.status = 'translating' if retry else 'failed'
            db.commit()


async def reconcile():
    # Keyset batches prevent skipping documents when callbacks update rows.
    last = UUID(int=0)
    while True:
        with SessionLocal() as db:
            docs = db.query(Document).filter(Document.document_id > last, Document.deleted_at.is_(None), Document.status != 'duplicate').order_by(Document.document_id).limit(200).all()
            if not docs:
                return
            last = docs[-1].document_id
            payload = {'documents': [{'document_id': str(d.document_id), 'updated_at': d.updated_at.isoformat(), 'status': {'success': 'processed', 'pending': 'queued', 'needs_review': 'failed', 'error': 'failed'}.get(d.status, d.status)} for d in docs]}
        result = (await data_service.post('/api/v1/sync/reconcile', json=payload)).json()
        missing = result.get('missing_in_data_service', [])
        outdated = [item['document_id'] for item in result.get('outdated_in_data_service', [])] + [item['document_id'] for item in result.get('status_mismatch', [])]
        with SessionLocal() as db:
            for ref in dict.fromkeys(missing + outdated):
                doc = db.get(Document, ref)
                pending = db.query(IntegrationOutbox).filter(IntegrationOutbox.document_id == ref, IntegrationOutbox.status != 'done').first()
                if doc and not doc.deleted_at and not pending:
                    enqueue_sync(db, doc, 'create' if ref in missing else 'metadata', historical=ref in missing and doc.status not in ('queued', 'processing', 'pending'))
                    if ref in missing and doc.status in ('processed', 'approved', 'success'):
                        enqueue_sync(db, doc)
            db.commit()


def recover_expired_jobs(db):
    for job in db.query(ProcessingJob).filter(ProcessingJob.status == 'processing',
            (ProcessingJob.lease_until <= now()) | ProcessingJob.lease_until.is_(None)).with_for_update():
        job.status = 'queued' if job.kind == 'translation' else 'needs_review'
        if job.kind == 'document':
            doc = db.get(Document, job.reference_id)
            if doc:
                doc.status = 'needs_review'
    db.commit()


def claim_next_job(db):
    blocked = db.query(ProcessingJob).filter(ProcessingJob.status == 'processing').first()
    waiting = db.query(ProcessingJob).filter_by(status='retry_wait').first()
    job = None
    if not blocked and waiting and waiting.lease_until <= now():
        job = waiting
    elif not blocked:
        job = db.query(ProcessingJob).filter(ProcessingJob.status == 'queued').filter(
            (ProcessingJob.kind == 'translation') | ProcessingJob.reference_id.in_(
                db.query(Document.document_id).filter(Document.sync_status == 'synced', Document.deleted_at.is_(None), Document.status == 'queued')
            )).order_by(ProcessingJob.priority, ProcessingJob.created_at, ProcessingJob.id).with_for_update(skip_locked=True).first()
    if job and job.kind == 'document':
        doc = db.get(Document, job.reference_id)
        if not doc or doc.deleted_at or doc.status == 'duplicate':
            job.status = 'cancelled'
            job = None
        elif doc.sync_status != 'synced':
            job = None
        else:
            doc.status = 'processing'
    if job:
        job.status, job.lease_until = 'processing', now() + timedelta(seconds=60)
        job_id = job.id
    db.commit()
    return job_id if job else None


async def main():
    if not enabled('INTEGRATION_WORKER_ENABLED') or not enabled('DS_SYNC_ENABLED'):
        raise RuntimeError('Worker requires INTEGRATION_WORKER_ENABLED and DS_SYNC_ENABLED')
    if enabled('LEGACY_DOCUMENT_WORKER_ENABLED'):
        raise RuntimeError('Disable embedded legacy worker before starting the integration worker')
    from zoneinfo import ZoneInfo
    with engine.connect() as guard:
        if not guard.execute(text('SELECT pg_try_advisory_lock(20261020,1)')).scalar():
            raise RuntimeError('Another integration worker owns the global slot')
        guard.commit()
        with SessionLocal() as db:
            recover_expired_jobs(db)
        active = None
        active_id = None
        last_reconcile = None
        stop = asyncio.Event()
        for sig in (signal.SIGTERM, signal.SIGINT):
            asyncio.get_running_loop().add_signal_handler(sig, stop.set)
        try:
            while not stop.is_set():
                # Detect a lost advisory lock connection before starting more work.
                guard.execute(text('SELECT 1'))
                guard.commit()
                Path('/tmp/adcs-worker-heartbeat').touch()
                await deliver_one()
                if active and active.done():
                    await active
                    active, active_id = None, None
                if active_id:
                    with SessionLocal() as db:
                        db.get(ProcessingJob, active_id).lease_until = now() + timedelta(seconds=60)
                        db.commit()
                if active is None:
                    with SessionLocal() as db:
                        recover_expired_jobs(db)
                        active_id = claim_next_job(db)
                    if active_id:
                        active = asyncio.create_task(run_heavy(active_id))
                local_time = now().astimezone(ZoneInfo('Asia/Ho_Chi_Minh'))
                if local_time.hour == 2 and last_reconcile != local_time.date():
                    try:
                        await reconcile()
                        last_reconcile = local_time.date()
                    except HTTPException:
                        logger.warning('Reconcile chưa hoàn tất; sẽ thử lại')
                try:
                    await asyncio.wait_for(stop.wait(), timeout=2)
                except asyncio.TimeoutError:
                    pass
        finally:
            if active:
                active.cancel()
                await asyncio.gather(active, return_exceptions=True)
            guard.execute(text('SELECT pg_advisory_unlock(20261020,1)'))
            guard.commit()


if __name__ == '__main__':
    asyncio.run(main())

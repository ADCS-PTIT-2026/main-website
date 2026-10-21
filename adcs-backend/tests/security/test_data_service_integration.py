"""DS v5 contract and transactional integration tests; providers are always fake."""
import asyncio
import hashlib
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.models.document import Document
from app.models.department import Department
from app.models.integration import IntegrationOutbox, ProcessingJob, CrawlerSourceMapping
from app.models.translation import TranslationLog
from app.models.user import User
from app.core.data_service import data_service
from app.services.integration_service import enqueue_sync, enqueue_processing
from app.services.integration_worker import deliver_one, run_translation, run_heavy, reconcile


def run(awaitable):
    return asyncio.run(awaitable)


def flags(monkeypatch):
    for key in ('DS_SYNC_ENABLED', 'INTEGRATION_WORKER_ENABLED', 'CRAWLER_INGEST_ENABLED',
                'DS_TRANSLATION_JOBS_ENABLED', 'DS_JOB_IDEMPOTENCY_CONFIRMED'):
        monkeypatch.setenv(key, 'true')
    monkeypatch.setenv('LEGACY_DOCUMENT_WORKER_ENABLED', 'false')


def response(data):
    return SimpleNamespace(json=lambda: data, content=b'translated-docx')


def crawler_payload(tmp_path, **changes):
    path = tmp_path / (str(uuid4()) + '.txt')
    path.write_bytes(b'Crawler document')
    payload = dict(document_id=str(uuid4()), source_name='Source', section='incoming', external_id=str(uuid4()),
                   filename='document.txt', file_path=str(path), file_size=path.stat().st_size,
                   file_hash=hashlib.sha256(path.read_bytes()).hexdigest())
    payload.update(changes)
    return payload


def test_transport_auth_error_and_same_origin(monkeypatch):
    captured = []
    async def request(client, method, url, **kwargs):
        captured.append((url, kwargs))
        return httpx.Response(401, json={'detail': {'error_code': 'UNAUTHORIZED', 'message': 'Khóa không hợp lệ'}}, request=httpx.Request(method, url))
    monkeypatch.setattr(httpx.AsyncClient, 'request', request)
    with pytest.raises(HTTPException) as error:
        run(data_service.get('/api/v1/history'))
    assert error.value.status_code == 502
    assert captured[0][1]['headers']['X-Service-Key'] == 'synthetic-backend-key'
    assert captured[0][1]['headers']['X-Request-ID']
    with pytest.raises(ValueError):
        run(data_service.get('https://foreign.invalid/api/v1/history'))
    assert len(captured) == 1


def test_sync_create_and_metadata_are_atomic_and_ordered(document, monkeypatch):
    flags(monkeypatch)
    ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        enqueue_sync(db, doc, 'create')
        doc.ngay_het_han = None
        enqueue_sync(db, doc, fields=['ngay_het_han'])
        db.commit()
        events = db.query(IntegrationOutbox).order_by(IntegrationOutbox.sequence).all()
        assert [e.sequence for e in events] == [1, 2]
        assert events[0].payload['file_hash'] == hashlib.sha256(Path(doc.file_path).read_bytes()).hexdigest()
        assert events[1].payload['ngay_het_han'] is None
    post = AsyncMock(return_value=response({'ds_document_id': 501}))
    put = AsyncMock(return_value=response({'applied': True}))
    monkeypatch.setattr(data_service, 'post', post)
    monkeypatch.setattr(data_service, 'put', put)
    run(deliver_one()); run(deliver_one())
    assert post.await_count == put.await_count == 1
    with SessionLocal() as db:
        assert db.get(Document, ref).sync_status == 'synced'
        assert db.get(Document, ref).ds_document_id == 501
        assert all(e.status == 'done' for e in db.query(IntegrationOutbox))


def test_rollback_does_not_leave_outbox(document, monkeypatch):
    flags(monkeypatch)
    ref = document()
    with SessionLocal() as db:
        enqueue_sync(db, db.get(Document, ref), 'create')
        db.rollback()
        assert db.query(IntegrationOutbox).count() == 0


def test_permanent_outbox_error_blocks_later_event(document, monkeypatch):
    flags(monkeypatch)
    ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        enqueue_sync(db, doc, 'create'); enqueue_sync(db, doc); db.commit()
    post = AsyncMock(side_effect=HTTPException(422, {'error_code': 'INVALID_DOCUMENT'}))
    put = AsyncMock()
    monkeypatch.setattr(data_service, 'post', post); monkeypatch.setattr(data_service, 'put', put)
    run(deliver_one()); run(deliver_one())
    assert post.await_count == 1 and put.await_count == 0
    with SessionLocal() as db:
        assert db.query(IntegrationOutbox).order_by(IntegrationOutbox.sequence).first().status == 'failed'


def test_sync_duplicate_stops_job_and_does_not_alias_original(document, monkeypatch):
    flags(monkeypatch)
    ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        enqueue_sync(db, doc, 'create'); enqueue_processing(db, doc.document_id); db.commit()
    monkeypatch.setattr(data_service, 'post', AsyncMock(return_value=response({'is_duplicate': True, 'ds_document_id': 77, 'duplicate_of': {'document_id': 77}, 'duplicate_reasons': ['same_file']})))
    run(deliver_one())
    with SessionLocal() as db:
        assert db.get(Document, ref).status == 'duplicate'
        assert db.query(ProcessingJob).one().status == 'cancelled'
        assert db.get(Document, ref).ds_document_id is None


def test_crawler_mapping_priority_and_idempotency(client, auth, data, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('CRAWLER_FILE_ROOT', str(tmp_path))
    with SessionLocal() as db:
        dept = Department(id=1, name='Receiver', code='RECEIVER'); db.add(dept); db.flush()
        dept_id = str(dept.department_id)
        db.add(CrawlerSourceMapping(source_name='Source', section='incoming', department_id=dept.department_id))
        user = db.get(User, data.ids['owner']); user.department_id = dept_id; db.commit()
    payload = crawler_payload(tmp_path)
    url = '/api/documents/webhook/crawler-ingest'
    assert client.post(url, json=payload).status_code == 403
    headers = {'X-Service-Key': 'synthetic-service-key'}
    assert client.post(url, json=payload, headers=headers).status_code == 202
    assert client.post(url, json=payload, headers=headers).json()['already_received']
    with SessionLocal() as db:
        doc = db.get(Document, payload['document_id'])
        assert doc.priority == 3 and str(doc.assigned_department_id) == dept_id
        assert db.query(ProcessingJob).count() == db.query(IntegrationOutbox).count() == 1
    assert client.get('/api/documents/'+payload['document_id'], headers=auth()).status_code == 200
    assert client.get('/api/documents/'+payload['document_id'], headers=auth('other')).status_code == 403


def test_crawler_unmapped_and_duplicate_are_private(client, auth, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('CRAWLER_FILE_ROOT', str(tmp_path))
    payload = crawler_payload(tmp_path)
    headers = {'X-Service-Key': 'synthetic-service-key'}
    assert client.post('/api/documents/webhook/crawler-ingest', json=payload, headers=headers).status_code == 202
    assert client.get('/api/documents/'+payload['document_id'], headers=auth()).status_code == 403
    payload['document_id'] = str(uuid4())
    assert client.post('/api/documents/webhook/crawler-ingest', json=payload, headers=headers).status_code == 409
    with SessionLocal() as db:
        assert db.query(Document).filter_by(status='duplicate').count() == 1
        assert db.query(ProcessingJob).count() == 1


@pytest.mark.parametrize('bad', ['hash', 'size', 'outside', 'symlink'])
def test_crawler_rejects_bad_file(client, tmp_path, monkeypatch, bad):
    flags(monkeypatch); root = tmp_path / 'root'; root.mkdir()
    monkeypatch.setenv('CRAWLER_FILE_ROOT', str(root))
    payload = crawler_payload(root)
    if bad == 'hash': payload['file_hash'] = '0' * 64
    if bad == 'size': payload['file_size'] += 1
    if bad in ('outside', 'symlink'):
        outside = tmp_path / 'private'; outside.write_bytes(b'private')
        if bad == 'symlink':
            link = root / 'escape'; link.symlink_to(outside); payload['file_path'] = str(link)
        else: payload['file_path'] = str(outside)
    assert client.post('/api/documents/webhook/crawler-ingest', json=payload, headers={'X-Service-Key': 'synthetic-service-key'}).status_code == 422
    with SessionLocal() as db:
        assert db.query(Document).count() == db.query(ProcessingJob).count() == 0


def test_translation_language_pair_dedup_and_persistent_input(client, auth, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('TRANSLATION_INPUT_DIR', str(tmp_path))
    def upload(target):
        return client.post('/api/translations/upload', headers=auth(), files={'files': ('doc.txt', b'translate me')}, data={'source_lang': 'vi', 'target_lang': target})
    first = upload('fr'); assert first.status_code == 200
    assert upload('fr').json()['duplicate_count'] == 1
    assert upload('en').json()['duplicate_count'] == 0
    with SessionLocal() as db:
        assert db.query(ProcessingJob).count() == 2
        for log in db.query(TranslationLog):
            assert Path(log.input_path).read_bytes() == b'translate me'
            assert log.source_language == 'vi' and len(log.file_hash) == 64


def test_translation_resume_download_and_no_second_job(client, auth, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('TRANSLATION_INPUT_DIR', str(tmp_path/'inputs'))
    monkeypatch.setenv('TRANSLATION_DOWNLOAD_DIR', str(tmp_path/'outputs'))
    result = client.post('/api/translations/upload', headers=auth(), files={'files': ('doc.txt', b'text')}).json()
    ref = UUID(result['processed_files'][0]['id']); job_id = uuid4()
    post = AsyncMock(return_value=response({'job_id': str(job_id)}))
    async def get(path, **kwargs):
        if path.endswith('/result'): return response({})
        return response({'status': 'success', 'progress': {'done': 1, 'total': 1}})
    monkeypatch.setattr(data_service, 'post', post); monkeypatch.setattr(data_service, 'get', get)
    run(run_translation(ref)); run(run_translation(ref))
    assert post.await_count == 1
    assert post.await_args.kwargs['data']['external_ref'] == str(ref)
    assert client.get(f'/api/translations/{ref}/download', headers=auth()).content == b'translated-docx'
    assert client.get(f'/api/translations/{ref}/download', headers=auth('other')).status_code == 403


def test_translation_cancel_scope_and_terminal_state(client, auth, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('TRANSLATION_INPUT_DIR', str(tmp_path))
    result = client.post('/api/translations/upload', headers=auth(), files={'files': ('doc.txt', b'text')}).json()
    ref = result['processed_files'][0]['id']
    assert client.post(f'/api/translations/{ref}/cancel', headers=auth('other')).status_code == 403
    assert client.post(f'/api/translations/{ref}/cancel', headers=auth()).status_code == 200
    assert client.post(f'/api/translations/{ref}/cancel', headers=auth()).status_code == 409


def test_translation_timeout_reuses_ref_and_holds_slot(client, auth, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('TRANSLATION_INPUT_DIR', str(tmp_path))
    result = client.post('/api/translations/upload', headers=auth(), files={'files': ('doc.txt', b'text')}).json()
    ref = result['processed_files'][0]['id']
    with SessionLocal() as db:
        job_id = db.query(ProcessingJob).filter_by(reference_id=ref).one().id
    monkeypatch.setattr(data_service, 'post', AsyncMock(side_effect=HTTPException(503, {'error_code': 'DS_UNAVAILABLE', 'message': 'Mất kết nối'})))
    run(run_heavy(job_id))
    with SessionLocal() as db:
        assert db.get(ProcessingJob, job_id).status == 'retry_wait'
        assert db.get(TranslationLog, ref).job_status == 'retry_wait'


def test_search_applies_uuid_acl_and_keeps_scores_separate(client, auth, document, monkeypatch):
    mine = document(); other = document('other')
    monkeypatch.setenv('DS_SEARCH_ENABLED', 'true'); monkeypatch.setenv('DS_SEARCH_ACL_CONFIRMED', 'true')
    post = AsyncMock(return_value=response({'results': [{'document_id': 7, 'web_document_id': mine, 'best_similarity': .9}], 'total': 1}))
    monkeypatch.setattr(data_service, 'post', post)
    result = client.get('/api/documents/search?search_mode=hybrid', headers=auth())
    assert result.status_code == 200, result.text
    assert result.json()['data'][0]['document_id'] == mine
    assert result.json()['data'][0]['similarity'] == .9
    assert post.await_args.kwargs['json']['allowed_web_document_ids'] == [mine]
    post.return_value = response({'results': [{'document_id': 8, 'web_document_id': other}], 'total': 1})
    assert client.get('/api/documents/search', headers=auth()).status_code == 502


def test_search_rejects_semantic_when_feature_off(client, auth):
    assert client.get('/api/documents/search?search_mode=semantic', headers=auth()).status_code == 503
    assert client.get('/api/documents/search?start_date=garbage', headers=auth()).status_code == 422


def test_duplicate_reference_is_not_exposed_in_local_search(client, auth, document):
    original = document('other'); copy = document()
    with SessionLocal() as db:
        doc = db.get(Document, copy); doc.status = 'duplicate'; doc.duplicate_of = {'web_document_id': original}; doc.possible_duplicates = [{'secret': original}]; db.commit()
    result = client.get('/api/documents/search', headers=auth())
    assert result.status_code == 200
    assert original not in result.text and 'secret' not in result.text
    assert result.json()['data'][0]['duplicate_document_id'] is None
    edited = client.put('/api/documents/'+copy+'/ai-result', headers=auth(), json={'trich_yeu': 'Updated copy'})
    assert edited.status_code == 200 and original not in edited.text and 'secret' not in edited.text
    assert client.put('/api/documents/'+copy+'/ai-result', headers=auth(), json={'status': 'approved'}).status_code == 409


def test_tombstone_hides_document_and_delete_404_is_done(client, auth, document, monkeypatch):
    flags(monkeypatch); ref = document()
    assert client.delete('/api/documents/'+ref, headers=auth()).status_code == 200
    assert client.delete('/api/documents/'+ref, headers=auth()).status_code == 200
    assert client.get('/api/documents/'+ref, headers=auth()).status_code == 404
    assert client.get('/api/documents/my', headers=auth()).json()['total'] == 0
    monkeypatch.setattr(data_service, 'delete', AsyncMock(side_effect=HTTPException(404, 'Missing')))
    run(deliver_one())
    with SessionLocal() as db:
        assert db.get(Document, ref).deleted_at
        assert db.query(IntegrationOutbox).one().status == 'done'


def test_history_numeric_id_joins_web_uuid_and_local_ids_are_stable(client, auth, document, history_data):
    ref = document()
    history_data([{'id': 31, 'document_id': 410, 'web_document_id': ref}])
    assert client.get('/api/history', headers=auth()).json()['results'][0]['id'] == 31
    history_data([])
    result = client.get('/api/history', headers=auth()).json()['results'][0]
    assert result['id'] == 'web:'+ref
    assert client.get('/api/history/'+result['id']+'/detail', headers=auth()).status_code == 200


def test_reconcile_resends_missing_once(document, monkeypatch):
    flags(monkeypatch); ref = document()
    monkeypatch.setattr(data_service, 'post', AsyncMock(return_value=response({'missing_in_data_service': [ref]})))
    run(reconcile()); run(reconcile())
    with SessionLocal() as db:
        assert db.query(IntegrationOutbox).count() == 2


def test_worker_global_lock_excludes_another_connection():
    with engine.connect() as first, engine.connect() as second:
        assert first.execute(text('SELECT pg_try_advisory_lock(20261020,1)')).scalar()
        assert not second.execute(text('SELECT pg_try_advisory_lock(20261020,1)')).scalar()
        first.execute(text('SELECT pg_advisory_unlock(20261020,1)'))


def test_source_mapping_is_admin_only_and_validates_department(client, auth):
    assert client.get('/api/crawler-source-mappings', headers=auth()).status_code == 403
    assert client.get('/api/crawler-source-mappings', headers=auth('admin')).status_code == 200
    assert client.put('/api/crawler-source-mappings', headers=auth('admin'), json=[{'source_name': 'Source', 'department_id': str(uuid4())}]).status_code == 422


def test_queue_priority_and_waiting_sync_does_not_block_ready_work(document, monkeypatch):
    from app.services.integration_worker import claim_next_job
    flags(monkeypatch)
    refs = [document() for _ in range(3)]
    with SessionLocal() as db:
        for priority, ref in enumerate(refs, 1):
            doc = db.get(Document, ref); doc.status = 'queued'; doc.sync_status = 'synced'
            enqueue_processing(db, doc.document_id, priority=priority)
        # First upload is not yet synced; the ready priority-2 job should be claimed.
        db.get(Document, refs[0]).sync_status = 'pending'
        db.commit()
        claimed = claim_next_job(db)
        assert str(db.get(ProcessingJob, claimed).reference_id) == refs[1]
        db.get(ProcessingJob, claimed).status = 'done'; db.commit()
        db.get(Document, refs[0]).sync_status = 'synced'; db.commit()
        claimed = claim_next_job(db)
        assert str(db.get(ProcessingJob, claimed).reference_id) == refs[0]


def test_needs_review_holds_all_heavy_work(document, monkeypatch):
    from app.services.integration_worker import claim_next_job
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        db.add(ProcessingJob(kind='document', reference_id=uuid4(), priority=3, status='needs_review'))
        doc = db.get(Document, ref); doc.status = 'queued'; doc.sync_status = 'synced'
        enqueue_processing(db, doc.document_id); db.commit()
        assert claim_next_job(db) is None


def test_sync_ack_preserves_business_timestamp(document, monkeypatch):
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref); enqueue_sync(db, doc, 'create'); db.commit()
        timestamp = doc.updated_at
    monkeypatch.setattr(data_service, 'post', AsyncMock(return_value=response({'ds_document_id': 10})))
    run(deliver_one())
    with SessionLocal() as db:
        assert db.get(Document, ref).updated_at == timestamp


def test_sync_transient_error_retries_same_event(document, monkeypatch):
    from datetime import datetime, timezone
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        enqueue_sync(db, db.get(Document, ref), 'create'); db.commit()
    post = AsyncMock(side_effect=HTTPException(503, {'error_code': 'DS_UNAVAILABLE'}))
    monkeypatch.setattr(data_service, 'post', post)
    run(deliver_one())
    with SessionLocal() as db:
        event = db.query(IntegrationOutbox).one()
        assert event.status == 'pending' and event.attempts == 1
        event.available_at = datetime.now(timezone.utc); db.commit()
    post.side_effect = None; post.return_value = response({'ds_document_id': 10})
    run(deliver_one())
    with SessionLocal() as db:
        assert db.query(IntegrationOutbox).one().status == 'done'


def test_duplicate_ai_result_never_calls_qlvb(document, monkeypatch):
    from app.services.document_queue_service import document_queue
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref); doc.status = 'processing'; db.commit()
    monkeypatch.setattr('app.services.document_queue_service.send_to_ai_service', AsyncMock(return_value={
        'trang_thai': 'success', 'storage_info': {'action': 'duplicate', 'duplicate_of': {'document_id': 2}, 'duplicate_reasons': ['same_content']}}))
    send = AsyncMock(); monkeypatch.setattr('app.services.document_queue_service.send_document_to_qlvb', send)
    async def process():
        await document_queue.semaphore.acquire()
        await document_queue._process_single_document(ref)
    run(process())
    assert send.await_count == 0
    with SessionLocal() as db:
        assert db.get(Document, ref).status == 'duplicate'


def test_duplicate_create_does_not_send_later_metadata(document, monkeypatch):
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        enqueue_sync(db, doc, 'create'); enqueue_sync(db, doc); db.commit()
    monkeypatch.setattr(data_service, 'post', AsyncMock(return_value=response({'is_duplicate': True, 'duplicate_of': {'document_id': 3}})))
    put = AsyncMock(); monkeypatch.setattr(data_service, 'put', put)
    run(deliver_one()); run(deliver_one())
    assert put.await_count == 0
    with SessionLocal() as db:
        assert all(event.status == 'done' for event in db.query(IntegrationOutbox))


def test_metadata_missing_restores_document_before_retry(document, monkeypatch):
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        enqueue_sync(db, db.get(Document, ref)); db.commit()
    put = AsyncMock(side_effect=[HTTPException(404, 'Missing'), response({'applied': True})])
    post = AsyncMock(return_value=response({'is_duplicate': False, 'ds_document_id': 42}))
    monkeypatch.setattr(data_service, 'post', post); monkeypatch.setattr(data_service, 'put', put)
    run(deliver_one())
    assert post.await_count == 1 and put.await_count == 2
    with SessionLocal() as db:
        assert db.query(IntegrationOutbox).one().status == 'done'


def test_recover_only_expired_leases_and_resume_translation_without_recreating_job(document, monkeypatch):
    from datetime import datetime, timedelta, timezone
    from app.services.integration_worker import recover_expired_jobs, claim_next_job
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        live = ProcessingJob(kind='document', reference_id=UUID(ref), priority=1, status='processing', lease_until=datetime.now(timezone.utc)+timedelta(seconds=60))
        expired_translation = ProcessingJob(kind='translation', reference_id=uuid4(), priority=2, status='processing', lease_until=datetime.now(timezone.utc)-timedelta(seconds=1))
        db.add_all([live, expired_translation]); db.commit()
        recover_expired_jobs(db)
        assert live.status == 'processing' and expired_translation.status == 'queued'
        assert claim_next_job(db) is None
        live.lease_until = datetime.now(timezone.utc)-timedelta(seconds=1); db.commit()
        recover_expired_jobs(db)
        assert live.status == 'needs_review' and db.get(Document, ref).status == 'needs_review'
        assert claim_next_job(db) is None


def test_backfill_is_resumable_and_never_requeues_processed_ai(document, monkeypatch):
    from app.commands.backfill_data_service import main
    flags(monkeypatch); ref = document()
    main(); main()
    with SessionLocal() as db:
        assert db.query(IntegrationOutbox).filter_by(document_id=ref).count() == 2
        assert db.query(ProcessingJob).count() == 0
        assert db.get(Document, ref).file_hash


def test_cancelled_translation_deleted_during_poll_does_not_crash_worker(client, auth, tmp_path, monkeypatch):
    flags(monkeypatch); monkeypatch.setenv('TRANSLATION_INPUT_DIR', str(tmp_path))
    result = client.post('/api/translations/upload', headers=auth(), files={'files': ('doc.txt', b'text')}).json()
    ref = result['processed_files'][0]['id']
    with SessionLocal() as db:
        job_id = db.query(ProcessingJob).filter_by(reference_id=ref).one().id
        db.get(TranslationLog, ref).ds_job_id = uuid4(); db.commit()
    async def deleted_during_poll(*args, **kwargs):
        with SessionLocal() as db:
            db.delete(db.get(ProcessingJob, job_id)); db.delete(db.get(TranslationLog, ref)); db.commit()
        return response({'status': 'cancelled'})
    monkeypatch.setattr(data_service, 'get', deleted_during_poll)
    run(run_heavy(job_id))
    with SessionLocal() as db:
        assert db.get(ProcessingJob, job_id) is None


def test_delete_duplicate_sends_only_its_own_uuid(client, auth, document, monkeypatch):
    flags(monkeypatch); original = document('other'); copy = document()
    with SessionLocal() as db:
        db.get(Document, copy).duplicate_of = {'web_document_id': original}
        db.get(Document, copy).status = 'duplicate'; db.commit()
    delete = AsyncMock(return_value=response({})); monkeypatch.setattr(data_service, 'delete', delete)
    assert client.delete('/api/documents/'+copy, headers=auth()).status_code == 200
    run(deliver_one())
    delete.assert_awaited_once_with('/api/v1/documents/'+copy)
    with SessionLocal() as db:
        assert db.get(Document, original).deleted_at is None


def test_local_file_cleanup_error_is_visible_without_crashing_worker(document, monkeypatch):
    from datetime import datetime, timezone
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref); doc.deleted_at = datetime.now(timezone.utc)
        enqueue_sync(db, doc, 'delete'); db.commit()
    monkeypatch.setattr(data_service, 'delete', AsyncMock(return_value=response({})))
    def denied(*args):
        raise PermissionError('Synthetic filesystem failure')
    monkeypatch.setattr('app.services.integration_worker.clean_owned_file', denied)
    run(deliver_one())
    with SessionLocal() as db:
        event = db.query(IntegrationOutbox).one()
        assert event.status == 'failed' and event.error_code == 'FILE_IO_ERROR'


def test_historical_sync_does_not_reclassify_completed_web_document(document, monkeypatch):
    flags(monkeypatch); ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        enqueue_sync(db, doc, 'create', historical=True); enqueue_sync(db, doc); db.commit()
    post = AsyncMock(return_value=response({'is_duplicate': True, 'ds_document_id': 99,
        'duplicate_of': {'document_id': 3}, 'duplicate_reasons': ['same_identity']}))
    put = AsyncMock(return_value=response({'applied': True}))
    monkeypatch.setattr(data_service, 'post', post); monkeypatch.setattr(data_service, 'put', put)
    run(deliver_one()); run(deliver_one())
    assert '_historical' not in post.await_args.kwargs['json']
    assert put.await_count == 1
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        assert doc.status == 'processed' and doc.ds_document_id == 99
        assert 'HISTORICAL_DUPLICATE_REVIEW' in doc.sync_warnings
        assert doc.sync_status == 'synced'


@pytest.mark.parametrize('legacy,wire', [('success','processed'),('pending','queued'),('needs_review','failed')])
def test_legacy_status_is_normalized_for_ds_without_changing_web(document, legacy, wire):
    from app.services.integration_service import metadata_payload
    ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref); doc.status = legacy
        assert metadata_payload(db, doc)['status'] == wire
        assert doc.status == legacy


@pytest.mark.parametrize('path', ['/api/documents?limit=5', '/api/documents/all'])
def test_dashboard_document_lists_accept_legacy_null_metadata_and_preserve_scope(client, auth, document, path):
    mine, foreign = document(), document('other')
    with SessionLocal() as db:
        owned = db.get(Document, mine)
        owned.sync_warnings = owned.duplicate_reasons = None
        owned.duplicate_of = {'web_document_id': foreign}
        db.commit()
    result = client.get(path, headers=auth())
    assert result.status_code == 200
    assert len(result.json()) == 1 and result.json()[0]['document_id'] == mine
    assert result.json()[0]['sync_warnings'] == result.json()[0]['duplicate_reasons'] == []
    assert result.json()[0]['duplicate_document_id'] is None and foreign not in result.text
    admin_result = client.get(path, headers=auth('admin'))
    assert admin_result.status_code == 200 and len(admin_result.json()) == 2
    stats = client.get('/api/documents/stats', headers=auth())
    assert stats.status_code == 200 and stats.json()['total_documents'] == 1


@pytest.mark.parametrize('warnings,reasons', [(None,None), (['PATH_IGNORED'],['same_file'])])
def test_document_response_normalizes_null_lists_for_orm_routes(document, warnings, reasons):
    from app.schemas.document import DocumentResponse
    ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        doc.sync_warnings, doc.duplicate_reasons = warnings, reasons
        value = DocumentResponse.model_validate(doc)
        assert value.sync_warnings == (warnings or [])
        assert value.duplicate_reasons == (reasons or [])

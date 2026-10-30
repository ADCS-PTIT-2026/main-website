"""Regressions from the 2026-10-30 Main web audit (L3, L4, L5, L7, L8, L9)."""
import asyncio
import json
import threading
from unittest.mock import AsyncMock
from uuid import UUID

import pytest
from fastapi import HTTPException

from app.core import error_contract as ec
from app.db.session import SessionLocal
from app.main import http_error_handler
from app.models.document import Document
from app.models.integration import ProcessingJob
from app.models.processing_attempt import ProcessingAttempt
from app.models.security import LoginAttempt
from app.services import auth_service
from app.services import document_queue_service as queue
from app.services.history_service import _enrich_with_web_documents, guess_mime_type, item_matches_search
from app.services.integration_worker import DOCUMENT_CONCURRENCY, claim_next_job, run_heavy

PASSWORD = 'AuditPassword123!'
GATEWAY = {'X-Real-IP': '172.18.0.1'}


def set_document(doc_id, **fields):
    with SessionLocal() as db:
        doc = db.get(Document, doc_id)
        for key, value in fields.items():
            setattr(doc, key, value)
        db.commit()


def run_document(doc_id, monkeypatch, tmp_path, ai_result):
    path = tmp_path / 'input.pdf'
    path.write_bytes(b'%PDF-1.4')
    set_document(doc_id, status='processing', file_path=str(path))
    with SessionLocal() as db:
        job = ProcessingJob(reference_id=UUID(doc_id), kind='document', priority=1, status='processing')
        db.add(job)
        db.commit()
        job_id = job.id
    monkeypatch.setattr(queue, 'send_to_ai_service', AsyncMock(return_value=ai_result))
    monkeypatch.setattr(queue, 'send_document_to_qlvb', AsyncMock())
    asyncio.run(run_heavy(job_id))
    with SessionLocal() as db:
        doc, job = db.get(Document, doc_id), db.get(ProcessingJob, job_id)
        attempt = db.query(ProcessingAttempt).filter_by(document_id=doc_id).one()
        db.expunge_all()
    return doc, job, attempt


def test_successful_ai_result_is_saved(document, monkeypatch, tmp_path):
    result = {'trang_thai': 'success', 'tom_tat': 'Tóm tắt', 'extracted_fields': {}, 'de_xuat_thoi_han_xu_ly': {},
              'warnings': [{'error_code': 'EMBEDDING_FAILED', 'message': 'Chưa tạo được vector'}]}
    doc, job, attempt = run_document(document(), monkeypatch, tmp_path, result)
    assert (doc.status, doc.summary, job.status, attempt.status) == ('processed', 'Tóm tắt', 'done', 'succeeded')
    assert attempt.finished_at is not None and attempt.warnings[0]['error_code'] == 'EMBEDDING_FAILED'


def test_retryable_ai_failure_schedules_retry_and_keeps_reason(document, monkeypatch, tmp_path):
    doc, job, attempt = run_document(document(), monkeypatch, tmp_path, ec.error('LLM_UNAVAILABLE', service='ai-service'))
    assert (doc.status, job.status, job.error_code) == ('queued', 'queued', 'LLM_UNAVAILABLE')
    assert doc.next_attempt_at is not None and doc.error_details['error_code'] == 'LLM_UNAVAILABLE'
    assert attempt.error['error_code'] == 'LLM_UNAVAILABLE' and attempt.finished_at is not None


def test_permanent_ai_failure_is_marked_failed(document, monkeypatch, tmp_path):
    doc, job, _ = run_document(document(), monkeypatch, tmp_path, ec.error('OCR_EXTRACTION_FAILED', service='ai-service'))
    assert (doc.status, job.status, job.error_code) == ('failed', 'failed', 'OCR_EXTRACTION_FAILED')


def test_incomplete_ai_error_keeps_its_code(document, monkeypatch, tmp_path):
    partial = {'status': 'error', 'error_code': 'OCR_EXTRACTION_FAILED', 'message': 'Không đọc được'}
    doc, _, _ = run_document(document(), monkeypatch, tmp_path, partial)
    assert doc.status == 'failed' and doc.error_details['error_code'] == 'OCR_EXTRACTION_FAILED'


def test_other_users_failures_below_ip_limit_do_not_lock_login(client):
    for index in range(auth_service.LOGIN_EMAIL_MAX_FAILURES):
        response = client.post('/api/auth/login', headers=GATEWAY, json={'email': f'other{index}@ptit.edu.vn', 'password': 'Wrong-Pass1!'})
        assert response.status_code == 401
    assert client.post('/api/auth/login', headers=GATEWAY, json={'email': 'owner@ptit.edu.vn', 'password': PASSWORD}).status_code == 200


def test_ip_lock_applies_at_its_own_limit(client, monkeypatch):
    monkeypatch.setattr(auth_service, 'LOGIN_IP_MAX_FAILURES', 3)
    for index in range(3):
        client.post('/api/auth/login', headers=GATEWAY, json={'email': f'other{index}@ptit.edu.vn', 'password': 'Wrong-Pass1!'})
    response = client.post('/api/auth/login', headers=GATEWAY, json={'email': 'owner@ptit.edu.vn', 'password': PASSWORD})
    assert response.status_code == 429 and 'địa chỉ IP' in response.json()['detail'] and 'Retry-After' in response.headers


def test_email_lock_after_five_failures_from_any_ip(client):
    for index in range(5):
        client.post('/api/auth/login', headers={'X-Real-IP': f'203.0.113.{index}'}, json={'email': 'owner@ptit.edu.vn', 'password': 'Wrong-Pass1!'})
    response = client.post('/api/auth/login', headers={'X-Real-IP': '203.0.113.99'}, json={'email': 'owner@ptit.edu.vn', 'password': PASSWORD})
    assert response.status_code == 429 and 'Tài khoản bị tạm khóa' in response.json()['detail']


def test_concurrent_first_failures_are_all_counted(data):
    errors, workers = [], 4
    barrier = threading.Barrier(workers)

    def fail_once():
        with SessionLocal() as db:
            barrier.wait()
            try:
                auth_service.record_login_failure(db, 'email:race@ptit.edu.vn')
            except Exception as exc:
                errors.append(exc)

    threads = [threading.Thread(target=fail_once) for _ in range(workers)]
    [thread.start() for thread in threads]
    [thread.join() for thread in threads]
    assert not errors
    with SessionLocal() as db:
        assert db.get(LoginAttempt, 'email:race@ptit.edu.vn').failures == workers


def test_dict_detail_message_reaches_client():
    detail = {'error_code': 'DS_UNAVAILABLE', 'message': 'Không kết nối được dịch vụ dữ liệu'}
    body = json.loads(asyncio.run(http_error_handler(None, HTTPException(503, detail=detail))).body)
    assert body['message'] == detail['message'] and body['error_code'] == 'DS_UNAVAILABLE'


def test_cancelled_document_is_not_reported_as_ai_failure(client, auth, document, monkeypatch):
    monkeypatch.setenv('INTEGRATION_WORKER_ENABLED', 'true')
    doc = document()
    set_document(doc, status='queued')
    with SessionLocal() as db:
        db.add(ProcessingJob(reference_id=UUID(doc), kind='document', priority=1))
        db.commit()
    assert client.post(f'/api/documents/{doc}/cancel', headers=auth()).json()['status'] == 'cancelled'
    detail = client.get(f'/api/history/document/{doc}/detail', headers=auth()).json()
    assert (detail['status'], detail['status_llm'], detail['status_save_file']) == ('cancelled', 'cancelled', 'skipped')
    assert client.post(f'/api/documents/{doc}/retry', headers=auth()).json()['status'] == 'queued'
    with SessionLocal() as db:
        assert db.query(ProcessingJob).filter_by(reference_id=UUID(doc)).one().status == 'queued'


def test_history_rows_get_web_metadata_status_and_file_type(document):
    doc = document()
    set_document(doc, status='failed', so_ky_hieu='1128/QLCL', trich_yeu='Về tuyển dụng viên chức')
    rows = [{'id': 1, 'filename': 'scan.png', 'file_type': 'application/pdf', 'status_llm': 'success', 'web_document_id': doc},
            {'id': 2, 'filename': 'crawler.pdf', 'file_type': None, 'status_llm': 'success', 'document_id': 'ds-541'}]
    with SessionLocal() as db:
        web_row, crawler_row = _enrich_with_web_documents(db, rows)
    assert (web_row['status_llm'], web_row['file_type']) == ('failed', 'image/png')
    assert item_matches_search(web_row, 'tuyển dụng') and item_matches_search(web_row, '1128/QLCL')
    assert (crawler_row['status_llm'], crawler_row['file_type']) == ('success', 'application/pdf')
    assert not item_matches_search(web_row, 'zzzz_khong_ton_tai')


def test_unknown_extension_is_not_labelled_as_pdf():
    assert guess_mime_type('file.unknownext') == 'application/octet-stream'
    assert guess_mime_type('file.unknownext', 'text/csv') == 'text/csv'
    assert guess_mime_type(None) == 'application/octet-stream'


def test_my_documents_returns_warnings_of_latest_successful_attempt(client, auth, document):
    doc = document()
    with SessionLocal() as db:
        db.add(ProcessingAttempt(document_id=UUID(doc), request_id='old', status='succeeded', warnings=[{'message': 'cũ'}]))
        db.commit()
        db.add(ProcessingAttempt(document_id=UUID(doc), request_id='new', status='succeeded', warnings=[{'message': 'mới'}]))
        db.commit()
    items = client.get('/api/documents/my', headers=auth()).json()['items']
    assert next(item for item in items if item['document_id'] == doc)['warnings'] == [{'message': 'mới'}]


def test_admin_processing_errors_expose_error_code(client, auth, document):
    doc = document()
    with SessionLocal() as db:
        db.add(ProcessingAttempt(document_id=UUID(doc), request_id='r1', status='failed', warnings=[],
                                 error={'error_code': 'LLM_TIMEOUT', 'message': 'm', 'stage': 'llm_analysis'}))
        db.add(ProcessingAttempt(document_id=UUID(doc), request_id='r2', status='succeeded', warnings=[]))
        db.commit()
    rows = client.get('/api/integration/processing-errors', headers=auth('admin')).json()
    assert len(rows) == 1 and rows[0]['error']['error_code'] == 'LLM_TIMEOUT'


def test_parallel_claim_respects_document_limit(document):
    for _ in range(DOCUMENT_CONCURRENCY + 1):
        doc = document()
        set_document(doc, status='queued', sync_status='synced')
        with SessionLocal() as db:
            db.add(ProcessingJob(reference_id=UUID(doc), kind='document', priority=1))
            db.commit()
    with SessionLocal() as db:
        claims = [claim_next_job(db, active_doc_count=active, active_trans_count=1) for active in range(DOCUMENT_CONCURRENCY + 1)]
    assert all(claims[:DOCUMENT_CONCURRENCY]) and claims[DOCUMENT_CONCURRENCY] is None

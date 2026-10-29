import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest

from app.core import error_contract as ec
from app.core.logger import request_id_var
from app.db.session import SessionLocal
from app.models.document import Document
from app.models.processing_attempt import ProcessingAttempt
from app.services.processing_errors import apply_failure


@pytest.mark.parametrize('code,status', [('INVALID_FILE','failed'), ('LLM_TIMEOUT','queued'),
    ('AI_RESPONSE_TIMEOUT','needs_review'), ('SERVER_BUSY','queued'), ('DEPENDENCY_AUTH_FAILED','failed')])
def test_retry_policy_keeps_original_error_and_does_not_retry_uncertain_work(code,status):
    doc=SimpleNamespace(document_id=uuid4(),retry_count=0)
    data=apply_failure(doc,ec.error(code),uuid4(),uuid4())
    assert doc.status==status and doc.error_details['error_code']==code
    if status=='queued':
        assert (doc.next_attempt_at-datetime.now(timezone.utc)).total_seconds()>13
    else: assert doc.next_attempt_at is None
    assert data['request_id'] in doc.error_message


def test_server_busy_respects_retry_after():
    doc=SimpleNamespace(document_id=uuid4(),retry_count=0)
    apply_failure(doc,ec.error('SERVER_BUSY',retry_after_seconds=90))
    assert (doc.next_attempt_at-datetime.now(timezone.utc)).total_seconds()>88


def test_http_error_and_read_timeout_do_not_become_none(monkeypatch):
    from app.services import document_service as service
    monkeypatch.setattr(service,'get_active_departments_for_ai',lambda db:[])
    class Client:
        async def __aenter__(self):return self
        async def __aexit__(self,*args):pass
        async def post(self,url,**kwargs):
            return httpx.Response(503,request=httpx.Request('POST',url),headers={'Retry-After':'45'},json=ec.error('SERVER_BUSY'))
    monkeypatch.setattr(httpx,'AsyncClient',lambda **kwargs:Client())
    with SessionLocal() as db:
        result=asyncio.run(service.send_to_ai_service(b'x','x.pdf',False,db=db,document_id=str(uuid4())))
    assert result['error_code']=='SERVER_BUSY' and result['retry_after_seconds']==45
    async def timeout(*args,**kwargs):raise httpx.ReadTimeout('private endpoint')
    monkeypatch.setattr(Client,'post',timeout)
    with SessionLocal() as db:
        result=asyncio.run(service.send_to_ai_service(b'x','x.pdf',False,db=db))
    assert result['error_code']=='AI_RESPONSE_TIMEOUT' and not result['retryable']
    assert 'private endpoint' not in str(result)


def test_worker_records_failure_and_attempts_are_scoped(client,auth,document,monkeypatch):
    from app.services import document_queue_service as queue
    ref=document()
    with SessionLocal() as db:
        doc=db.get(Document,ref);doc.status='processing';db.commit()
    async def failed(**kwargs):return ec.error('LLM_UPSTREAM_ERROR',dependency='qwen')
    monkeypatch.setattr(queue,'send_to_ai_service',failed)
    async def run():
        worker=queue.DocumentQueueManager()
        await worker.semaphore.acquire()
        await worker._process_single_document(ref)
    asyncio.run(run())
    with SessionLocal() as db:
        doc=db.get(Document,ref)
        assert doc.error_details['error_code']=='LLM_UPSTREAM_ERROR'
        assert doc.next_attempt_at is not None
        row=db.query(ProcessingAttempt).filter_by(document_id=ref).one()
        assert row.request_id not in ('SYSTEM','N/A')
        assert row.error['error_code']=='LLM_UPSTREAM_ERROR' and row.finished_at
    result=client.get(f'/api/documents/{ref}/processing-attempts',headers=auth('owner'))
    assert result.status_code==200 and len(result.json()['attempts'])==1
    assert client.get(f'/api/documents/{ref}/processing-attempts',headers=auth('other')).status_code==403
    assert client.get('/api/integration/processing-errors',headers=auth('owner')).status_code==403
    assert client.get('/api/integration/processing-errors',headers=auth('admin')).status_code==200
    assert request_id_var.get()=='SYSTEM'  # context must not leak to the next task


def test_admin_error_feed_filters_success_before_limit(client,auth,document):
    from datetime import timedelta
    ref=document()
    with SessionLocal() as db:
        db.add(ProcessingAttempt(document_id=ref,request_id='old-error',status='failed',
            error=ec.error('LLM_TIMEOUT'),started_at=datetime.now(timezone.utc)-timedelta(hours=1)))
        for index in range(105):
            db.add(ProcessingAttempt(document_id=ref,request_id=f'success-{index}',status='succeeded',warnings=[]))
        db.commit()
    response=client.get('/api/integration/processing-errors',headers=auth('admin'))
    assert response.status_code==200
    assert [row['request_id'] for row in response.json()]==['old-error']

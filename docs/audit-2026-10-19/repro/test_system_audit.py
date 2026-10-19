"""Expected-behavior checks. Run only against the disposable local audit database.

Imports application source without starting its lifespan/queue/webhook initializer.
Every test uses synthetic data; all outbound HTTP is blocked by default.
"""
import asyncio
import contextlib
import io
import os
from pathlib import Path
import sys
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

if not os.environ.get('ADCS_AUDIT_ROOT'):
    pytest.skip('Opt in with ADCS_AUDIT_ROOT and a disposable audit database', allow_module_level=True)

ROOT = Path(os.environ['ADCS_AUDIT_ROOT']).resolve()
os.environ.update({
    'DB_HOST': '127.0.0.1', 'DB_PORT': '15434', 'DB_USER': 'audit',
    'DB_PASSWORD': 'audit-local-only', 'DB_NAME': 'adcs_audit',
    'SECRET_KEY': 'synthetic-audit-signing-key-only', 'ALGORITHM': 'HS256',
    'AI_SERVICE_URL': 'https://ai.invalid/analyze',
    'DATA_SERVICE_URL': 'https://data.invalid',
    'PTIT_TOKEN_ENDPOINT': 'https://sso.invalid/token',
    'PTIT_CERTS_ENDPOINT': 'https://sso.invalid/certs',
    'PTIT_CLIENT_ID': 'audit-client', 'PTIT_REDIRECT_URI': 'http://127.0.0.1/callback',
    'TELEGRAM_BOT_TOKEN': '', 'QLVB_API_KEY': 'synthetic',
    'QLVB_BASE_URL': 'https://qlvb.invalid',
})
sys.path.insert(0, str(ROOT / 'adcs-backend'))
os.chdir(Path(__file__).parent)

from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.role_permission import Role, Permission
from app.models.document import Document
from app.models.department import Department
from app.models.translation import TranslationLog
from app.core.security import create_access_token, create_refresh_token, hash_password
from app.core.document_websocket import manager
from app.api.v1.endpoints import document as document_ep
from app.services import auth_service, document_queue_service, history_service
from app.crud.document import claim_next_document_for_processing, recover_interrupted_documents


def no_outbound(*args, **kwargs):
    raise RuntimeError('Outbound HTTP intentionally blocked by audit harness')


@pytest.fixture(autouse=True)
def isolated_data(monkeypatch):
    assert engine.url.host == '127.0.0.1' and engine.url.port == 15434
    assert engine.url.database == 'adcs_audit'
    monkeypatch.setattr('requests.sessions.Session.request', no_outbound)
    monkeypatch.setattr('httpx.AsyncClient.send', no_outbound)
    manager.active_connections.clear()
    with engine.begin() as connection:
        tables = connection.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
        names = [row[0] for row in tables]
        connection.execute(text('TRUNCATE ' + ', '.join('"'+n+'"' for n in names) + ' RESTART IDENTITY CASCADE'))
    with SessionLocal() as db:
        admin_role = Role(name='admin')
        user_role = Role(name='user')
        db.add(admin_role); db.flush()
        db.add(user_role); db.flush()
        password_hash = hash_password('AuditPassword123')
        users = [User(username=n, email=n+'@ptit.edu.vn', password_hash=password_hash,
                      role_id=r.role_id, is_active=True)
                 for n, r in [('audit_admin', admin_role), ('audit_owner', user_role), ('audit_other', user_role)]]
        for user in users:
            db.add(user); db.flush()
        db.commit()
        result = {n: str(u.user_id) for n, u in zip(['admin', 'owner', 'other'], users)}
        result['user_role'] = str(user_role.role_id)
    yield result
    manager.active_connections.clear()


@pytest.fixture
def client():
    # Avoid TestClient context manager: application startup changes Telegram webhook
    # and starts workers. Explicit service calls below test the queue in isolation.
    return TestClient(app, raise_server_exceptions=False)


def headers(data, name='owner', refresh=False):
    token = (create_refresh_token if refresh else create_access_token)({'sub': data[name]})
    return {'Authorization': 'Bearer '+token}


def add_doc(data, tmp_path, status='processed', **kwargs):
    f = tmp_path / 'synthetic.txt'; f.write_text('Synthetic audit data')
    with SessionLocal() as db:
        doc = Document(uploaded_by_user_id=data['owner'], status=status,
                       file_path=str(f), original_filename='audit.txt',
                       is_chua_doc=True, retry_count=0, priority=1, page_count=1, **kwargs)
        db.add(doc); db.commit()
        return str(doc.document_id)


def read_doc(doc_id):
    with SessionLocal() as db:
        doc = db.query(Document).filter(Document.document_id == doc_id).first()
        return {'status': doc.status, 'retry_count': doc.retry_count, 'summary': doc.summary,
                'yeu_cau_hanh_dong': doc.yeu_cau_hanh_dong, 'ngay_het_han': doc.ngay_het_han}


def add_translation(data, tmp_path):
    f = tmp_path / 'synthetic.docx'; f.write_bytes(b'audit-result')
    with SessionLocal() as db:
        log = TranslationLog(user_id=data['owner'], filename='audit.docx', file_type='docx',
                             status='success', result_file_url=str(f))
        db.add(log); db.commit(); return str(log.id)


def test_health(client):
    assert client.get('/health').json()['database'] == 'connected'


def test_login_and_wrong_password(client):
    assert client.post('/api/auth/login', json={'email':'audit_owner@ptit.edu.vn','password':'AuditPassword123'}).status_code == 200
    assert client.post('/api/auth/login', json={'email':'audit_owner@ptit.edu.vn','password':'wrong'}).status_code == 401


def test_registration_pending_approval(client):
    r = client.post('/api/auth/register', json={'name':'New Audit','email':'new@ptit.edu.vn','password':'AuditPassword123'})
    assert r.status_code == 200 and r.json()['is_active'] is False
    assert client.post('/api/auth/login', json={'email':'new@ptit.edu.vn','password':'AuditPassword123'}).status_code == 403


def test_protected_document_list(client):
    assert client.get('/api/documents').status_code == 401


def test_anonymous_users_denied(client):
    assert client.get('/api/users').status_code in (401, 403)


def test_anonymous_role_creation_denied(client):
    assert client.post('/api/role-permissions/roles', json={'name':'audit-unauthorized'}).status_code in (401,403)


def test_anonymous_matrix_update_denied(client):
    assert client.put('/api/role-permissions/roles/permissions-matrix', json={}).status_code in (401,403)


def test_anonymous_role_rename_cannot_grant_admin(client,isolated_data):
    with SessionLocal() as db:
        admin_role_id=str(db.query(Role).filter(Role.name=='admin').first().role_id)
    first=client.put('/api/role-permissions/roles/'+admin_role_id,json={'name':'previous-admin'})
    second=client.put('/api/role-permissions/roles/'+isolated_data['user_role'],json={'name':'admin'})
    r=client.put('/api/system-parameters',headers=headers(isolated_data),json={'temperature':'0.5'})
    assert r.status_code == 403, f'Anonymous role updates={first.status_code},{second.status_code}; regular user admin action={r.status_code}'


def test_admin_can_save_permission_matrix(client,isolated_data):
    with SessionLocal() as db:
        db.add(Permission(code='file.edit')); db.commit()
    key='file.edit_'+isolated_data['user_role']
    r=client.put('/api/role-permissions/roles/permissions-matrix',headers=headers(isolated_data,'admin'),json={key:True})
    assert r.status_code == 200


def test_admin_can_create_permission(client,isolated_data):
    r=client.post('/api/role-permissions/permissions',headers=headers(isolated_data,'admin'),json={'name':'Audit permission','code':'audit:view'})
    assert r.status_code == 200


def test_anonymous_department_creation_denied(client):
    r = client.post('/api/departments', json={'name':'Audit Department','id':123,'description':'Synthetic description only'})
    assert r.status_code in (401,403)


def test_translation_list_requires_identity(client, isolated_data, tmp_path):
    add_translation(isolated_data, tmp_path)
    r = client.get('/api/translations/', params={'user_id': isolated_data['owner']})
    assert r.status_code in (401,403)


def test_translation_comment_requires_owner(client, isolated_data, tmp_path):
    log_id = add_translation(isolated_data, tmp_path)
    assert client.put(f'/api/translations/{log_id}/comment', json={'comment':'unauthorized change'}).status_code in (401,403)


def test_translation_delete_requires_owner(client, isolated_data, tmp_path):
    log_id = add_translation(isolated_data, tmp_path)
    assert client.delete(f'/api/translations/{log_id}').status_code in (401,403)


def test_document_scope(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path)
    assert client.get(f'/api/documents/{doc_id}', headers=headers(isolated_data)).status_code == 200
    assert client.get(f'/api/documents/{doc_id}', headers=headers(isolated_data,'other')).status_code == 403
    result = client.get('/api/documents/search', headers=headers(isolated_data,'other')).json()
    assert result['total'] == 0


def test_non_uuid_document_cannot_bypass_scope(client,isolated_data,tmp_path,monkeypatch):
    doc_id=add_doc(isolated_data,tmp_path,summary='Private owner content')
    original=client.get('/api/documents/'+doc_id,headers=headers(isolated_data)).json()
    monkeypatch.setattr(document_ep,'get_detail_document_in_data_service',AsyncMock(return_value=original))
    r=client.get('/api/documents/701',headers=headers(isolated_data,'other'))
    assert r.status_code == 403


def test_refresh_token_not_usable_as_access_token(client, isolated_data):
    assert client.get('/api/users/me', headers=headers(isolated_data, refresh=True)).status_code == 401


def test_access_token_not_usable_for_refresh(client, isolated_data):
    access = create_access_token({'sub':isolated_data['owner']})
    assert client.post('/api/auth/refresh', json={'refresh_token':access}).status_code == 401


def test_sso_rejects_unverified_token(client, isolated_data, monkeypatch):
    from jose import jwt
    forged = jwt.encode({'email':'audit_admin@ptit.edu.vn','name':'Forged'}, 'wrong-signing-key', algorithm='HS256')
    monkeypatch.setattr(auth_service.requests, 'post', lambda *a, **kw: SimpleNamespace(status_code=200, json=lambda:{'id_token':forged}))
    monkeypatch.setattr(auth_service, 'get_ptit_jwks', lambda:None)
    assert client.get('/api/auth/sso/callback?code=synthetic-code').status_code in (401,502,503)


def test_telegram_webhook_rejects_forged_link(client, isolated_data, monkeypatch):
    from app.api.v1.endpoints import telegram
    monkeypatch.setattr(telegram,'send_telegram_notification',lambda *a, **kw:None)
    r = client.post('/api/telegram/webhook', json={'message':{'text':'/start '+isolated_data['owner'],'chat':{'id':123456}}})
    with SessionLocal() as db:
        user = db.query(User).filter(User.user_id == isolated_data['owner']).first()
        assert not user.telegram_chat_id, f'Forged webhook linked chat_id={user.telegram_chat_id}; HTTP={r.status_code}'


def test_websocket_requires_authentication(client, isolated_data):
    accepted = False
    try:
        with client.websocket_connect('/api/documents/ws/'+isolated_data['owner']):
            accepted = True
    except Exception:
        pass
    assert not accepted


def test_retry_and_cancel_owner(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path, status='failed')
    assert client.post(f'/api/documents/{doc_id}/retry', headers=headers(isolated_data)).status_code == 200
    assert client.post(f'/api/documents/{doc_id}/cancel', headers=headers(isolated_data)).status_code == 200


def test_retry_and_cancel_other_denied(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path, status='failed')
    assert client.post(f'/api/documents/{doc_id}/retry', headers=headers(isolated_data,'other')).status_code == 403


def test_approve_preserves_approved_status(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path)
    r = client.put(f'/api/documents/{doc_id}/ai-result', headers=headers(isolated_data), json={'status':'approved'})
    assert r.status_code == 200
    assert read_doc(doc_id)['status'] == 'approved'


def test_read_only_permission_cannot_edit(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path)
    # The synthetic user role has no permissions at all.
    r = client.put(f'/api/documents/{doc_id}/ai-result', headers=headers(isolated_data), json={'summary':'Changed without edit permission'})
    assert r.status_code == 403


def test_action_requirement_is_returned(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path, yeu_cau_hanh_dong='Required synthetic action')
    r = client.get(f'/api/documents/{doc_id}', headers=headers(isolated_data))
    assert r.json().get('yeu_cau_hanh_dong') == 'Required synthetic action'


def test_null_clears_due_date(client, isolated_data, tmp_path):
    from datetime import date
    doc_id = add_doc(isolated_data, tmp_path, ngay_het_han=date(2026,10,20))
    r = client.put(f'/api/documents/{doc_id}/ai-result',headers=headers(isolated_data),json={'ngay_het_han':None})
    assert r.status_code == 200
    assert read_doc(doc_id)['ngay_het_han'] is None


def test_failed_document_exposes_error(client, isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path,status='failed',error_message='Synthetic failure reason')
    assert client.get(f'/api/documents/{doc_id}',headers=headers(isolated_data)).json().get('error_message') == 'Synthetic failure reason'


def test_queue_success(isolated_data, tmp_path, monkeypatch):
    doc_id = add_doc(isolated_data, tmp_path,status='processing')
    monkeypatch.setattr(document_queue_service,'send_to_ai_service',AsyncMock(return_value={'trang_thai':'success','tom_tat':'Synthetic summary'}))
    monkeypatch.setattr(document_queue_service,'send_document_to_qlvb',AsyncMock())
    asyncio.run(document_queue_service.DocumentQueueManager()._process_single_document(doc_id))
    assert read_doc(doc_id)['status'] == 'processed'


def test_queue_failed_ai_exhausts_retries(isolated_data, tmp_path, monkeypatch):
    doc_id = add_doc(isolated_data, tmp_path,status='processing')
    monkeypatch.setattr(document_queue_service,'send_to_ai_service',AsyncMock(return_value=None))
    worker = document_queue_service.DocumentQueueManager()
    for _ in range(3):
        asyncio.run(worker._process_single_document(doc_id))
    assert read_doc(doc_id)['status'] == 'failed' and read_doc(doc_id)['retry_count'] == 3


def test_queue_malformed_ai_does_not_stick(isolated_data, tmp_path, monkeypatch):
    doc_id = add_doc(isolated_data, tmp_path,status='processing')
    monkeypatch.setattr(document_queue_service,'send_to_ai_service',AsyncMock(return_value={'trang_thai':'success','extracted_fields':None}))
    asyncio.run(document_queue_service.DocumentQueueManager()._process_single_document(doc_id))
    assert read_doc(doc_id)['status'] in ('failed','queued')


def test_recovery_does_not_steal_active_worker(isolated_data, tmp_path):
    doc_id = add_doc(isolated_data, tmp_path,status='queued')
    with SessionLocal() as first:
        assert claim_next_document_for_processing(first).document_id == uuid.UUID(doc_id)
    with SessionLocal() as second:
        assert recover_interrupted_documents(second) == 0


def test_history_unknown_web_document_does_not_crash(isolated_data, monkeypatch):
    class FakeClient:
        def __init__(self,*a,**kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*a): pass
        async def get(self,url,**kw):
            return SimpleNamespace(status_code=200,json=lambda: {'results':[{'id':700,'filename':'external-only.pdf','document_id':701,'status_llm':'success'}]} if url.endswith('/history') else {})
    monkeypatch.setattr(history_service.httpx,'AsyncClient',FakeClient)
    with SessionLocal() as db:
        result = asyncio.run(history_service.fetch_history_detail(700,db))
    assert result['filename'] == 'external-only.pdf'


def test_history_filter_does_not_match_other_owner_filename(isolated_data,tmp_path,monkeypatch):
    doc_id = add_doc(isolated_data,tmp_path)
    class FakeClient:
        def __init__(self,*a,**kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*a): pass
        async def get(self,*a,**kw):
            return SimpleNamespace(status_code=200,json=lambda:{'results':[{'id':888,'filename':'audit.txt','document_id':str(uuid.uuid4()),'created_at':'2026-10-19'}]})
    monkeypatch.setattr(history_service.httpx,'AsyncClient',FakeClient)
    with SessionLocal() as db:
        user=db.query(User).filter(User.user_id==isolated_data['owner']).first()
        result=asyncio.run(history_service.fetch_processing_history(user=user,db=db))
    assert all(item['id'] != 888 for item in result['results'])


def test_history_detail_requires_document_scope(client,isolated_data,tmp_path,monkeypatch):
    doc_id=add_doc(isolated_data,tmp_path,summary='Private owner content')
    class FakeClient:
        def __init__(self,*a,**kw): pass
        async def __aenter__(self): return self
        async def __aexit__(self,*a): pass
        async def get(self,url,**kw):
            return SimpleNamespace(status_code=200,json=lambda: {'results':[{'id':700,'filename':'audit.txt','document_id':doc_id,'status_llm':'success'}]} if url.endswith('/history') else {})
    monkeypatch.setattr(history_service.httpx,'AsyncClient',FakeClient)
    r=client.get('/api/history/700/detail',headers=headers(isolated_data,'other'))
    assert r.status_code == 403


def test_history_fallback_detail_resolves(client,isolated_data,tmp_path):
    add_doc(isolated_data,tmp_path)
    result=client.get('/api/history',headers=headers(isolated_data)).json()
    record=result['results'][0]
    assert client.get(f"/api/history/{record['id']}/detail",headers=headers(isolated_data)).status_code == 200


def test_department_cycle_rejected(client):
    first=client.post('/api/departments',json={'name':'Audit root','id':1,'description':'Synthetic root department'}).json()
    second=client.post('/api/departments',json={'name':'Audit child','id':2,'parent_id':1,'description':'Synthetic child department'}).json()
    r=client.put('/api/departments/'+first['department_id'],json={'parent_id':2})
    assert r.status_code in (400,409,422)


def test_validation_returns_422_instead_of_500(client):
    r=client.post('/api/departments',json={'name':'Audit invalid','description':'short'})
    assert r.status_code == 422


def test_email_validation_returns_422_instead_of_500(client):
    r=client.post('/api/users',json={'username':'Invalid audit','email':'invalid','password':'abc'})
    assert r.status_code == 422


def test_feedback_submission(client,isolated_data):
    r=client.post('/api/feedbacks',headers=headers(isolated_data),json={'feedback_type':'bug','content':'Synthetic audit feedback'})
    assert r.status_code == 201


def test_non_admin_cannot_change_ai_config(client,isolated_data):
    assert client.put('/api/system-parameters',headers=headers(isolated_data),json={'temperature':'0.5'}).status_code == 403


def test_admin_ai_validation(client,isolated_data):
    assert client.put('/api/system-parameters',headers=headers(isolated_data,'admin'),json={'temperature':'9'}).status_code == 400
    assert client.put('/api/system-parameters',headers=headers(isolated_data,'admin'),json={'temperature':'0.5'}).status_code == 200


@pytest.fixture
def redirect_uploads(monkeypatch,tmp_path):
    original_path=os.path
    class AuditPath:
        def __getattr__(self,name): return getattr(original_path,name)
        def exists(self,path):
            return False if path == '/mnt/data2tb/adcs/uploads' else original_path.exists(path)
        def abspath(self,path):
            if str(path).endswith('/endpoints/document.py'):
                return str(tmp_path/'a/b/c/d/document.py')
            return original_path.abspath(path)
    monkeypatch.setattr(document_ep,'os',SimpleNamespace(path=AuditPath(),makedirs=os.makedirs,remove=os.remove))
    return tmp_path


def test_upload_enqueues_and_persists_file(client,isolated_data,redirect_uploads):
    r=client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':('audit.txt',b'Synthetic content','text/plain')},data={'is_save_file':'true'})
    assert r.status_code == 200 and r.json()['status'] == 'queued'
    with SessionLocal() as db:
        doc=db.query(Document).filter(Document.document_id==r.json()['document_id']).first()
        assert Path(doc.file_path).is_relative_to(redirect_uploads)
        assert Path(doc.file_path).read_bytes() == b'Synthetic content'


def test_upload_quota_rejects_sixth_pending_file(client,isolated_data,redirect_uploads):
    for i in range(5):
        assert client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':(f'audit{i}.txt',b'Synthetic content')}).status_code == 200
    assert client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':('sixth.txt',b'Synthetic')}).status_code == 429


def test_upload_rejects_unsupported_extension(client,isolated_data,redirect_uploads):
    r=client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':('audit.exe',b'not executable synthetic content')})
    assert r.status_code in (400,415,422)


def test_upload_rejects_invalid_pdf(client,isolated_data,redirect_uploads):
    r=client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':('invalid.pdf',b'not a pdf','application/pdf')})
    assert r.status_code in (400,415,422)


def test_upload_pdf_page_limit(client,isolated_data,redirect_uploads):
    from pypdf import PdfWriter
    writer=PdfWriter()
    for _ in range(101): writer.add_blank_page(width=50,height=50)
    buffer=io.BytesIO();writer.write(buffer)
    r=client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':('over-limit.pdf',buffer.getvalue(),'application/pdf')})
    assert r.status_code == 400


def test_upload_save_choice_reaches_ai(client,isolated_data,redirect_uploads,monkeypatch):
    r=client.post('/api/documents/upload',headers=headers(isolated_data),files={'file':('audit.txt',b'Synthetic')},data={'is_save_file':'true'})
    assert r.status_code == 200
    ai=AsyncMock(return_value={'trang_thai':'success'})
    monkeypatch.setattr(document_queue_service,'send_to_ai_service',ai)
    monkeypatch.setattr(document_queue_service,'send_document_to_qlvb',AsyncMock())
    asyncio.run(document_queue_service.DocumentQueueManager()._process_single_document(r.json()['document_id']))
    assert ai.await_args.kwargs['is_save_file'] is True


def test_profile_update_and_change_password(client,isolated_data):
    auth=headers(isolated_data)
    r=client.put('/api/users/me',headers=auth,json={'username':'Updated synthetic audit name'})
    assert r.status_code == 200 and r.json()['username']=='Updated synthetic audit name'
    r=client.post('/api/users/change-password',headers=auth,json={'current_password':'AuditPassword123','new_password':'ChangedAudit123!','confirm_password':'ChangedAudit123!'})
    assert r.status_code == 200
    assert client.post('/api/auth/login',json={'email':'audit_owner@ptit.edu.vn','password':'ChangedAudit123!'}).status_code == 200


def test_password_verification_does_not_print_hashes(client,isolated_data):
    output=io.StringIO()
    with contextlib.redirect_stdout(output):
        client.post('/api/auth/login',json={'email':'audit_owner@ptit.edu.vn','password':'AuditPassword123'})
    assert '$bcrypt' not in output.getvalue()


def test_invalid_auth_request_does_not_log_password(client,caplog):
    secret='SyntheticAuditPasswordNeverLog123'
    r=client.post('/api/auth/register',json={'email':'missing-name@ptit.edu.vn','password':secret})
    assert r.status_code == 422
    assert secret not in caplog.text

import io
import zipfile
from uuid import uuid4
from unittest.mock import AsyncMock

import pytest

from app.db.session import SessionLocal
from app.models.role_permission import Role
from app.models.user import User


@pytest.mark.parametrize("method,path,payload", [
    ("GET", "/api/users", None), ("POST", "/api/users", {"email":"new@ptit.edu.vn","username":"New","password":"AuditPassword123!"}),
    ("GET", "/api/role-permissions/roles", None),
    ("POST", "/api/role-permissions/roles", {"name":"New role"}),
    ("PUT", "/api/role-permissions/roles/permissions-matrix", {}),
    ("GET", "/api/role-permissions/permissions", None),
    ("GET", "/api/departments", None),
    ("POST", "/api/departments", {"name":"New department","description":"Synthetic department"}),
    ("GET", "/api/system-parameters", None),
    ("GET", "/api/translations/", None),
    ("PUT", "/api/translations/"+str(uuid4())+"/comment", {"comment":"attack"}),
    ("DELETE", "/api/translations/"+str(uuid4()), None),
    ("GET", "/api/translations/"+str(uuid4())+"/download", None),
    ("POST", "/api/users/connect_to_telegram", None),
])
def test_anonymous_access_rejected(client, method, path, payload):
    assert client.request(method, path, json=payload).status_code == 401


def test_regular_user_cannot_rename_roles_or_use_admin_api(client, auth, data):
    assert client.put('/api/role-permissions/roles/'+data.ids['admin_role'], headers=auth(), json={'name':'previous-admin'}).status_code == 403
    assert client.put('/api/role-permissions/roles/'+data.ids['user_role'], headers=auth(), json={'name':'admin'}).status_code == 403
    assert client.put('/api/system-parameters', headers=auth(), json={'temperature':'0.5'}).status_code == 403
    assert client.get('/api/users', headers=auth()).status_code == 403


def test_system_roles_are_protected_even_from_admin(client, auth, data):
    for role_id in (data.ids['admin_role'], data.ids['user_role']):
        assert client.put('/api/role-permissions/roles/'+role_id, headers=auth('admin'), json={'name':'renamed'}).status_code == 400
        assert client.delete('/api/role-permissions/roles/'+role_id, headers=auth('admin')).status_code == 400
    for name in ('ADMIN', ' user ', 'Administrator'):
        assert client.post('/api/role-permissions/roles', headers=auth('admin'), json={'name':name}).status_code == 400


def test_admin_identity_does_not_depend_on_display_name(client, auth, data):
    with SessionLocal() as db:
        admin = db.query(Role).filter(Role.role_id == data.ids['admin_role']).first()
        admin.name='Admin display label'; db.flush()
        user = db.query(Role).filter(Role.role_id == data.ids['user_role']).first()
        user.name='admin'; db.commit()
    assert client.get('/api/users',headers=auth()).status_code == 403
    assert client.get('/api/users',headers=auth('admin')).status_code == 200


def test_admin_can_manage_custom_roles_and_matrix(client, auth, data):
    response=client.post('/api/role-permissions/roles',headers=auth('admin'),json={'name':'Custom reviewer'})
    assert response.status_code == 200
    role_id=response.json()['role_id']
    assert client.put('/api/role-permissions/roles/'+role_id,headers=auth('admin'),json={'name':'Renamed reviewer'}).status_code == 200
    key='file.read_'+role_id
    assert client.put('/api/role-permissions/roles/permissions-matrix',headers=auth('admin'),json={key:True}).status_code == 200
    assert client.get('/api/role-permissions/roles/permissions-matrix',headers=auth('admin')).json()[key] is True
    assert client.delete('/api/role-permissions/roles/'+role_id,headers=auth('admin')).status_code == 200


def test_departments_read_write_permissions(client, auth, permissions):
    assert client.get('/api/departments',headers=auth()).status_code == 200
    payload={'name':'Audit dept','id':100,'description':'Synthetic department'}
    assert client.post('/api/departments',headers=auth(),json=payload).status_code == 403
    permissions(['department.create','department.update','department.delete'])
    response=client.post('/api/departments',headers=auth(),json=payload)
    assert response.status_code == 200
    dep=response.json()['department_id']
    assert client.put('/api/departments/'+dep,headers=auth(),json={'name':'Updated audit dept'}).status_code == 200
    assert client.delete('/api/departments/'+dep,headers=auth()).status_code == 200


def test_admin_user_creation_and_config(client,auth):
    assert client.post('/api/users',headers=auth('admin'),json={'email':'new@ptit.edu.vn','username':'New','password':'AuditPassword123!'}).status_code == 201
    assert client.get('/api/system-parameters',headers=auth('admin')).status_code == 200


def test_translation_list_identity_and_admin_scope(client,auth,data,translation):
    owned=translation(); other=translation('other')
    assert [x['id'] for x in client.get('/api/translations/',headers=auth()).json()] == [owned]
    assert client.get('/api/translations/',headers=auth(),params={'user_id':data.ids['other']}).status_code == 403
    assert [x['id'] for x in client.get('/api/translations/',headers=auth('admin'),params={'user_id':data.ids['other']}).json()] == [other]


@pytest.mark.parametrize('method,suffix,payload', [('PUT','/comment',{'comment':'attack'}),('DELETE','',None),('GET','/download',None)])
def test_other_user_cannot_modify_or_download_translation(client,auth,translation,method,suffix,payload):
    log=translation()
    assert client.request(method,'/api/translations/'+log+suffix,headers=auth('other'),json=payload).status_code == 403


def test_translation_owner_download_comment_zip_delete(client,auth,translation):
    owned=translation(); translation('other')
    assert client.put('/api/translations/'+owned+'/comment',headers=auth(),json={'comment':'Mine'}).status_code == 200
    assert client.get('/api/translations/'+owned+'/download',headers=auth()).content == b'Private translation for owner'
    response=client.get('/api/translations/download-all/zip',headers=auth())
    assert response.status_code == 200
    with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
        assert len(archive.namelist()) == 1 and 'other' not in archive.namelist()[0]
    assert client.delete('/api/translations/'+owned,headers=auth()).status_code == 200


def test_history_never_matches_another_document_by_filename(client,auth,document,history_data):
    mine=document(); other=document('other')
    history_data([{'id':1,'document_id':mine,'filename':'different-name.txt'},
                  {'id':2,'document_id':other,'filename':'same-name.txt'}])
    records=client.get('/api/history',headers=auth()).json()['results']
    assert {item['id'] for item in records} == {1}


def test_history_detail_and_telegram_enforce_scope(client,auth,document,history_data,data,monkeypatch):
    mine=document()
    history_data([{'id':7,'document_id':mine,'filename':'same-name.txt','status_llm':'success'}])
    assert client.get('/api/history/7/detail',headers=auth()).status_code == 200
    assert client.get('/api/history/7/detail',headers=auth('other')).status_code == 403
    with SessionLocal() as db:
        user=db.query(User).filter(User.user_id == data.ids['other']).first(); user.telegram_chat_id='12345'; db.commit()
    sent=[]
    monkeypatch.setattr('app.services.history_service.send_telegram_notification',lambda *args:sent.append(args))
    assert client.post('/api/history/7/send-telegram',headers=auth('other')).status_code == 403
    assert not sent


def test_unmapped_history_is_admin_only(client,auth,history_data):
    history_data([{'id':7,'document_id':701,'filename':'external-only.txt','status_llm':'success'}])
    assert client.get('/api/history/7/detail',headers=auth()).status_code == 403
    assert client.get('/api/history/7/detail',headers=auth('admin')).status_code == 200


def test_document_history_ignores_filename_collision(client,auth,document,history_data):
    mine=document(); foreign=document('other')
    history_data([{'id':7,'document_id':foreign,'filename':'same-name.txt','attachments':[{'private':'other'}]}])
    response=client.get('/api/history/document/'+mine+'/detail',headers=auth())
    assert response.status_code == 200 and response.json()['attachments'] == []


def test_legacy_document_id_resolves_scope_before_detail_or_file(client,auth,document,monkeypatch):
    mine=document()
    monkeypatch.setattr('app.api.v1.endpoints.document.get_detail_document_in_data_service',AsyncMock(return_value={'document_id':mine}))
    assert client.get('/api/documents/701',headers=auth()).status_code == 200
    assert client.get('/api/documents/701/file',headers=auth()).content == b'Private document for owner'
    assert client.get('/api/documents/701',headers=auth('other')).status_code == 403
    assert client.get('/api/documents/701/file',headers=auth('other')).status_code == 403


def test_unmapped_legacy_document_is_not_trusted_by_owner_claim(client,auth,data,monkeypatch):
    monkeypatch.setattr('app.api.v1.endpoints.document.get_detail_document_in_data_service',AsyncMock(return_value={'document_id':701,'uploaded_by_user_id':data.ids['owner']}))
    assert client.get('/api/documents/701',headers=auth()).status_code == 403
    assert client.get('/api/documents/701/file',headers=auth()).status_code == 403


@pytest.mark.parametrize('suffix',['','/stats','/all','/my','/search'])
def test_document_reads_require_permission(client,auth,permissions,suffix):
    permissions([])
    assert client.get('/api/documents'+suffix,headers=auth()).status_code == 403


def test_document_actions_require_permissions_and_scope(client,auth,permissions,document):
    mine=document()
    permissions(['file.read'])
    assert client.get('/api/documents/'+mine,headers=auth()).status_code == 200
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth(),json={'summary':'Changed'}).status_code == 403
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth(),json={'status':'approved'}).status_code == 403
    assert client.delete('/api/documents/'+mine,headers=auth()).status_code == 403
    assert client.post('/api/documents/'+mine+'/retry',headers=auth()).status_code == 403
    assert client.post('/api/documents/upload',headers=auth(),files={'file':('audit.txt',b'Synthetic')}).status_code == 403


def test_edit_and_approval_are_separate(client,auth,permissions,document):
    mine=document()
    permissions(['file.read','file.update'])
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth(),json={'summary':'Changed'}).status_code == 200
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth(),json={'status':'approved'}).status_code == 403
    permissions(['file.read','file.approve'])
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth(),json={'status':'approved','summary':'Bypassed update'}).status_code == 403
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth(),json={'status':'approved'}).status_code == 200
    assert client.get('/api/documents/'+mine,headers=auth()).json()['status'] == 'approved'


def test_privilege_alone_does_not_grant_foreign_document_scope(client,auth,document):
    mine=document()
    assert client.put('/api/documents/'+mine+'/ai-result',headers=auth('other'),json={'summary':'Attack'}).status_code == 403
    assert client.delete('/api/documents/'+mine,headers=auth('other')).status_code == 403
    assert client.delete('/api/documents/'+mine+'?force=true',headers=auth()).status_code == 403

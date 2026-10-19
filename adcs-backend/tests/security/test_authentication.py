import base64
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
import hashlib
import io
import logging
import os
from pathlib import Path
import secrets
import time
from types import SimpleNamespace
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from fastapi.testclient import TestClient
from jose import jwt
import pytest
import rsa

from app.main import app
from app.core.log_redaction import SensitiveDataFilter
from app.core.security import create_access_token, create_refresh_token, hash_token, utcnow
from app.db.session import SessionLocal
from app.models.security import RefreshToken, SSOLoginAttempt, TelegramLinkToken
from app.models.user import User
from app.services import sso_service


def login(client):
    response=client.post('/api/auth/login',json={'email':'owner@ptit.edu.vn','password':'AuditPassword123!'})
    assert response.status_code == 200
    return response.json()


def test_login_creates_typed_session_and_only_hashes_refresh_token(client):
    tokens=login(client)
    access=jwt.get_unverified_claims(tokens['access_token']); refresh=jwt.get_unverified_claims(tokens['refresh_token'])
    assert access['token_type']=='access' and refresh['token_type']=='refresh'
    assert access['sid']==refresh['sid'] and access['jti']!=refresh['jti']
    assert 0 < access['exp']-access['iat'] <= 900
    with SessionLocal() as db:
        record=db.query(RefreshToken).one()
        assert record.token_hash==hash_token(tokens['refresh_token'])
        assert record.token_hash!=tokens['refresh_token'] and record.revoked_at is None


def test_refresh_token_cannot_be_access_and_access_cannot_refresh(client):
    tokens=login(client)
    assert client.get('/api/users/me',headers={'Authorization':'Bearer '+tokens['refresh_token']}).status_code==401
    assert client.post('/api/auth/refresh',json={'refresh_token':tokens['access_token']}).status_code==401


def test_legacy_untyped_tokens_and_unregistered_sessions_are_rejected(client,data):
    claims={'sub':data.ids['owner'],'exp':int(time.time())+600}
    legacy=jwt.encode(claims,os.environ['SECRET_KEY'],algorithm='HS256')
    assert client.get('/api/users/me',headers={'Authorization':'Bearer '+legacy}).status_code==401
    unregistered=create_access_token({'sub':data.ids['owner'],'sid':str(uuid4())})
    assert client.get('/api/users/me',headers={'Authorization':'Bearer '+unregistered}).status_code==401
    unregistered_refresh=create_refresh_token({'sub':data.ids['owner'],'sid':str(uuid4())})
    assert client.post('/api/auth/refresh',json={'refresh_token':unregistered_refresh}).status_code==401


def test_rotation_and_replay_revoke_successor_family(client):
    initial=login(client)
    response=client.post('/api/auth/refresh',json={'refresh_token':initial['refresh_token']})
    assert response.status_code==200
    rotated=response.json()
    assert rotated['refresh_token']!=initial['refresh_token']
    assert client.get('/api/users/me',headers={'Authorization':'Bearer '+rotated['access_token']}).status_code==200
    assert client.post('/api/auth/refresh',json={'refresh_token':initial['refresh_token']}).status_code==401
    assert client.post('/api/auth/refresh',json={'refresh_token':rotated['refresh_token']}).status_code==401
    assert client.get('/api/users/me',headers={'Authorization':'Bearer '+rotated['access_token']}).status_code==401


def test_concurrent_refresh_uses_single_database_rotation(client):
    initial=login(client)
    def rotate(_):
        local=TestClient(app,raise_server_exceptions=False)
        return local.post('/api/auth/refresh',json={'refresh_token':initial['refresh_token']}).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        statuses=list(pool.map(rotate,range(2)))
    assert sorted(statuses)==[200,401]


def test_logout_revokes_access_and_refresh(client):
    tokens=login(client)
    assert client.post('/api/auth/logout',json={'refresh_token':tokens['refresh_token']}).status_code==200
    assert client.get('/api/users/me',headers={'Authorization':'Bearer '+tokens['access_token']}).status_code==401
    assert client.post('/api/auth/refresh',json={'refresh_token':tokens['refresh_token']}).status_code==401


def test_password_change_revokes_all_sessions(client):
    first=login(client); second=login(client)
    response=client.post('/api/users/change-password',headers={'Authorization':'Bearer '+first['access_token']},json={
        'current_password':'AuditPassword123!','new_password':'ChangedAudit123!','confirm_password':'ChangedAudit123!',
    })
    assert response.status_code==200
    for tokens in (first,second):
        assert client.get('/api/users/me',headers={'Authorization':'Bearer '+tokens['access_token']}).status_code==401
        assert client.post('/api/auth/refresh',json={'refresh_token':tokens['refresh_token']}).status_code==401
    assert client.post('/api/auth/login',json={'email':'owner@ptit.edu.vn','password':'ChangedAudit123!'}).status_code==200


@pytest.fixture(scope='session')
def signing_keys():
    public,private=rsa.newkeys(2048)
    def encoded(value):
        return base64.urlsafe_b64encode(value.to_bytes((value.bit_length()+7)//8,'big')).rstrip(b'=').decode()
    return private.save_pkcs1().decode(),{'kty':'RSA','kid':'audit-key','alg':'RS256','use':'sig','n':encoded(public.n),'e':encoded(public.e)}


@pytest.fixture
def sso_flow(client,monkeypatch,signing_keys):
    response=client.get('/api/auth/sso/start')
    assert response.status_code==200
    start=response.json(); query=parse_qs(urlparse(start['authorization_url']).query)
    assert 'HttpOnly' in response.headers['set-cookie'] and 'SameSite=lax' in response.headers['set-cookie']
    assert query['state']==[start['state']] and query['code_challenge_method']==['S256']
    with SessionLocal() as db:
        attempt=db.query(SSOLoginAttempt).one()
        assert attempt.state_hash==hash_token(start['state'])
        challenge=base64.urlsafe_b64encode(hashlib.sha256(attempt.code_verifier.encode()).digest()).rstrip(b'=').decode()
        assert query['code_challenge']==[challenge]
    claims={'iss':sso_service.PTIT_ISSUER,'aud':sso_service.PTIT_CLIENT_ID,'sub':'oidc-subject',
            'iat':int(time.time())-1,'exp':int(time.time())+300,'email':'owner@ptit.edu.vn',
            'email_verified':True,'nonce':query['nonce'][0]}
    private,jwk=signing_keys
    monkeypatch.setattr(sso_service,'get_ptit_jwks',lambda **kwargs:{'keys':[jwk]})
    exchanges=[]
    def set_token(overrides=None,remove=(),algorithm='RS256',key=None):
        payload={**claims,**(overrides or {})}
        for name in remove: payload.pop(name,None)
        token=jwt.encode(payload,key or private,algorithm=algorithm,headers={'kid':'audit-key'})
        def exchange(*args,**kwargs):
            exchanges.append(kwargs)
            return SimpleNamespace(status_code=200,json=lambda:{'id_token':token})
        monkeypatch.setattr(sso_service.requests,'post',exchange)
    set_token()
    return SimpleNamespace(state=start['state'],claims=claims,set_token=set_token,exchanges=exchanges)


def callback(client,flow,**overrides):
    return client.post('/api/auth/sso/callback',json={'code':'synthetic-authorization-code','state':flow.state,**overrides})


def test_valid_sso_and_single_use_attempt(client,sso_flow):
    response=callback(client,sso_flow)
    assert response.status_code==200 and response.json()['user']['email']=='owner@ptit.edu.vn'
    assert sso_flow.exchanges[0]['data']['code_verifier']
    assert callback(client,sso_flow).status_code==401
    assert len(sso_flow.exchanges)==1


@pytest.mark.parametrize('change,remove', [
    ({'aud':'another-client'},()),({'iss':'https://attacker.invalid'},()),({'exp':int(time.time())-100},()),
    ({'nonce':'wrong-nonce'},()),({'email_verified':False},()),({},('exp',)),({},('nonce',)),({},('aud',)),({},('iss',)),
])
def test_sso_rejects_invalid_claims(client,sso_flow,change,remove):
    sso_flow.set_token(change,remove)
    assert callback(client,sso_flow).status_code==401


def test_sso_never_decodes_without_jwks(client,sso_flow,monkeypatch):
    monkeypatch.setattr(sso_service,'get_ptit_jwks',lambda **kwargs:None)
    assert callback(client,sso_flow).status_code==503
    with SessionLocal() as db: assert db.query(RefreshToken).count()==0


def test_sso_rejects_wrong_signature_and_hmac(client,sso_flow,signing_keys,monkeypatch):
    public,private=rsa.newkeys(1024)
    sso_flow.set_token(key=private.save_pkcs1().decode())
    assert callback(client,sso_flow).status_code==401


def test_sso_rejects_hmac_token(client,sso_flow):
    sso_flow.set_token(algorithm='HS256',key='attacker-key')
    assert callback(client,sso_flow).status_code==401


@pytest.mark.parametrize('state',['wrong-state-that-is-long-enough-for-validation','é'*43])
def test_sso_requires_state_cookie_match_before_exchange(client,sso_flow,state):
    assert callback(client,sso_flow,state=state).status_code==401
    assert not sso_flow.exchanges


def test_sso_attempt_is_bound_to_initiating_browser(client,sso_flow):
    stranger=TestClient(app,raise_server_exceptions=False)
    assert callback(stranger,sso_flow).status_code==401
    assert not sso_flow.exchanges


def test_expired_sso_attempt_fails_before_exchange(client,sso_flow):
    with SessionLocal() as db:
        db.query(SSOLoginAttempt).update({'expires_at':utcnow()-timedelta(seconds=1)});db.commit()
    assert callback(client,sso_flow).status_code==401 and not sso_flow.exchanges


def test_sso_auth_code_is_not_accepted_in_query_string(client):
    assert client.get('/api/auth/sso/callback?code=secret-code').status_code==405


def webhook(client,payload,secret='synthetic-webhook-secret'):
    headers={'X-Telegram-Bot-Api-Secret-Token':secret.encode('utf-8')} if secret is not None else {}
    return client.post('/api/telegram/webhook',headers=headers,json=payload)


def message(token,chat_id=12345,chat_type='private'):
    return {'message':{'text':'/start '+token,'chat':{'id':chat_id,'type':chat_type}}}


def link_token(client,auth):
    response=client.post('/api/users/connect_to_telegram',headers=auth())
    assert response.status_code==200
    return parse_qs(urlparse(response.json()['link']).query)['start'][0]


@pytest.mark.parametrize('secret',[None,'wrong-secret','é'])
def test_webhook_requires_secret_before_linking(client,data,secret):
    assert webhook(client,message(data.ids['owner']),secret).status_code==403
    with SessionLocal() as db: assert not db.query(User).filter(User.user_id==data.ids['owner']).first().telegram_chat_id


def test_valid_webhook_cannot_link_using_user_id(client,data):
    assert webhook(client,message(data.ids['owner'])).json()['status']=='invalid_or_expired_link'
    with SessionLocal() as db: assert not db.query(User).filter(User.user_id==data.ids['owner']).first().telegram_chat_id


def test_telegram_one_time_token_is_hashed_and_cannot_be_replayed(client,auth,data,monkeypatch):
    sent=[];monkeypatch.setattr('app.api.v1.endpoints.telegram.send_telegram_notification',lambda *args:sent.append(args))
    token=link_token(client,auth)
    assert len(token)==43 and data.ids['owner'] not in token
    with SessionLocal() as db:
        record=db.query(TelegramLinkToken).one();assert record.token_hash==hash_token(token) and record.token_hash!=token
    assert webhook(client,message(token)).json()['status']=='ok'
    assert webhook(client,message(token,999)).json()['status']=='invalid_or_expired_link'
    with SessionLocal() as db: assert db.query(User).filter(User.user_id==data.ids['owner']).first().telegram_chat_id=='12345'
    assert len(sent)==1


def test_link_must_be_private_and_not_expired(client,auth):
    token=link_token(client,auth)
    assert webhook(client,message(token,chat_type='group')).json()['status']=='ignored'
    with SessionLocal() as db:
        db.query(TelegramLinkToken).update({'expires_at':utcnow()-timedelta(seconds=1)});db.commit()
    assert webhook(client,message(token)).json()['status']=='invalid_or_expired_link'


def test_new_link_and_disconnect_invalidate_old_link(client,auth):
    first=link_token(client,auth); second=link_token(client,auth)
    assert webhook(client,message(first)).json()['status']=='invalid_or_expired_link'
    assert client.post('/api/users/disconnect_telegram',headers=auth()).status_code==200
    assert webhook(client,message(second)).json()['status']=='invalid_or_expired_link'


def test_status_endpoint_does_not_reveal_link_token_or_user_id(client,auth,data):
    response=client.get('/api/users/telegram_status',headers=auth())
    assert response.status_code==200
    assert '?start=' not in response.json()['link'] and data.ids['owner'] not in response.json()['link']


def test_setup_webhook_registers_secret_explicitly(client,auth,monkeypatch):
    captured=[]
    def post(*args,**kwargs):
        captured.append(kwargs)
        return SimpleNamespace(raise_for_status=lambda:None,json=lambda:{'ok':True})
    monkeypatch.setattr('app.api.v1.endpoints.telegram.requests.post',post)
    assert client.post('/api/telegram/setup-webhook',headers=auth('admin')).status_code==200
    assert captured[0]['json']['secret_token']=='synthetic-webhook-secret'


def test_missing_webhook_configuration_fails_closed(client,monkeypatch):
    monkeypatch.delenv('TELEGRAM_WEBHOOK_SECRET')
    assert webhook(client,message('x'*43)).status_code==503


def test_bot_credentials_never_fall_back_to_database(client,auth,monkeypatch):
    from app.api.v1.endpoints.telegram import get_system_bot_token
    monkeypatch.delenv('TELEGRAM_BOT_TOKEN')
    assert get_system_bot_token(SessionLocal())==''


def test_auth_passwords_and_hashes_are_not_logged_or_echoed(client,caplog,capsys):
    secret='RawPasswordMustNotBeLogged123!'
    response=client.post('/api/auth/register',json={'email':'missing-name@ptit.edu.vn','password':secret})
    assert response.status_code==422 and secret not in response.text
    assert 'input' not in response.text and 'body' not in response.json()
    login(client)
    output=capsys.readouterr()
    assert secret not in caplog.text and secret not in output.out
    assert '$bcrypt' not in caplog.text+output.out


def test_log_filter_redacts_credentials_and_exception_text():
    stream=io.StringIO();handler=logging.StreamHandler(stream);handler.addFilter(SensitiveDataFilter())
    logger=logging.getLogger('security-redaction-test');logger.addHandler(handler);logger.setLevel(logging.INFO)
    secret=os.environ['SECRET_KEY']
    try:
        raise RuntimeError('request failed with '+secret)
    except RuntimeError:
        logger.exception('password="do-not-log-this" secret=%s',secret)
    result=stream.getvalue();logger.removeHandler(handler)
    assert secret not in result and 'do-not-log-this' not in result and '[REDACTED]' in result

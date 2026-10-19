from pathlib import Path
import re

import pytest
import yaml

from app.core import security

ROOT=Path(__file__).resolve().parents[3]


def test_distributed_schema_has_no_production_rows():
    schema=(ROOT/'adcs-backend/db/schema.sql').read_text()
    assert 'CREATE TABLE public.auth_refresh_tokens' in schema
    assert 'CREATE TABLE public.telegram_link_tokens' in schema
    assert 'CREATE TABLE public.sso_login_attempts' in schema
    assert not re.search(r'^COPY\s|^INSERT INTO\s',schema,re.MULTILINE)
    compose=yaml.safe_load((ROOT/'docker-compose.yml').read_text())
    assert './adcs-backend/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro' in compose['services']['db']['volumes']


def test_deployment_has_no_credential_fallbacks_and_db_is_loopback_only():
    compose=yaml.safe_load((ROOT/'docker-compose.yml').read_text())
    db=compose['services']['db']
    assert db['environment']['POSTGRES_PASSWORD'].startswith('${POSTGRES_PASSWORD:?')
    assert db['ports'][0].startswith('127.0.0.1:')
    source=(ROOT/'adcs-backend/app/services/document_service.py').read_text()
    assert re.search(r'os.getenv\("QLVB_API_KEY"\)',source)
    assert not re.search(r'os.getenv\("QLVB_API_KEY",\s*"[^"\n]+"\)',source)


def test_short_jwt_secrets_are_not_accepted(monkeypatch):
    monkeypatch.setattr(security,'SECRET_KEY','short')
    with pytest.raises(RuntimeError): security.create_access_token({'sub':'irrelevant'})


def test_sso_cookie_cors_is_restricted_to_configured_frontend(client):
    allowed=client.options('/api/auth/sso/start',headers={
        'Origin':'http://127.0.0.1:15173','Access-Control-Request-Method':'GET',
    })
    assert allowed.status_code==200
    assert allowed.headers['access-control-allow-origin']=='http://127.0.0.1:15173'
    assert allowed.headers['access-control-allow-credentials']=='true'
    rejected=client.options('/api/auth/sso/start',headers={
        'Origin':'https://attacker.invalid','Access-Control-Request-Method':'GET',
    })
    assert rejected.status_code==400 and 'access-control-allow-origin' not in rejected.headers

"""Security integration tests use only an explicitly opted-in disposable DB."""
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace

import pytest
from sqlalchemy.engine import make_url

BACKEND = Path(__file__).resolve().parents[2]
REPO = BACKEND.parent
TEST_URL = os.getenv("ADCS_SECURITY_TEST_DATABASE_URL")
if TEST_URL:
    target = make_url(TEST_URL)
    if (target.host, target.port, target.database) != ("127.0.0.1", 15434, "adcs_audit"):
        raise RuntimeError("Security tests require the disposable 127.0.0.1:15434/adcs_audit database")

WORK = Path(tempfile.mkdtemp(prefix="adcs-security-tests-"))
os.environ.update({
    "DATABASE_URL": TEST_URL or "postgresql://audit:audit-local-only@127.0.0.1:15434/adcs_audit",
    "SECRET_KEY": "synthetic-security-test-signing-key", "ALGORITHM": "HS256",
    "ADCS_LOG_DIR": str(WORK / "logs"), "CORS_ORIGINS": "http://127.0.0.1:15173",
    "TELEGRAM_BOT_TOKEN": "synthetic-telegram-token", "TELEGRAM_WEBHOOK_SECRET": "synthetic-webhook-secret",
    "TELEGRAM_BOT_NAME": "audit_bot", "SERVICE_INTERNAL_KEY": "synthetic-service-key",
    "QLVB_API_KEY": "synthetic-qlvb-key", "QLVB_BASE_URL": "https://qlvb.invalid",
    "DATA_SERVICE_API_KEY": "synthetic-backend-key", "AI_SERVICE_URL": "https://ai.invalid/analyze", "DATA_SERVICE_URL": "https://data.invalid",
    "PTIT_CLIENT_ID": "audit-client", "PTIT_REDIRECT_URI": "http://127.0.0.1:15173/auth/callback",
    "PTIT_ISSUER": "https://sso.invalid/realms/ptit",
    "PTIT_AUTH_ENDPOINT": "https://sso.invalid/realms/ptit/protocol/openid-connect/auth",
    "PTIT_TOKEN_ENDPOINT": "https://sso.invalid/realms/ptit/protocol/openid-connect/token",
    "PTIT_CERTS_ENDPOINT": "https://sso.invalid/realms/ptit/protocol/openid-connect/certs",
})
sys.path.insert(0, str(BACKEND))

from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.session import engine, SessionLocal
from app.core.security import hash_password
from app.models.document import Document
from app.models.role_permission import Role, Permission, RolePermission
from app.models.translation import TranslationLog
from app.models.user import User
from app.services.token_service import issue_token_pair


def deny_network(*args, **kwargs):
    raise RuntimeError("Outbound HTTP blocked by security tests")


@pytest.fixture(scope="session")
def password_hash():
    return hash_password("AuditPassword123!")


@pytest.fixture(autouse=True)
def data(monkeypatch, password_hash):
    if not TEST_URL:
        pytest.skip("Set ADCS_SECURITY_TEST_DATABASE_URL to opt into disposable DB tests")
    assert engine.url.host == "127.0.0.1" and engine.url.port == 15434 and engine.url.database == "adcs_audit"
    monkeypatch.setattr("requests.sessions.Session.request", deny_network)
    monkeypatch.setattr("httpx.AsyncClient.send", deny_network)
    with engine.begin() as connection:
        names = [row[0] for row in connection.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))]
        connection.execute(text("TRUNCATE " + ", ".join('"'+name+'"' for name in names) + " RESTART IDENTITY CASCADE"))
    with SessionLocal() as db:
        admin_role = Role(name="admin", system_code="admin")
        user_role = Role(name="user", system_code="user")
        for role in (admin_role, user_role):
            db.add(role); db.flush()
        for code in ("file.read", "file.create", "file.update", "file.approve", "file.delete"):
            permission = Permission(code=code)
            db.add(permission); db.flush()
            db.add(RolePermission(role_id=str(user_role.role_id), permission_id=str(permission.permission_id)))
        users = {}
        for name, role in (("admin", admin_role), ("owner", user_role), ("other", user_role)):
            user = User(username="Audit "+name, email=name+"@ptit.edu.vn", password_hash=password_hash,
                        is_active=True, role_id=str(role.role_id))
            db.add(user); db.flush(); db.refresh(user)
            users[name] = str(user.user_id)
        db.commit()
        ids = {**users, "user_role": str(user_role.role_id), "admin_role": str(admin_role.role_id)}
    return SimpleNamespace(ids=ids)


@pytest.fixture
def client():
    # No context manager: never run production startup/queue or external setup.
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def auth(data):
    tokens = {}
    def get(name="owner"):
        if name not in tokens:
            with SessionLocal() as db:
                user = db.query(User).filter(User.user_id == data.ids[name]).first()
                tokens[name] = issue_token_pair(db, user)
        return {"Authorization": "Bearer "+tokens[name]["access_token"]}
    get.tokens = tokens
    return get


@pytest.fixture
def document(data, tmp_path):
    def create(owner="owner", **kwargs):
        file = tmp_path / (owner+".txt")
        file.write_bytes(("Private document for "+owner).encode())
        with SessionLocal() as db:
            doc = Document(uploaded_by_user_id=data.ids[owner], status="processed", file_path=str(file),
                           original_filename="same-name.txt", is_chua_doc=True, **kwargs)
            db.add(doc); db.commit(); return str(doc.document_id)
    return create


@pytest.fixture
def translation(data, tmp_path, monkeypatch):
    monkeypatch.setenv("TRANSLATION_DOWNLOAD_DIR", str(tmp_path))
    def create(owner="owner"):
        file = tmp_path / (owner+".docx")
        file.write_bytes(("Private translation for "+owner).encode())
        with SessionLocal() as db:
            log = TranslationLog(user_id=data.ids[owner], filename=owner+".docx", file_type="docx",
                                 status="success", result_file_url=str(file))
            db.add(log); db.commit(); return str(log.id)
    return create


@pytest.fixture
def permissions(data):
    def set_codes(codes):
        with SessionLocal() as db:
            db.query(RolePermission).filter(RolePermission.role_id == data.ids["user_role"]).delete()
            for code in codes:
                permission = db.query(Permission).filter(Permission.code == code).first()
                if not permission:
                    permission = Permission(code=code); db.add(permission); db.flush()
                db.add(RolePermission(role_id=data.ids["user_role"], permission_id=str(permission.permission_id)))
            db.commit()
    return set_codes


@pytest.fixture
def history_data(monkeypatch):
    def set_results(results, detail=None):
        class FakeClient:
            def __init__(self, *args, **kwargs): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def get(self, url, **kwargs):
                return SimpleNamespace(status_code=200, json=lambda: {"results": results} if url.endswith("/history") else (detail or {}))
        monkeypatch.setattr("app.services.history_service.data_service", FakeClient())
    return set_results

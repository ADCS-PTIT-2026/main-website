"""Disposable browser-test API. Never run against a real database/provider."""
import time
from types import SimpleNamespace

from jose import jwt
import pytest
import rsa

import conftest
from app.core.security import hash_password
from app.models.department import Department
from app.models.user import User
from app.services import sso_service

if not conftest.TEST_URL:
    raise RuntimeError("Set ADCS_SECURITY_TEST_DATABASE_URL to the disposable database")
mp = pytest.MonkeyPatch()
seed = conftest.data.__wrapped__(mp, hash_password("AuditPassword123!"))
app = conftest.app
app.router.on_startup.clear()
app.router.on_shutdown.clear()
with conftest.SessionLocal() as db:
    db.add(Department(id=100, name="Synthetic department", description="Synthetic department for security checks"))
    for name, active, role_id in [('pending',False,None),('unassigned',True,None),('awaiting',False,seed.ids['user_role'])]:
        db.add(User(username='Audit '+name,email=name+'@ptit.edu.vn',password_hash=hash_password('AuditPassword123!'),
                    is_active=active,role_id=role_id))
    db.commit()

public, private = rsa.newkeys(2048)
import base64
def encoded(value):
    return base64.urlsafe_b64encode(value.to_bytes((value.bit_length()+7)//8, "big")).rstrip(b"=").decode()
jwk = {"kty": "RSA", "kid": "preview-key", "use": "sig", "alg": "RS256", "n": encoded(public.n), "e": encoded(public.e)}
mp.setattr(sso_service, "get_ptit_jwks", lambda **kwargs: {"keys": [jwk]})

def fake_token_exchange(url, *, data, timeout):
    if url != sso_service.PTIT_TOKEN_ENDPOINT or not data["code"].startswith("synthetic."):
        raise RuntimeError("Unexpected provider request in preview")
    nonce = data["code"].split(".", 1)[1]
    token = jwt.encode({
        "iss": sso_service.PTIT_ISSUER, "aud": sso_service.PTIT_CLIENT_ID, "sub": "preview-subject",
        "iat": int(time.time())-1, "exp": int(time.time())+300, "nonce": nonce,
        "email": "owner@ptit.edu.vn", "email_verified": True,
    }, private.save_pkcs1().decode(), algorithm="RS256", headers={"kid": "preview-key"})
    return SimpleNamespace(status_code=200, json=lambda: {"id_token": token})

mp.setattr(sso_service.requests, "post", fake_token_exchange)

import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from app.services.auth_service import is_allowed_registration_email, check_login_rate_limit, record_login_failure, record_login_success
from app.models.security import LoginAttempt
from fastapi import HTTPException

def test_email_allowed_domain():
    # Valid domains
    assert is_allowed_registration_email("teacher@ptit.edu.vn") is True
    assert is_allowed_registration_email("student@stu.ptit.edu.vn") is True
    assert is_allowed_registration_email("STUDENT@STU.PTIT.EDU.VN") is True
    
    # Invalid external domains
    assert is_allowed_registration_email("user@gmail.com") is False
    assert is_allowed_registration_email("hacker@ptit.edu.vn.attacker.com") is False
    assert is_allowed_registration_email("user@other.edu.vn") is False
    assert is_allowed_registration_email("notanemail") is False

def test_check_login_rate_limit_locked():
    db = MagicMock()
    # Mock attempt currently locked
    attempt = LoginAttempt(
        key="email:victim@ptit.edu.vn",
        failures=5,
        locked_until=datetime.now(timezone.utc) + timedelta(minutes=10)
    )
    db.query(LoginAttempt).filter_by.return_value.first.return_value = attempt

    with pytest.raises(HTTPException) as excinfo:
        check_login_rate_limit(db, "email:victim@ptit.edu.vn")
    assert excinfo.value.status_code == 429
    assert "Retry-After" in excinfo.value.headers

import pytest
from unittest.mock import MagicMock
from app.core import error_contract as ec
from app.services.processing_errors import apply_failure

def test_error_contract_definitions():
    assert "LLM_UNAVAILABLE" in ec.CATALOG
    assert "LLM_TIMEOUT" in ec.CATALOG
    assert "AI_RESPONSE_TIMEOUT" in ec.CATALOG
    assert "SERVER_BUSY" in ec.CATALOG
    
    err = ec.error("AI_RESPONSE_TIMEOUT", message="Thao tác quá thời gian")
    assert err["error_code"] == "AI_RESPONSE_TIMEOUT"
    assert err["message"] == "Thao tác quá thời gian"
    assert err["retryable"] is False
    assert err["stage"] == "awaiting_ai"
    assert "request_id" in err

def test_error_contract_normalization():
    norm = ec.normalize({"error_code": "LLM_UNAVAILABLE"})
    assert norm["error_code"] == "LLM_UNAVAILABLE"
    assert norm["retryable"] is True
    
    # Legacy / unknown error falls back to catalog message safely
    norm_unknown = ec.normalize({"error": "something went wrong"})
    assert norm_unknown["error_code"] == "INTERNAL_ERROR"
    assert norm_unknown["retryable"] is False

def test_apply_failure_retryable():
    doc = MagicMock()
    doc.document_id = "test-doc-123"
    doc.retry_count = 0

    failure = ec.error("LLM_UNAVAILABLE", retryable=True, retry_after_seconds=30)
    applied = apply_failure(doc, failure)
    
    assert doc.status == "queued"
    assert doc.retry_count == 1
    assert doc.next_attempt_at is not None
    assert doc.error_details["error_code"] == "LLM_UNAVAILABLE"

def test_apply_failure_needs_review():
    doc = MagicMock()
    doc.document_id = "test-doc-456"
    doc.retry_count = 0

    failure = ec.error("AI_RESPONSE_TIMEOUT")
    applied = apply_failure(doc, failure)

    # AI_RESPONSE_TIMEOUT should transition to needs_review to prevent duplicated heavy calls
    assert doc.status == "needs_review"
    assert doc.next_attempt_at is None
    assert "AI_RESPONSE_TIMEOUT" in doc.error_message

def test_apply_failure_max_retries():
    doc = MagicMock()
    doc.document_id = "test-doc-789"
    doc.retry_count = 2  # next will be 3, exceeding limit (< 3)

    failure = ec.error("LLM_UNAVAILABLE", retryable=True)
    applied = apply_failure(doc, failure)

    assert doc.status == "failed"
    assert doc.retry_count == 3
    assert doc.next_attempt_at is None

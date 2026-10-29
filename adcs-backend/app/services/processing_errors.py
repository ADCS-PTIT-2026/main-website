"""Business error policy, shared by legacy and integration document workers."""
from datetime import datetime, timedelta, timezone
from app.core import error_contract as ec


def apply_failure(doc, failure, attempt_id=None, job_id=None):
    failure = dict(failure or ec.error('LLM_INVALID_RESPONSE', service='web-backend'))
    failure.update(document_id=str(doc.document_id), attempt_id=str(attempt_id) if attempt_id else None,
                   job_id=str(job_id) if job_id else None)
    failure['details'] = {**failure.get('details', {}), 'document_id': str(doc.document_id)}
    doc.retry_count = (doc.retry_count or 0) + 1
    code = failure['error_code']
    if code in ('AI_RESPONSE_TIMEOUT', 'LLM_INVALID_RESPONSE', 'AI_INVALID_RESPONSE'):
        # A timeout does not prove AI stopped. Do not submit overlapping work.
        doc.status, doc.next_attempt_at = 'needs_review', None
    elif failure.get('retryable') and doc.retry_count < 3:
        delay = max(15, int(failure.get('retry_after_seconds') or 15), min(300, 2 ** doc.retry_count))
        doc.status = 'queued'
        doc.next_attempt_at = datetime.now(timezone.utc) + timedelta(seconds=delay)
        failure['next_retry_at'] = doc.next_attempt_at.isoformat()
    else:
        doc.status, doc.next_attempt_at = 'failed', None
    doc.error_details = failure
    doc.error_message = f"{failure['message']} [Mã: {code}; bước: {failure['stage']}; tra cứu: {failure['request_id']}]"
    return failure


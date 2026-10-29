"""ADCS error contract v1. Identical, dependency-free module in all three services."""
from contextvars import ContextVar
from datetime import datetime, timezone
import re
from uuid import uuid4

context = ContextVar('adcs_error_context', default=None)

# code: (HTTP status, stage, retryable, public message)
CATALOG = {
    'INVALID_REQUEST': (400, 'validating', False, 'Yêu cầu không hợp lệ.'),
    'INVALID_FILE': (400, 'validating', False, 'File không hợp lệ hoặc bị hỏng.'),
    'UNSUPPORTED_FILE_TYPE': (400, 'validating', False, 'Định dạng file không được hỗ trợ.'),
    'DOCUMENT_TOO_LARGE': (413, 'validating', False, 'Văn bản vượt giới hạn cho phép.'),
    'INVALID_DEPARTMENT_LIST': (422, 'validating', False, 'Danh mục phòng ban không hợp lệ.'),
    'INVALID_AI_PARAMETERS': (422, 'validating', False, 'Cấu hình AI không hợp lệ.'),
    'OCR_EXTRACTION_FAILED': (422, 'ocr', False, 'Không đọc được nội dung văn bản.'),
    'SERVER_BUSY': (503, 'queued', True, 'Dịch vụ đang bận, vui lòng chờ rồi thử lại.'),
    'LLM_UNAVAILABLE': (503, 'llm_analysis', True, 'Dịch vụ phân tích tạm thời không khả dụng.'),
    'AI_AGENT_UNAVAILABLE': (503, 'llm_analysis', True, 'Dịch vụ phân tích tạm thời không khả dụng.'),
    'LLM_TIMEOUT': (504, 'llm_analysis', True, 'Dịch vụ phân tích phản hồi quá thời gian cho phép.'),
    'LLM_UPSTREAM_ERROR': (502, 'llm_analysis', True, 'Dịch vụ phân tích gặp lỗi nội bộ.'),
    'LLM_INVALID_RESPONSE': (502, 'llm_analysis', False, 'Kết quả AI thiếu hoặc không đúng cấu trúc; cần kiểm tra.'),
    'LLM_ANALYSIS_FAILED': (500, 'llm_analysis', True, 'Không hoàn thành được phân tích văn bản.'),
    'RELATED_SEARCH_FAILED': (503, 'related_search', True, 'Chưa tìm được văn bản tương tự.'),
    'FILE_STORAGE_FAILED': (503, 'storage', True, 'Chưa lưu được văn bản vào kho.'),
    'EMBEDDING_FAILED': (503, 'embedding', True, 'Chưa tạo hoặc lưu được vector tìm kiếm.'),
    'EMBEDDING_UNAVAILABLE': (503, 'embedding', True, 'Dịch vụ tạo vector tạm thời không khả dụng.'),
    'HISTORY_WRITE_FAILED': (503, 'history', True, 'Chưa ghi được lịch sử xử lý.'),
    'DEPENDENCY_AUTH_FAILED': (502, 'dependency', False, 'Kết nối nội bộ chưa được xác thực; quản trị cần kiểm tra.'),
    'DEPENDENCY_UNAVAILABLE': (503, 'dependency', True, 'Dịch vụ phụ thuộc tạm thời không khả dụng.'),
    'AI_RESPONSE_TIMEOUT': (504, 'awaiting_ai', False, 'Web hết thời gian chờ; AI có thể vẫn đang xử lý. Cần kiểm tra trước khi gửi lại.'),
    'INTERNAL_ERROR': (500, 'internal', False, 'Có lỗi hệ thống; vui lòng cung cấp mã tra cứu cho quản trị.'),
    'UNAUTHORIZED': (401, 'authentication', False, 'Yêu cầu chưa được xác thực.'),
    'FORBIDDEN': (403, 'authorization', False, 'Không có quyền thực hiện thao tác này.'),
    'NOT_FOUND': (404, 'validating', False, 'Không tìm thấy dữ liệu yêu cầu.'),
    'JOB_NOT_FOUND': (404, 'validating', False, 'Không tìm thấy tiến độ xử lý.'),
}


def request_id(value=None):
    value = str(value or '')
    return value if value not in ('SYSTEM', '-', 'N/A') and re.fullmatch(r'[A-Za-z0-9_.:-]{1,64}', value) else str(uuid4())


def begin(value=None, service='ai-service', **fields):
    return context.set(dict(request_id=request_id(value), service=service, stage='validating', warnings=[], **fields))


def update(**fields):
    current = context.get()
    if current is not None:
        current.update(fields)


def error(code, *, service=None, stage=None, dependency=None, http_status=None,
          document_id=None, retryable=None, retry_after_seconds=None, message=None, **fields):
    current = context.get() or {}
    status, default_stage, retry, public = CATALOG.get(code, CATALOG['INTERNAL_ERROR'])
    data = {
        'schema_version': 1, 'status': 'error', 'error_code': code,
        'error_id': str(uuid4()), 'message': message or public, 'detail': message or public,
        'http_status': http_status or status, 'service': service or current.get('service', 'ai-service'),
        'stage': stage or default_stage, 'dependency': dependency or ('qwen' if code.startswith('LLM_') else None),
        'request_id': request_id(current.get('request_id')),
        'document_id': document_id or current.get('document_id'),
        'retryable': retry if retryable is None else retryable,
        'retry_after_seconds': retry_after_seconds if retry_after_seconds is not None else (15 if retry else None),
        'timestamp': datetime.now(timezone.utc).isoformat(),
    }
    data.update({k: v for k, v in fields.items() if k in ('attempt_id', 'job_id', 'cause_error_id')})
    data['step'] = data['stage']  # compatible with the existing Web Data Service client
    data['details'] = {'document_id': data['document_id']}
    return data


def normalize(payload, status=500, *, service='ai-service', stage=None, dependency=None):
    """Accept legacy detail/object errors; never reflect raw upstream HTML/exception text."""
    payload = payload if isinstance(payload, dict) else {}
    nested = payload.get('detail')
    source = nested if isinstance(nested, dict) else payload
    code = str(source.get('error_code') or {400:'INVALID_REQUEST', 401:'UNAUTHORIZED', 403:'FORBIDDEN', 404:'NOT_FOUND', 413:'DOCUMENT_TOO_LARGE', 422:'INVALID_REQUEST', 429:'SERVER_BUSY', 503:'DEPENDENCY_UNAVAILABLE', 504:'LLM_TIMEOUT'}.get(status, 'INTERNAL_ERROR'))[:100]
    data = error(code, service=service, stage=stage or source.get('stage') or source.get('step'), dependency=dependency or source.get('dependency'), http_status=status)
    # Messages come from our local catalog; keep upstream identifiers and control fields only.
    for key in ('request_id', 'error_id', 'document_id', 'attempt_id', 'job_id', 'cause_error_id'):
        value = source.get(key)
        if isinstance(value, str) and re.fullmatch(r'[A-Za-z0-9_.:-]{1,100}', value) and value not in ('SYSTEM', '-', 'N/A'):
            data[key] = value
    if isinstance(source.get('retryable'), bool):
        data['retryable'] = source['retryable']
    delay = source.get('retry_after_seconds', (source.get('details') or {}).get('retry_after_seconds') if isinstance(source.get('details'), dict) else None)
    if isinstance(delay, (int, float)) and not isinstance(delay, bool):
        data['retry_after_seconds'] = max(1, min(1800, int(delay)))
    data['details']['document_id'] = data['document_id']
    return data


def warn(data):
    current = context.get()
    if current is not None:
        current['warnings'].append(data)
    return data


def warnings():
    return list((context.get() or {}).get('warnings', []))


class DependencyError(ConnectionError):
    def __init__(self, data):
        super().__init__(data['message'])
        self.error = data

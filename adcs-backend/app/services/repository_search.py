import math
from datetime import date
from fastapi import HTTPException
from app.core.data_service import data_service, enabled
from app.crud.document import build_document_scope_query
from app.models.department import Department
from app.models.document import Document
from app.services.integration_service import serialize_document


async def search_repository(db, current_user, query=None, start_date=None, end_date=None, department_id=None,
                            document_type=None, page=1, page_size=20, sort_by='newest', search_mode=None,
                            source_type=None, document_status=None, do_khan=None):
    for value in (start_date, end_date):
        if value:
            try:
                if date.fromisoformat(value).isoformat() != value:
                    raise ValueError()
            except ValueError:
                raise HTTPException(422, 'Ngày tìm kiếm phải có định dạng YYYY-MM-DD')
    if start_date and end_date and start_date > end_date:
        raise HTTPException(422, 'Ngày bắt đầu phải trước ngày kết thúc')
    if not enabled('DS_SEARCH_ENABLED'):
        if search_mode and search_mode != 'keyword':
            raise HTTPException(503, 'Tìm kiếm ngữ nghĩa chưa được bật')
        from app.services.document_service import search_documents_combined_service
        result = search_documents_combined_service(db, current_user, query, start_date, end_date,
                    department_id, document_type, page, page_size, sort_by,
                    source_type=source_type, document_status=document_status, do_khan=do_khan)
        result['data'] = [serialize_document(db, item, current_user) for item in result['data']]
        result['warnings'] = []
        return result
    if not enabled('DS_SEARCH_ACL_CONFIRMED'):
        raise HTTPException(503, 'Chưa xác nhận bộ lọc phân quyền của Data Service')
    from app.crud.system_parameter import get_all_parameters
    params = get_all_parameters(db)
    threshold = float(params.get('searchSimilarityThreshold', '0.8'))
    scoped = build_document_scope_query(db, current_user).filter(Document.status != 'duplicate')
    ids = [str(ref) for (ref,) in scoped.with_entities(Document.document_id).all()]
    if not ids:
        return {'status': 'success', 'query': query or '', 'data': [], 'total': 0, 'page': page,
                'page_size': page_size, 'total_pages': 1, 'warnings': []}
    department = db.get(Department, department_id) if department_id else None
    if department_id and (not department or not department.code):
        raise HTTPException(422, 'Phòng ban chưa có mã đồng bộ')
    payload = {'query': query or None, 'search_mode': search_mode or 'hybrid',
               'from_date': start_date, 'to_date': end_date, 'department_code': department.code if department else None,
               'loai_van_ban': document_type if document_type != 'all' else None,
               'source_type': source_type, 'status': document_status, 'do_khan': do_khan,
               'similarity_threshold': threshold, 'page': page, 'page_size': page_size,
               'include_unprocessed': bool(document_status in ('queued', 'processing', 'failed')),
               'sort_by': 'relevance' if sort_by in ('confidence', 'relevance') else 'newest',
               'allowed_web_document_ids': ids}
    response = (await data_service.post('/api/v1/search/documents', json=payload)).json()
    items = []
    allowed = set(ids)
    for item in response.get('results', []):
        ref = str(item.get('web_document_id') or '')
        if ref not in allowed:
            raise HTTPException(502, 'Data Service trả tài liệu ngoài phạm vi được phép')
        doc = db.get(Document, ref)
        data = serialize_document(db, doc, current_user)
        # Web is authoritative for approved metadata and all access control fields.
        data['similarity'] = item.get('best_similarity')
        items.append(data)
    total = int(response['total'])
    return {'status': 'success', 'query': query or '', 'data': items, 'total': total, 'page': page,
            'page_size': page_size, 'total_pages': max(1, math.ceil(total / page_size)),
            'warnings': response.get('warnings') or []}

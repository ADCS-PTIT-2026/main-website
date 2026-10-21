"""Regressions for truncated AI output and approval form serialization."""
import asyncio
import json
from unittest.mock import AsyncMock, Mock

import pytest

from app.db.session import SessionLocal
from app.models.document import Document
from app.models.department import Department
from app.models.integration import IntegrationOutbox
from app.services.department_service import get_active_departments_for_ai
from app.services.document_service import normalize_ai_response


def test_ai_catalog_uses_compactable_units_and_receiving_departments():
    with SessionLocal() as db:
        db.add_all([
            Department(id=1, code='PDT', name='Phòng Đào tạo', level_number=2, description='Đào tạo '*1000),
            Department(id=2, code='PDT-TO', name='Tổ trực thuộc', level_number=3, parent_id=1),
            Department(id=3, code='NEW', name='Đơn vị mới chưa phân cấp'),
        ])
        db.commit()
        catalog = get_active_departments_for_ai(db)
    assert {unit['ma_don_vi'] for unit in catalog['units']} == {'PDT', 'NEW'}
    unit = next(u for u in catalog['units'] if u['ma_don_vi'] == 'PDT')
    assert unit['id'] == 1 and unit['ten_hien_thi'] == 'Phòng Đào tạo'
    assert len(unit['mo_ta']) > 1000  # AI Service drops descriptions in compact mode.


@pytest.mark.parametrize('nested', [
    '{"trang_thai":"success","tom_tat":"Tóm tắt bị cắt',
    '```json\n{"trang_thai":"success","tom_tat":"Tóm tắt bị cắt',
    'Raw text response',
])
def test_partial_ai_summary_is_not_accepted_as_completed_analysis(nested):
    result = normalize_ai_response({'key_information': nested, 'extracted_fields': {}})
    assert result['trang_thai'] == 'error'
    assert result['error_code'] == 'AI_INVALID_RESPONSE'


def test_fenced_legacy_ai_payload_keeps_metadata_and_storage():
    payload = {'trang_thai': 'success', 'tom_tat': 'Tóm tắt',
               'extracted_fields': {'so_hieu_van_ban': '123/TB'}}
    result = normalize_ai_response({'key_information': '```json\n'+json.dumps(payload)+'\n```',
                                    'storage_info': {'save_document': False}})
    assert result['extracted_fields'] == payload['extracted_fields']
    assert result['storage_info'] == {'save_document': False}
    assert 'error_code' not in result


def test_invalid_ai_json_requires_review_and_never_forwards_to_qlvb(document, monkeypatch):
    from app.services.document_queue_service import document_queue
    monkeypatch.setenv('DS_SYNC_ENABLED', 'true')
    ref = document()
    with SessionLocal() as db:
        doc = db.get(Document, ref); doc.status = 'processing'; db.commit()
    monkeypatch.setattr('app.services.document_queue_service.send_to_ai_service', AsyncMock(return_value={
        'trang_thai': 'success', 'key_information': '{"tom_tat":"cut off', 'extracted_fields': {}}))
    qlvb = AsyncMock()
    monkeypatch.setattr('app.services.document_queue_service.send_document_to_qlvb', qlvb)
    async def process():
        await document_queue.semaphore.acquire()
        await document_queue._process_single_document(ref)
    asyncio.run(process())
    with SessionLocal() as db:
        assert db.get(Document, ref).status == 'needs_review'
        assert db.get(Document, ref).error_message
        assert db.query(IntegrationOutbox).one().payload['status'] == 'failed'
    qlvb.assert_not_awaited()


def test_approval_accepts_blank_optional_inputs_and_sends_mock_notification(client, auth, document, monkeypatch):
    ref = document()
    notify = Mock(return_value={'status': 'success'})
    monkeypatch.setattr('app.api.v1.endpoints.document.send_telegram_ai_result', notify)
    response = client.put(f'/api/documents/{ref}/ai-result', headers=auth('admin'), json={
        'status': 'approved', 'assigned_department_id': '', 'ngay_van_ban': '',
        'ngay_het_han': '', 'updated_at': None, 'yeu_cau_hanh_dong': 'Triển khai thử nghiệm',
    })
    assert response.status_code == 200, response.text
    assert response.json()['telegram_notification'] == 'success'
    assert response.json()['document']['yeu_cau_hanh_dong'] == 'Triển khai thử nghiệm'
    notify.assert_called_once()
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        assert doc.status == 'approved' and doc.updated_at is not None
        assert doc.assigned_department_id is None and doc.ngay_van_ban is None


def test_approval_keeps_rejecting_invalid_department_code(client, auth, document, monkeypatch):
    notify = Mock()
    monkeypatch.setattr('app.api.v1.endpoints.document.send_telegram_ai_result', notify)
    ref = document()
    response = client.put(f'/api/documents/{ref}/ai-result', headers=auth('admin'), json={
        'status': 'approved', 'assigned_department_id': 'UNKNOWN_DEPARTMENT',
    })
    assert response.status_code == 422
    assert response.json()['detail'][0]['loc'] == ['body', 'assigned_department_id']
    notify.assert_not_called()
    with SessionLocal() as db:
        assert db.get(Document, ref).status == 'processed'


@pytest.mark.parametrize('field', ['yeu_cau_hanh_dong', 'yeu_cau_han_dong'])
def test_metadata_action_field_round_trips_and_accepts_legacy_spelling(client, auth, document, field):
    ref = document()
    response = client.put(f'/api/documents/{ref}/ai-result', headers=auth(), json={field: 'Kiểm tra'})
    assert response.status_code == 200
    detail = client.get(f'/api/documents/{ref}', headers=auth()).json()
    assert detail['yeu_cau_hanh_dong'] == 'Kiểm tra'


def test_queue_resolves_ai_department_code_and_stores_extracted_fields(document, monkeypatch):
    from app.services.document_queue_service import document_queue
    with SessionLocal() as db:
        department = Department(id=20, code='PDT', name='Phòng Đào tạo')
        db.add(department); db.commit(); dept_id = department.department_id
    ref = document()
    with SessionLocal() as db:
        db.get(Document, ref).status = 'processing'; db.commit()
    monkeypatch.setattr('app.services.document_queue_service.send_to_ai_service', AsyncMock(return_value={
        'trang_thai': 'success', 'tom_tat': 'Tóm tắt', 'key_points': ['Điểm chính'],
        'goi_y_phong_ban': {'phong_ban': 'PDT', 'id_phong_ban': 20},
        'extracted_fields': {'so_hieu_van_ban': '123/TB', 'ngay_ban_hanh': '20/10/2026',
                             'yeu_cau_hanh_dong': 'Thực hiện'},
    }))
    monkeypatch.setattr('app.services.document_queue_service.send_document_to_qlvb', AsyncMock())
    async def process():
        await document_queue.semaphore.acquire()
        await document_queue._process_single_document(ref)
    asyncio.run(process())
    with SessionLocal() as db:
        doc = db.get(Document, ref)
        assert doc.status == 'processed'
        assert doc.assigned_department_id == dept_id
        assert doc.so_ky_hieu == '123/TB' and doc.ngay_van_ban.isoformat() == '2026-10-20'
        assert doc.yeu_cau_hanh_dong == 'Thực hiện'

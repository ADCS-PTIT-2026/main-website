"""Cross-service history contract; load only pure definitions, with all providers mocked."""
import ast
import asyncio
import contextlib
import json
import logging
import os
import sys
import tempfile
import time
from pathlib import Path
from types import ModuleType, SimpleNamespace
from typing import Optional
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import httpx
import pytest
from fastapi import APIRouter, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import JSONResponse

ROOT = Path(os.getenv('ADCS_AI_HISTORY_ROOT', str(Path(__file__).resolve().parents[5] / 'Document-AI-Service')))
pytestmark = pytest.mark.skipif(not (ROOT / 'app/api/routes.py').is_file(), reason='AI source checkout required for cross-service contract tests')


@pytest.fixture
def definitions(monkeypatch):
    client = ModuleType('ai_history_contract_client')
    monkeypatch.setitem(sys.modules, client.__name__, client)
    source = ROOT / 'app/services/data_service/data_service_client.py'
    exec(compile(source.read_text(), str(source), 'exec'), client.__dict__)
    source = ROOT / 'app/services/data_service/document_storage_orchestrator.py'
    tree = ast.parse(source.read_text())
    tree.body = [node for node in tree.body if not (isinstance(node, ast.ImportFrom) and node.module == 'app.services.data_service.data_service_client')]
    namespace = dict(client.__dict__)
    exec(compile(tree, str(source), 'exec'), namespace)
    return client, namespace['DocumentStorageOrchestrator']


@pytest.mark.parametrize('llm_status', ['success', 'failed'])
def test_unsaved_analysis_records_skipped_storage_and_web_uuid(definitions, llm_status):
    client, Orchestrator = definitions
    fake = SimpleNamespace(get_related=AsyncMock(return_value=[]), post_history=AsyncMock(return_value=True), ingest_ocr=AsyncMock())
    ref = str(uuid4())
    result = asyncio.run(Orchestrator(fake).process(save_document=False, summary='', filename='synthetic.png',
                                                 status_llm=llm_status, web_document_id=ref))
    payload = fake.post_history.await_args.args[0]
    assert payload.status_llm == llm_status
    assert payload.status_save_file == payload.status_save_vector == 'skipped'
    assert payload.web_document_id == ref and payload.document_id is None
    assert result['storage_info']['save_document'] is False
    fake.ingest_ocr.assert_not_awaited()


def test_saved_analysis_preserves_storage_outcome(definitions):
    client, Orchestrator = definitions
    ref = str(uuid4())
    fake = SimpleNamespace(get_related=AsyncMock(return_value=[]), post_history=AsyncMock(return_value=True),
        ingest_ocr=AsyncMock(return_value=client.IngestResult(document_id=7, num_chunks=2, chunk_types={}, total_chars=100, message='OK', save_document=True)))
    asyncio.run(Orchestrator(fake).process(save_document=True, summary='Synthetic summary', web_document_id=ref))
    payload = fake.post_history.await_args.args[0]
    assert payload.status_save_file == payload.status_save_vector == 'success'
    assert payload.document_id == 7 and payload.web_document_id == ref


def test_history_http_body_contains_explicit_skipped_and_canonical_uuid(definitions, monkeypatch):
    client, _ = definitions
    ref = str(uuid4())
    transport = SimpleNamespace(post=AsyncMock(return_value=SimpleNamespace(status_code=200, raise_for_status=lambda: None)))
    class Context:
        async def __aenter__(self): return transport
        async def __aexit__(self, *args): pass
    monkeypatch.setattr(client.httpx, 'AsyncClient', lambda **kw: Context())
    monkeypatch.setitem(sys.modules, 'app.core.config', SimpleNamespace(settings=SimpleNamespace(data_service_api_key='synthetic')))
    service = object.__new__(client.DataServiceClient)
    service.base_url, service.timeout = 'https://synthetic.invalid', 10
    result = asyncio.run(service.post_history(client.HistoryPayload(
        filename='synthetic.png', file_type='image', status_llm='success', status_save_file='skipped',
        status_save_vector='skipped', web_document_id=ref)))
    body = transport.post.await_args.kwargs['json']
    assert result is True
    assert body['web_document_id'] == ref
    assert body['status_save_file'] == body['status_save_vector'] == 'skipped'


@pytest.mark.parametrize('provided_id', ['valid', 'omitted', 'invalid'])
def test_analyze_http_form_passes_valid_web_uuid_to_history(tmp_path, monkeypatch, provided_id):
    # Exercise the actual endpoint body without importing heavyweight OCR/LLM startup modules.
    source = ROOT / 'app/api/routes.py'
    tree = ast.parse(source.read_text())
    endpoint = next(node for node in tree.body if isinstance(node, ast.AsyncFunctionDef) and node.name == 'analyze_document')
    catalog = ModuleType('app.services.department_catalog.department_catalog_service')
    for name in ['get_departments_prompt', 'get_departments_prompt_from_json', 'get_default_departments_context']:
        setattr(catalog, name, lambda *args, **kw: 'Synthetic catalog')
    monkeypatch.setitem(sys.modules, catalog.__name__, catalog)
    result = {'trang_thai': 'success', 'tom_tat': 'Summary', 'extracted_fields': {'so_hieu_van_ban': '123/TB'}}
    storage = SimpleNamespace(process=AsyncMock(return_value={'storage_info': {'save_document': False}, 'related_documents': []}))
    from app.core import error_contract as ec  # module giống hệt nhau ở cả ba service
    namespace = dict(globals(), ec=ec, request_limiter=SimpleNamespace(guard=contextlib.nullcontext),
        router=APIRouter(), settings=SimpleNamespace(temp_dir=str(tmp_path)),
        AgentFactory=SimpleNamespace(get_default_agent=lambda: object()),
        FileUtils=SimpleNamespace(detect_mime_type=lambda path: 'image/png'),
        document_router=SimpleNamespace(process_document=lambda path: {'text': 'Synthetic text', 'pages': 1},
                                        process_document_with_llm=lambda **kw: result),
        _pick_summary=lambda value: value['tom_tat'], _storage_orchestrator=storage,
        logger=logging.getLogger('history-contract'))
    exec(compile(ast.Module(body=[endpoint], type_ignores=[]), str(source), 'exec'), namespace)
    app = FastAPI(); app.include_router(namespace['router'])
    ref = str(uuid4())
    form = {'save_document': 'false', 'department_list': 'Synthetic catalog'}
    if provided_id != 'omitted': form['document_id'] = ref if provided_id == 'valid' else 'invalid-uuid'
    async def request():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as transport:
            return await transport.post('/analyze-document', data=form, files={'file': ('synthetic.png', b'synthetic', 'image/png')})
    response = asyncio.run(request())
    if provided_id == 'invalid':
        assert response.status_code == 422
        storage.process.assert_not_awaited()
    else:
        assert response.status_code == 200, response.text
        assert storage.process.await_args.kwargs['web_document_id'] == (ref if provided_id == 'valid' else None)

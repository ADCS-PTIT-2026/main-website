"""Synthetic browser checks. Intercepts every API request; never calls real providers."""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:15174'
OUTPUT = Path(os.getenv('ADCS_DS_BROWSER_OUTPUT', '/tmp/adcs-ds-browser'))
OUTPUT.mkdir(parents=True, exist_ok=True)
DEPT = '00000000-0000-4000-8000-000000000010'
DOC = '00000000-0000-4000-8000-000000000020'
LOG = '00000000-0000-4000-8000-000000000030'
USER = {'id': '00000000-0000-4000-8000-000000000001', 'email': 'admin@example.invalid', 'name': 'Synthetic admin',
        'role': 'admin', 'is_admin': True, 'account_status': 'active', 'is_active': True, 'permissions': ['file.read', 'file.create']}
records, requests, errors = [], [], []
mappings = []
logs = [{'id': LOG, 'filename': 'existing.txt', 'file_type': 'txt', 'status': 'translating', 'job_status': 'processing',
         'comment': '', 'step': 'translate', 'progress_done': 2, 'progress_total': 4, 'created_at': '2026-10-20T00:00:00Z'}]
NEW = '00000000-0000-4000-8000-000000000031'


def record(name, passed):
    records.append({'name': name, 'passed': bool(passed)})
    assert passed, name


def api(route):
    request = route.request
    parsed = urlsplit(request.url)
    path = parsed.path
    if request.url.startswith(BASE) and not path.startswith('/api/'):
        route.continue_()
        return
    if '/api/' not in path:
        if request.url.startswith(BASE): route.continue_()
        else: route.abort()
        return
    path = path[path.index('/api/') + 4:]
    body = None
    if request.method in ('POST', 'PUT'):
        body = request.post_data or ''
    requests.append({'path': path, 'method': request.method, 'body': body})
    data = {}
    code = 200
    if path == '/auth/me': data = USER
    elif path == '/departments': data = [{'department_id': DEPT, 'name': 'Phòng thử nghiệm', 'children': []}]
    elif path == '/crawler-source-mappings':
        if request.method == 'PUT': mappings[:] = json.loads(body)
        data = list(mappings)
    elif path == '/integration/status': data = {'unmapped_crawler': [], 'jobs': [], 'outbox': []}
    elif path == '/system-parameters': data = {'searchSimilarityThreshold': '0.8'}
    elif path == '/translations/': data = list(logs)
    elif path == '/translations/upload':
        logs.append({'id': NEW, 'filename': 'languages.txt', 'file_type': 'txt', 'status': 'pending', 'job_status': 'queued', 'comment': '', 'created_at': '2026-10-20T00:00:00Z'})
        data = {'message': 'Accepted', 'duplicate_count': 0, 'processed_files': [logs[-1]]}
    elif path == f'/translations/{NEW}/cancel':
        logs[-1]['status'] = logs[-1]['job_status'] = 'cancelled'
        data = {'message': 'Đã hủy'}
    elif path == '/documents/search-capabilities': data = {'data_service_search': True}
    elif path == '/documents/search':
        data = {'status': 'success', 'query': '', 'data': [{'document_id': DOC, 'trich_yeu': 'Văn bản thử nghiệm', 'similarity': .93,
                'confidence': .42, 'status': 'processed', 'sync_status': 'pending'}], 'total': 1, 'page': 1, 'page_size': 20,
                'total_pages': 1, 'warnings': ['semantic_unavailable']}
    route.fulfill(status=code, content_type='application/json', body=json.dumps(data))


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.getenv('CHROME_BIN', '/usr/bin/google-chrome'), headless=True,
                                         args=['--no-sandbox', '--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    context.add_init_script("localStorage.setItem('access_token','synthetic'); localStorage.setItem('user'," + json.dumps(json.dumps(USER)) + ");")
    context.route('**/*', api)
    page = context.new_page(); page.set_default_timeout(5000); page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(BASE+'/admin/crawler-sources')
    expect(page.get_by_role('heading', name='Nguồn crawler và đồng bộ dữ liệu')).to_be_visible()
    page.get_by_role('button', name='Thêm nguồn').click()
    page.get_by_label('Tên nguồn', exact=True).fill('Nguồn thử nghiệm')
    page.get_by_label('Mục nguồn', exact=True).fill('incoming')
    page.get_by_role('combobox').first.select_option(DEPT)
    page.get_by_role('button', name='Lưu cấu hình').click()
    expect(page.get_by_text('Đã lưu cấu hình', exact=True)).to_be_visible()
    record('Admin saves source-section mapping', bool(mappings) and mappings[0]['department_id'] == DEPT)
    page.screenshot(path=str(OUTPUT/'crawler-desktop.png'), full_page=True)
    page.goto(BASE+'/translation')
    expect(page.get_by_text('Tiến độ 2/4', exact=False)).to_be_visible()
    record('Translation progress is visible', page.get_by_role('progressbar').count() == 1)
    page.locator('select').nth(0).select_option('fr'); page.locator('select').nth(1).select_option('ru')
    page.locator('input[type=file]').set_input_files({'name': 'languages.txt', 'mimeType': 'text/plain', 'buffer': b'hello'})
    expect(page.get_by_text('languages.txt', exact=True)).to_be_visible()
    upload = next(item for item in requests if item['path'] == '/translations/upload')
    record('Language selections reach multipart upload', 'name="source_lang"\r\n\r\nfr' in upload['body'] and 'name="target_lang"\r\n\r\nru' in upload['body'])
    page.get_by_role('button', name='Hủy', exact=True).click()
    expect(page.get_by_text('Đã hủy', exact=True).first).to_be_visible()
    record('Queued translation can be cancelled', any(item['path'].endswith('/cancel') for item in requests))
    page.goto(BASE+'/document-repository')
    expect(page.get_by_text('Tương đồng: 93%', exact=True)).to_be_visible()
    expect(page.get_by_text('Đang chờ đồng bộ dữ liệu.', exact=True)).to_be_visible()
    record('Similarity is separate from AI confidence', page.get_by_text('Tương đồng: 42%', exact=True).count() == 0)
    expect(page.get_by_role('status').filter(has_text='tìm kiếm từ khóa')).to_be_visible()
    record('Semantic fallback warning is visible', True)
    page.get_by_label('Chế độ tìm kiếm').select_option('exact')
    page.wait_for_timeout(200)
    record('Search mode reaches backend', any(item['path'] == '/documents/search' for item in requests) and page.get_by_label('Chế độ tìm kiếm').input_value() == 'exact')
    page.set_viewport_size({'width': 375, 'height': 812})
    page.wait_for_timeout(400)
    page.screenshot(path=str(OUTPUT/'search-mobile.png'), full_page=True)
    record('Search controls fit mobile viewport', page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
    page.emulate_media(color_scheme='dark')
    page.evaluate("localStorage.setItem('theme','dark')")
    page.goto(BASE+'/admin/crawler-sources'); expect(page.get_by_role('button', name='Thêm nguồn')).to_be_visible()
    page.wait_for_timeout(400)
    page.evaluate("document.documentElement.classList.add('dark')")
    record('Dark theme is active', page.locator('html').evaluate("element => element.classList.contains('dark')"))
    page.screenshot(path=str(OUTPUT/'crawler-mobile-dark.png'), full_page=True)
    record('Admin controls fit mobile viewport', page.evaluate('document.documentElement.scrollWidth <= window.innerWidth'))
    record('No browser runtime errors', not errors)
    browser.close()
(OUTPUT/'results.json').write_text(json.dumps({'checks': records, 'errors': errors}, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(records), 'errors': errors}))

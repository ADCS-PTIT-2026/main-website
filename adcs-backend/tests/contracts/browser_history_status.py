"""History status UI checks, with all APIs and external traffic intercepted."""
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:15174'
USER = {'id': '00000000-0000-4000-8000-000000000001', 'email': 'admin@example.invalid',
        'name': 'Synthetic admin', 'role': 'admin', 'is_admin': True, 'is_active': True, 'account_status': 'active', 'permissions': ['file.read']}
RECORDS = [
    {'id': 1, 'filename': 'skipped.png', 'status_llm': 'success', 'status_save_file': 'skipped', 'status_save_vector': 'skipped'},
    {'id': 2, 'filename': 'active.png', 'status_llm': 'processing', 'status_save_file': 'pending', 'status_save_vector': 'pending'},
    {'id': 3, 'filename': 'failed.png', 'status_llm': 'failed', 'status_save_file': 'skipped', 'status_save_vector': 'skipped'},
]
for row in RECORDS:
    row.update(request_id=str(row['id']), action_type='upload', file_type='image', created_at='2026-10-21T00:00:00Z')
checks, errors = [], []


def record(name, passed):
    checks.append({'name': name, 'passed': bool(passed)})
    assert passed, name


def api(route):
    request = route.request
    path = urlsplit(request.url).path
    if request.url.startswith(BASE) and not path.startswith('/api/'):
        route.continue_(); return
    if '/api/' not in path:
        route.abort(); return
    path = path[path.index('/api/')+4:]
    data = {}
    if path == '/auth/me': data = USER
    elif path.endswith('telegram-status'): data = {'is_connected': False}
    elif path == '/history': data = {'results': RECORDS, 'total': len(RECORDS)}
    elif path == '/history/1/detail':
        data = {**RECORDS[0], 'status': 'success', 'document_id': None,
                'so_ky_hieu': '123/TB', 'summary': 'Tóm tắt để kiểm tra tab AI'}
    route.fulfill(status=200, content_type='application/json', body=json.dumps(data))


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True, args=['--no-sandbox', '--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1100})
    context.add_init_script("localStorage.setItem('access_token','synthetic');localStorage.setItem('user',"+json.dumps(json.dumps(USER))+");")
    context.route('**/*', api)
    page = context.new_page(); page.set_default_timeout(8000)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(BASE+'/history', wait_until='networkidle')
    done = page.locator('tr').filter(has_text='skipped.png')
    expect(done).to_contain_text('Hoàn tất')
    record('Completed AI with skipped storage is complete', True)
    expect(page.locator('tr').filter(has_text='active.png')).to_contain_text('Đang xử lý')
    record('Active work still shows processing', True)
    expect(page.locator('tr').filter(has_text='failed.png')).to_contain_text('Lỗi')
    record('Failed AI with skipped storage still shows failure', True)
    done.get_by_role('button', name='Chi tiết').click()
    expect(page.get_by_text('123/TB', exact=True)).to_be_visible()
    record('Administrative information tab is preserved', True)
    page.get_by_role('button', name='Kết quả AI & Trích xuất').click()
    expect(page.get_by_text('Tóm tắt để kiểm tra tab AI', exact=True)).to_be_visible()
    record('AI result tab is preserved', True)
    page.get_by_role('button', name='Tiến trình & Lưu trữ').click()
    expect(page.get_by_text('Không áp dụng', exact=True)).to_have_count(2)
    record('Skipped stages have explicit Vietnamese labels', True)
    expect(page.locator('span').filter(has_text='remove_circle_outline')).to_have_count(2)
    record('Skipped stages do not show waiting icons', True)
    record('No browser runtime errors', not errors)
    browser.close()

Path('/tmp/adcs-history-status-browser.json').write_text(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(checks), 'errors': errors}))

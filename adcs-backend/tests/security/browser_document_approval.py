"""Document editing/approval checks; every API and external request is intercepted."""
import json
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

BASE = 'http://127.0.0.1:15174'
DOC = '00000000-0000-4000-8000-000000000020'
DEPT = '00000000-0000-4000-8000-000000000010'
USER = {'id': '00000000-0000-4000-8000-000000000001', 'email': 'admin@example.invalid',
        'name': 'Synthetic admin', 'role': 'admin', 'is_admin': True, 'account_status': 'active',
        'is_active': True, 'permissions': ['file.read', 'file.update', 'file.approve', 'file.create']}
doc = {'document_id': DOC, 'status': 'processed', 'trich_yeu': 'Văn bản thử nghiệm',
       'summary': 'Tóm tắt thử nghiệm', 'so_ky_hieu': '123/TB', 'ngay_van_ban': '2026-10-20',
       'assigned_department_id': DEPT, 'updated_at': None, 'sync_status': 'synced',
       'yeu_cau_hanh_dong': 'Triển khai thử nghiệm',
       'suggested_departments': [{'department_code': 'UNKNOWN', 'department_name': 'Không có trong danh mục'}]}
requests, checks, errors = [], [], []
reject = False


def record(name, condition):
    checks.append({'name': name, 'passed': bool(condition)})
    assert condition, name


def api(route):
    request = route.request
    path = urlsplit(request.url).path
    if request.url.startswith(BASE) and not path.startswith('/api/'):
        route.continue_(); return
    if '/api/' not in path:
        route.abort(); return
    path = path[path.index('/api/')+4:]
    status, data = 200, {}
    if path == '/auth/me': data = USER
    elif path == '/departments': data = [{'department_id': DEPT, 'id': 10, 'code': 'PDT', 'name': 'Phòng Đào tạo', 'children': []}]
    elif path == f'/documents/{DOC}': data = doc
    elif path == f'/documents/{DOC}/ai-result':
        body = request.post_data_json
        requests.append(body)
        if reject:
            status, data = 422, {'detail': [{'loc': ['body', 'assigned_department_id'], 'type': 'uuid_parsing', 'msg': 'Giá trị không hợp lệ'}]}
        else:
            data = {'document': doc, 'message': 'Đã lưu', 'telegram_notification': 'success'}
    route.fulfill(status=status, content_type='application/json', body=json.dumps(data))


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                                args=['--no-sandbox', '--disable-dev-shm-usage'])
    context = browser.new_context(viewport={'width': 1440, 'height': 1100})
    context.add_init_script("localStorage.setItem('access_token','synthetic'); localStorage.setItem('user',"+json.dumps(json.dumps(USER))+");")
    context.route('**/*', api)
    page = context.new_page(); page.set_default_timeout(8000)
    page.on('pageerror', lambda error: errors.append(str(error)))

    def load():
        page.goto(BASE+f'/documents?id={DOC}', wait_until='networkidle')
        expect(page.get_by_text('123/TB', exact=True).first).to_be_visible()

    approve = page.get_by_role('button', name='Phê duyệt & Gửi thông báo Telegram')
    load()
    record('Extracted action is visible', page.get_by_text('Triển khai thử nghiệm', exact=True).count() == 1)
    approve.click()
    expect(page.get_by_text('Gửi thông báo Telegram thành công!', exact=True)).to_be_visible()
    record('Approval without edits sends only approved status', requests[-1] == {'status': 'approved'})

    load()
    page.get_by_role('button', name='Chỉnh sửa').click()
    page.locator('input[type=date]').fill('')
    page.locator('select').select_option('')
    approve.click()
    expect(page.get_by_text('Gửi thông báo Telegram thành công!', exact=True)).to_be_visible()
    record('Blank dates and department become explicit null', requests[-1] == {'status': 'approved', 'assigned_department_id': None, 'ngay_van_ban': None})
    record('Approval excludes server-owned and AI-only fields', not any(key in requests[-1] for key in ['updated_at', 'document_id', 'sync_status', 'confidence']))

    load()
    page.get_by_role('button', name='Chỉnh sửa').click()
    page.locator('input[type=date]').fill('2026-11-01')
    page.get_by_role('button', name='Hủy chỉnh sửa').click()
    approve.click()
    expect(page.get_by_text('Gửi thông báo Telegram thành công!', exact=True)).to_be_visible()
    record('Cancelled edits are not sent on approval', requests[-1] == {'status': 'approved'})

    load()
    page.get_by_role('heading', name='Không có trong danh mục').click()
    expect(page.get_by_text('Không tìm thấy phòng ban được gợi ý. Vui lòng chọn phòng ban trong phần chỉnh sửa.', exact=True)).to_be_visible()
    approve.click()
    expect(page.get_by_text('Gửi thông báo Telegram thành công!', exact=True)).to_be_visible()
    record('Unknown suggestion never becomes an invalid department ID', requests[-1] == {'status': 'approved'})

    load(); reject = True
    approve.click()
    expect(page.get_by_text('Vui lòng kiểm tra thông tin: Phòng ban xử lý.', exact=True).first).to_be_visible()
    record('422 identifies the field in Vietnamese', page.get_by_text('Request failed with status code 422', exact=True).count() == 0)
    record('No browser runtime errors', not errors)
    browser.close()

output = Path('/tmp/adcs-document-approval-browser.json')
output.write_text(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False, indent=2))
print(json.dumps({'passed': len(checks), 'errors': errors}))

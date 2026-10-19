import json
from pathlib import Path
import time
from playwright.sync_api import sync_playwright

BASE='http://127.0.0.1:15173'
API='http://127.0.0.1:18081/api'
OUT=Path(__file__).parent
results=[]

def record(name,ok,detail=None):
    item={'name':name,'passed':bool(ok),'detail':detail}
    results.append(item); print(json.dumps(item,ensure_ascii=False),flush=True)

def check(name,fn):
    try:
        fn()
    except Exception as exc:
        record(name,False,str(exc)[:600])

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    ctx=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    # Application/API traffic stays on loopback; allow the site's font assets.
    ctx.route('**/*',lambda route:route.continue_() if route.request.url.startswith(('http://127.0.0.1:15173','http://127.0.0.1:18081','ws://127.0.0.1:15173','https://fonts.googleapis.com/','https://fonts.gstatic.com/','blob:','data:')) else route.abort())
    page=ctx.new_page()
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))

    page.goto(BASE+'/documents/my');page.wait_for_url('**/login')
    page.evaluate('document.fonts.ready')
    record('anonymous protected route redirects',page.url.endswith('/login'))

    page.locator('input[name=email]').fill('audit_owner@ptit.edu.vn')
    page.locator('input[name=password]').fill('AuditPassword123')
    page.locator('button[type=submit]').click();page.wait_for_url('**/dashboard')
    page.wait_for_timeout(700)
    record('password login to dashboard',page.url.endswith('/dashboard'))

    for path in ['/dashboard','/documents','/documents/my','/document-repository','/translation','/departments','/history','/profile']:
        previous=len(errors)
        page.goto(BASE+path);page.wait_for_timeout(500)
        record('route '+path,len(errors)==previous and len(page.locator('body').inner_text())>50,{'page_errors':errors[previous:]})

    page.goto(BASE+'/admin/roles');page.wait_for_timeout(500)
    record('regular user admin guard',page.url.endswith('/dashboard'))

    data=ctx.request.get(API+'/documents',headers={'Authorization':'Bearer '+page.evaluate("sessionStorage.getItem('access_token')")}).json()
    doc_id=data[0]['document_id']
    page.goto(BASE+'/documents?id='+doc_id);page.wait_for_timeout(600)
    preview=page.locator('object[data],img[alt="Document Preview"]').count()
    record('persisted document preview after reload',preview>0,{'preview_elements':preview})
    page.screenshot(path=str(OUT/'document-reload.png'),full_page=True)

    page.goto(BASE+'/translation');page.wait_for_timeout(400)
    page.locator('select').nth(1).select_option('fr')
    with page.expect_request('**/translations/upload') as req:
        page.locator('input[type=file]').set_input_files({'name':'synthetic-language.txt','mimeType':'text/plain','buffer':b'Synthetic text'})
    body=req.value.post_data_buffer or b''
    record('translation language selection reaches API',b'target_lang' in body and b'fr' in body,{'target_lang_field':b'target_lang' in body,'source_lang_field':b'source_lang' in body})
    page.wait_for_timeout(600)

    page.goto(BASE+'/history');page.wait_for_timeout(600)
    detail_button=page.locator('tr[title="Nhấn để xem chi tiết lượt xử lý"]')
    if detail_button.count():
        with page.expect_response('**/history/*/detail') as response:
            detail_button.first.click()
        record('history fallback opens detail',response.value.status==200,{'status':response.value.status})
    else:
        record('history fallback opens detail',False,'No detail control found by title; check source and backend result')

    # Login via backend API, then initialize storage for an admin browser context.
    admin_login=ctx.request.post(API+'/auth/login',data={'email':'audit_admin@ptit.edu.vn','password':'AuditPassword123'}).json()
    page.evaluate('(d)=>{sessionStorage.clear();localStorage.clear();sessionStorage.setItem("access_token",d.access_token);sessionStorage.setItem("refresh_token",d.refresh_token);sessionStorage.setItem("user",JSON.stringify(d.user))}',admin_login)
    page.goto(BASE+'/dashboard');page.wait_for_timeout(900)
    record('admin feedback list displays returned items','Synthetic feedback must appear for admin' in page.locator('body').inner_text())
    page.screenshot(path=str(OUT/'admin-dashboard.png'),full_page=True)

    for path in ['/admin/roles','/admin/users','/admin/ai-config']:
        previous=len(errors)
        page.goto(BASE+path);page.wait_for_timeout(500)
        record('admin route '+path,len(errors)==previous and page.url.endswith(path),{'page_errors':errors[previous:]})

    dept=ctx.request.post(API+'/departments',data={'name':'Browser audit department','id':1001,'description':'Synthetic browser audit department'}).json()
    roles=ctx.request.get(API+'/role-permissions/roles').json()
    user_role=next(row for row in roles if row['name']=='user')
    page.goto(BASE+'/admin/users');page.wait_for_timeout(400)
    page.get_by_role('button',name='Thêm người dùng mới').click()
    page.locator('input[name=display_name]').fill('Synthetic New User')
    new_email='new_browser_'+str(int(time.time()))+'@ptit.edu.vn'
    page.locator('input[name=email]').fill(new_email)
    page.locator('input[name=phone]').fill('0123456789')
    page.locator('input[name=password]').fill('AuditPassword123!')
    page.locator('select[name=department_id]').select_option(dept['department_id'])
    page.locator('select[name=role_id]').select_option(user_role['role_id'])
    with page.expect_response(lambda response: response.url==API+'/users' and response.request.method=='POST') as created:
        page.get_by_role('button',name='Lưu thông tin').click()
    created_data=created.value.json()
    record('admin new user saves selected role department and active status',created_data.get('role_id')==user_role['role_id'] and created_data.get('department_id')==dept['department_id'] and created_data.get('is_active') is True,{'role_id_saved':bool(created_data.get('role_id')),'department_id_saved':bool(created_data.get('department_id')),'is_active':created_data.get('is_active')})

    # The role API uses fetch directly and should carry the logged-in identity.
    seen=[]
    page.on('request',lambda request:seen.append(dict(url=request.url,authorization=request.headers.get('authorization'))) if '/role-permissions/' in request.url else None)
    page.goto(BASE+'/admin/roles');page.wait_for_timeout(500)
    record('role requests include authorization',bool(seen) and all(row['authorization'] for row in seen),{'request_count':len(seen),'authorized_count':sum(bool(row['authorization']) for row in seen)})

    # Scan representative pages in both themes at small phone and desktop widths.
    for width in [375,1440]:
        page.set_viewport_size({'width':width,'height':900})
        for dark in [False,True]:
            for path in ['/dashboard','/documents/my','/document-repository','/translation','/departments','/profile']:
                page.goto(BASE+path);page.wait_for_timeout(250)
                page.evaluate('(dark)=>document.documentElement.classList.toggle("dark",dark)',dark)
                sizes=page.evaluate('({view:window.innerWidth,body:document.documentElement.scrollWidth})')
                record(f'viewport {width} {"dark" if dark else "light"} {path}',sizes['body']<=sizes['view']+1,sizes)
        if width==375:
            page.goto(BASE+'/documents/my');page.wait_for_timeout(300)
            page.screenshot(path=str(OUT/'mobile-documents.png'),full_page=True)

    page.set_viewport_size({'width':1440,'height':1000})
    page.goto(BASE+'/dashboard');page.wait_for_timeout(500)
    feedback_button=page.get_by_role('button',name='Đóng góp',exact=False)
    if not feedback_button.count():
        feedback_button=page.locator('button').filter(has_text='Góp ý')
    if feedback_button.count():
        feedback_button.first.click();page.wait_for_timeout(200)
        record('feedback modal has dialog semantics',page.locator('[role=dialog],[role=alertdialog],dialog').count()>0)
        page.keyboard.press('Escape');page.wait_for_timeout(100)
        record('feedback modal closes with Escape',page.get_by_text('Gửi ý kiến đóng góp',exact=True).count()==0)
    record('no uncaught browser exceptions',not errors,{'errors':errors})

    # Isolated frontend test: callback must reject mismatched OAuth state before API call.
    callback_ctx=browser.new_context()
    callback_page=callback_ctx.new_page();callback_calls=[]
    callback_page.route('http://127.0.0.1:18081/api/**',lambda route:(callback_calls.append(route.request.url),route.fulfill(status=401,content_type='application/json',headers={'Access-Control-Allow-Origin':'*'},body='{"detail":"audit state check"}'))[-1])
    callback_page.goto(BASE+'/login')
    callback_page.evaluate('sessionStorage.setItem("oauth_state","expected-state")')
    callback_page.goto(BASE+'/auth/callback?code=synthetic&state=wrong-state')
    callback_page.wait_for_timeout(700)
    record('SSO callback rejects mismatched state before exchange',not any('/auth/sso/callback' in url for url in callback_calls),{'exchange_calls':sum('/auth/sso/callback' in url for url in callback_calls)})
    callback_ctx.close()
    browser.close()

(OUT/'browser-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print(json.dumps({'total':len(results),'passed':sum(r['passed'] for r in results),'failed':sum(not r['passed'] for r in results)},indent=2))

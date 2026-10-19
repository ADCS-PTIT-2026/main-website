"""Pending-account dashboard checks against disposable preview_app and Vite."""
import json
import os
import time
from pathlib import Path

from jose import jwt
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:15173'
API = 'http://127.0.0.1:18081/api'
MESSAGE = 'Vui lòng chờ hoặc liên hệ admin để cấp quyền cho tài khoản.'
results = []
errors = []


def record(name, passed):
    results.append({'name':name,'passed':bool(passed)})
    print(json.dumps(results[-1],ensure_ascii=False),flush=True)
    assert passed,name


def sign_in(page,email):
    page.goto(BASE+'/login')
    page.locator('input[name=email]').fill(email)
    page.locator('input[name=password]').fill('AuditPassword123!')
    page.locator('button[type=submit]').click()
    page.wait_for_url('**/dashboard')


def session(page):
    return page.evaluate('''() => {
      const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
      return {access_token:storage.getItem('access_token'),user:JSON.parse(storage.getItem('user'))};
    }''')


with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.getenv('CHROME_BIN','/usr/bin/google-chrome'),headless=True,
                              args=['--no-sandbox','--disable-dev-shm-usage'])
    for index,name in enumerate(['pending','unassigned','awaiting']):
        context=browser.new_context(viewport={'width':1440,'height':1000})
        context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(
            (BASE,'http://127.0.0.1:18081','https://fonts.googleapis.com/','https://fonts.gstatic.com/')) else route.abort())
        page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        business=[]
        page.on('request',lambda req:business.append(req.url) if req.url.startswith(API+'/') and not req.url.startswith(API+'/auth/') else None)
        email=name+'@ptit.edu.vn';sign_in(page,email)
        page.get_by_role('heading',name='Tài khoản đang chờ cấp quyền',exact=True).wait_for()
        record(name+': waiting message visible after password login',page.get_by_text(MESSAGE,exact=True).is_visible())
        record(name+': business APIs and navigation hidden',not business and page.get_by_role('link',name='Xử lý văn bản',exact=True).count()==0)
        page.evaluate('''() => {
          const storage=localStorage.getItem('access_token')?localStorage:sessionStorage;
          const user=JSON.parse(storage.getItem('user'));
          storage.setItem('user',JSON.stringify({...user,account_status:'active',is_admin:true,role:'admin',permissions:['*']}));
        }''')
        page.goto(BASE+'/admin/users')
        page.get_by_role('heading',name='Tài khoản đang chờ cấp quyền',exact=True).wait_for()
        record(name+': server status overrides forged browser role and direct route',page.url.endswith('/dashboard') and not business)
        fits=True
        for width in [375,1440]:
            page.set_viewport_size({'width':width,'height':900})
            for dark in [False,True]:
                page.evaluate('dark=>document.documentElement.classList.toggle("dark",dark)',dark)
                fits=fits and page.get_by_text(MESSAGE,exact=True).is_visible() and page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        record(name+': notice fits mobile and desktop in both themes',fits)
        if index==0:
            claims=jwt.get_unverified_claims(session(page)['access_token']);claims['exp']=int(time.time())-30
            expired=jwt.encode(claims,'synthetic-security-test-signing-key',algorithm='HS256')
            page.evaluate('token=>(localStorage.getItem("access_token")?localStorage:sessionStorage).setItem("access_token",token)',expired)
            refreshes=[]
            page.on('request',lambda req:refreshes.append(req.url) if req.url==API+'/auth/refresh' else None)
            page.reload();page.get_by_role('heading',name='Tài khoản đang chờ cấp quyền',exact=True).wait_for()
            record('pending auth/me expiry rotates once and preserves waiting dashboard',len(refreshes)==1 and not business)
        old=session(page)['access_token']
        page.get_by_role('button',name='Đăng nhập lại',exact=True).click();page.wait_for_url('**/login')
        record(name+': sign-in-again button logs out and revokes session',context.request.get(API+'/auth/me',headers={'Authorization':'Bearer '+old}).status==401)
        # Approve only synthetic fixture accounts using the real admin endpoints.
        admin=context.request.post(API+'/auth/login',data={'email':'admin@ptit.edu.vn','password':'AuditPassword123!'}).json()
        headers={'Authorization':'Bearer '+admin['access_token']}
        users=context.request.get(API+'/users',headers=headers).json()
        user=next(row for row in users if row['email']==email)
        roles=context.request.get(API+'/role-permissions/roles',headers=headers).json()
        role=next(row for row in roles if row['name']=='user')
        assert context.request.put(API+'/users/'+user['user_id']+'/assign',headers=headers,data={'role_id':role['role_id']}).status==200
        assert context.request.put(API+'/users/'+user['user_id']+'/status',headers=headers,data={'is_active':True}).status==200
        context.request.post(API+'/auth/logout',data={'refresh_token':admin['refresh_token']})
        sign_in(page,email)
        page.get_by_text(MESSAGE,exact=True).wait_for(state='hidden')
        page.wait_for_function('''() => {
          const raw=localStorage.getItem('user')||sessionStorage.getItem('user');
          return raw && JSON.parse(raw).account_status==='active';
        }''')
        record(name+': approved account reaches normal dashboard on fresh login',session(page)['user']['account_status']=='active')
        context.close()
    browser.close()

record('no uncaught browser errors',not errors)
Path(os.getenv('ADCS_PENDING_BROWSER_OUTPUT','/tmp/adcs-pending-browser.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results)}))

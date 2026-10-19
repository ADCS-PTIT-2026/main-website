"""Chrome checks against preview_app and Vite, with all providers stubbed."""
import json
import os
from pathlib import Path
from urllib.parse import parse_qs, urlparse, urlencode

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:15173"
API = "http://127.0.0.1:18081/api"
results = []

def record(name, passed, detail=None):
    row = {"name": name, "passed": bool(passed), "detail": detail}
    results.append(row)
    print(json.dumps(row, ensure_ascii=False), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.getenv("CHROME_BIN", "/usr/bin/google-chrome"), headless=True,
                                args=["--no-sandbox", "--disable-dev-shm-usage"])
    context = browser.new_context(viewport={"width":1440,"height":1000})
    def route_external(route):
        url = route.request.url
        if url.startswith((BASE, "http://127.0.0.1:18081", "https://fonts.googleapis.com/", "https://fonts.gstatic.com/")):
            route.continue_()
        elif url.startswith("https://sso.invalid/"):
            route.fulfill(status=200, content_type="text/html", body="Synthetic SSO provider")
        else:
            route.abort()
    context.route("**/*", route_external)
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(BASE+"/login")
    page.locator('input[name=email]').fill('owner@ptit.edu.vn')
    page.locator('input[name=password]').fill('AuditPassword123!')
    page.locator('button[type=submit]').click()
    page.wait_for_url('**/dashboard')
    record('password login succeeds with persistent token session', True)
    page.goto(BASE+'/admin/roles');page.wait_for_timeout(400)
    record('regular user redirected from administrative pages',page.url.endswith('/dashboard'))
    page.goto(BASE+'/departments');page.wait_for_timeout(400)
    record('read-only department page hides create and save controls',page.get_by_role('button',name='Thêm phòng ban').count()==0 and page.get_by_role('button',name='Lưu thay đổi').count()==0)

    # Two concurrent failures should share one token rotation.
    stats_count = [0]; refresh_count = [0]
    def stats_route(route):
        if route.request.method=='GET' and stats_count[0]<2:
            stats_count[0]+=1
            route.fulfill(status=401,content_type='application/json',headers={
                'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Credentials':'true',
            },body='{"detail":"Synthetic expired access token"}')
        else: route.continue_()
    def count_refresh(request):
        if request.url==API+'/auth/refresh' and request.method=='POST':refresh_count[0]+=1
    page.on('request',count_refresh)
    context.route(API+'/documents/stats',stats_route)
    codes=page.evaluate('''async () => {
      const {default: api} = await import('/src/api/axiosClient.ts');
      const values = await Promise.all([api.get('/documents/stats'), api.get('/documents/stats')]);
      return values.map(value => typeof value.total_documents === 'number');
    }''')
    record('concurrent 401s refresh once and retry successfully',all(codes) and refresh_count[0]==1,{'refresh_requests':refresh_count[0]})
    context.unroute(API+'/documents/stats',stats_route)

    # Admin pages must use the common authenticated HTTP client.
    admin = context.request.post(API+'/auth/login', data={'email':'admin@ptit.edu.vn','password':'AuditPassword123!'}).json()
    page.evaluate('''data => {
      sessionStorage.clear();localStorage.clear();
      sessionStorage.setItem('access_token',data.access_token);
      sessionStorage.setItem('refresh_token',data.refresh_token);
      sessionStorage.setItem('user',JSON.stringify(data.user));
    }''',admin)
    role_requests=[]
    page.on('request',lambda req:role_requests.append(bool(req.headers.get('authorization'))) if '/api/role-permissions/' in req.url else None)
    page.goto(BASE+'/admin/roles');page.wait_for_timeout(500)
    record('admin role page loads with Authorization on all role calls',page.url.endswith('/admin/roles') and bool(role_requests) and all(role_requests))
    # Test the actual API client used by this page, avoiding modal label coupling.
    matrix=page.evaluate('''async () => {
      const {rolePermissionApi} = await import('/src/api/rolePermission.ts');
      const roles = await rolePermissionApi.listRoles();
      const user = roles.find(role => role.name === 'user');
      const key = `file.read_${user.role_id}`;
      await rolePermissionApi.updateMatrix({[key]:true});
      return (await rolePermissionApi.getMatrix())[key];
    }''')
    record('authenticated role API saves and reloads permission matrix',matrix is True)

    # Logout through the same API path as the sidebar, then verify server revocation.
    old_access=admin['access_token']
    page.evaluate('''async () => {
      const {authAPI} = await import('/src/api/auth.ts');
      const {clearAuthStorage} = await import('/src/api/axiosClient.ts');
      await authAPI.logout(sessionStorage.getItem('refresh_token'));
      clearAuthStorage();
    }''')
    denied=context.request.get(API+'/users/me',headers={'Authorization':'Bearer '+old_access})
    record('logout revokes the server session',denied.status==401)

    page.goto(BASE+'/login')
    sso_calls=[]
    page.on('request',lambda req:sso_calls.append(req.url) if req.url==API+'/auth/sso/callback' and req.method=='POST' else None)
    page.evaluate("sessionStorage.setItem('oauth_state','expected-state')")
    page.goto(BASE+'/auth/callback?code=synthetic&state=wrong-state');page.wait_for_timeout(400)
    record('mismatched OAuth state is rejected before code exchange',not sso_calls and '/login' in page.url)

    page.get_by_role('button',name='Đăng nhập bằng SSO PTIT').click()
    page.wait_for_url('https://sso.invalid/**')
    query=parse_qs(urlparse(page.url).query)
    cookies=context.cookies('http://127.0.0.1:18081/api/auth/sso')
    record('SSO starts with PKCE nonce and an HttpOnly state cookie',query.get('code_challenge_method')==['S256'] and bool(query.get('nonce')) and any(cookie['name']=='adcs_sso_state' and cookie['httpOnly'] for cookie in cookies))
    callback=urlencode({'code':'synthetic.'+query['nonce'][0],'state':query['state'][0]})
    before=len(sso_calls)
    page.goto(BASE+'/auth/callback?'+callback);page.wait_for_url('**/dashboard')
    page.wait_for_timeout(300)
    record('valid SSO callback exchanges code once under React StrictMode',len(sso_calls)-before==1,{'exchanges':len(sso_calls)-before})
    record('SSO stores the server-verified identity',page.evaluate("JSON.parse(localStorage.getItem('user')).email")=='owner@ptit.edu.vn')
    record('no uncaught browser exceptions',not errors,{'errors':errors})
    browser.close()

output=Path(os.getenv('ADCS_SECURITY_BROWSER_OUTPUT','/tmp/adcs-security-browser.json'))
output.write_text(json.dumps(results,ensure_ascii=False,indent=2))
summary={'total':len(results),'passed':sum(row['passed'] for row in results),'failed':sum(not row['passed'] for row in results)}
print(json.dumps(summary))
raise SystemExit(1 if summary['failed'] else 0)

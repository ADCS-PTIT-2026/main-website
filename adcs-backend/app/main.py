from fastapi import FastAPI
import httpx
import time
import os
from app.core import error_contract as ec
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.endpoints import auth, document, system_parameter, telegram, user, role_permission, department, history, translation, feedback
from app.api.v1.endpoints import crawler_webhook
from app.core.http_client import http_client
from app.core.logger import request_id_var, generate_request_id, logger

class RequestTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        req_id = ec.request_id(request.headers.get("X-Request-ID"))
        ctx_token = ec.begin(req_id, "web-backend")
        token = request_id_var.set(req_id)

        start_time = time.time()
        logger.info(f"📥 BẮT ĐẦU: {request.method} {request.url.path}")

        try:
            response = await call_next(request)

            if response.status_code >= 400:
                logger.warning("Yêu cầu bị từ chối: HTTP %s", response.status_code)
            if request.url.path.startswith("/api/auth/"):
                response.headers["Cache-Control"] = "no-store"

            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = req_id
            logger.info(f"📤 HOÀN THÀNH: {response.status_code} (Mất {process_time:.2f}ms)")
            
            return response
            
        except Exception as e:
            logger.error("Lỗi xử lý yêu cầu: %s", type(e).__name__)
            raise
        finally:
            request_id_var.reset(token)
            ec.context.reset(ctx_token)

MAX_ACTIVE_CONCURRENCY = int(os.getenv("MAX_ACTIVE_CONCURRENCY", 500))
active_requests_count = 0

class LoadSheddingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        global active_requests_count
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        if active_requests_count >= MAX_ACTIVE_CONCURRENCY:
            logger.warning(f"⚠️ Quá tải hệ thống ({active_requests_count}/{MAX_ACTIVE_CONCURRENCY} requests). Từ chối request.")
            return JSONResponse(
                status_code=503,
                content=ec.error("SERVER_BUSY", service="web-backend")
            )

        active_requests_count += 1
        try:
            return await call_next(request)
        finally:
            active_requests_count = max(0, active_requests_count - 1)

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    http_client.client = httpx.AsyncClient(timeout=300.0)
    from app.services.document_queue_service import document_queue
    from app.core.data_service import enabled
    if enabled('INTEGRATION_WORKER_ENABLED') and not enabled('DS_SYNC_ENABLED'):
        raise RuntimeError('Standalone worker requires DS_SYNC_ENABLED')
    if enabled('INTEGRATION_WORKER_ENABLED') and enabled('LEGACY_DOCUMENT_WORKER_ENABLED'):
        raise RuntimeError('Disable legacy document worker before enabling integration worker')
    if os.getenv('LEGACY_DOCUMENT_WORKER_ENABLED', 'true').lower() == 'true' and not enabled('INTEGRATION_WORKER_ENABLED'):
        document_queue.start()
    from app.core.document_websocket import listen_notifications
    import asyncio
    app.state.notification_task = asyncio.create_task(listen_notifications())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "https://adcs.ptitai.org").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoadSheddingMiddleware)
app.add_middleware(RequestTrackingMiddleware)

@app.get("/health")
def health_check():
    from app.db.session import engine
    from sqlalchemy import text
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)}
        )

from app.api.v1.endpoints import integration
app.include_router(integration.router, prefix='/api', tags=['Integration'])

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(document.router, prefix="/api/documents", tags=["Documents"])
app.include_router(crawler_webhook.router, prefix="/api/documents", tags=["Crawler"])
app.include_router(role_permission.router, prefix="/api/role-permissions", tags=["Role-Permissions"])
app.include_router(department.router, prefix="/api/departments", tags=["Departments"])
app.include_router(system_parameter.router, prefix="/api/system-parameters", tags="AI_Config")
app.include_router(telegram.router, prefix="/api/telegram", tags="Telegram")
app.include_router(history.router, prefix="/api/history", tags="History")
app.include_router(translation.router, prefix="/api/translations", tags="Translation")
app.include_router(feedback.router, prefix="/api/feedbacks", tags=["Feedback"])

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Pydantic errors may contain raw input and exception contexts, including passwords.
    errors = [{"loc": error["loc"], "type": error["type"], "msg": "Giá trị không hợp lệ"}
              for error in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={**ec.error('INVALID_REQUEST', service='web-backend', http_status=422), "detail": errors},
    )

@app.exception_handler(StarletteHTTPException)
async def http_error_handler(request: Request, exc: StarletteHTTPException):
    detail_obj = exc.detail if isinstance(exc.detail, dict) else {}
    data = ec.normalize(detail_obj, exc.status_code, service='web-backend')
    data['detail'] = exc.detail  # preserve existing business messages/clients
    if isinstance(exc.detail, str):
        data['message'] = exc.detail
    return JSONResponse(data, status_code=exc.status_code, headers=exc.headers)

@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception('Unhandled HTTP error')
    data = ec.error('INTERNAL_ERROR', service='web-backend')
    data['detail'] = 'Lỗi hệ thống nội bộ'
    return JSONResponse(data, status_code=500, headers={'X-Request-ID': data['request_id']})

@app.on_event('shutdown')
async def shutdown_integrations():
    import asyncio
    task = getattr(app.state, 'notification_task', None)
    if task:
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)
    from app.services.document_queue_service import document_queue
    await document_queue.stop()
    if http_client.client:
        await http_client.client.aclose()

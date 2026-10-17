from fastapi import FastAPI
import httpx
import time
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.concurrency import iterate_in_threadpool

from app.api.v1.endpoints import auth, document, system_parameter, telegram, user, role_permission, department, history, translation, feedback
from app.core.http_client import http_client
from app.core.logger import request_id_var, generate_request_id, logger

class RequestTrackingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        req_id = generate_request_id()
        token = request_id_var.set(req_id)

        start_time = time.time()
        logger.info(f"📥 BẮT ĐẦU: {request.method} {request.url.path}")

        try:
            response = await call_next(request)

            if response.status_code != 200:
                response_body = [chunk async for chunk in response.body_iterator]
                response.body_iterator = iterate_in_threadpool(iter(response_body))

                try:
                    body_content = b"".join(response_body).decode("utf-8")
                    logger.warning(f"⚠️ CHI TIẾT LỖI ({response.status_code}): {body_content}")
                except Exception:
                    logger.warning(f"⚠️ CHI TIẾT LỖI ({response.status_code}): (Không thể decode body)")

            process_time = (time.time() - start_time) * 1000
            response.headers["X-Request-ID"] = req_id
            logger.info(f"📤 HOÀN THÀNH: {response.status_code} (Mất {process_time:.2f}ms)")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ LỖI HỆ THỐNG: {str(e)}")
            raise e
        finally:
            request_id_var.reset(token)

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
                content={"detail": "Hệ thống đang quá tải do lượng truy cập cao. Vui lòng thử lại sau giây lát."}
            )

        active_requests_count += 1
        try:
            return await call_next(request)
        finally:
            active_requests_count = max(0, active_requests_count - 1)

app = FastAPI()

def init_telegram_webhook():
    import requests
    from app.db.session import SessionLocal
    from app.models.telegram_bot import Bot
    try:
        db = SessionLocal()
        bot = db.query(Bot).filter(Bot.name == "ptit_adcs_bot").first()
        if bot and bot.token:
            webhook_url = "https://adcs.ptitai.org/api/telegram/webhook"
            info_url = f"https://api.telegram.org/bot{bot.token}/getWebhookInfo"
            resp = requests.get(info_url, timeout=5).json()
            if resp.get("ok") and resp.get("result", {}).get("url") != webhook_url:
                set_url = f"https://api.telegram.org/bot{bot.token}/setWebhook?url={webhook_url}"
                set_resp = requests.get(set_url, timeout=5).json()
                logger.info(f"Đã tự động cấu hình Telegram webhook: {set_resp}")
            else:
                logger.info(f"Telegram webhook đã sẵn sàng: {resp.get('result', {}).get('url')}")
        db.close()
    except Exception as e:
        logger.warning(f"Không thể khởi tạo Telegram webhook lúc khởi động: {e}")

@app.on_event("startup")
async def startup_event():
    http_client.client = httpx.AsyncClient(timeout=300.0)
    init_telegram_webhook()
    from app.services.document_queue_service import document_queue
    document_queue.start()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(document.router, prefix="/api/documents", tags=["Documents"])
app.include_router(role_permission.router, prefix="/api/role-permissions", tags=["Role-Permissions"])
app.include_router(department.router, prefix="/api/departments", tags=["Departments"])
app.include_router(system_parameter.router, prefix="/api/system-parameters", tags="AI_Config")
app.include_router(telegram.router, prefix="/api/telegram", tags="Telegram")
app.include_router(history.router, prefix="/api/history", tags="History")
app.include_router(translation.router, prefix="/api/translations", tags="Translation")
app.include_router(feedback.router, prefix="/api/feedbacks", tags=["Feedback"])

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Lỗi Validation: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.on_event("shutdown")
async def shutdown_event():
    from app.services.document_queue_service import document_queue
    await document_queue.stop()
    await http_client.client.aclose()
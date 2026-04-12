from fastapi import FastAPI
import httpx
import time
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.endpoints import auth, document, system_parameter, telegram, user, role_permission, department, history
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
            
            response.headers["X-Request-ID"] = req_id
            
            process_time = (time.time() - start_time) * 1000
            logger.info(f"📤 HOÀN THÀNH: {response.status_code} (Mất {process_time:.2f}ms)")
            
            return response
            
        except Exception as e:
            logger.error(f"❌ LỖI HỆ THỐNG: {str(e)}")
            raise e
        finally:
            request_id_var.reset(token)

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    http_client.client = httpx.AsyncClient(timeout=300.0)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(user.router, prefix="/api/users", tags=["Users"])
app.include_router(document.router, prefix="/api/documents", tags=["Documents"])
app.include_router(role_permission.router, prefix="/api/role-permissions", tags=["Role-Permissions"])
app.include_router(department.router, prefix="/api/departments", tags=["Departments"])
app.include_router(system_parameter.router, prefix="/api/system-parameters", tags="AI_Config")
app.include_router(telegram.router, prefix="/api/telegram", tags="Telegram")
app.include_router(history.router, prefix="/api/history", tags="History")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"Lỗi Validation: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.on_event("shutdown")
async def shutdown_event():
    await http_client.client.aclose()
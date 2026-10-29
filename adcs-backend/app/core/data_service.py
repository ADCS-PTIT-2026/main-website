"""Authenticated, same-origin Data Service transport. Never forward these headers to AI."""
import os
from urllib.parse import urlsplit

import httpx
from fastapi import HTTPException

from app.core import error_contract as ec
from app.core.logger import request_id_var, generate_request_id


def enabled(name: str) -> bool:
    return os.getenv(name, "false").lower() in {"1", "true", "yes"}


class DataServiceClient:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def request(self, method: str, path: str, **kwargs):
        base = os.getenv("DATA_SERVICE_URL", "").rstrip("/")
        key = os.getenv("DATA_SERVICE_API_KEY", "")
        if not base or not key:
            raise HTTPException(503, detail={"error_code": "DS_NOT_CONFIGURED", "message": "Chưa cấu hình dịch vụ dữ liệu"})
        # Call sites may pass the configured absolute URL during migration only.
        if path.startswith(base + "/"):
            path = path[len(base):]
        if not path.startswith("/api/") or urlsplit(path).netloc or ".." in path.split("/"):
            raise ValueError("Invalid Data Service path")
        request_id = request_id_var.get()
        if not request_id or request_id == 'SYSTEM':
            request_id = generate_request_id()
        headers = {"X-Service-Key": key, "X-Request-ID": request_id}
        timeout = kwargs.pop("timeout", 30.0)
        kwargs.pop("headers", None)
        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
                response = await client.request(method, base + path, headers=headers, **kwargs)
        except httpx.RequestError:
            raise HTTPException(503, detail={"error_code": "DS_UNAVAILABLE", "message": "Không kết nối được dịch vụ dữ liệu", "request_id": headers["X-Request-ID"]}) from None
        if response.is_success:
            return response
        try:
            payload = response.json()
            payload = payload if isinstance(payload, dict) else {}
            detail = payload.get("detail", payload)
            detail = detail if isinstance(detail, dict) else {}
        except (ValueError, AttributeError):
            detail = {}
            payload = {}
        # Return only documented, bounded fields; never raw bodies or HTML proxy errors.
        error = {**ec.normalize(payload, response.status_code, service='data-service'),
                 "error_code": str(detail.get("error_code") or "DS_ERROR")[:100],
                 "message": str(detail.get("message") or "Dịch vụ dữ liệu từ chối yêu cầu")[:500],
                 "step": str(detail.get("step") or "")[:80],
                 "request_id": response.headers.get("X-Request-ID", headers["X-Request-ID"])}
        status = response.status_code
        if status in (401, 403) or status >= 500 or 300 <= status < 400:
            status = 502
        raise HTTPException(status, detail=error)

    async def get(self, path, **kwargs):
        return await self.request("GET", path, **kwargs)

    async def post(self, path, **kwargs):
        return await self.request("POST", path, **kwargs)

    async def put(self, path, **kwargs):
        return await self.request("PUT", path, **kwargs)

    async def delete(self, path, **kwargs):
        return await self.request("DELETE", path, **kwargs)


data_service = DataServiceClient()

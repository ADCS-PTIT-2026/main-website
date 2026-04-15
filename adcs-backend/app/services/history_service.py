import os
import httpx
from fastapi import HTTPException
from app.core.logger import logger

DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")

async def fetch_processing_history(
    limit: int = 10,
    search: str = None,
    action: str = None,
    time_filter: str = None
):
    """
    Gọi API sang Data service để lấy lịch sử xử lý dựa trên các bộ lọc
    """
    url = f"{DATA_SERVICE_URL}/api/v1/history"

    params = {
        "limit": limit
    }

    if search:
        params["search"] = search
    
    if action and action != "Tất cả hành động":
        params["action"] = action
        
    if time_filter and time_filter != "Tùy chọn...":
        params["time_filter"] = time_filter

    logger.info(f"Đang gọi Data Service lấy lịch sử. Bộ lọc (Params): {params}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            
            logger.info("Đã lấy thành công dữ liệu lịch sử từ Data Service.")
            return response.json()
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Lỗi HTTP khi gọi Data Service: {e.response.status_code} - {e.response.text}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Máy chủ dữ liệu trả về lỗi."
        )
    except httpx.RequestError as e:
        logger.error(f"Lỗi kết nối khi gọi Data Service (History API): {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail="Không thể lấy dữ liệu lịch sử từ máy chủ dữ liệu lúc này."
        )
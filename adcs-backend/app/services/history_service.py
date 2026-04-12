import os
import requests
from fastapi import HTTPException

DATA_SERVICE_API = os.getenv("DATA_SERVICE_API")

def fetch_processing_history(
    limit: int = 10,
    search: str = None,
    action: str = None,
    time_filter: str = None
):
    """
    Gọi API sang Data service để lấy lịch sử xử lý dựa trên các bộ lọc
    """
    url = f"{DATA_SERVICE_API}/api/v1/history"

    params = {
        "limit": limit
    }

    if search:
        params["search"] = search
    
    if action and action != "Tất cả hành động":
        params["action"] = action
        
    if time_filter and time_filter != "Tùy chọn...":
        params["time_filter"] = time_filter

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print(f"[History Service Error] Lỗi khi kết nối Data Service: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Không thể lấy dữ liệu lịch sử từ máy chủ dữ liệu lúc này."
        )
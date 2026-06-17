import httpx
import asyncio
from app.db.session import SessionLocal
from app.core.document_websocket import manager
from app.crud import translation as crud_translation
from dotenv import load_dotenv
import os

load_dotenv()
DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")
DATA_SERVICE_TRANSLATE_URL = f"{DATA_SERVICE_URL}/api/v1/translate"

async def process_translation_background(log_id: str, file_content: bytes, filename: str, client_id: str):
    db = SessionLocal()
    try:
        log = crud_translation.get_translation_log_by_id(db, log_id)
        if not log: return

        crud_translation.update_translation_status(db, log, status="translating")

        async with httpx.AsyncClient(timeout=600.0) as client:
            files = {"file": (filename, file_content)}
            data = {"source_lang": log.source_language, "target_lang": log.target_language}
            response = await client.post(DATA_SERVICE_TRANSLATE_URL, files=files, data=data)
            response.raise_for_status()
            
            res_data = response.json()
            result_url = res_data.get("download_url")

        await asyncio.sleep(5) 
        result_url = f"/static/downloads/translated_{log_id}.docx"

        crud_translation.update_translation_status(db, log, status="success", result_url=result_url)

        await manager.send_personal_message({"type": "TRANSLATION_SUCCESS", "id": log_id}, client_id)

    except Exception as e:
        print(f"Lỗi dịch thuật background: {e}")
        log = crud_translation.get_translation_log_by_id(db, log_id)
        if log:
            crud_translation.update_translation_status(db, log, status="failed")
    finally:
        db.close()
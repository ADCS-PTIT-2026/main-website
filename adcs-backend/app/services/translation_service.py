import httpx
import asyncio
from app.db.session import SessionLocal
from app.models.translation import TranslationLog
from app.core.document_websocket import manager
from dotenv import load_dotenv
import os

load_dotenv()
DATA_SERVICE_URL = os.getenv("DATA_SERVICE_URL")
DATA_SERVICE_TRANSLATE_URL = f"{DATA_SERVICE_URL}/api/v1/translate"

async def process_translation_background(log_id: str, file_content: bytes, filename: str, client_id: str):
    db = SessionLocal()
    try:
        log = db.query(TranslationLog).filter(TranslationLog.id == log_id).first()
        if not log: return

        log.status = "translating"
        db.commit()

        async with httpx.AsyncClient(timeout=300.0) as client:
            files = {"file": (filename, file_content)}
            data = {"source_lang": log.source_language, "target_lang": log.target_language}
            response = await client.post(DATA_SERVICE_TRANSLATE_URL, files=files, data=data)
            response.raise_for_status()
            
            res_data = response.json()
            result_url = res_data.get("download_url")

        await asyncio.sleep(5) 
        result_url = f"/static/downloads/translated_{log_id}.docx"

        log.status = "success"
        log.result_file_url = result_url
        db.commit()

        await manager.send_personal_message({"type": "TRANSLATION_SUCCESS", "id": log_id}, client_id)

    except Exception as e:
        print(f"Lỗi dịch thuật background: {e}")
        log.status = "failed"
        db.commit()
    finally:
        db.close()
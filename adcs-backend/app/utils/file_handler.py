import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "uploads"

async def save_file(file: UploadFile) -> tuple[str, str]:
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_ext = file.filename.split('.')[-1]
    new_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    return file_path, new_filename
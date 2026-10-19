"""Local integration harness; never start the real application lifespan."""
from pathlib import Path
import tempfile
import pytest
from unittest.mock import AsyncMock
from test_system_audit import *
from app.models.feedback import Feedback
from app.services import translation_service

mp = pytest.MonkeyPatch()
seed_generator = isolated_data.__wrapped__(mp)
ids = next(seed_generator)
work = Path(tempfile.mkdtemp(prefix='adcs-browser-data-'))
doc_id = add_doc(ids,work,summary='Synthetic audit document',trich_yeu='Synthetic audit document',loai_van_ban_text='Công văn',confidence=0.88)
with SessionLocal() as db:
    db.add(Feedback(user_id=ids['owner'],feedback_type='bug',content='Synthetic feedback must appear for admin'))
    db.commit()

# Preserve filesystem operations but redirect the hardcoded upload destination.
original_path = os.path
class AuditPath:
    def __getattr__(self,name): return getattr(original_path,name)
    def exists(self,path):
        return False if path == '/mnt/data2tb/adcs/uploads' else original_path.exists(path)
    def abspath(self,path):
        if str(path).endswith('/endpoints/document.py'):
            return str(work/'a/b/c/d/document.py')
        return original_path.abspath(path)
document_ep.os=SimpleNamespace(path=AuditPath(),makedirs=os.makedirs,remove=os.remove)

async def fake_translation(log_id,file_content,filename,client_id):
    with SessionLocal() as db:
        log=db.query(TranslationLog).filter(TranslationLog.id==log_id).first()
        if log:
            log.status='success';log.result_file_url='static/downloads/audit-synthetic.docx';db.commit()
translation_service.process_translation_background=fake_translation
app.router.on_startup.clear()
app.router.on_shutdown.clear()

print('Audit harness seeded synthetic users and document',flush=True)

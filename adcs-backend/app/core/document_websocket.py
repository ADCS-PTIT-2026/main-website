from fastapi import WebSocket
import uuid

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]

    async def send_personal_message(self, message: dict, client_id: str):
        websocket = self.active_connections.get(client_id)
        if websocket:
            await websocket.send_json(message)

manager = ConnectionManager()

def is_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

async def listen_notifications():
    """Each API process fans out committed worker events to its own sockets."""
    import asyncio
    import json
    import select
    from app.db.session import engine, SessionLocal
    from app.models.document import Document
    from app.models.translation import TranslationLog
    connection = None
    try:
        while True:
            try:
                if connection is None:
                    connection = engine.raw_connection()
                    connection.set_isolation_level(0)
                    with connection.cursor() as cursor:
                        cursor.execute('LISTEN adcs_events')
                if select.select([connection], [], [], 0)[0]:
                    connection.poll()
                    while connection.notifies:
                        notification = connection.notifies.pop(0)
                        event = json.loads(notification.payload)
                        with SessionLocal() as db:
                            translation = event['kind'] == 'translation'
                            record = db.get(TranslationLog if translation else Document, event['reference_id'])
                            if record:
                                owner = record.user_id if translation else record.uploaded_by_user_id
                                message = {'type': 'TRANSLATION_SUCCESS' if translation else 'DOCUMENT_PROCESSED',
                                           'id': event['reference_id'], 'document_id': event['reference_id'], 'status': record.status}
                                if owner:
                                    await manager.send_personal_message(message, str(owner))
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                raise
            except Exception:
                if connection is not None:
                    connection.invalidate()
                    connection = None
                await asyncio.sleep(3)
    finally:
        if connection is not None:
            with connection.cursor() as cursor:
                cursor.execute('UNLISTEN *')
            connection.set_isolation_level(1)
            connection.close()

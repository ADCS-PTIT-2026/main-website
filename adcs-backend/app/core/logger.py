import logging
import contextvars
import random
from datetime import datetime

request_id_var = contextvars.ContextVar("request_id", default="SYSTEM")

def generate_request_id():
    now = datetime.now()
    timestamp = now.strftime("%y%m%d%H%M%S")
    milliseconds = str(int(now.microsecond / 1000)).zfill(3)
    random_part = str(random.randint(1000, 9999))
    return f"ADCS{timestamp}{milliseconds}{random_part}"

class RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

logger = logging.getLogger("adcs_logger")
logger.setLevel(logging.INFO)

formatter = logging.Formatter('[%(asctime)s] [%(request_id)s] [%(levelname)s] %(message)s')

console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
console_handler.addFilter(RequestIdFilter())
logger.addHandler(console_handler)

# file_handler = logging.FileHandler("adcs_app.log", encoding="utf-8")
# file_handler.setFormatter(formatter)
# file_handler.addFilter(RequestIdFilter())
# logger.addHandler(file_handler)
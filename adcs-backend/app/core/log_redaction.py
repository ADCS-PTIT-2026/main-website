"""Last-line log protection; request bodies and credentials should not be logged."""
import logging
import os
import re
import traceback

SECRET_ENV_KEYS = (
    "SECRET_KEY", "DB_PASSWORD", "TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET",
    "SERVICE_INTERNAL_KEY", "QLVB_API_KEY", "PTIT_CLIENT_SECRET", "DATABASE_URL",
)


def redact_secrets(value: str) -> str:
    for name in SECRET_ENV_KEYS:
        secret = os.getenv(name)
        if secret:
            value = value.replace(secret, "[REDACTED]")
    value = re.sub(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "[REDACTED_TOKEN]", value)
    value = re.sub(r"bot\d{6,}:[A-Za-z0-9_-]+", "bot[REDACTED]", value)
    value = re.sub(r"\$(?:bcrypt-sha256|2[aby])\$[^\s'\",}]+", "[REDACTED_HASH]", value)
    value = re.sub(r"(?i)(postgres(?:ql)?://[^\s:/]+:)[^@\s]+@", r"\1[REDACTED]@", value)
    value = re.sub(
        r'''(?i)(["']?(?:password|current_password|new_password|confirm_password|password_hash|access_token|refresh_token|client_secret|code_verifier)["']?\s*[:=]\s*)(["'])(.*?)\2''',
        r'\1"[REDACTED]"', value,
    )
    return value


class SensitiveDataFilter(logging.Filter):
    def filter(self, record):
        record.msg = redact_secrets(record.getMessage())
        record.args = ()
        if record.exc_info:
            record.exc_text = redact_secrets("".join(traceback.format_exception(*record.exc_info)))
            record.exc_info = None
        elif record.exc_text:
            record.exc_text = redact_secrets(record.exc_text)
        return True

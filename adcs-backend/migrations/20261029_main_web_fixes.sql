-- 2026-10-29: Main web tasks fixes (L3, L4, L7)
SET search_path = public;

-- L3: Processing error diagnostics & next attempt tracking
ALTER TABLE documents ADD COLUMN IF NOT EXISTS error_details JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS processing_attempts (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    job_id UUID,
    request_id VARCHAR(64) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'running',
    error JSONB,
    warnings JSONB,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_processing_attempts_document_id ON processing_attempts(document_id);
CREATE INDEX IF NOT EXISTS ix_processing_attempts_request_id ON processing_attempts(request_id);

-- L7: Login failure rate limiting & lockout
CREATE TABLE IF NOT EXISTS login_attempts (
    key VARCHAR(255) PRIMARY KEY,
    failures INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_login_attempts_locked_until ON login_attempts(locked_until);

-- L4: Migrate historical documents cancelled by user to 'cancelled' status
UPDATE documents
SET status = 'cancelled', error_message = NULL
WHERE status = 'failed' AND error_message = 'Đã hủy bởi người dùng';


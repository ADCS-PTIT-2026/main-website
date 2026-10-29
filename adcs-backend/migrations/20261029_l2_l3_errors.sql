-- Additive migration; apply before reloading Web/worker.
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

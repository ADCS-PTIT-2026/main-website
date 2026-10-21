BEGIN;
-- Crawler records have no human uploader; access remains department/admin scoped.
ALTER TABLE documents ALTER COLUMN uploaded_by_user_id DROP NOT NULL;
ALTER TABLE documents
 ADD COLUMN IF NOT EXISTS source_type varchar(32) NOT NULL DEFAULT 'user_upload',
 ADD COLUMN IF NOT EXISTS source_name text,
 ADD COLUMN IF NOT EXISTS source_url text,
 ADD COLUMN IF NOT EXISTS external_id text,
 ADD COLUMN IF NOT EXISTS source_section text,
 ADD COLUMN IF NOT EXISTS file_hash varchar(64),
 ADD COLUMN IF NOT EXISTS ds_document_id integer,
 ADD COLUMN IF NOT EXISTS sync_status varchar(24) NOT NULL DEFAULT 'pending',
 ADD COLUMN IF NOT EXISTS sync_version integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS duplicate_of jsonb,
 ADD COLUMN IF NOT EXISTS duplicate_reasons jsonb,
 ADD COLUMN IF NOT EXISTS possible_duplicates jsonb,
 ADD COLUMN IF NOT EXISTS sync_warnings jsonb,
 ADD COLUMN IF NOT EXISTS extra_files jsonb;
CREATE INDEX IF NOT EXISTS documents_file_hash_idx ON documents(file_hash);
DROP INDEX IF EXISTS documents_crawler_identity_idx;
CREATE UNIQUE INDEX documents_crawler_identity_idx
 ON documents(source_name, COALESCE(source_section,''), external_id)
 WHERE source_type='crawler' AND external_id IS NOT NULL AND deleted_at IS NULL AND status IS DISTINCT FROM 'duplicate';
ALTER TABLE translation_logs
 ADD COLUMN IF NOT EXISTS input_path text,
 ADD COLUMN IF NOT EXISTS ds_job_id uuid,
 ADD COLUMN IF NOT EXISTS job_status varchar(32) NOT NULL DEFAULT 'queued',
 ADD COLUMN IF NOT EXISTS step varchar(80),
 ADD COLUMN IF NOT EXISTS progress_done integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS progress_total integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS queue_position integer,
 ADD COLUMN IF NOT EXISTS error_code varchar(100),
 ADD COLUMN IF NOT EXISTS error_message text;
UPDATE translation_logs SET job_status=CASE status
 WHEN 'pending' THEN 'queued' WHEN 'translating' THEN 'needs_review' ELSE status END
 WHERE input_path IS NULL;
CREATE TABLE IF NOT EXISTS integration_outbox (
 id uuid PRIMARY KEY, sequence integer NOT NULL, document_id uuid NOT NULL,
 operation varchar(20) NOT NULL, payload jsonb NOT NULL,
 status varchar(24) NOT NULL DEFAULT 'pending', attempts integer NOT NULL DEFAULT 0,
 available_at timestamptz NOT NULL DEFAULT now(), error_code varchar(100),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id,sequence)
);
CREATE INDEX IF NOT EXISTS integration_outbox_ready_idx ON integration_outbox(status,available_at);
CREATE TABLE IF NOT EXISTS processing_jobs (
 id uuid PRIMARY KEY, kind varchar(20) NOT NULL, reference_id uuid NOT NULL UNIQUE,
 priority integer NOT NULL, status varchar(24) NOT NULL DEFAULT 'queued',
 lease_until timestamptz, error_code varchar(100), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS processing_jobs_ready_idx ON processing_jobs(status,priority,created_at);
CREATE TABLE IF NOT EXISTS crawler_source_mappings (
 id uuid PRIMARY KEY, source_name text NOT NULL, section text NOT NULL DEFAULT '',
 department_id uuid NOT NULL REFERENCES departments(department_id), UNIQUE(source_name,section)
);
COMMIT;

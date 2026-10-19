BEGIN;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS system_code varchar(32);
UPDATE roles SET system_code = lower(name)
WHERE system_code IS NULL AND lower(name) IN ('admin', 'user');
CREATE UNIQUE INDEX IF NOT EXISTS roles_system_code_key ON roles(system_code);
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_version integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
    token_hash varchar(64) PRIMARY KEY,
    family_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    auth_version integer NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_user_id_idx ON auth_refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_family_id_idx ON auth_refresh_tokens(family_id);
CREATE INDEX IF NOT EXISTS auth_refresh_tokens_expires_at_idx ON auth_refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS telegram_link_tokens (
    token_hash varchar(64) PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    used_at timestamptz
);
CREATE INDEX IF NOT EXISTS telegram_link_tokens_user_id_idx ON telegram_link_tokens(user_id);
CREATE INDEX IF NOT EXISTS telegram_link_tokens_expires_at_idx ON telegram_link_tokens(expires_at);

CREATE TABLE IF NOT EXISTS sso_login_attempts (
    state_hash varchar(64) PRIMARY KEY,
    nonce_hash varchar(64) NOT NULL,
    code_verifier varchar(128) NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz
);
CREATE INDEX IF NOT EXISTS sso_login_attempts_expires_at_idx ON sso_login_attempts(expires_at);

INSERT INTO permissions (permission_id, code, description)
SELECT gen_random_uuid(), p.code, p.description FROM (VALUES
    ('file.read', 'Xem và tải tài liệu trong phạm vi được phép'),
    ('file.approve', 'Phê duyệt tài liệu trong phạm vi được phép')
) AS p(code, description)
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = p.code);

-- Preserve read access for existing file operators; do not grant create/approve.
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT rp.role_id, reader.permission_id
FROM role_permissions rp
JOIN permissions existing ON existing.permission_id = rp.permission_id
CROSS JOIN permissions reader
WHERE existing.code IN ('file.create', 'file.update', 'file.delete', 'doc:create', 'doc:update', 'doc:delete')
  AND reader.code = 'file.read'
ON CONFLICT DO NOTHING;
COMMIT;

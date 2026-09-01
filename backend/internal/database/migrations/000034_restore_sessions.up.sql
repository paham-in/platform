-- Revert dari refresh-token (JWT) kembali ke session-based auth.
-- 000032 menghapus sessions, 000033 membuat refresh_tokens (sudah tercatat di
-- schema_migrations DB). Migrasi ini memulihkan tabel sessions dan membuang
-- refresh_tokens yang tidak terpakai lagi.
CREATE TABLE IF NOT EXISTS sessions (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    user_id    bigint NOT NULL,
    token      varchar(255) NOT NULL,
    expires_at bigint NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_deleted_at ON sessions (deleted_at);

DROP TABLE IF EXISTS refresh_tokens;
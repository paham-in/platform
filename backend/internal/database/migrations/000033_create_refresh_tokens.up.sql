CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    user_id    bigint NOT NULL,
    token      varchar(255) NOT NULL,
    expires_at bigint NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_deleted_at ON refresh_tokens (deleted_at);
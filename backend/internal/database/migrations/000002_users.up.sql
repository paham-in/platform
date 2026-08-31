CREATE TABLE IF NOT EXISTS users (
    id             bigserial PRIMARY KEY,
    created_at     timestamptz,
    updated_at     timestamptz,
    deleted_at     timestamptz,
    public_id      varchar(36) NOT NULL,
    name           varchar(100) NOT NULL,
    email          varchar(100) NOT NULL,
    google_id      varchar(100),
    avatar_url     varchar(500),
    password       varchar(255)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_public_id ON users (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);
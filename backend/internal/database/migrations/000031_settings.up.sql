CREATE TABLE IF NOT EXISTS settings (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    key        varchar(100) NOT NULL,
    value      text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_key ON settings (key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_settings_deleted_at ON settings (deleted_at);
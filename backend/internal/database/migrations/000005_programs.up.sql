CREATE TABLE IF NOT EXISTS programs (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    public_id  varchar(36) NOT NULL,
    name       varchar(100) NOT NULL,
    slug       varchar(100) NOT NULL,
    "desc"     varchar(500)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_public_id ON programs (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_slug ON programs (slug);
CREATE INDEX IF NOT EXISTS idx_programs_deleted_at ON programs (deleted_at);
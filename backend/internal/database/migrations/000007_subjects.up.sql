CREATE TABLE IF NOT EXISTS subjects (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    public_id  varchar(36) NOT NULL,
    name       varchar(100) NOT NULL,
    slug       varchar(100) NOT NULL,
    program_id bigint
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_public_id ON subjects (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_slug ON subjects (slug);
CREATE INDEX IF NOT EXISTS idx_subjects_program_id ON subjects (program_id);
CREATE INDEX IF NOT EXISTS idx_subjects_deleted_at ON subjects (deleted_at);
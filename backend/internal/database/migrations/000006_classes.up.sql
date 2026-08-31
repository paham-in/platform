CREATE TABLE IF NOT EXISTS classes (
    id                bigserial PRIMARY KEY,
    created_at        timestamptz,
    updated_at        timestamptz,
    deleted_at        timestamptz,
    public_id         varchar(36) NOT NULL,
    name              varchar(100) NOT NULL,
    slug              varchar(100) NOT NULL,
    program_id        bigint,
    allow_tutoring    boolean DEFAULT true,
    price_per_session numeric DEFAULT 0,
    group_price       numeric DEFAULT 0,
    content_price     numeric DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_public_id ON classes (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_slug ON classes (slug);
CREATE INDEX IF NOT EXISTS idx_classes_program_id ON classes (program_id);
CREATE INDEX IF NOT EXISTS idx_classes_deleted_at ON classes (deleted_at);
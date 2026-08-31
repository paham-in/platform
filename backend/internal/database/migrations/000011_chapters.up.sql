CREATE TABLE IF NOT EXISTS chapters (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    public_id   varchar(36) NOT NULL,
    class_id    bigint NOT NULL,
    subject_id  bigint NOT NULL,
    title       varchar(200) NOT NULL,
    slug        varchar(200) NOT NULL,
    description varchar(500),
    cover_url   varchar(500),
    "order"     bigint DEFAULT 0,
    CONSTRAINT fk_chapters_class FOREIGN KEY (class_id) REFERENCES classes (id),
    CONSTRAINT fk_chapters_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_public_id ON chapters (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_subject_slug ON chapters (class_id, subject_id, slug);
CREATE INDEX IF NOT EXISTS idx_chapters_deleted_at ON chapters (deleted_at);
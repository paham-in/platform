CREATE TABLE IF NOT EXISTS materials (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    public_id   varchar(36) NOT NULL,
    chapter_id  bigint NOT NULL,
    author_id   bigint NOT NULL,
    title       varchar(200) NOT NULL,
    slug        varchar(200) NOT NULL,
    description varchar(500),
    type        varchar(20) DEFAULT 'text',
    content     text,
    video_url   varchar(500),
    status      varchar(20) DEFAULT 'draft',
    is_free     boolean NOT NULL,
    "order"     bigint DEFAULT 0,
    CONSTRAINT fk_materials_chapter FOREIGN KEY (chapter_id) REFERENCES chapters (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_public_id ON materials (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_slug ON materials (slug);
CREATE INDEX IF NOT EXISTS idx_materials_chapter_id ON materials (chapter_id);
CREATE INDEX IF NOT EXISTS idx_materials_author_id ON materials (author_id);
CREATE INDEX IF NOT EXISTS idx_materials_deleted_at ON materials (deleted_at);
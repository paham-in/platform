CREATE TABLE IF NOT EXISTS quiz_collections (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    public_id   varchar(36) NOT NULL,
    name        varchar(200) NOT NULL,
    author_id   bigint,
    class_id    bigint NOT NULL,
    is_free     boolean NOT NULL,
    description varchar(500),
    CONSTRAINT fk_quiz_collections_class FOREIGN KEY (class_id) REFERENCES classes (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_collections_public_id ON quiz_collections (public_id);
CREATE INDEX IF NOT EXISTS idx_quiz_collections_author_id ON quiz_collections (author_id);
CREATE INDEX IF NOT EXISTS idx_quiz_collections_class_id ON quiz_collections (class_id);
CREATE INDEX IF NOT EXISTS idx_quiz_collections_deleted_at ON quiz_collections (deleted_at);
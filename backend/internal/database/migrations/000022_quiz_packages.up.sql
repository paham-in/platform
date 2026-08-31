CREATE TABLE IF NOT EXISTS quiz_packages (
    id            bigserial PRIMARY KEY,
    created_at    timestamptz,
    updated_at    timestamptz,
    deleted_at    timestamptz,
    public_id     varchar(36) NOT NULL,
    name          varchar(200) NOT NULL,
    author_id     bigint,
    description   varchar(500),
    subject_id    bigint NOT NULL DEFAULT 0,
    is_free       boolean NOT NULL DEFAULT true,
    status        varchar(20) DEFAULT 'draft',
    collection_id bigint,
    CONSTRAINT fk_quiz_collections_packages FOREIGN KEY (collection_id) REFERENCES quiz_collections (id),
    CONSTRAINT fk_quiz_packages_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_packages_public_id ON quiz_packages (public_id);
CREATE INDEX IF NOT EXISTS idx_quiz_packages_author_id ON quiz_packages (author_id);
CREATE INDEX IF NOT EXISTS idx_quiz_packages_subject_id ON quiz_packages (subject_id);
CREATE INDEX IF NOT EXISTS idx_quiz_packages_collection_id ON quiz_packages (collection_id);
CREATE INDEX IF NOT EXISTS idx_quiz_packages_deleted_at ON quiz_packages (deleted_at);
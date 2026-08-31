CREATE TABLE IF NOT EXISTS forum_questions (
    id            bigserial PRIMARY KEY,
    created_at    timestamptz,
    updated_at    timestamptz,
    deleted_at    timestamptz,
    public_id     varchar(36) NOT NULL,
    user_id       bigint NOT NULL,
    subject_id    bigint,
    content       text NOT NULL,
    plain_content text NOT NULL,
    CONSTRAINT fk_forum_questions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_forum_questions_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_questions_public_id ON forum_questions (public_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_user_id ON forum_questions (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_subject_id ON forum_questions (subject_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_deleted_at ON forum_questions (deleted_at);
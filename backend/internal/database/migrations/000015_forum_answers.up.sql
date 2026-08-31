CREATE TABLE IF NOT EXISTS forum_answers (
    id            bigserial PRIMARY KEY,
    created_at    timestamptz,
    updated_at    timestamptz,
    deleted_at    timestamptz,
    public_id     varchar(36) NOT NULL,
    question_id   bigint NOT NULL,
    user_id       bigint NOT NULL,
    content       text NOT NULL,
    plain_content text NOT NULL,
    video_url     varchar(500),
    CONSTRAINT fk_forum_answers_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_forum_questions_answers FOREIGN KEY (question_id) REFERENCES forum_questions (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_answers_public_id ON forum_answers (public_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_question_id ON forum_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_user_id ON forum_answers (user_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_deleted_at ON forum_answers (deleted_at);
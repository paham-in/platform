CREATE TABLE IF NOT EXISTS quiz_answers (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    public_id   varchar(36) NOT NULL,
    question_id bigint NOT NULL,
    content     text NOT NULL,
    is_correct  boolean NOT NULL DEFAULT false,
    sort_order  bigint NOT NULL DEFAULT 0,
    CONSTRAINT fk_quiz_questions_answers FOREIGN KEY (question_id) REFERENCES quiz_questions (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_answers_public_id ON quiz_answers (public_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_deleted_at ON quiz_answers (deleted_at);
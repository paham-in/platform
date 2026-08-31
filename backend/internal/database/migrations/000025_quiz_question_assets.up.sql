CREATE TABLE IF NOT EXISTS quiz_question_assets (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    question_id bigint NOT NULL,
    object_name varchar(255) NOT NULL,
    CONSTRAINT fk_quiz_question_assets_question FOREIGN KEY (question_id) REFERENCES quiz_questions (id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_question_assets_question_id ON quiz_question_assets (question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_assets_deleted_at ON quiz_question_assets (deleted_at);
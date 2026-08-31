CREATE TABLE IF NOT EXISTS quiz_questions (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    public_id   varchar(36) NOT NULL,
    user_id     bigint NOT NULL,
    package_id  bigint NOT NULL,
    question    text NOT NULL,
    explanation text,
    CONSTRAINT fk_quiz_packages_questions FOREIGN KEY (package_id) REFERENCES quiz_packages (id),
    CONSTRAINT fk_quiz_questions_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_questions_public_id ON quiz_questions (public_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_package_id ON quiz_questions (package_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_user_id ON quiz_questions (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_deleted_at ON quiz_questions (deleted_at);
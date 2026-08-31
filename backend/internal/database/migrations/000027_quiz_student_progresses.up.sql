CREATE TABLE IF NOT EXISTS quiz_student_progresses (
    id                 bigserial PRIMARY KEY,
    created_at         timestamptz,
    updated_at         timestamptz,
    deleted_at         timestamptz,
    user_id            bigint NOT NULL,
    package_id         bigint NOT NULL,
    question_id        bigint NOT NULL,
    is_correct         boolean NOT NULL DEFAULT false,
    selected_answer_id bigint NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_student_progresses_user_id ON quiz_student_progresses (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_student_progresses_package_id ON quiz_student_progresses (package_id);
CREATE INDEX IF NOT EXISTS idx_quiz_student_progresses_question_id ON quiz_student_progresses (question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_student_progresses_deleted_at ON quiz_student_progresses (deleted_at);
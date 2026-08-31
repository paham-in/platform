CREATE TABLE IF NOT EXISTS teacher_subjects (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    user_id    bigint NOT NULL,
    subject_id bigint NOT NULL,
    CONSTRAINT fk_teacher_subjects_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_teacher_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_subject ON teacher_subjects (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_user_id ON teacher_subjects (user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_id ON teacher_subjects (subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_deleted_at ON teacher_subjects (deleted_at);
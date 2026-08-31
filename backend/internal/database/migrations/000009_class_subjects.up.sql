CREATE TABLE IF NOT EXISTS class_subjects (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    class_id   bigint NOT NULL,
    subject_id bigint NOT NULL,
    CONSTRAINT fk_class_subjects_class FOREIGN KEY (class_id) REFERENCES classes (id),
    CONSTRAINT fk_class_subjects_subject FOREIGN KEY (subject_id) REFERENCES subjects (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_class_subject ON class_subjects (class_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects (class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects (subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_deleted_at ON class_subjects (deleted_at);
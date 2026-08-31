CREATE TABLE IF NOT EXISTS student_class_enrollments (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    user_id    bigint NOT NULL,
    class_id   bigint NOT NULL,
    expiry     varchar(10) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_class_enrollments_user_id ON student_class_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_student_class_enrollments_class_id ON student_class_enrollments (class_id);
CREATE INDEX IF NOT EXISTS idx_student_class_enrollments_deleted_at ON student_class_enrollments (deleted_at);
CREATE TABLE IF NOT EXISTS bookings (
    id            bigserial PRIMARY KEY,
    created_at    timestamptz,
    updated_at    timestamptz,
    deleted_at    timestamptz,
    public_id     varchar(36) NOT NULL,
    teacher_id    bigint,
    student_id    bigint NOT NULL,
    subject_id    bigint NOT NULL DEFAULT 0,
    date          varchar(10) NOT NULL,
    start_time    varchar(5) NOT NULL,
    end_time      varchar(5) NOT NULL,
    status        varchar(20) DEFAULT 'pending',
    mode          varchar(20) DEFAULT 'private',
    session_count bigint NOT NULL DEFAULT 1,
    group_token   varchar(64),
    note          varchar(500),
    class_id      bigint,
    CONSTRAINT fk_bookings_student FOREIGN KEY (student_id) REFERENCES users (id),
    CONSTRAINT fk_bookings_subject FOREIGN KEY (subject_id) REFERENCES subjects (id),
    CONSTRAINT fk_bookings_teacher FOREIGN KEY (teacher_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_public_id ON bookings (public_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON bookings (student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_subject_id ON bookings (subject_id);
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id ON bookings (teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_group_token ON bookings (group_token);
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings (class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_deleted_at ON bookings (deleted_at);
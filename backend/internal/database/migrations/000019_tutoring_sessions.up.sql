CREATE TABLE IF NOT EXISTS tutoring_sessions (
    id           bigserial PRIMARY KEY,
    created_at   timestamptz,
    updated_at   timestamptz,
    deleted_at   timestamptz,
    public_id    varchar(36) NOT NULL,
    booking_id   bigint NOT NULL,
    date         varchar(10) NOT NULL,
    start_time   varchar(5) NOT NULL,
    end_time     varchar(5) NOT NULL,
    status       varchar(20) DEFAULT 'scheduled',
    evidence_url varchar(500),
    fee_paid     boolean DEFAULT false,
    fee_taken    boolean DEFAULT false,
    CONSTRAINT fk_bookings_sessions FOREIGN KEY (booking_id) REFERENCES bookings (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tutoring_sessions_public_id ON tutoring_sessions (public_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_booking_id ON tutoring_sessions (booking_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_deleted_at ON tutoring_sessions (deleted_at);
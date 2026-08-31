CREATE TABLE IF NOT EXISTS invoices (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    public_id  varchar(36) NOT NULL,
    user_id    bigint NOT NULL,
    amount     numeric NOT NULL,
    start_date varchar(10) NOT NULL,
    end_date   varchar(10) NOT NULL,
    status     varchar(20) DEFAULT 'pending',
    note       varchar(500),
    class_id   bigint,
    booking_id bigint,
    CONSTRAINT fk_invoices_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_bookings_invoice FOREIGN KEY (booking_id) REFERENCES bookings (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_public_id ON invoices (public_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_class_id ON invoices (class_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices (booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_deleted_at ON invoices (deleted_at);
CREATE TABLE IF NOT EXISTS notifications (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    public_id  varchar(36) NOT NULL,
    user_id    bigint NOT NULL,
    title      varchar(255) NOT NULL,
    body       text NOT NULL,
    type       varchar(50) NOT NULL,
    url        varchar(500) NOT NULL DEFAULT '',
    is_read    boolean NOT NULL DEFAULT false,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_public_id ON notifications (public_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications (deleted_at);
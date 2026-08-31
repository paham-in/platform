CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    user_id    bigint NOT NULL,
    endpoint   text NOT NULL,
    keys_p256  text NOT NULL,
    keys_auth  text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uni_push_subscriptions_endpoint ON push_subscriptions (endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_deleted_at ON push_subscriptions (deleted_at);
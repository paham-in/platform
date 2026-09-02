-- Rollback: kembali ke unique global pada endpoint.
DROP INDEX IF EXISTS uni_push_subscriptions_user_endpoint;

CREATE UNIQUE INDEX IF NOT EXISTS uni_push_subscriptions_endpoint
    ON push_subscriptions (endpoint);

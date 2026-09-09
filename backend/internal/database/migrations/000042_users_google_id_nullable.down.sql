DROP INDEX IF EXISTS idx_users_google_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);

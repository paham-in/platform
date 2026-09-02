-- Satu endpoint (perangkat/browser) bisa dipakai oleh akun berbeda secara
-- bergantian (login user A lalu logout, login user B di perangkat yang sama).
-- Unique global pada `endpoint` membuat reassign ownership gagal dengan
-- duplicate key. Ganti jadi unique komposit (user_id, endpoint).

-- Index lama dibuat sebagai CONSTRAINT (dari label unique pada model gorm).
-- Constraint ini harus di-drop via ALTER TABLE ... DROP CONSTRAINT, bukan
-- DROP INDEX (Postgres menolak DROP INDEX untuk constraint).
ALTER TABLE IF EXISTS push_subscriptions DROP CONSTRAINT IF EXISTS uni_push_subscriptions_endpoint;

-- Jaga-jaga kalau ternyata wujudnya index standalone (bukan constraint).
DROP INDEX IF EXISTS uni_push_subscriptions_endpoint CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS uni_push_subscriptions_user_endpoint
    ON push_subscriptions (user_id, endpoint);

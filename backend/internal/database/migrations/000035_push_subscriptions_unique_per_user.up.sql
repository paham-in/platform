-- Satu endpoint (perangkat/browser) bisa dipakai oleh akun berbeda secara
-- bergantian (login user A lalu logout, login user B di perangkat yang sama).
-- Unique global pada `endpoint` membuat reassign ownership gagal dengan
-- duplicate key. Ganti jadi unique komposit (user_id, endpoint).

DROP INDEX IF EXISTS uni_push_subscriptions_endpoint;

CREATE UNIQUE INDEX IF NOT EXISTS uni_push_subscriptions_user_endpoint
    ON push_subscriptions (user_id, endpoint);

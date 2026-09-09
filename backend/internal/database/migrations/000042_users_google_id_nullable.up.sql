-- google_id string kosong ('') ikut unique index global sehingga akun
-- non-Google kedua dst gagal create (duplicate key). Ubah jadi NULL yang
-- boleh banyak + partial unique index (nilai isi tetap unik).
UPDATE users SET google_id = NULL WHERE google_id = '';

DROP INDEX IF EXISTS idx_users_google_id;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;

-- Rollback: hapus guru per sesi. Catatan: riwayat alihkan guru ikut hilang
-- (sesi kembali ikut guru booking), jadi rollback hanya untuk darurat.
UPDATE tutoring_sessions SET teacher_id = NULL;
ALTER TABLE IF EXISTS tutoring_sessions DROP COLUMN IF EXISTS teacher_id;

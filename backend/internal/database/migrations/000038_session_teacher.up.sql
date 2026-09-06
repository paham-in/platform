-- Guru per sesi: 1 booking bisa ganti guru di tengah jalan (alihkan permanen
-- atau ganti 1 sesi). teacher_id di bookings = guru saat ini (penanggung jawab
-- ke depan); teacher_id di sini = guru yang mengerjakan sesi itu (fakta sejarah,
-- dipakai kepemilikan, cek bentrok & fee). Tanpa kolom ini, alihkan booking
-- akan menggeser fee sesi lama ke guru baru (salah bayar).
ALTER TABLE IF EXISTS tutoring_sessions ADD COLUMN IF NOT EXISTS teacher_id bigint;
DROP INDEX IF EXISTS idx_tutoring_sessions_teacher_id;
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_teacher_id ON tutoring_sessions (teacher_id);

-- Backfill: semua sesi lama ikut guru booking-nya (riwayat tidak berubah makna).
UPDATE tutoring_sessions s SET teacher_id = b.teacher_id
FROM bookings b WHERE s.booking_id = b.id AND s.teacher_id IS NULL;

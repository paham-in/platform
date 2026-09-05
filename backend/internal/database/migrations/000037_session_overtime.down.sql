-- Rollback: hapus kolom overtime sesi les.
ALTER TABLE IF EXISTS tutoring_sessions DROP COLUMN IF EXISTS extra_sessions;
ALTER TABLE IF EXISTS tutoring_sessions DROP COLUMN IF EXISTS overtime_minutes;
ALTER TABLE IF EXISTS tutoring_sessions DROP COLUMN IF EXISTS actual_end_time;

-- Overtime sesi les: guru melaporkan jam selesai aktual saat upload bukti
-- kehadiran. overtime_minutes & extra_sessions dihitung backend dari selisih
-- actual_end_time terhadap end_time terjadwal (toleransi 15 menit, selebihnya
-- dibulatkan ke atas per blok 90 menit).
ALTER TABLE IF EXISTS tutoring_sessions ADD COLUMN IF NOT EXISTS actual_end_time varchar(5);
ALTER TABLE IF EXISTS tutoring_sessions ADD COLUMN IF NOT EXISTS overtime_minutes integer NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS tutoring_sessions ADD COLUMN IF NOT EXISTS extra_sessions integer NOT NULL DEFAULT 0;

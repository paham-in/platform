-- Rollback: hapus penanda organizer booking grup.
ALTER TABLE IF EXISTS bookings DROP COLUMN IF EXISTS is_organizer;

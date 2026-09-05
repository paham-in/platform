-- Penanda organizer booking grup. Satu booking grup = N baris bookings dengan
-- group_token yang sama; sebelumnya tidak ada penanda baris mana pembuatnya,
-- sehingga aturan "hanya pembuat grup yang boleh mengubah jadwal grup" tidak
-- bisa ditegakkan. Baris private tidak butuh penanda (aturan kode memakai mode).
ALTER TABLE IF EXISTS bookings ADD COLUMN IF NOT EXISTS is_organizer boolean NOT NULL DEFAULT false;

-- Backfill: organizer = baris pertama (id terkecil) tiap group_token.
-- Urutan create di semua jalur grup (murid, tanpa guru, admin) selalu
-- organizer dulu baru anggota, jadi MIN(id) tepat menunjuk organizer.
UPDATE bookings SET is_organizer = true WHERE id IN (
    SELECT MIN(id) FROM bookings
    WHERE group_token IS NOT NULL AND group_token <> ''
    GROUP BY group_token
);

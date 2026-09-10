-- Klaim refund per sesi: tiap sesi batal dari invoice lunas melahirkan satu
-- baris utang (platform → murid) yang hidup-mati sendiri. Menggantikan pola
-- lama refund_amount absolut di invoices (sumber bug K5: angka ditimpa tapi
-- flag done tidak ikut → cron hapus utang belum dibayar).
-- session_id UNIQUE (partial, abaikan soft-delete): satu sesi = satu klaim,
-- reconcile cukup find-or-create tanpa pernah menimpa.
-- Kolom refund_amount/refund_done di invoices DIBEKUKAN (berhenti ditulis,
-- tetap dibaca sebagai arsip); drop fisik dijadwalkan migrasi susulan.
CREATE TABLE IF NOT EXISTS refund_claims (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    public_id   varchar(36) NOT NULL,
    invoice_id  bigint NOT NULL,
    booking_id  bigint NOT NULL,
    session_id  bigint,
    amount      numeric NOT NULL,
    done        boolean NOT NULL DEFAULT false,
    note        varchar(500),
    CONSTRAINT fk_refund_claims_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    CONSTRAINT fk_refund_claims_booking FOREIGN KEY (booking_id) REFERENCES bookings (id),
    CONSTRAINT fk_refund_claims_session FOREIGN KEY (session_id) REFERENCES tutoring_sessions (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_claims_public_id ON refund_claims (public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_refund_claims_session_id ON refund_claims (session_id) WHERE session_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_refund_claims_invoice_id ON refund_claims (invoice_id);
CREATE INDEX IF NOT EXISTS idx_refund_claims_booking_id ON refund_claims (booking_id);

-- Backfill: satu klaim agregat per invoice yang punya refund.
-- Status apa pun (invoice lunas yang di-toggle pending tetap menampilkan
-- angka beku) — session_id NULL karena tak bisa direkonstruksi per sesi.
-- Hanya invoice booking (refund langganan tidak ada). Admin verifikasi sekali.
-- public_id backfill pakai md5 (tanpa ekstensi, jalan di semua versi PG).
INSERT INTO refund_claims (created_at, updated_at, public_id, invoice_id, booking_id, session_id, amount, done, note)
SELECT now(), now(), md5('refund-migrasi-' || i.id::text), i.id, i.booking_id, NULL, i.refund_amount, i.refund_done, 'Saldo migrasi dari refund invoice'
FROM invoices i
WHERE i.refund_amount > 0 AND i.booking_id IS NOT NULL AND i.deleted_at IS NULL;

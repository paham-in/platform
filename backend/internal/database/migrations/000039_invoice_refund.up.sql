-- Refund invoice: potongan tercatat tanpa mengubah nominal tagihan.
-- refund_amount = nominal yang harus kembali ke murid (dihitung otomatis tiap
-- ada sesi dibatalkan; transfernya manual di luar aplikasi).
-- refund_done = penanda admin sudah mentransfer refund tersebut.
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS refund_amount double precision NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS refund_done boolean NOT NULL DEFAULT false;

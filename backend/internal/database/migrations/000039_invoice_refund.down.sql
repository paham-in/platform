-- Rollback: hapus kolom refund invoice.
ALTER TABLE IF EXISTS invoices DROP COLUMN IF EXISTS refund_done;
ALTER TABLE IF EXISTS invoices DROP COLUMN IF EXISTS refund_amount;

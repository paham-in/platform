-- Rollback: hapus tabel klaim. Kolom beku refund_amount/refund_done di
-- invoices tetap ada (tak pernah di-drop), jadi baca lama langsung jalan lagi.
DROP TABLE IF EXISTS refund_claims;

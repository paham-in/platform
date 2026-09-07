ALTER TABLE invoices
  ADD CONSTRAINT invoices_owner_check
  CHECK (booking_id IS NOT NULL OR class_id IS NOT NULL);

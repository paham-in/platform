package jobs

import (
	"context"
	"log"
	"time"

	"bimbel2/backend/internal/paymentproof"
	"bimbel2/backend/internal/storage"
	"bimbel2/backend/internal/tutoring"
	"bimbel2/backend/internal/user"

	"gorm.io/gorm"
)

// Runner membungkus background job yang berjalan di server. Dipakai dua
// cara: Start* meluncurkan goroutine berkala (cron), method yang sama
// dipanggil manual lewat endpoint admin untuk debug.
type Runner struct {
	sessionRepo       *user.SessionRepository
	tutoringRepo      *tutoring.Repository
	paymentProofRepo  *paymentproof.Repository
	objectStorage     *storage.ObjectStorage
	retentionDays     int
}

func New(db *gorm.DB, objectStorage *storage.ObjectStorage, retentionDays int) *Runner {
	return &Runner{
		sessionRepo:      user.NewSessionRepository(db),
		tutoringRepo:     tutoring.NewRepository(db),
		paymentProofRepo: paymentproof.NewRepository(db),
		objectStorage:    objectStorage,
		retentionDays:    retentionDays,
	}
}

// SessionCleanup menghapus sesi yang sudah kedaluwarsa. Mengembalikan jumlah
// sesi yang dihapus.
func (r *Runner) SessionCleanup() (int64, error) {
	return r.sessionRepo.DeleteExpired(time.Now())
}

// EvidenceCleanup menghapus bukti kehadiran approved yang melewati masa simpan
// dari storage, lalu mengosongkan kolom evidence_url. Mengembalikan jumlah
// bukti yang berhasil dihapus.
func (r *Runner) EvidenceCleanup() (int, error) {
	if r.objectStorage == nil {
		log.Println("[evidence-cleanup] storage tidak tersedia — cleanup dilewati")
		return 0, nil
	}
	cutoff := time.Now().AddDate(0, 0, -r.retentionDays)
	sessions, err := r.tutoringRepo.ListApprovedEvidenceOlderThan(cutoff)
	if err != nil {
		log.Printf("[evidence-cleanup] gagal query: %v", err)
		return 0, err
	}
	deleted := 0
	for _, s := range sessions {
		if err := r.objectStorage.Delete(context.Background(), s.EvidenceURL); err != nil {
			log.Printf("[evidence-cleanup] gagal hapus %s: %v", s.EvidenceURL, err)
			continue
		}
		if err := r.tutoringRepo.ClearSessionEvidence(s.ID); err != nil {
			log.Printf("[evidence-cleanup] gagal kosongkan evidence sesi %d: %v", s.ID, err)
			continue
		}
		deleted++
		log.Printf("[evidence-cleanup] bukti sesi %d dihapus", s.ID)
	}
	return deleted, nil
}

// StartSessionCleanup menjalankan cleanup sesi sekali saat boot, lalu tiap 1 jam.
func (r *Runner) StartSessionCleanup() {
	go func() {
		r.runSessionCleanup()
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			r.runSessionCleanup()
		}
	}()
}

func (r *Runner) runSessionCleanup() {
	deleted, err := r.SessionCleanup()
	if err != nil {
		log.Printf("[session-cleanup] gagal hapus sesi expired: %v", err)
		return
	}
	if deleted > 0 {
		log.Printf("[session-cleanup] %d sesi kedaluwarsa dihapus", deleted)
	}
}

// StartEvidenceCleanup menjalankan cleanup bukti pertama saat tengah malam
// berikutnya, lalu tiap 24 jam.
func (r *Runner) StartEvidenceCleanup() {
	if r.objectStorage == nil {
		log.Println("[evidence-cleanup] storage tidak tersedia — cleanup dilewati")
		return
	}
	go func() {
		now := time.Now()
		next := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, 1)
		time.Sleep(time.Until(next))
		for {
			r.EvidenceCleanup()
			time.Sleep(24 * time.Hour)
		}
	}()
}

// PaymentProofCleanup menghapus bukti pembayaran yang sudah di-approve dan
// melewati masa simpan dari storage, lalu hapus row DB-nya.
// Dipicu tiap tengah malam lewat StartPaymentProofCleanup, atau manual lewat
// endpoint devreset /admin/dev/cron/payment-proof-cleanup.
func (r *Runner) PaymentProofCleanup() (int, error) {
	if r.objectStorage == nil {
		log.Println("[payment-proof-cleanup] storage tidak tersedia — cleanup dilewati")
		return 0, nil
	}
	cutoff := time.Now().AddDate(0, 0, -r.retentionDays)
	proofs, err := r.paymentProofRepo.ListApprovedOlderThan(cutoff)
	if err != nil {
		log.Printf("[payment-proof-cleanup] gagal query: %v", err)
		return 0, err
	}
	deleted := 0
	for _, p := range proofs {
		if err := r.objectStorage.Delete(context.Background(), p.ObjectName); err != nil {
			log.Printf("[payment-proof-cleanup] gagal hapus %s: %v", p.ObjectName, err)
			continue
		}
		if err := r.paymentProofRepo.Delete(p.ID); err != nil {
			log.Printf("[payment-proof-cleanup] gagal hapus DB proof %d: %v", p.ID, err)
			continue
		}
		deleted++
		log.Printf("[payment-proof-cleanup] proof %d (invoice %d) dihapus", p.ID, p.InvoiceID)
	}
	return deleted, nil
}

// StartPaymentProofCleanup menjalankan cleanup pertama saat tengah malam
// berikutnya, lalu tiap 24 jam. Pola sama persis dengan StartEvidenceCleanup.
func (r *Runner) StartPaymentProofCleanup() {
	if r.objectStorage == nil {
		log.Println("[payment-proof-cleanup] storage tidak tersedia — cleanup dilewati")
		return
	}
	go func() {
		now := time.Now()
		next := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location()).AddDate(0, 0, 1)
		time.Sleep(time.Until(next))
		for {
			r.PaymentProofCleanup()
			time.Sleep(24 * time.Hour)
		}
	}()
}

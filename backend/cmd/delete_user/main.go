package main

import (
	"errors"
	"fmt"
	"log"
	"os"

	"gorm.io/gorm"

	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/database"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/user"
)

func main() {
	email := "rizaldwianggoro@student.uns.ac.id"
	if len(os.Args) > 1 {
		email = os.Args[1]
	}

	cfg := config.Load()
	db := database.Connect(cfg)

	// cari user by email (termasuk yang sudah soft-delete?)
	var u models.User
	err := db.Preload("Roles").Where("email = ?", email).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		fmt.Printf("User dengan email %q tidak ditemukan — tidak ada yang dihapus.\n", email)
		return
	}
	if err != nil {
		log.Fatalf("Gagal mencari user: %v", err)
	}

	fmt.Printf("Ditemukan: ID=%d, Name=%q, Email=%q, Roles=%v\n", u.ID, u.Name, u.Email, roleNames(u))

	cleanupUser(db, u.ID)

	// hapus via repository — hard delete untuk non-teacher, soft delete untuk teacher.
	// Semua child sudah di-cleanup di atas, jadi hardDelete jalan bersih.
	userRepo := user.NewUserRepository(db)
	if err := userRepo.Delete(u.ID); err != nil {
		log.Fatalf("Gagal menghapus user: %v", err)
	}
	fmt.Println("User berhasil dihapus.")
}

// cleanupUser menghapus hard semua data yang merujuk user. Dilakukan manual di sini
// karena UserRepository.hardDelete memakai pluck tanpa Unscoped, sehingga baris yang
// soft-deleted terlewat dan FK (tutoring_sessions, question_images, dll) memblokir.
func cleanupUser(db *gorm.DB, id uint) {
	// booking user → sesi + invoice per booking
	var bookingIDs []uint
	db.Unscoped().Model(&models.Booking{}).Where("student_id = ? OR teacher_id = ?", id, id).Pluck("id", &bookingIDs)
	if len(bookingIDs) > 0 {
		db.Unscoped().Where("booking_id IN ?", bookingIDs).Delete(&models.TutoringSession{})
		db.Unscoped().Where("booking_id IN ?", bookingIDs).Delete(&models.Invoice{})
	}
	db.Unscoped().Where("student_id = ? OR teacher_id = ?", id, id).Delete(&models.Booking{})

	// pertanyaan milik user → gambar + jawabannya
	var qids []uint
	db.Unscoped().Model(&models.ForumQuestion{}).Where("user_id = ?", id).Pluck("id", &qids)
	if len(qids) > 0 {
		db.Unscoped().Where("question_id IN ?", qids).Delete(&models.ForumQuestionImage{})
		db.Unscoped().Where("question_id IN ?", qids).Delete(&models.ForumAnswer{})
	}
	db.Unscoped().Where("user_id = ?", id).Delete(&models.ForumQuestion{})
	db.Unscoped().Where("user_id = ?", id).Delete(&models.ForumAnswer{})

	// bank soal milik user → jawabannya
	var pqids []uint
	db.Unscoped().Model(&models.QuizQuestion{}).Where("user_id = ?", id).Pluck("id", &pqids)
	if len(pqids) > 0 {
		db.Unscoped().Where("question_id IN ?", pqids).Delete(&models.QuizAnswer{})
	}
	db.Unscoped().Where("user_id = ?", id).Delete(&models.QuizQuestion{})

	// sisa referensi langsung
	db.Unscoped().Where("user_id = ?", id).Delete(&models.Session{})
	db.Unscoped().Where("user_id = ?", id).Delete(&models.TeacherSubject{})
	db.Unscoped().Where("user_id = ?", id).Delete(&models.SubjectImage{})
	db.Unscoped().Where("user_id = ?", id).Delete(&models.PushSubscription{})
	db.Unscoped().Where("user_id = ?", id).Delete(&models.Invoice{})
	db.Unscoped().Where("user_id = ?", id).Delete(&models.StudentClass{})
	db.Unscoped().Where("teacher_id = ?", id).Delete(&models.Availability{})
	db.Unscoped().Where("author_id = ?", id).Delete(&models.Material{})
}

func roleNames(u models.User) []string {
	names := make([]string, len(u.Roles))
	for i, r := range u.Roles {
		names[i] = r.Name
	}
	return names
}

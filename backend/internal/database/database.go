package database

import (
	"fmt"
	"log"

	"errors"

	"bimbel2/backend/internal/config"
	"bimbel2/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPass, cfg.DBName,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected")
	return db
}

func Migrate(db *gorm.DB) {
	// clean up orphaned subject_images before AutoMigrate (FK constraint)
	db.Exec("DELETE FROM subject_images WHERE user_id NOT IN (SELECT id FROM users)")

	// clean up orphaned questionbank data before AutoMigrate (FK constraint):
	// row lama ber-`package_id` tidak valid (mis. 0 dari default kolom) akan
	// memblokir pembuatan constraint FK dan menghentikan AutoMigrate. Hapus
	// jawaban anak dulu, baru soal (FK fk_questionbank_questions_answers).
	db.Exec("DELETE FROM questionbank_answers WHERE question_id IN (SELECT id FROM questionbank_questions WHERE package_id NOT IN (SELECT id FROM question_packages))")
	db.Exec("DELETE FROM questionbank_questions WHERE package_id NOT IN (SELECT id FROM question_packages)")

	// migrasi rename: question_package_groups → question_package_collections,
	// kolom group_id → collection_id di question_packages. Idempotent — lewati
	// kalau tabel/kolom baru sudah ada (rename sekali saja, lalu AutoMigrate lanjut).
	if db.Migrator().HasTable("question_package_groups") && !db.Migrator().HasTable("question_package_collections") {
		db.Exec("ALTER TABLE question_package_groups RENAME TO question_package_collections")
		db.Exec("ALTER INDEX IF EXISTS idx_question_package_groups_class_id RENAME TO idx_question_package_collections_class_id")
		log.Println("Renamed table question_package_groups → question_package_collections")
	}
	if db.Migrator().HasColumn(&models.QuestionPackage{}, "group_id") && !db.Migrator().HasColumn(&models.QuestionPackage{}, "collection_id") {
		db.Exec("ALTER TABLE question_packages RENAME COLUMN group_id TO collection_id")
		log.Println("Renamed column question_packages.group_id → collection_id")
	}

	db.AutoMigrate(&models.User{}, &models.Session{}, &models.Class{}, &models.Subject{}, &models.ClassSubject{}, &models.Chapter{}, &models.Material{}, &models.Question{}, &models.Answer{}, &models.QuestionImage{}, &models.SubjectImage{}, &models.Invoice{}, &models.PaymentProof{}, &models.Availability{}, &models.Booking{}, &models.TutoringSession{}, &models.Role{}, &models.QuestionbankQuestion{}, &models.QuestionbankAnswer{}, &models.QuestionPackageCollection{}, &models.QuestionPackage{}, &models.TeacherSubject{}, &models.PushSubscription{}, &models.Program{}, &models.StudentClass{}, &models.Setting{})

	// seed default roles (role "user" dihapus — semua pendaftar otomatis student)
	for _, name := range []string{"student", "teacher", "admin"} {
		var role models.Role
		if err := db.Where("name = ?", name).First(&role).Error; err != nil {
			db.Create(&models.Role{Name: name})
		}
	}

	// hapus role "user" dari semua yang punya (jika masih ada di DB lama)
	var userRole models.Role
	if err := db.Where("name = ?", "user").First(&userRole).Error; err == nil {
		// lepaskan semua user dari role "user"
		db.Exec("DELETE FROM user_roles WHERE role_id = ?", userRole.ID)
		db.Delete(&userRole)
		log.Println("Removed role 'user' from database")
	}

	// migrasi: user yang role-nya *hanya* "student" sudah OK.
	// user roleless → assign student. (user yang sebelumnya punya role "user"
	// sudah di-hapus sehingga jadi roleless di sini → dapat student.)
	var roleless []models.User
	db.Preload("Roles").Where("id NOT IN (SELECT user_id FROM user_roles)").Find(&roleless)
	if len(roleless) > 0 {
		var studentRole models.Role
		db.Where("name = ?", "student").First(&studentRole)
		for i := range roleless {
			db.Model(&roleless[i]).Association("Roles").Append(&studentRole)
		}
		log.Printf("Assigned default role to %d existing users\n", len(roleless))
	}

	// migrate existing chapters table -- add class_id column
	if !db.Migrator().HasColumn(&models.Chapter{}, "class_id") {
		db.Exec("ALTER TABLE chapters ADD COLUMN class_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_chapters_class_id ON chapters(class_id)")
	}

	// migrate unique index -- from slug-only to composite (class_id, subject_id, slug)
	if db.Migrator().HasIndex(&models.Chapter{}, "idx_chapters_slug") {
		db.Migrator().DropIndex(&models.Chapter{}, "idx_chapters_slug")
	}

	// hard-delete soft-deleted rows to avoid slug unique constraint conflicts
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Chapter{})
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Subject{})
	db.Unscoped().Where("deleted_at IS NOT NULL").Delete(&models.Material{})

	// migrate existing materials table -- add chapter_id, fix old subject_id
	if !db.Migrator().HasColumn(&models.Material{}, "chapter_id") {
		db.Exec("ALTER TABLE materials ADD COLUMN chapter_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_materials_chapter_id ON materials(chapter_id)")
	}
	if db.Migrator().HasColumn(&models.Material{}, "subject_id") {
		db.Exec("ALTER TABLE materials DROP COLUMN subject_id")
	}
	if !db.Migrator().HasColumn(&models.Material{}, "author_id") {
		db.Exec("ALTER TABLE materials ADD COLUMN author_id BIGINT NOT NULL DEFAULT 0")
	}

	// migrate existing users -- add payment_status
	if !db.Migrator().HasColumn(&models.User{}, "payment_status") {
		db.Exec("ALTER TABLE users ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'")
	}

	// migrate content -- add is_free flag (default true = konten existing jadi gratis)
	if !db.Migrator().HasColumn(&models.Material{}, "is_free") {
		db.Exec("ALTER TABLE materials ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT TRUE")
	}
	if !db.Migrator().HasColumn(&models.QuestionPackage{}, "is_free") {
		db.Exec("ALTER TABLE question_packages ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT TRUE")
	}

	// migrate questions -- drop title, add plain_content
	if db.Migrator().HasColumn(&models.Question{}, "title") {
		db.Exec("ALTER TABLE questions DROP COLUMN title")
	}
	if !db.Migrator().HasColumn(&models.Question{}, "plain_content") {
		db.Exec("ALTER TABLE questions ADD COLUMN plain_content TEXT NOT NULL DEFAULT ''")
	}

	// migrate answers -- add video_url
	if !db.Migrator().HasColumn(&models.Answer{}, "video_url") {
		db.Exec("ALTER TABLE answers ADD COLUMN video_url VARCHAR(500) NOT NULL DEFAULT ''")
	}

	// migrate questions -- drop upvotes
	if db.Migrator().HasColumn(&models.Question{}, "upvotes") {
		db.Exec("ALTER TABLE questions DROP COLUMN upvotes")
	}

	// migrate question_images -- drop url column
	if db.Migrator().HasColumn(&models.QuestionImage{}, "url") {
		db.Exec("ALTER TABLE question_images DROP COLUMN url")
	}

	// backfill: pertanyaan open yang sudah punya jawaban → status answered
	db.Exec(`UPDATE questions SET status = 'answered'
		WHERE status = 'open'
		AND id IN (SELECT DISTINCT question_id FROM answers WHERE deleted_at IS NULL)`)

	// migrate subject_images -- add user_id column
	if !db.Migrator().HasColumn(&models.SubjectImage{}, "user_id") {
		db.Exec("ALTER TABLE subject_images ADD COLUMN user_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_subject_images_user_id ON subject_images(user_id)")
	}

	// migrate classes -- drop description column (tidak dipakai)
	if db.Migrator().HasColumn(&models.Class{}, "description") {
		db.Exec("ALTER TABLE classes DROP COLUMN description")
	}

	// migrate subjects -- drop description column (tidak dipakai)
	if db.Migrator().HasColumn(&models.Subject{}, "description") {
		db.Exec("ALTER TABLE subjects DROP COLUMN description")
	}

	// migrate questionbank_questions -- pindah dari chapter ke paket soal
	if !db.Migrator().HasColumn(&models.QuestionbankQuestion{}, "package_id") {
		db.Exec("ALTER TABLE questionbank_questions ADD COLUMN package_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_questionbank_questions_package_id ON questionbank_questions(package_id)")
	}
	if db.Migrator().HasColumn(&models.QuestionbankQuestion{}, "chapter_id") {
		db.Exec("ALTER TABLE questionbank_questions DROP COLUMN chapter_id")
	}

	// tabel join many2many tidak dipakai lagi (soal dimiliki paket)
	if db.Migrator().HasTable("package_questions") {
		db.Migrator().DropTable("package_questions")
	}

	// migrasi: program + student_classes (buat eksplisit lewat Migrator
	// agar tak bergantung AutoMigrate global yang bisa gagal di mid-cycle).
	if !db.Migrator().HasTable(&models.Program{}) {
		db.Migrator().CreateTable(&models.Program{})
	}
	if !db.Migrator().HasTable(&models.StudentClass{}) {
		db.Migrator().CreateTable(&models.StudentClass{})
	}

	// migrasi: classes tambah harga les privat per kelas
	if !db.Migrator().HasColumn(&models.Class{}, "price_per_session") {
		db.Exec("ALTER TABLE classes ADD COLUMN price_per_session DECIMAL(12,2) NOT NULL DEFAULT 0")
		db.Exec("ALTER TABLE classes ADD COLUMN semi_private_price DECIMAL(12,2) NOT NULL DEFAULT 0")
	}

	// migrasi: classes tambah program_id; invoices ganti program_id → class_id
	if !db.Migrator().HasColumn(&models.Class{}, "program_id") {
		db.Exec("ALTER TABLE classes ADD COLUMN program_id BIGINT DEFAULT NULL")
		db.Exec("CREATE INDEX idx_classes_program_id ON classes(program_id)")
	}
	if db.Migrator().HasColumn(&models.Invoice{}, "program_id") {
		db.Exec("ALTER TABLE invoices DROP COLUMN program_id")
	}
	if !db.Migrator().HasColumn(&models.Invoice{}, "class_id") {
		db.Exec("ALTER TABLE invoices ADD COLUMN class_id BIGINT DEFAULT NULL")
		db.Exec("CREATE INDEX idx_invoices_class_id ON invoices(class_id)")
	}

	// backfill: student_programs (per-program) → student_classes (per-kelas).
	// Akses program lama → grant ke semua kelas dalam program itu. Idempoten.
	if db.Migrator().HasTable("student_programs") {
		type oldSP struct {
			UserID    uint
			ProgramID uint
			Expiry    string
		}
		var rows []oldSP
		db.Table("student_programs").Find(&rows)
		for _, r := range rows {
			var classIDs []uint
			db.Model(&models.Class{}).Where("program_id = ?", r.ProgramID).Pluck("id", &classIDs)
			for _, cid := range classIDs {
				var sc models.StudentClass
				err := db.Where("user_id = ? AND class_id = ?", r.UserID, cid).First(&sc).Error
				if errors.Is(err, gorm.ErrRecordNotFound) {
					db.Create(&models.StudentClass{UserID: r.UserID, ClassID: cid, Expiry: r.Expiry})
				}
			}
		}
		db.Migrator().DropTable("student_programs")
		log.Println("Migrated student_programs → student_classes")
	}

	// seed program default "Sekolah" bila belum ada
	var program models.Program
	if err := db.Where("slug = ?", "sekolah").First(&program).Error; err != nil {
		db.Create(&models.Program{Name: "Sekolah", Slug: "sekolah", Desc: "Program belajar sekolah"})
	}

	// migrasi: subjects tambah program_id (fitur subjek terikat program)
	if !db.Migrator().HasColumn(&models.Subject{}, "program_id") {
		db.Exec("ALTER TABLE subjects ADD COLUMN program_id BIGINT DEFAULT NULL")
		db.Exec("CREATE INDEX idx_subjects_program_id ON subjects(program_id)")
	}
	// backfill: subjek lama tanpa program → program "Sekolah"
	var sekolah models.Program
	if err := db.Where("slug = ?", "sekolah").First(&sekolah).Error; err == nil {
		db.Model(&models.Subject{}).Where("program_id IS NULL").Update("program_id", sekolah.ID)
	}

	log.Println("Migration completed")
}

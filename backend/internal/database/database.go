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
	// migrasi rename: question_package_groups → question_package_collections.
	// Idempotent — lewati kalau tabel baru sudah ada (rename sekali saja, lalu
	// AutoMigrate lanjut). Blok ini harus jalan sebelum rename ke quiz_collections
	// supaya DB lama bisa ter-rename dua tahap dalam satu run.
	if db.Migrator().HasTable("question_package_groups") && !db.Migrator().HasTable("question_package_collections") {
		db.Exec("ALTER TABLE question_package_groups RENAME TO question_package_collections")
		db.Exec("ALTER INDEX IF EXISTS idx_question_package_groups_class_id RENAME TO idx_question_package_collections_class_id")
		log.Println("Renamed table question_package_groups → question_package_collections")
	}

	// migrasi rename: fitur quiz — tabel questionbank_questions/questionbank_answers/
	// question_packages/question_package_collections/student_question_progresses jadi
	// ber-prefix quiz_*. Idempotent — lewati kalau tabel baru sudah ada (rename
	// sekali saja, lalu AutoMigrate lanjut). Postgres otomatis memperbarui FK
	// constraint dan sequence; index di-rename manual biar konsisten.
	if db.Migrator().HasTable("questionbank_questions") && !db.Migrator().HasTable("quiz_questions") {
		db.Exec("ALTER TABLE questionbank_questions RENAME TO quiz_questions")
		db.Exec("ALTER INDEX IF EXISTS idx_questionbank_questions_package_id RENAME TO idx_quiz_questions_package_id")
		log.Println("Renamed table questionbank_questions → quiz_questions")
	}
	if db.Migrator().HasTable("questionbank_answers") && !db.Migrator().HasTable("quiz_answers") {
		db.Exec("ALTER TABLE questionbank_answers RENAME TO quiz_answers")
		log.Println("Renamed table questionbank_answers → quiz_answers")
	}
	if db.Migrator().HasTable("question_packages") && !db.Migrator().HasTable("quiz_packages") {
		db.Exec("ALTER TABLE question_packages RENAME TO quiz_packages")
		log.Println("Renamed table question_packages → quiz_packages")
	}
	if db.Migrator().HasTable("question_package_collections") && !db.Migrator().HasTable("quiz_collections") {
		db.Exec("ALTER TABLE question_package_collections RENAME TO quiz_collections")
		db.Exec("ALTER INDEX IF EXISTS idx_question_package_collections_class_id RENAME TO idx_quiz_collections_class_id")
		log.Println("Renamed table question_package_collections → quiz_collections")
	}
	if db.Migrator().HasTable("student_question_progresses") && !db.Migrator().HasTable("quiz_student_progresses") {
		db.Exec("ALTER TABLE student_question_progresses RENAME TO quiz_student_progresses")
		log.Println("Renamed table student_question_progresses → quiz_student_progresses")
	}

	// clean up orphaned quiz data before AutoMigrate (FK constraint): row lama
	// ber-`package_id` tidak valid (mis. 0 dari default kolom) akan memblokir
	// pembuatan constraint FK dan menghentikan AutoMigrate. Hapus jawaban anak
	// dulu, baru soal (FK quiz_answers.question_id → quiz_questions.id).
	// Jalan setelah rename di atas supaya nama tabel sudah yang baru.
	db.Exec("DELETE FROM quiz_answers WHERE question_id IN (SELECT id FROM quiz_questions WHERE package_id NOT IN (SELECT id FROM quiz_packages))")
	db.Exec("DELETE FROM quiz_questions WHERE package_id NOT IN (SELECT id FROM quiz_packages)")

	// migrasi rename: kolom group_id → collection_id di quiz_packages.
	if db.Migrator().HasColumn(&models.QuizPackage{}, "group_id") && !db.Migrator().HasColumn(&models.QuizPackage{}, "collection_id") {
		db.Exec("ALTER TABLE quiz_packages RENAME COLUMN group_id TO collection_id")
		log.Println("Renamed column quiz_packages.group_id → collection_id")
	}

	// migrasi rename: semi-private → kelompok. Kolom classes.semi_private_price
	// jadi group_price, dan value mode 'semi_private' di bookings jadi 'group'.
	if db.Migrator().HasColumn(&models.Class{}, "semi_private_price") && !db.Migrator().HasColumn(&models.Class{}, "group_price") {
		db.Exec("ALTER TABLE classes RENAME COLUMN semi_private_price TO group_price")
		log.Println("Renamed column classes.semi_private_price → group_price")
	}
	db.Exec("UPDATE bookings SET mode = 'group' WHERE mode = 'semi_private'")

	// migrasi rename: fitur forum — tabel questions/answers/question_images
	// jadi ber-prefix forum_*. Idempotent — lewati kalau tabel baru sudah ada
	// (rename sekali saja, lalu AutoMigrate lanjut). Postgres otomatis
	// memperbarui FK constraint, index, dan sequence yang mereferensikan tabel.
	if db.Migrator().HasTable("questions") && !db.Migrator().HasTable("forum_questions") {
		db.Exec("ALTER TABLE questions RENAME TO forum_questions")
		log.Println("Renamed table questions → forum_questions")
	}
	if db.Migrator().HasTable("answers") && !db.Migrator().HasTable("forum_answers") {
		db.Exec("ALTER TABLE answers RENAME TO forum_answers")
		log.Println("Renamed table answers → forum_answers")
	}

	// migrate content -- add is_free flag SEBELUM AutoMigrate supaya baris existing
	// ikut DEFAULT TRUE (konten lama jadi gratis). Model tidak lagi mendeklarasikan
	// default di tag GORM (kalau default:true, GORM menimpa is_free=false saat Create
	// jadi materi premium tak pernah tersimpan); nilai is_free selalu dikirim eksplisit.
	// AutoMigrate lalu men-sync kolom (DROP DEFAULT di DB) tanpa menyentuh nilai baris.
	if db.Migrator().HasTable(&models.Material{}) && !db.Migrator().HasColumn(&models.Material{}, "is_free") {
		db.Exec("ALTER TABLE materials ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT TRUE")
	}
	if db.Migrator().HasTable(&models.QuizPackage{}) && !db.Migrator().HasColumn(&models.QuizPackage{}, "is_free") {
		db.Exec("ALTER TABLE quiz_packages ADD COLUMN is_free BOOLEAN NOT NULL DEFAULT TRUE")
	}
	// migrate content -- paket soal bisa dibuat draft dulu sebelum dipublish.
	// Baris existing (yang sudah tampil ke murid) ikut DEFAULT 'published' supaya
	// tidak hilang dari tampilan murid; paket baru dibuat draft via service.
	if db.Migrator().HasTable(&models.QuizPackage{}) && !db.Migrator().HasColumn(&models.QuizPackage{}, "status") {
		db.Exec("ALTER TABLE quiz_packages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'published'")
	}

	db.AutoMigrate(&models.User{}, &models.Session{}, &models.Class{}, &models.Subject{}, &models.ClassSubject{}, &models.Chapter{}, &models.Material{}, &models.MaterialAsset{}, &models.ForumQuestion{}, &models.ForumAnswer{}, &models.ForumQuestionAsset{}, &models.ForumAnswerAsset{}, &models.Invoice{}, &models.Booking{}, &models.TutoringSession{}, &models.Role{}, &models.QuizQuestion{}, &models.QuizAnswer{}, &models.QuizQuestionAsset{}, &models.QuizAnswerAsset{}, &models.QuizCollection{}, &models.QuizPackage{}, &models.TeacherSubject{}, &models.PushSubscription{}, &models.Program{}, &models.StudentClassEnrollment{}, &models.Setting{}, &models.QuizStudentProgress{}, &models.Notification{}, &models.TeacherPermission{})

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

	// migrate questions -- drop title, add plain_content
	if db.Migrator().HasColumn(&models.ForumQuestion{}, "title") {
		db.Exec("ALTER TABLE forum_questions DROP COLUMN title")
	}
	if !db.Migrator().HasColumn(&models.ForumQuestion{}, "plain_content") {
		db.Exec("ALTER TABLE forum_questions ADD COLUMN plain_content TEXT NOT NULL DEFAULT ''")
	}

	// migrate answers -- add video_url
	if !db.Migrator().HasColumn(&models.ForumAnswer{}, "video_url") {
		db.Exec("ALTER TABLE forum_answers ADD COLUMN video_url VARCHAR(500) NOT NULL DEFAULT ''")
	}

	// migrate questions -- drop upvotes
	if db.Migrator().HasColumn(&models.ForumQuestion{}, "upvotes") {
		db.Exec("ALTER TABLE forum_questions DROP COLUMN upvotes")
	}

	// backfill: pertanyaan open yang sudah punya jawaban → status answered
	db.Exec(`UPDATE forum_questions SET status = 'answered'
		WHERE status = 'open'
		AND id IN (SELECT DISTINCT question_id FROM forum_answers WHERE deleted_at IS NULL)`)

	// migrate classes -- drop description column (tidak dipakai)
	if db.Migrator().HasColumn(&models.Class{}, "description") {
		db.Exec("ALTER TABLE classes DROP COLUMN description")
	}

	// migrate subjects -- drop description column (tidak dipakai)
	if db.Migrator().HasColumn(&models.Subject{}, "description") {
		db.Exec("ALTER TABLE subjects DROP COLUMN description")
	}

	// migrate quiz_questions -- pindah dari chapter ke paket soal
	if !db.Migrator().HasColumn(&models.QuizQuestion{}, "package_id") {
		db.Exec("ALTER TABLE quiz_questions ADD COLUMN package_id BIGINT NOT NULL DEFAULT 0")
		db.Exec("CREATE INDEX idx_quiz_questions_package_id ON quiz_questions(package_id)")
	}
	if db.Migrator().HasColumn(&models.QuizQuestion{}, "chapter_id") {
		db.Exec("ALTER TABLE quiz_questions DROP COLUMN chapter_id")
	}

	// tabel join many2many tidak dipakai lagi (soal dimiliki paket)
	if db.Migrator().HasTable("package_questions") {
		db.Migrator().DropTable("package_questions")
	}

	// fitur gallery dihapus — buang tabel subject_images (sisa dari DB lama).
	if db.Migrator().HasTable("subject_images") {
		db.Migrator().DropTable("subject_images")
		log.Println("Dropped table subject_images")
	}

	// fitur gambar pendukung forum dihapus — buang tabel sisa (nama lama & baru).
	for _, t := range []string{"question_images", "forum_question_images", "answer_images", "forum_answer_images"} {
		if db.Migrator().HasTable(t) {
			db.Migrator().DropTable(t)
			log.Printf("Dropped table %s", t)
		}
	}

	// migrasi: program + student_class_enrollments (buat eksplisit lewat Migrator
	// agar tak bergantung AutoMigrate global yang bisa gagal di mid-cycle).
	if !db.Migrator().HasTable(&models.Program{}) {
		db.Migrator().CreateTable(&models.Program{})
	}
	if !db.Migrator().HasTable(&models.StudentClassEnrollment{}) {
		db.Migrator().CreateTable(&models.StudentClassEnrollment{})
	}
	// drop tabel lama student_classes (rename ke student_class_enrollments)
	if db.Migrator().HasTable("student_classes") {
		db.Migrator().DropTable("student_classes")
		log.Println("Dropped old table student_classes (renamed to student_class_enrollments)")
	}
	// drop tabel lama question_banks (renamed ke quiz_questions + quiz_answers)
	if db.Migrator().HasTable("question_banks") {
		db.Migrator().DropTable("question_banks")
		log.Println("Dropped old table question_banks")
	}
	// drop tabel lama availabilities (fitur dihapus)
	if db.Migrator().HasTable("availabilities") {
		db.Migrator().DropTable("availabilities")
		log.Println("Dropped old table availabilities")
	}

	// migrasi: classes tambah harga les privat per kelas
	if !db.Migrator().HasColumn(&models.Class{}, "price_per_session") {
		db.Exec("ALTER TABLE classes ADD COLUMN price_per_session DECIMAL(12,2) NOT NULL DEFAULT 0")
		db.Exec("ALTER TABLE classes ADD COLUMN group_price DECIMAL(12,2) NOT NULL DEFAULT 0")
	}

	// migrasi: classes tambah harga konten (materi + paket soal + forum) per kelas
	if !db.Migrator().HasColumn(&models.Class{}, "content_price") {
		db.Exec("ALTER TABLE classes ADD COLUMN content_price DECIMAL(12,2) NOT NULL DEFAULT 0")
	}

	// migrasi: users.class_id dihapus — akses kelas sepenuhnya lewat student_class_enrollments
	if db.Migrator().HasColumn(&models.User{}, "class_id") {
		db.Exec("ALTER TABLE users DROP COLUMN class_id")
		log.Println("Dropped column users.class_id")
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

	// backfill: student_programs (per-program) → student_class_enrollments (per-kelas).
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
				var sc models.StudentClassEnrollment
				err := db.Where("user_id = ? AND class_id = ?", r.UserID, cid).First(&sc).Error
				if errors.Is(err, gorm.ErrRecordNotFound) {
					db.Create(&models.StudentClassEnrollment{UserID: r.UserID, ClassID: cid, Expiry: r.Expiry})
				}
			}
		}
		db.Migrator().DropTable("student_programs")
		log.Println("Migrated student_programs → student_class_enrollments")
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

	// migrate public_id: tambah kolom UUID v4 untuk public-facing resources.
	// Backfill existing rows dengan gen_random_uuid() (PostgreSQL native).
	publicIDModels := []struct {
		model interface{}
		table string
	}{
		{&models.User{}, "users"},
		{&models.ForumQuestion{}, "forum_questions"},
		{&models.ForumAnswer{}, "forum_answers"},
		{&models.QuizPackage{}, "quiz_packages"},
		{&models.QuizCollection{}, "quiz_collections"},
		{&models.Booking{}, "bookings"},
		{&models.Invoice{}, "invoices"},
		{&models.Notification{}, "notifications"},
	}
	for _, t := range publicIDModels {
		if !db.Migrator().HasColumn(t.model, "public_id") {
			db.Exec(fmt.Sprintf("ALTER TABLE %s ADD COLUMN public_id VARCHAR(36) NOT NULL DEFAULT ''", t.table))
		}
		db.Exec(fmt.Sprintf("UPDATE %s SET public_id = gen_random_uuid()::text WHERE public_id = '' OR public_id IS NULL", t.table))
	}

	// migrasi: pindah izin guru dari kolom users → tabel teacher_permissions
	if db.Migrator().HasColumn(&models.User{}, "can_manage_materials") {
		db.Exec(`INSERT INTO teacher_permissions (user_id, can_manage_materials, can_manage_question_packages, created_at, updated_at)
			SELECT id, can_manage_materials, can_manage_question_packages, NOW(), NOW()
			FROM users WHERE can_manage_materials = true OR can_manage_question_packages = true
			ON CONFLICT (user_id) DO UPDATE SET
				can_manage_materials = EXCLUDED.can_manage_materials,
				can_manage_question_packages = EXCLUDED.can_manage_question_packages,
				updated_at = NOW()`)
		db.Exec("ALTER TABLE users DROP COLUMN can_manage_materials")
		db.Exec("ALTER TABLE users DROP COLUMN can_manage_question_packages")
		log.Println("Migrated teacher permissions: users columns → teacher_permissions table")
	}

	log.Println("Migration completed")
}

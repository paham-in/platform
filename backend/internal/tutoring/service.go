package tutoring

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/notification"
	"bimbel2/backend/internal/setting"

	"gorm.io/gorm"
)

const maxGroupSlots = 5

type Service struct {
	repo     *Repository
	db       *gorm.DB
	settings *setting.Service
	notifSvc *notification.Service
}

func NewService(repo *Repository, db *gorm.DB, settings *setting.Service) *Service {
	return &Service{repo: repo, db: db, settings: settings}
}

func (s *Service) SetNotificationService(n *notification.Service) {
	s.notifSvc = n
}

// sessionFee menghitung fee guru utk satu sesi: persentase dari harga sesi.
func (s *Service) sessionFee(price float64) float64 {
	return price * s.settings.TeacherFeePercent() / 100
}

func (s *Service) ListTeachers(filter ListTeachersRequest) ([]ListTeachersResponse, error) {
	var users []models.User
	var err error
	if filter.SubjectID != nil {
		users, err = s.repo.ListTeachersBySubject(*filter.SubjectID)
	} else {
		users, err = s.repo.ListTeachers()
	}
	if err != nil {
		return nil, err
	}

	res := make([]ListTeachersResponse, 0, len(users))
	for _, u := range users {
		res = append(res, newListTeachersResponse(u))
	}

	// filter ketersediaan: hanya guru yang bebas (tanpa booking bentrok &
	// tanpa sesi) di tanggal+jam yang diminta.
	if filter.Date != "" {
		if filter.StartTime == "" || filter.EndTime == "" {
			return nil, errors.New("start_time dan end_time wajib diisi saat filter date")
		}
		busy, err := s.repo.ListBusyTeacherIDs(filter.Date, filter.StartTime, filter.EndTime)
		if err != nil {
			return nil, err
		}
		filtered := res[:0]
		for _, t := range res {
			if busy[t.ID] {
				continue
			}
			filtered = append(filtered, t)
		}
		res = filtered
	}
	return res, nil
}

func (s *Service) ListAllBookings() ([]AdminListBookingsResponse, error) {
	bookings, err := s.repo.ListAllBookings()
	if err != nil {
		return nil, err
	}
	res := make([]AdminListBookingsResponse, len(bookings))
	for i, b := range bookings {
		res[i] = newAdminListBookingsResponse(b)
	}
	return res, nil
}

func (s *Service) ListTeacherBookings(teacherID uint) ([]ListBookingsResponse, error) {
	bookings, err := s.repo.ListBookingsByTeacher(teacherID)
	if err != nil {
		return nil, err
	}
	res := make([]ListBookingsResponse, len(bookings))
	for i, b := range bookings {
		res[i] = newListBookingsResponse(b)
	}
	return res, nil
}

func (s *Service) ListMyBookings(studentID uint) ([]ListBookingsResponse, error) {
	bookings, err := s.repo.ListBookingsByStudent(studentID)
	if err != nil {
		return nil, err
	}
	res := make([]ListBookingsResponse, len(bookings))
	for i, b := range bookings {
		res[i] = newListBookingsResponse(b)
	}
	return res, nil
}

func (s *Service) CreateBooking(studentID uint, input CreateBookingRequest) (*CreateBookingResponse, error) {
	if input.Mode == "" {
		input.Mode = "private"
	}
	if input.Mode != "private" && input.Mode != "group" {
		return nil, errors.New("mode harus private atau group")
	}
	if input.SessionCount < 1 {
		input.SessionCount = 1
	}
	if input.SessionCount > 52 {
		return nil, errors.New("session_count maksimal 52")
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}

	return s.createOrganizer(studentID, input)
}

func (s *Service) createOrganizer(studentID uint, input CreateBookingRequest) (*CreateBookingResponse, error) {
	// kelas booking wajib diisi, ambil dari langganan aktif kalau tidak dikirim
	if input.ClassID == nil {
		classID, err := s.resolveStudentClassID(studentID)
		if err != nil {
			return nil, err
		}
		input.ClassID = classID
	}

	// cek apakah kelas mendukung les
	var class models.Class
	if err := s.db.First(&class, *input.ClassID).Error; err != nil {
		return nil, errors.New("kelas tidak ditemukan")
	}
	if !class.AllowTutoring {
		return nil, errors.New("kelas ini tidak menyediakan layanan les")
	}

	// mapel wajib + harus satu program dengan kelas murid
	if input.SubjectID == 0 {
		return nil, errors.New("pilih mata pelajaran dulu")
	}
	if err := s.validateSubjectProgram(input.SubjectID, *input.ClassID); err != nil {
		return nil, err
	}

	// booking tanpa guru → diserahkan ke admin
	if input.TeacherID == nil {
		return s.createNoTeacherBooking(studentID, input)
	}

	// validasi slot sesuai jadwal kosong guru + cek konflik (booking & sesi)
	if err := s.checkBookingConflict(*input.TeacherID, input.Date, input.StartTime, input.EndTime); err != nil {
		return nil, err
	}

	// kelompok selalu grup: resolve member, semua booking ber-token sama.
	if input.Mode == "group" {
		memberIDs, err := s.resolveGroupMembers(studentID, input.MemberEmails)
		if err != nil {
			return nil, err
		}
		if err := s.checkStudentsConflict(append([]uint{studentID}, memberIDs...), input.Date, input.StartTime, input.EndTime, input.SessionCount); err != nil {
			return nil, err
		}
		token, err := generateToken()
		if err != nil {
			return nil, errors.New("gagal membuat token grup")
		}
		total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
		if err != nil {
			return nil, err
		}
		var resp *CreateBookingResponse
		err = s.db.Transaction(func(tx *gorm.DB) error {
			base := models.Booking{
				TeacherID:    input.TeacherID,
				SubjectID:    input.SubjectID,
				Date:         input.Date,
				StartTime:    input.StartTime,
				EndTime:      input.EndTime,
				Status:       "pending",
				Mode:         "group",
				SessionCount: total,
				GroupToken:   token,
				Note:         input.Note,
				ClassID:      input.ClassID,
			}
			organizer := base
			organizer.StudentID = studentID
			organizer.IsOrganizer = true
			if err := tx.Create(&organizer).Error; err != nil {
				return err
			}
			for _, mID := range memberIDs {
				m := base
				m.StudentID = mID
				if err := tx.Create(&m).Error; err != nil {
					return err
				}
			}
			created, err := s.repo.GetBookingWithDB(tx, organizer.ID)
			if err != nil {
				return err
			}
			r := newCreateBookingResponse(*created)
			resp = &r
			return nil
		})
		if err != nil {
			return nil, err
		}
		if s.notifSvc != nil && input.TeacherID != nil {
			s.notifyTeacherNewBooking(*input.TeacherID, input.Date, input.StartTime, input.EndTime, resp.ID)
		}
		return resp, nil
	}

	total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
	if err != nil {
		return nil, err
	}
	if err := s.checkStudentConflict(studentID, input.Date, input.StartTime, input.EndTime, input.SessionCount, 0, 0); err != nil {
		return nil, err
	}
	booking := models.Booking{
		TeacherID:    input.TeacherID,
		StudentID:    studentID,
		SubjectID:    input.SubjectID,
		Date:         input.Date,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
		Status:       "pending",
		Mode:         input.Mode,
		SessionCount: total,
		GroupToken:   "",
		Note:         input.Note,
		ClassID:      input.ClassID,
	}
	if err := s.repo.CreateBooking(&booking); err != nil {
		return nil, err
	}
	created, err := s.repo.GetBooking(booking.ID)
	if err != nil {
		return nil, err
	}
	r := newCreateBookingResponse(*created)
	if s.notifSvc != nil && input.TeacherID != nil {
		s.notifyTeacherNewBooking(*input.TeacherID, booking.Date, booking.StartTime, booking.EndTime, booking.ID)
	}
	return &r, nil
}

// resolveGroupMembers memvalidasi & meresolve email member grup.
// Email tanpa akun student → error (register-first: semua wajib daftar dulu).
// Mengembalikan member user IDs, sudah dedupe dan tanpa organizer.
func (s *Service) resolveGroupMembers(organizerID uint, emails []string) ([]uint, error) {
	if len(emails) == 0 {
		return nil, errors.New("daftarkan minimal 1 email teman")
	}
	seen := map[string]bool{}
	unique := make([]string, 0, len(emails))
	for _, e := range emails {
		e = strings.TrimSpace(e)
		if e == "" || seen[e] {
			continue
		}
		seen[e] = true
		unique = append(unique, e)
	}

	byEmail, err := s.repo.FindStudentIDsByEmails(unique)
	if err != nil {
		return nil, err
	}
	var missing []string
	memberIDs := make([]uint, 0, len(unique))
	for _, e := range unique {
		id, ok := byEmail[e]
		if !ok {
			missing = append(missing, e)
			continue
		}
		if id == organizerID {
			continue // email organizer sendiri tidak dihitung member
		}
		memberIDs = append(memberIDs, id)
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("email belum terdaftar: %s, minta daftar dulu", strings.Join(missing, ", "))
	}
	if len(memberIDs) == 0 {
		return nil, errors.New("daftarkan minimal 1 email teman")
	}
	if len(memberIDs)+1 > maxGroupSlots {
		return nil, fmt.Errorf("grup maksimal %d siswa termasuk kamu", maxGroupSlots)
	}
	return memberIDs, nil
}

// createNoTeacherBooking membuat booking tanpa guru untuk diproses admin.
// Private & group sama-sama boleh tanpa guru; admin yang menetapkan nanti.
func (s *Service) createNoTeacherBooking(studentID uint, input CreateBookingRequest) (*CreateBookingResponse, error) {
	total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
	if err != nil {
		return nil, err
	}

	base := models.Booking{
		TeacherID:    nil,
		SubjectID:    input.SubjectID,
		Date:         input.Date,
		StartTime:    input.StartTime,
		EndTime:      input.EndTime,
		Status:       "pending",
		SessionCount: total,
		Note:         input.Note,
		ClassID:      input.ClassID,
	}

	// grup tanpa guru: organizer + member ber-token sama, semua tanpa guru.
	if input.Mode == "group" {
		memberIDs, err := s.resolveGroupMembers(studentID, input.MemberEmails)
		if err != nil {
			return nil, err
		}
		if err := s.checkStudentsConflict(append([]uint{studentID}, memberIDs...), input.Date, input.StartTime, input.EndTime, input.SessionCount); err != nil {
			return nil, err
		}
		token, err := generateToken()
		if err != nil {
			return nil, errors.New("gagal membuat token grup")
		}
		base.Mode = "group"
		base.GroupToken = token

		var resp *CreateBookingResponse
		var organizerName, subjectName string
		err = s.db.Transaction(func(tx *gorm.DB) error {
			organizer := base
			organizer.StudentID = studentID
			organizer.IsOrganizer = true
			if err := tx.Create(&organizer).Error; err != nil {
				return err
			}
			for _, mID := range memberIDs {
				m := base
				m.StudentID = mID
				if err := tx.Create(&m).Error; err != nil {
					return err
				}
			}
			created, err := s.repo.GetBookingWithDB(tx, organizer.ID)
			if err != nil {
				return err
			}
			if created.Student != nil {
				organizerName = created.Student.Name
			}
			if created.Subject != nil {
				subjectName = created.Subject.Name
			}
			r := newCreateBookingResponse(*created)
			resp = &r
			return nil
		})
		if err != nil {
			return nil, err
		}
		s.notifyAdminsNewBooking(organizerName, subjectName, input.Date, input.StartTime, input.EndTime)
		return resp, nil
	}

	base.Mode = "private"
	booking := base
	booking.StudentID = studentID
	if err := s.checkStudentConflict(studentID, input.Date, input.StartTime, input.EndTime, input.SessionCount, 0, 0); err != nil {
		return nil, err
	}
	if err := s.repo.CreateBooking(&booking); err != nil {
		return nil, err
	}
	created, err := s.repo.GetBooking(booking.ID)
	if err != nil {
		return nil, err
	}
	r := newCreateBookingResponse(*created)
	studentName := ""
	if created.Student != nil {
		studentName = created.Student.Name
	}
	subjectName := ""
	if created.Subject != nil {
		subjectName = created.Subject.Name
	}
	s.notifyAdminsNewBooking(studentName, subjectName, input.Date, input.StartTime, input.EndTime)
	return &r, nil
}

// notifyAdminsNewBooking mengirim notifikasi ke semua admin bahwa ada booking
// baru (tanpa guru) yang menunggu di-assign. Best-effort: kalau tidak ada
// admin atau gagal query, dilewati diam-diam.
func (s *Service) notifyAdminsNewBooking(studentName, subjectName, date, startTime, endTime string) {
	if s.notifSvc == nil {
		return
	}
	admins, err := s.repo.ListAdminIDs()
	if err != nil || len(admins) == 0 {
		return
	}
	body := fmt.Sprintf("%s buat booking %s - pada %s %s-%s, belum ada guru",
		studentName, subjectName, date, startTime, endTime)
	s.notifSvc.NotifyBatch(admins, "Booking baru menunggu guru", body, "tutoring", "/dashboard/admin/tutoring")
}

// validateSubjectProgram memastikan mapel satu program dengan kelas murid.
func (s *Service) validateSubjectProgram(subjectID, classID uint) error {
	var subject models.Subject
	if err := s.repo.db.First(&subject, subjectID).Error; err != nil {
		return errors.New("mata pelajaran tidak ditemukan")
	}
	var class models.Class
	if err := s.repo.db.First(&class, classID).Error; err != nil {
		return errors.New("kelas tidak ditemukan")
	}
	if subject.ProgramID != nil && class.ProgramID != nil && *subject.ProgramID != *class.ProgramID {
		return errors.New("mata pelajaran tidak sesuai dengan kelas kamu")
	}
	return nil
}

// AdminCreateBooking daftarkan les privat manual atas nama murid.
// Langsung status confirmed + generate sesi & invoice (admin tinggal tandai lunas).
// Semua write (booking + sesi + invoice) dalam satu transaksi, atomicity.
func (s *Service) AdminCreateBooking(input AdminCreateBookingRequest) (*AdminCreateBookingResponse, error) {
	if input.Mode == "" {
		input.Mode = "private"
	}
	if input.Mode != "private" && input.Mode != "group" {
		return nil, errors.New("mode harus private atau group")
	}
	if input.SessionCount < 1 {
		input.SessionCount = 1
	}
	if input.SessionCount > 52 {
		return nil, errors.New("session_count maksimal 52")
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}
	if err := s.checkBookingConflict(input.TeacherID, input.Date, input.StartTime, input.EndTime); err != nil {
		return nil, err
	}

	// kelas booking wajib diisi, ambil dari langganan aktif kalau tidak dikirim
	if input.ClassID == nil {
		classID, err := s.resolveStudentClassID(input.StudentID)
		if err != nil {
			return nil, err
		}
		input.ClassID = classID
	}

	// cek apakah kelas mendukung les
	var class models.Class
	if err := s.db.First(&class, *input.ClassID).Error; err != nil {
		return nil, errors.New("kelas tidak ditemukan")
	}
	if !class.AllowTutoring {
		return nil, errors.New("kelas ini tidak menyediakan layanan les")
	}

	if input.SubjectID == 0 {
		return nil, errors.New("subject_id wajib diisi")
	}
	if err := s.validateSubjectProgram(input.SubjectID, *input.ClassID); err != nil {
		return nil, err
	}

	// kelompok: resolve member & buat semua booking + sesi + invoice ber-token sama.
	if input.Mode == "group" {
		memberIDs, err := s.resolveGroupMembers(input.StudentID, input.MemberEmails)
		if err != nil {
			return nil, err
		}
		if err := s.checkStudentsConflict(append([]uint{input.StudentID}, memberIDs...), input.Date, input.StartTime, input.EndTime, input.SessionCount); err != nil {
			return nil, err
		}
		token, err := generateToken()
		if err != nil {
			return nil, errors.New("gagal membuat token grup")
		}
		total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
		if err != nil {
			return nil, err
		}
		var resp *AdminCreateBookingResponse
		err = s.db.Transaction(func(tx *gorm.DB) error {
			base := models.Booking{
				TeacherID:    &input.TeacherID,
				SubjectID:    input.SubjectID,
				Date:         input.Date,
				StartTime:    input.StartTime,
				EndTime:      input.EndTime,
				Status:       "confirmed",
				Mode:         "group",
				SessionCount: total,
				GroupToken:   token,
				Note:         input.Note,
				ClassID:      input.ClassID,
			}
			students := append([]uint{input.StudentID}, memberIDs...)
			var firstID uint
			for i, sid := range students {
				b := base
				b.StudentID = sid
				if i == 0 {
					b.IsOrganizer = true
				}
				if err := tx.Create(&b).Error; err != nil {
					return err
				}
				if i == 0 {
					firstID = b.ID
				}
				// sesi + invoice (dalam tx) utk tiap murid
				if err := s.createSessionsAndInvoice(tx, b); err != nil {
					return err
				}
			}
			created, err := s.repo.GetBookingWithDB(tx, firstID)
			if err != nil {
				return err
			}
			r := newAdminCreateBookingResponse(*created)
			resp = &r
			return nil
		})
		if err != nil {
			return nil, err
		}
		if s.notifSvc != nil {
			s.notifyTeacherNewBooking(input.TeacherID, input.Date, input.StartTime, input.EndTime, resp.ID)
			s.notifSvc.Notify(input.StudentID, "Les dikonfirmasi", fmt.Sprintf("Booking les %s %s telah dikonfirmasi admin", input.Mode, input.Date), "tutoring", "/dashboard/tutoring")
		}
		return resp, nil
	}

	// input.SessionCount = jumlah minggu → total sesi = minggu × sesi-per-minggu
	total, err := sessionCountForTotal(input.SessionCount, input.StartTime, input.EndTime)
	if err != nil {
		return nil, err
	}
	if err := s.checkStudentConflict(input.StudentID, input.Date, input.StartTime, input.EndTime, input.SessionCount, 0, 0); err != nil {
		return nil, err
	}
	input.SessionCount = total

	var resp *AdminCreateBookingResponse
	err = s.db.Transaction(func(tx *gorm.DB) error {
		booking := models.Booking{
			TeacherID:    &input.TeacherID,
			StudentID:    input.StudentID,
			SubjectID:    input.SubjectID,
			Date:         input.Date,
			StartTime:    input.StartTime,
			EndTime:      input.EndTime,
			Status:       "confirmed",
			Mode:         input.Mode,
			SessionCount: input.SessionCount,
			Note:         input.Note,
			ClassID:      input.ClassID,
		}
		if err := tx.Create(&booking).Error; err != nil {
			return err
		}

		// sesi + invoice (dalam tx)
		if err := s.createSessionsAndInvoice(tx, booking); err != nil {
			return err
		}

		// baca via tx, s.repo.GetBooking (s.db) tidak terlihat row yg belum commit
		created, err := s.repo.GetBookingWithDB(tx, booking.ID)
		if err != nil {
			return err
		}
		r := newAdminCreateBookingResponse(*created)
		resp = &r
		return nil
	})
	if err != nil {
		return nil, err
	}
	if s.notifSvc != nil {
		s.notifyTeacherNewBooking(input.TeacherID, input.Date, input.StartTime, input.EndTime, resp.ID)
		s.notifSvc.Notify(input.StudentID, "Les dikonfirmasi", fmt.Sprintf("Booking les %s %s telah dikonfirmasi admin", input.Mode, input.Date), "tutoring", "/dashboard/tutoring")
	}
	return resp, nil
}

// checkBookingConflict mengecek keseluruhan bentrokan jadwal guru: booking
// existing pada date+time, dan sesi pertemuan yang sudah di-expand dari booking
// berulang (multi-week). Dipanggil saat create/assign booking, termasuk path
// admin yang langsung confirmed + generate sesi.
func (s *Service) checkBookingConflict(teacherID uint, date, startTime, endTime string) error {
	if err := s.checkTeacherConflict(teacherID, date, startTime, endTime, ""); err != nil {
		return err
	}
	conflict, err := s.repo.SessionConflict(teacherID, date, startTime, endTime, 0)
	if err != nil {
		return err
	}
	if conflict {
		return errors.New("guru sudah memiliki sesi pada tanggal & jam tersebut")
	}
	return nil
}

// checkTeacherConflict memblokir booking yang bentrok dgn booking guru lain.
// excludeToken dipakai utk mengabaikan booking dalam grup yang sama.
func (s *Service) checkTeacherConflict(teacherID uint, date, startTime, endTime, excludeToken string) error {
	newStart, _ := timeToMinutes(startTime)
	newEnd, _ := timeToMinutes(endTime)
	existing, err := s.repo.ListBookingsByTeacherAndDate(teacherID, date, []string{"confirmed", "pending"})
	if err != nil {
		return err
	}
	for _, b := range existing {
		if excludeToken != "" && b.GroupToken == excludeToken {
			continue
		}
		bStart, err1 := timeToMinutes(b.StartTime)
		bEnd, err2 := timeToMinutes(b.EndTime)
		if err1 != nil || err2 != nil {
			continue
		}
		if hasOverlap(newStart, newEnd, bStart, bEnd) {
			return errors.New("guru sudah memiliki booking pada jam tersebut")
		}
	}
	return nil
}

// checkStudentConflict menolak slot yang bertabrakan dengan jadwal les murid
// yang lain (booking pending/confirmed mingguan + sesi, termasuk reschedule).
func (s *Service) checkStudentConflict(studentID uint, date, startTime, endTime string, weeks int, excludeBookingID, excludeSessionID uint) error {
	conflict, err := s.repo.StudentConflict(studentID, date, startTime, endTime, weeks, excludeBookingID, excludeSessionID)
	if err != nil {
		return err
	}
	if conflict {
		return errors.New("jadwal bentrok dengan booking les kamu yang lain")
	}
	return nil
}

// checkStudentsConflict memeriksa beberapa murid sekaligus (organizer + anggota grup).
func (s *Service) checkStudentsConflict(studentIDs []uint, date, startTime, endTime string, weeks int) error {
	for _, id := range studentIDs {
		if err := s.checkStudentConflict(id, date, startTime, endTime, weeks, 0, 0); err != nil {
			return err
		}
	}
	return nil
}

// bookingWeeks menghitung jumlah minggu dari booking tersimpan
// (SessionCount = total sesi, perWeek dari durasi blok).
func bookingWeeks(startTime, endTime string, total int) (int, error) {
	s, err := timeToMinutes(startTime)
	if err != nil {
		return 0, errors.New("format jam mulai tidak valid")
	}
	e, err := timeToMinutes(endTime)
	if err != nil {
		return 0, errors.New("format jam selesai tidak valid")
	}
	dur := e - s
	if dur <= 0 || dur%sessionDurationMinutes != 0 {
		return 0, fmt.Errorf("durasi les harus kelipatan %d menit (%d jam)", sessionDurationMinutes, sessionDurationMinutes/60)
	}
	if total <= 0 {
		return 1, nil
	}
	weeks := (total + dur/sessionDurationMinutes - 1) / (dur / sessionDurationMinutes)
	if weeks < 1 {
		weeks = 1
	}
	return weeks, nil
}

// timeToMinutes mengubah "HH:mm" menjadi menit sejak tengah malam.
func timeToMinutes(t string) (int, error) {
	parsed, err := time.Parse("15:04", t)
	if err != nil {
		return 0, err
	}
	return parsed.Hour()*60 + parsed.Minute(), nil
}

// minutesToHHMM mengubah menit sejak tengah malam menjadi "HH:mm".
func minutesToHHMM(min int) string {
	return fmt.Sprintf("%02d:%02d", min/60, min%60)
}

// sessionDurationMinutes adalah durasi standar 1 sesi les.
const sessionDurationMinutes = 90

// overtimeGraceMinutes adalah toleransi overtime gratis (menit).
const overtimeGraceMinutes = 15

// overtimeFor menghitung kelebihan menit & blok 90-menit tambahan dari jam
// selesai aktual vs terjadwal. Kosong = tidak lapor. Di bawah toleransi = 0.
// Selebihnya dibulatkan ke atas per blok 90 menit (1 sesi).
func overtimeFor(scheduledEnd, actualEnd string) (overtimeMinutes, extraSessions int, err error) {
	if actualEnd == "" {
		return 0, 0, nil
	}
	sched, err := timeToMinutes(scheduledEnd)
	if err != nil {
		return 0, 0, errors.New("format jam selesai terjadwal tidak valid")
	}
	actual, err := timeToMinutes(actualEnd)
	if err != nil {
		return 0, 0, errors.New("format jam selesai aktual tidak valid (HH:mm)")
	}
	if actual < sched {
		return 0, 0, errors.New("jam selesai aktual tidak boleh lebih awal dari jadwal")
	}
	over := actual - sched
	if over <= overtimeGraceMinutes {
		return 0, 0, nil
	}
	extra := (over + sessionDurationMinutes - 1) / sessionDurationMinutes
	return over, extra, nil
}

// sessionFeeTotal menghitung fee guru utk satu sesi termasuk blok overtime.
func (s *Service) sessionFeeTotal(price float64, extraSessions int) float64 {
	if extraSessions < 0 {
		extraSessions = 0
	}
	return s.sessionFee(price) * float64(1+extraSessions)
}

// sessionsPerWeekFor menghitung jumlah sesi 90-menit dalam satu blok (start..end).
// Durasi harus kelipatan 90, kalau tidak, tolak.
func sessionsPerWeekFor(start, end string) (int, error) {
	s, err := timeToMinutes(start)
	if err != nil {
		return 0, errors.New("format jam mulai tidak valid")
	}
	e, err := timeToMinutes(end)
	if err != nil {
		return 0, errors.New("format jam selesai tidak valid")
	}
	dur := e - s
	if dur <= 0 {
		return 0, errors.New("start_time harus sebelum end_time")
	}
	if dur%sessionDurationMinutes != 0 {
		return 0, fmt.Errorf("durasi les harus kelipatan %d menit (%d jam)", sessionDurationMinutes, sessionDurationMinutes/60)
	}
	return dur / sessionDurationMinutes, nil
}

// hasOverlap mengembalikan true jika dua interval waktu saling tumpang tindih.
func hasOverlap(start1, end1, start2, end2 int) bool {
	return start1 < end2 && start2 < end1
}

func (s *Service) GetBookingByPublicID(publicID string) (*models.Booking, error) {
	return s.repo.GetBookingByPublicID(publicID)
}

func (s *Service) GetBooking(id uint) (*models.Booking, error) {
	return s.repo.GetBooking(id)
}

// CancelBooking membatalkan booking oleh murid pemiliknya.
// Hanya bisa saat status pending (guru belum di-assign admin). Setelah guru
// di-assign & booking confirmed, murid tidak bisa batal sendiri, hubungi admin.
// Grup: hanya booking murid yang bersangkutan yang dibatalkan, anggota lain
// tidak terpengaruh.
func (s *Service) CancelBooking(id, studentID uint) (*CancelBookingResponse, error) {
	booking, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, errors.New("booking tidak ditemukan")
	}
	if booking.StudentID != studentID {
		return nil, errors.New("bukan booking kamu")
	}
	switch booking.Status {
	case "cancelled":
		return nil, errors.New("booking sudah dibatalkan")
	case "rejected":
		return nil, errors.New("booking sudah ditolak guru")
	case "confirmed":
		return nil, errors.New("booking sudah punya guru, hubungi admin untuk pembatalan")
	}

	// status → cancelled; sesi terjadwal ikut batal; invoice belum lunas dihapus.
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Booking{}).Where("id = ?", id).Update("status", "cancelled").Error; err != nil {
			return err
		}
		if err := tx.Model(&models.TutoringSession{}).
			Where("booking_id = ? AND status = ?", id, "scheduled").
			Update("status", "cancelled").Error; err != nil {
			return err
		}
		if err := tx.Where("booking_id = ? AND status = ?", id, "pending").Delete(&models.Invoice{}).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	updated, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, err
	}
	r := newCancelBookingResponse(*updated)
	return &r, nil
}

// ReschedulePendingBooking menggeser tanggal & jam booking yang masih pending
// (belum ada sesi/invoice, jadi cukup UPDATE baris booking). Durasi blok harus
// sama, tanggal & jam boleh pindah; grup digeser serentak se-token.
// Murid hanya boleh geser booking private miliknya atau grup yang ia buat
// (is_organizer); perubahan grup oleh anggota biasa harus lewat admin.
func (s *Service) ReschedulePendingBooking(id, requesterID uint, isAdmin bool, input RescheduleBookingRequest) (*RescheduleBookingResponse, error) {
	booking, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, errors.New("booking tidak ditemukan")
	}
	if booking.Status != "pending" {
		return nil, errors.New("hanya booking pending yang bisa diubah jadwalnya")
	}
	targets := []models.Booking{*booking}
	if booking.GroupToken != "" {
		group, err := s.repo.ListBookingsByGroupToken(booking.GroupToken)
		if err != nil {
			return nil, err
		}
		targets = group
	}
	if !isAdmin {
		var own *models.Booking
		for i := range targets {
			if targets[i].StudentID == requesterID {
				own = &targets[i]
				break
			}
		}
		if own == nil {
			return nil, errors.New("bukan booking kamu")
		}
		if own.Mode == "group" && !own.IsOrganizer {
			return nil, errors.New("hanya pembuat grup yang bisa mengubah jadwal grup, hubungi admin")
		}
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}
	oldStart, _ := timeToMinutes(booking.StartTime)
	oldEnd, _ := timeToMinutes(booking.EndTime)
	newStart, err1 := timeToMinutes(input.StartTime)
	newEnd, err2 := timeToMinutes(input.EndTime)
	if err1 != nil || err2 != nil {
		return nil, errors.New("format waktu tidak valid")
	}
	if newEnd-newStart != oldEnd-oldStart {
		return nil, errors.New("durasi les tidak boleh berubah, batalkan dan buat booking baru")
	}
	if _, err := sessionsPerWeekFor(input.StartTime, input.EndTime); err != nil {
		return nil, err
	}
	for _, t := range targets {
		weeks, err := bookingWeeks(t.StartTime, t.EndTime, t.SessionCount)
		if err != nil {
			return nil, err
		}
		if err := s.checkStudentConflict(t.StudentID, input.Date, input.StartTime, input.EndTime, weeks, t.ID, 0); err != nil {
			return nil, err
		}
	}
	err = s.db.Transaction(func(tx *gorm.DB) error {
		for _, t := range targets {
			if err := tx.Model(&models.Booking{}).Where("id = ?", t.ID).Updates(map[string]interface{}{
				"date":       input.Date,
				"start_time": input.StartTime,
				"end_time":   input.EndTime,
			}).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	updated, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, err
	}
	r := newRescheduleBookingResponse(*updated)
	if s.notifSvc != nil {
		if isAdmin {
			for _, t := range targets {
				s.notifSvc.Notify(t.StudentID, "Jadwal les diubah admin",
					fmt.Sprintf("Booking les kamu dipindah ke %s %s-%s", input.Date, input.StartTime, input.EndTime),
					"tutoring", "/dashboard/tutoring")
			}
		} else {
			if admins, err := s.repo.ListAdminIDs(); err == nil && len(admins) > 0 {
				studentName := ""
				if updated.Student != nil {
					studentName = updated.Student.Name
				}
				s.notifSvc.NotifyBatch(admins, "Jadwal booking diubah murid",
					fmt.Sprintf("%s memindah booking ke %s %s-%s", studentName, input.Date, input.StartTime, input.EndTime),
					"tutoring", "/dashboard/admin/tutoring")
			}
			for _, t := range targets {
				if t.StudentID == requesterID {
					continue
				}
				s.notifSvc.Notify(t.StudentID, "Jadwal les grup diubah",
					fmt.Sprintf("Jadwal les grup kamu dipindah ke %s %s-%s", input.Date, input.StartTime, input.EndTime),
					"tutoring", "/dashboard/tutoring")
			}
		}
	}
	return &r, nil
}

// AdminRejectBooking menolak booking pending (mis. tidak ada guru yang
// tersedia). Grup ditolak serentak se-token. Murid diberi tahu; baris rejected
// dibersihkan otomatis oleh cron setelah masa tenggang.
func (s *Service) AdminRejectBooking(id uint) (*RejectBookingResponse, error) {
	booking, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, errors.New("booking tidak ditemukan")
	}
	if booking.Status != "pending" {
		return nil, errors.New("hanya booking pending yang bisa ditolak")
	}
	targets := []models.Booking{*booking}
	if booking.GroupToken != "" {
		group, err := s.repo.ListBookingsByGroupToken(booking.GroupToken)
		if err != nil {
			return nil, err
		}
		targets = group
	}
	err = s.db.Transaction(func(tx *gorm.DB) error {
		for _, t := range targets {
			if err := tx.Model(&models.Booking{}).Where("id = ? AND status = ?", t.ID, "pending").Update("status", "rejected").Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	if s.notifSvc != nil {
		for _, t := range targets {
			s.notifSvc.Notify(t.StudentID, "Booking les ditolak",
				fmt.Sprintf("Booking %s %s-%s tidak bisa diproses (tidak ada guru tersedia), silakan buat booking di jadwal lain", booking.Date, booking.StartTime, booking.EndTime),
				"tutoring", "/dashboard/tutoring")
		}
	}
	r := newRejectBookingResponse()
	return &r, nil
}

// AssignTeacher menetapkan guru ke booking tanpa guru (admin). Status langsung
// confirmed + generate sesi & invoice. Validasi konflik jadwal. Kalau booking
// bagian grup, guru diterapkan ke seluruh anggota ber-token sama. (Approve guru
// dihapus; admin assign = langsung disetujui.)
func (s *Service) AssignTeacher(id, teacherID uint) (*AssignTeacherResponse, error) {
	booking, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, errors.New("booking tidak ditemukan")
	}
	if booking.TeacherID != nil {
		return nil, errors.New("booking sudah punya guru")
	}
	if booking.Status != "pending" {
		return nil, errors.New("booking sudah diproses sebelumnya")
	}
	if err := s.checkBookingConflict(teacherID, booking.Date, booking.StartTime, booking.EndTime); err != nil {
		return nil, err
	}

	// guru ditetapkan admin → otomatis disetujui, tanpa perlu approve guru lagi.
	targets := []models.Booking{*booking}
	if booking.GroupToken != "" {
		group, err := s.repo.ListBookingsByGroupToken(booking.GroupToken)
		if err != nil {
			return nil, err
		}
		targets = group
	}

	// murid (organizer + anggota grup) tidak boleh bentrok dengan jadwalnya sendiri.
	for _, t := range targets {
		weeks, err := bookingWeeks(t.StartTime, t.EndTime, t.SessionCount)
		if err != nil {
			return nil, err
		}
		if err := s.checkStudentConflict(t.StudentID, t.Date, t.StartTime, t.EndTime, weeks, t.ID, 0); err != nil {
			return nil, err
		}
	}

	// set guru + confirm + buat sesi & invoice utk semua target dalam satu transaksi.
	err = s.db.Transaction(func(tx *gorm.DB) error {
		for _, b := range targets {
			if b.Status != "pending" {
				continue
			}
			if err := tx.Model(&models.Booking{}).Where("id = ?", b.ID).Update("teacher_id", teacherID).Error; err != nil {
				return err
			}
			if err := tx.Model(&models.Booking{}).Where("id = ?", b.ID).Update("status", "confirmed").Error; err != nil {
				return err
			}
			if err := s.createSessionsAndInvoice(tx, b); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	updated, err := s.repo.GetBooking(id)
	if err != nil {
		return nil, err
	}
	r := newAssignTeacherResponse(*updated)
	return &r, nil
}

// resolveStudentClassID mengambil class_id dari langganan aktif student
// (student_classes). 0 langganan → error; 1 → langsung dipakai; >1 → minta pilih.
func (s *Service) resolveStudentClassID(studentID uint) (*uint, error) {
	today := time.Now().Format("2006-01-02")
	var ids []uint
	if err := s.repo.db.Model(&models.StudentClassEnrollment{}).
		Where("user_id = ? AND expiry >= ?", studentID, today).
		Distinct("class_id").Order("class_id asc").Pluck("class_id", &ids).Error; err != nil {
		return nil, err
	}
	switch len(ids) {
	case 0:
		return nil, errors.New("kamu belum punya akses kelas, hubungi admin")
	case 1:
		return &ids[0], nil
	default:
		return nil, errors.New("pilih kelas dulu sebelum booking")
	}
}

// getClassPrices mengembalikan harga les privat per kelas.
// Kelas tidak ditemukan / belum diisi harga → 0.
func (s *Service) getClassPrices(classID *uint) (price, groupPrice float64) {
	if classID == nil {
		return 0, 0
	}
	var class models.Class
	if err := s.repo.db.First(&class, *classID).Error; err != nil {
		return 0, 0
	}
	return class.PricePerSession, class.GroupPrice
}

// perSessionPrice menghitung harga per pertemuan utk mode tertentu.
// Admin diharapkan mengisi harga tiap kelas; kelas tanpa harga → 0.
func (s *Service) perSessionPrice(classID *uint, mode string) float64 {
	price, groupPrice := s.getClassPrices(classID)
	if mode == "group" {
		return groupPrice
	}
	return price
}

// createSessionsAndInvoice membuat sesi pertemuan mingguan + invoice pembayaran.
// db dipakai agar bisa dijalankan dalam transaksi (tx) atau langsung (s.db).
func (s *Service) createSessionsAndInvoice(db *gorm.DB, booking models.Booking) error {
	date, err := time.Parse("2006-01-02", booking.Date)
	if err != nil {
		return errors.New("tanggal booking tidak valid")
	}

	// booking.SessionCount = total sesi. Durasi blok (Start..End) dipecah jadi sesi
	// 90-menit back-to-back per minggu; jumlah minggu = total / perWeek (harus bulat).
	perWeek, err := sessionsPerWeekFor(booking.StartTime, booking.EndTime)
	if err != nil {
		return err
	}
	if booking.SessionCount%perWeek != 0 {
		return fmt.Errorf("jumlah pertemuan harus kelipatan %d sesi/minggu", perWeek)
	}
	weeks := booking.SessionCount / perWeek
	startMin, _ := timeToMinutes(booking.StartTime)

	sessions := make([]models.TutoringSession, 0, booking.SessionCount)
	startDate := date
	endDate := date
	for w := 0; w < weeks; w++ {
		d := date.AddDate(0, 0, 7*w)
		if w == 0 {
			startDate = d
		}
		endDate = d
		for j := 0; j < perWeek; j++ {
			ss := startMin + j*sessionDurationMinutes
			se := ss + sessionDurationMinutes
			sessions = append(sessions, models.TutoringSession{
				BookingID: booking.ID,
				Date:      d.Format("2006-01-02"),
				StartTime: minutesToHHMM(ss),
				EndTime:   minutesToHHMM(se),
				Status:    "scheduled",
			})
		}
	}
	if err := db.Create(&sessions).Error; err != nil {
		return err
	}

	modeLabel := "private"
	if booking.Mode == "group" {
		modeLabel = "kelompok"
	}
	perSession := s.perSessionPrice(booking.ClassID, booking.Mode)
	invoice := models.Invoice{
		UserID:    booking.StudentID,
		Amount:    perSession * float64(booking.SessionCount),
		StartDate: startDate.Format("2006-01-02"),
		EndDate:   endDate.AddDate(0, 0, 7).Format("2006-01-02"), // sesi terakhir + 7 hari akses
		Status:    "pending",
		Note:      fmt.Sprintf("Les %s, %d sesi", modeLabel, booking.SessionCount),
		BookingID: &booking.ID,
		ClassID:   booking.ClassID, // grant StudentClass saat invoice lunas
	}
	return db.Create(&invoice).Error
}

// sessionCountForTotal menghitung total sesi = minggu × sesi-per-minggu, dan
// memvalidasi durasi blok kelipatan durasi-sesi.
func sessionCountForTotal(weeks int, start, end string) (int, error) {
	perWeek, err := sessionsPerWeekFor(start, end)
	if err != nil {
		return 0, err
	}
	return weeks * perWeek, nil
}

// ListTeacherSessions mengembalikan semua sesi pertemuan milik guru.
func (s *Service) ListTeacherSessions(teacherID uint) ([]ListSessionsResponse, error) {
	sessions, err := s.repo.ListSessionsByTeacher(teacherID)
	if err != nil {
		return nil, err
	}
	res := make([]ListSessionsResponse, len(sessions))
	for i, v := range sessions {
		res[i] = newListSessionsResponse(v)
	}
	return res, nil
}

func (s *Service) ListMySessions(studentID uint) ([]ListSessionsResponse, error) {
	sessions, err := s.repo.ListSessionsByUser(studentID)
	if err != nil {
		return nil, err
	}
	res := make([]ListSessionsResponse, len(sessions))
	for i, v := range sessions {
		res[i] = newListSessionsResponse(v)
	}
	return res, nil
}

const evidenceWindowDays = 7

// getOwnedSession mengambil sesi milik guru dan memastikan guru pemilik booking-nya.
func (s *Service) getOwnedSession(sessionID, teacherID uint) (*models.TutoringSession, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, errors.New("sesi tidak ditemukan")
	}
	if session.Booking == nil || session.Booking.TeacherID == nil || *session.Booking.TeacherID != teacherID {
		return nil, errors.New("bukan guru pemilik sesi ini")
	}
	return session, nil
}

// RescheduleSession memindahkan sesi ke waktu lain oleh guru (tanpa approval murid).
func (s *Service) RescheduleSession(sessionID, teacherID uint, input UpdateSessionRequest) (*UpdateSessionResponse, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" {
		return nil, errors.New("hanya sesi terjadwal yang bisa di-reschedule")
	}
	if input.Date < time.Now().Format("2006-01-02") {
		return nil, errors.New("tanggal tidak boleh di masa lalu")
	}
	if input.StartTime >= input.EndTime {
		return nil, errors.New("start_time harus sebelum end_time")
	}
	if err := s.checkTeacherConflict(teacherID, input.Date, input.StartTime, input.EndTime, ""); err != nil {
		return nil, err
	}
	conflict, err := s.repo.SessionConflict(teacherID, input.Date, input.StartTime, input.EndTime, sessionID)
	if err != nil {
		return nil, err
	}
	if conflict {
		return nil, errors.New("guru sudah memiliki sesi pada jam tersebut")
	}
	// murid pemilik sesi juga tidak boleh bentrok dengan jadwal lesnya yang lain.
	if err := s.checkStudentConflict(session.Booking.StudentID, input.Date, input.StartTime, input.EndTime, 1, session.BookingID, sessionID); err != nil {
		return nil, err
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"date":       input.Date,
		"start_time": input.StartTime,
		"end_time":   input.EndTime,
	}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	r := newUpdateSessionResponse(*updated)

	if s.notifSvc != nil && session.Booking != nil {
		s.notifSvc.Notify(session.Booking.StudentID, "Sesi dijadwalkan ulang",
			fmt.Sprintf("Sesi tanggal %s %s dipindah ke %s %s", session.Date, session.StartTime, input.Date, input.StartTime),
			"tutoring", "/dashboard/tutoring")
	}

	return &r, nil
}

// CancelSession membatalkan sesi oleh guru (scheduled → cancelled).
func (s *Service) CancelSession(sessionID, teacherID uint) (*CancelSessionResponse, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" {
		return nil, errors.New("hanya sesi terjadwal yang bisa dibatalkan")
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{"status": "cancelled"}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	r := newCancelSessionResponse(*updated)

	if s.notifSvc != nil && session.Booking != nil {
		s.notifSvc.Notify(session.Booking.StudentID, "Sesi les dibatalkan",
			fmt.Sprintf("Sesi tanggal %s %s telah dibatalkan oleh guru", session.Date, session.StartTime),
			"tutoring", "/dashboard/tutoring")
	}

	return &r, nil
}

// checkEvidenceEligible memvalidasi sesi milik guru, berstatus scheduled, dan
// masih dalam jendela upload. Mengembalikan session kalau valid.
func (s *Service) checkEvidenceEligible(sessionID, teacherID uint) (*models.TutoringSession, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" && session.Status != "review" {
		return nil, errors.New("hanya sesi terjadwal atau menunggu validasi yang bisa diisi bukti kehadiran")
	}
	start, err := time.ParseInLocation("2006-01-02 15:04", session.Date+" "+session.StartTime, time.Local)
	if err != nil {
		return nil, errors.New("waktu sesi tidak valid")
	}
	end, err := time.ParseInLocation("2006-01-02 15:04", session.Date+" "+session.EndTime, time.Local)
	if err != nil {
		return nil, errors.New("waktu sesi tidak valid")
	}
	now := time.Now()
	if now.Before(start) {
		return nil, errors.New("sesi belum dimulai, upload bukti setelah jam mulai")
	}
	deadline := end.Add(evidenceWindowDays * 24 * time.Hour)
	if now.After(deadline) {
		return nil, errors.New("batas upload bukti sudah lewat (maksimal 7 hari setelah sesi berakhir)")
	}
	return session, nil
}

// ValidateEvidenceUpload dipanggil handler SEBELUM upload file ke storage
// supaya file tidak ter-upload percuma (lalu jadi orphan) kalau sesi bukan
// milik guru / bukan scheduled / di luar jendela waktu.
func (s *Service) ValidateEvidenceUpload(sessionID, teacherID uint) error {
	_, err := s.checkEvidenceEligible(sessionID, teacherID)
	return err
}

// UploadEvidence menyimpan foto bukti kehadiran guru dan menandai sesi "review"
// (menunggu validasi admin). Jendela upload: mulai jam sesi mulai sampai H+7 setelah sesi berakhir.
// Sesi berstatus "review" boleh di-upload ulang (ganti foto); objectName foto lama
// dikembalikan supaya handler bisa menghapus file lamanya dari storage.
func (s *Service) UploadEvidence(sessionID, teacherID uint, objectName string) (*UploadSessionEvidenceResponse, string, error) {
	session, err := s.checkEvidenceEligible(sessionID, teacherID)
	if err != nil {
		return nil, "", err
	}
	oldObject := ""
	if session.EvidenceURL != "" {
		oldObject = session.EvidenceURL
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"evidence_url": objectName,
		"status":       "review",
	}); err != nil {
		return nil, "", err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, "", err
	}
	r := newUploadSessionEvidenceResponse(*updated)
	return &r, oldObject, nil
}

// ReportOvertime mencatat jam selesai aktual sesi oleh guru (menu terpisah dari
// upload bukti). Overtime dihitung backend: toleransi 15 menit gratis,
// selebihnya dibulatkan ke atas per blok 90 menit. Boleh dilaporkan ulang
// (menimpa) selama sesi belum divalidasi admin; charge-nya diterapkan saat
// approve. Sesi yang sudah done ditolak (hubungi admin).
func (s *Service) ReportOvertime(sessionID, teacherID uint, actualEndTime string) (*ReportOvertimeResponse, error) {
	session, err := s.getOwnedSession(sessionID, teacherID)
	if err != nil {
		return nil, err
	}
	if session.Status != "scheduled" && session.Status != "review" {
		return nil, errors.New("overtime hanya bisa dilaporkan untuk sesi terjadwal atau menunggu validasi (sesi selesai hubungi admin)")
	}
	end, err := time.ParseInLocation("2006-01-02 15:04", session.Date+" "+session.EndTime, time.Local)
	if err != nil {
		return nil, errors.New("waktu sesi tidak valid")
	}
	if time.Now().Before(end) {
		return nil, errors.New("overtime baru bisa dilaporkan setelah jam selesai terjadwal")
	}
	over, extra, err := overtimeFor(session.EndTime, actualEndTime)
	if err != nil {
		return nil, err
	}
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"actual_end_time":  actualEndTime,
		"overtime_minutes": over,
		"extra_sessions":   extra,
	}); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	r := newReportOvertimeResponse(*updated)
	return &r, nil
}

// ListEvidence mengembalikan sesi yang punya bukti, difilter status ("" = semua)
// dan search (nama/email murid, opsional).
// Plus info fee & status invoice utk halaman admin gabungan validasi + fee guru.
func (s *Service) ListEvidence(status, search string) ([]AdminListEvidenceResponse, error) {
	sessions, err := s.repo.ListSessionsWithEvidence(status, search)
	if err != nil {
		return nil, err
	}
	res := make([]AdminListEvidenceResponse, len(sessions))
	for i, v := range sessions {
		res[i] = newAdminListEvidenceResponse(v)
		paid := v.Booking != nil && v.Booking.Invoice != nil && v.Booking.Invoice.Status == "paid"
		res[i].InvoicePaid = paid
		// fee_amount cuma relevan utk sesi selesai yg muridnya sudah lunas
		if v.Status == "done" && paid {
			perSession := s.perSessionPrice(v.Booking.ClassID, v.Booking.Mode)
			res[i].FeeAmount = s.sessionFeeTotal(perSession, v.ExtraSessions)
		}
	}
	return res, nil
}

// ApproveEvidence menyetujui bukti → sesi selesai. Charge overtime (kalau ada)
// diterapkan di transaksi yang sama: invoice pending ditambah, kalau invoice
// sudah lunas (atau tidak ada) dibuatkan invoice baru.
func (s *Service) ApproveEvidence(sessionID uint) (*AdminReviewEvidenceResponse, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, errors.New("sesi tidak ditemukan")
	}
	if session.EvidenceURL == "" || session.Status != "review" {
		return nil, errors.New("tidak ada bukti yang menunggu validasi pada sesi ini")
	}
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.TutoringSession{}).Where("id = ?", sessionID).Update("status", "done").Error; err != nil {
			return err
		}
		return s.applyOvertimeCharge(tx, session)
	})
	if err != nil {
		return nil, err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	r := newAdminReviewEvidenceResponse(*updated)
	return &r, nil
}

// applyOvertimeCharge menagihkan blok overtime sesi ke murid. Invoice utama
// yang masih pending ditambah nominalnya; kalau sudah lunas (atau tidak ada),
// dibuatkan invoice baru khusus overtime.
func (s *Service) applyOvertimeCharge(tx *gorm.DB, session *models.TutoringSession) error {
	if session.ExtraSessions <= 0 || session.Booking == nil {
		return nil
	}
	perSession := s.perSessionPrice(session.Booking.ClassID, session.Booking.Mode)
	extra := perSession * float64(session.ExtraSessions)
	if extra <= 0 {
		return nil
	}
	var inv models.Invoice
	if err := tx.Where("booking_id = ?", session.BookingID).Order("id asc").First(&inv).Error; err == nil && inv.Status == "pending" {
		note := inv.Note + fmt.Sprintf(" + overtime %d sesi %s", session.ExtraSessions, session.Date)
		if len(note) > 450 {
			note = inv.Note
		}
		return tx.Model(&models.Invoice{}).Where("id = ?", inv.ID).Updates(map[string]interface{}{
			"amount": inv.Amount + extra,
			"note":   note,
		}).Error
	}
	bookingID := session.BookingID
	return tx.Create(&models.Invoice{
		UserID:    session.Booking.StudentID,
		Amount:    extra,
		StartDate: session.Date,
		EndDate:   session.Date,
		Status:    "pending",
		Note:      fmt.Sprintf("Kelebihan waktu %d sesi (%s)", session.ExtraSessions, session.Date),
		BookingID: &bookingID,
		ClassID:   session.Booking.ClassID,
	}).Error
}

// ValidateEvidenceReject memvalidasi sesi punya bukti yang menunggu validasi
// dan mengembalikan objectName-nya. Dipanggil handler SEBELUM menghapus file
// storage, kalau hapus file gagal, DB tidak diubah (tetap konsisten, bisa retry).
func (s *Service) ValidateEvidenceReject(sessionID uint) (string, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return "", errors.New("sesi tidak ditemukan")
	}
	if session.EvidenceURL == "" || session.Status != "review" {
		return "", errors.New("tidak ada bukti yang menunggu validasi pada sesi ini")
	}
	return session.EvidenceURL, nil
}

// RejectEvidence menolak bukti → sesi kembali terjadwal, bukti dihapus.
// Mengembalikan objectName bukti lama supaya handler bisa menghapus file storage.
func (s *Service) RejectEvidence(sessionID uint) (*AdminReviewEvidenceResponse, string, error) {
	session, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, "", errors.New("sesi tidak ditemukan")
	}
	if session.EvidenceURL == "" || session.Status != "review" {
		return nil, "", errors.New("tidak ada bukti yang menunggu validasi pada sesi ini")
	}
	oldObject := session.EvidenceURL
	if err := s.repo.UpdateSession(sessionID, map[string]interface{}{
		"evidence_url": "",
		"status":       "scheduled",
	}); err != nil {
		return nil, "", err
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, "", err
	}
	r := newAdminReviewEvidenceResponse(*updated)
	return &r, oldObject, nil
}

// ListAdminSessionReport mengagregasi jumlah pertemuan per booking + nominal refund.
func (s *Service) ListAdminSessionReport() ([]AdminListReportResponse, error) {
	bookings, err := s.repo.ListAllBookingsWithSessions()
	if err != nil {
		return nil, err
	}
	reports := make([]AdminListReportResponse, 0, len(bookings))
	for _, b := range bookings {
		reports = append(reports, s.newAdminListReportResponse(b))
	}
	return reports, nil
}

// ListTeacherFeeSessions mengembalikan sesi terlaksana (done) dari booking yang
// invoice-nya sudah lunas, utk pencatatan fee guru.
func (s *Service) ListTeacherFeeSessions() ([]AdminListFeesResponse, error) {
	sessions, err := s.repo.ListSessionsDone()
	if err != nil {
		return nil, err
	}
	result := make([]AdminListFeesResponse, 0, len(sessions))
	for _, v := range sessions {
		// hanya sesi yang muridnya sudah bayar
		if v.Booking == nil || v.Booking.Invoice == nil || v.Booking.Invoice.Status != "paid" {
			continue
		}
		res := newAdminListFeesResponse(v)
		perSession := s.perSessionPrice(v.Booking.ClassID, v.Booking.Mode)
		res.FeeAmount = s.sessionFeeTotal(perSession, v.ExtraSessions)
		result = append(result, res)
	}
	return result, nil
}

// ToggleSessionFeePaid membalik status pembayaran fee guru pada sesi.
func (s *Service) ToggleSessionFeePaid(sessionID uint) (*AdminToggleFeePaidResponse, error) {
	if _, err := s.repo.ToggleSessionFeePaid(sessionID); err != nil {
		return nil, errors.New("sesi tidak ditemukan")
	}
	updated, err := s.repo.GetSession(sessionID)
	if err != nil {
		return nil, err
	}
	r := newAdminToggleFeePaidResponse(*updated)
	return &r, nil
}

// ListTeacherEarnings mengembalikan riwayat sesi selesai milik guru + estimasi fee.
func (s *Service) ListTeacherEarnings(teacherID uint) (*MyEarningsResponse, error) {
	sessions, err := s.repo.ListSessionsByTeacher(teacherID)
	if err != nil {
		return nil, err
	}
	resp := s.newMyEarningsResponse(sessions)
	return &resp, nil
}

// MarkEarningsTaken menandai sesi milik guru sebagai fee sudah diambil
// (atau membatalkannya) lalu mengembalikan state earnings terbaru.
func (s *Service) MarkEarningsTaken(teacherID uint, ids []uint, taken bool) (*MyEarningsResponse, error) {
	if err := s.repo.MarkSessionsTaken(teacherID, ids, taken); err != nil {
		return nil, err
	}
	return s.ListTeacherEarnings(teacherID)
}

func generateToken() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// notifyTeacherNewBooking mengirim notifikasi ke guru ada booking baru.
func (s *Service) notifyTeacherNewBooking(teacherID uint, date, startTime, endTime string, bookingID uint) {
	s.notifSvc.Notify(teacherID, "Booking les baru",
		fmt.Sprintf("Ada booking les %s %s %s-%s yang menunggu persetujuan", date, startTime, endTime, date),
		"tutoring", fmt.Sprintf("/dashboard/tutoring"))
}

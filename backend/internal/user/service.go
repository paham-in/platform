package user

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"slices"
	"strings"
	"time"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

// sessionDuration dipakai untuk sliding expiration: diperpanjang tiap token dipakai.
const sessionDuration = models.SessionTTL // 7 hari

type Service struct {
	userRepo    *UserRepository
	sessionRepo *SessionRepository
}

func NewService(userRepo *UserRepository, sessionRepo *SessionRepository) *Service {
	return &Service{userRepo: userRepo, sessionRepo: sessionRepo}
}

func (s *Service) LoginOrCreateWithGoogle(googleID, email, name, avatarURL string) (*AuthResponse, error) {
	// cari by google_id dulu
	user, err := s.userRepo.GetByGoogleID(googleID)
	if err == nil && user != nil {
		if avatarURL != "" && user.AvatarURL != avatarURL {
			s.userRepo.UpdateAvatar(user.ID, avatarURL)
		}
		token, err := s.createSessionForLogin(user)
		if err != nil {
			return nil, errInternal
		}
		return &AuthResponse{Token: token, User: newMeResponse(*user)}, nil
	}

	// cari by email
	user, err = s.userRepo.GetByEmail(email)
	if err == nil && user != nil {
		s.userRepo.UpdateGoogleID(user.ID, googleID)
		if avatarURL != "" {
			s.userRepo.UpdateAvatar(user.ID, avatarURL)
		}
		token, err := s.createSessionForLogin(user)
		if err != nil {
			return nil, errInternal
		}
		return &AuthResponse{Token: token, User: newMeResponse(*user)}, nil
	}

	// create new user + assign default role (student) + buat sesi login dalam
	// satu transaksi — kalau satu langkah gagal, user tidak jadi tersimpan
	// setengah (user tanpa role atau tanpa sesi).
	user = &models.User{
		Name:      name,
		Email:     email,
		GoogleID:  googleID,
		AvatarURL: avatarURL,
	}
	var token string
	if err := s.userRepo.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		// assign default role: semua pendaftar otomatis student (role "user" sudah dihapus)
		var userRole models.Role
		if err := tx.Where("name = ?", "student").First(&userRole).Error; err != nil {
			return err
		}
		if err := tx.Model(user).Association("Roles").Append(&userRole); err != nil {
			return err
		}
		var err error
		token, err = s.createSessionTx(tx, user.ID)
		return err
	}); err != nil {
		return nil, errInternal
	}
	return &AuthResponse{Token: token, User: newMeResponse(*user)}, nil
}

// createSessionForLogin membuat sesi baru. Untuk user ber-role student,
// semua sesi lama dihapus dulu (pembatasan satu perangkat — anti berbagi akun).
func (s *Service) createSessionForLogin(user *models.User) (string, error) {
	if slices.Contains(roleNames(*user), "student") {
		if err := s.sessionRepo.DeleteAllByUser(user.ID); err != nil {
			return "", err
		}
	}
	return s.createSession(user.ID)
}

func (s *Service) Logout(token string) error {
	return s.sessionRepo.Delete(token)
}

func (s *Service) ValidateSession(token string) (*models.User, error) {
	session, err := s.sessionRepo.GetByToken(token)
	if err != nil {
		return nil, err
	}
	// sliding expiration: perpanjang masa sesi pada tiap pemakaian yang valid.
	// non-fatal — kalau update gagal, sesi tetap valid untuk request ini.
	_ = s.sessionRepo.Touch(session.ID, time.Now().Add(sessionDuration).Unix())
	return s.userRepo.Get(session.UserID)
}

func (s *Service) createSession(userID uint) (string, error) {
	return s.createSessionTx(s.sessionRepo.db, userID)
}

// createSessionTx membuat sesi login memakai koneksi tertentu (bisa tx).
func (s *Service) createSessionTx(db *gorm.DB, userID uint) (string, error) {
	token, err := generateToken()
	if err != nil {
		return "", err
	}

	session := models.Session{
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(sessionDuration).Unix(),
	}

	if err := db.Create(&session).Error; err != nil {
		return "", err
	}

	return token, nil
}

func generateToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func roleNames(u models.User) []string {
	names := make([]string, len(u.Roles))
	for i, r := range u.Roles {
		names[i] = r.Name
	}
	return names
}

func (s *Service) ListUsers(search string, role string) ([]AdminListUsersResponse, error) {
	users, err := s.userRepo.List(search, role)
	if err != nil {
		return nil, err
	}
	result := make([]AdminListUsersResponse, len(users))
	for i, u := range users {
		result[i] = newAdminListUsersResponse(u)
	}
	return result, nil
}

// SearchStudents mencari teman (user ber-role student) untuk booking grup.
// excludeID = user pemanggil, supaya tidak bisa memilih diri sendiri.
func (s *Service) SearchStudents(q string, excludeID uint) ([]AdminListUsersResponse, error) {
	users, err := s.userRepo.SearchStudents(strings.TrimSpace(q), excludeID, 20)
	if err != nil {
		return nil, err
	}
	result := make([]AdminListUsersResponse, len(users))
	for i, u := range users {
		result[i] = newAdminListUsersResponse(u)
	}
	return result, nil
}

// AdminCreateStudent membuat user ber-role student.
func (s *Service) AdminCreateStudent(input AdminCreateUserRequest) (*AdminCreateUserResponse, error) {
	name := strings.TrimSpace(input.Name)
	email := strings.TrimSpace(input.Email)
	if name == "" {
		return nil, errors.New("nama wajib diisi")
	}
	if email == "" {
		return nil, errors.New("email wajib diisi")
	}
	if _, err := s.userRepo.GetByEmail(email); err == nil {
		return nil, errEmailExists
	}

	u := models.User{Name: name, Email: email}
	err := s.userRepo.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&u).Error; err != nil {
			return err
		}
		var studentRole models.Role
		if err := tx.Where("name = ?", "student").First(&studentRole).Error; err != nil {
			return err
		}
		return tx.Model(&u).Association("Roles").Append(&studentRole)
	})
	if err != nil {
		return nil, errInternal
	}
	r := newAdminCreateUserResponse(u)
	return &r, nil
}

// UpdateUserEmail mengganti email user. Dipakai utk menghubungkan akun dummy
// dengan email asli murid, sehingga login Google otomatis ter-link.
// MergeDummyUser menghubungkan akun dummy (tanpa google_id) ke akun Google yang
// sudah ada: data dummy (booking, invoice, akses kelas, forum) dipindah ke akun
// Google, lalu akun dummy dihapus. Admin melihat dua akun terpisah di Kelola
// User karena murid login Google duluan sebelum email-nya di-set ke dummy.
func (s *Service) MergeDummyUser(dummyID, targetID uint) (*AdminMergeUserResponse, error) {
	if dummyID == targetID {
		return nil, errors.New("target harus akun Google yang berbeda")
	}
	dummy, err := s.userRepo.Get(dummyID)
	if err != nil {
		return nil, errors.New("akun dummy tidak ditemukan")
	}
	target, err := s.userRepo.Get(targetID)
	if err != nil {
		return nil, errors.New("akun Google tidak ditemukan")
	}
	if dummy.GoogleID != "" {
		return nil, errors.New("akun yang dipilih sudah punya google_id")
	}
	if dummy.Password != nil {
		return nil, errors.New("akun yang dipilih sudah punya password — bukan akun dummy")
	}
	if target.GoogleID == "" {
		return nil, errors.New("target harus akun yang sudah login Google")
	}
	if !slices.Contains(roleNames(*dummy), "student") {
		return nil, errors.New("hanya akun murid (student) yang bisa dihubungkan")
	}
	if !slices.Contains(roleNames(*target), "student") {
		return nil, errors.New("target harus ber-role student")
	}

	if err := s.userRepo.Merge(dummyID, targetID); err != nil {
		return nil, errInternal
	}
	merged, err := s.userRepo.Get(targetID)
	if err != nil {
		return nil, errNotFound
	}
	r := newAdminMergeUserResponse(*merged)
	return &r, nil
}

func (s *Service) UpdateUserEmail(id uint, email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return errors.New("email wajib diisi")
	}
	if existing, err := s.userRepo.GetByEmail(email); err == nil && existing.ID != id {
		return errEmailExists
	}
	return s.userRepo.UpdateEmail(id, email)
}

// SetTeacherPermissions mengubah izin kelola konten guru (materi / paket soal).
// Hanya field non-nil yang di-update (PATCH semantics).
func (s *Service) SetTeacherPermissions(id uint, input AdminUpdateTeacherPermissionsRequest) error {
	if _, err := s.userRepo.Get(id); err != nil {
		return errNotFound
	}
	updates := map[string]any{}
	if input.CanManageMaterials != nil {
		updates["can_manage_materials"] = *input.CanManageMaterials
	}
	if input.CanManageQuestionPackages != nil {
		updates["can_manage_question_packages"] = *input.CanManageQuestionPackages
	}
	if len(updates) == 0 {
		return errors.New("tidak ada field yang diubah")
	}
	return s.userRepo.UpdatePermissions(id, updates)
}

func (s *Service) SetTeacherSubjects(id uint, input AdminUpdateTeacherSubjectsRequest) (*AdminUpdateTeacherSubjectsResponse, error) {
	if err := s.userRepo.SetTeacherSubjects(id, input.SubjectIDs); err != nil {
		return nil, err
	}
	u, err := s.userRepo.Get(id)
	if err != nil {
		return nil, err
	}
	r := newAdminUpdateTeacherSubjectsResponse(*u)
	return &r, nil
}

func (s *Service) UpdateUserRole(id uint, roles []string) error {
	validRoles := map[string]bool{"student": true, "teacher": true, "admin": true}
	for _, r := range roles {
		if !validRoles[r] {
			return errors.New("role tidak valid: " + r)
		}
	}
	if len(roles) == 0 {
		return errors.New("minimal 1 role")
	}
	// hanya teacher & admin yang boleh multi-role; student harus single-role
	if len(roles) > 1 {
		for _, r := range roles {
			if r == "student" {
				return errors.New("role student tidak boleh digabung dengan role lain")
			}
		}
	}
	return s.userRepo.UpdateRole(id, roles)
}

func (s *Service) UpdatePaymentStatus(id uint, status string) error {
	valid := map[string]bool{"pending": true, "paid": true}
	if !valid[status] {
		return errors.New("status tidak valid")
	}
	return s.userRepo.UpdatePaymentStatus(id, status)
}

func (s *Service) UpdateProfile(id uint, input UpdateProfileRequest) (*UpdateProfileResponse, error) {
	if input.Name != nil {
		if err := s.userRepo.UpdateName(id, *input.Name); err != nil {
			return nil, errInternal
		}
	}

	user, err := s.userRepo.Get(id)
	if err != nil {
		return nil, errNotFound
	}
	resp := newUpdateProfileResponse(*user)
	return &resp, nil
}

func (s *Service) DeleteUser(id uint) error {
	return s.userRepo.Delete(id)
}

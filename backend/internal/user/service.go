package user

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"slices"
	"time"

	"bimbel2/backend/internal/models"
)

// sessionDuration dipakai untuk sliding expiration: diperpanjang tiap token dipakai.
const sessionDuration = models.SessionTTL // 7 hari

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID            uint          `json:"id"`
	Name          string        `json:"name"`
	Email         string        `json:"email"`
	Roles         []string      `json:"roles"`
	AvatarURL     string        `json:"avatar_url"`
	PaymentStatus string        `json:"payment_status"`
	ClassID       *uint         `json:"class_id"`
	Subjects      []SubjectInfo `json:"subjects"`
}

type AdminUserResponse struct {
	ID            uint          `json:"id"`
	Name          string        `json:"name"`
	Email         string        `json:"email"`
	Roles         []string      `json:"roles"`
	AvatarURL     string        `json:"avatar_url"`
	PaymentStatus string        `json:"payment_status"`
	CreatedAt     string        `json:"created_at"`
	Subjects      []SubjectInfo `json:"subjects"`
}

type SubjectInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

type MessageResponse struct {
	Message string `json:"message" example:"berhasil"`
}

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
		return &AuthResponse{Token: token, User: toResponse(*user)}, nil
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
		return &AuthResponse{Token: token, User: toResponse(*user)}, nil
	}

	// create new user
	user = &models.User{
		Name:      name,
		Email:     email,
		GoogleID:  googleID,
		AvatarURL: avatarURL,
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, errInternal
	}

	// assign default role via association — user OAuth baru belum berlangganan → role "user"
	var userRole models.Role
	if err := s.userRepo.db.Where("name = ?", "user").First(&userRole).Error; err != nil {
		return nil, errInternal
	}
	if err := s.userRepo.db.Model(user).Association("Roles").Append(&userRole); err != nil {
		return nil, errInternal
	}

	token, err := s.createSessionForLogin(user)
	if err != nil {
		return nil, errInternal
	}
	return &AuthResponse{Token: token, User: toResponse(*user)}, nil
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
	token, err := generateToken()
	if err != nil {
		return "", err
	}

	session := models.Session{
		UserID:    userID,
		Token:     token,
		ExpiresAt: time.Now().Add(sessionDuration).Unix(),
	}

	if err := s.sessionRepo.Create(&session); err != nil {
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

func (s *Service) ListUsers(search string, role string) ([]AdminUserResponse, error) {
	users, err := s.userRepo.List(search, role)
	if err != nil {
		return nil, err
	}
	result := make([]AdminUserResponse, len(users))
	for i, u := range users {
		result[i] = AdminUserResponse{
			ID:            u.ID,
			Name:          u.Name,
			Email:         u.Email,
			Roles:         roleNames(u),
			AvatarURL:     u.AvatarURL,
			PaymentStatus: u.PaymentStatus,
			CreatedAt:     u.CreatedAt.Format("2006-01-02"),
			Subjects:      subjectInfos(u.Subjects),
		}
	}
	return result, nil
}

func subjectInfos(subjects []models.Subject) []SubjectInfo {
	res := make([]SubjectInfo, len(subjects))
	for i, s := range subjects {
		res[i] = SubjectInfo{ID: s.ID, Name: s.Name}
	}
	return res
}

// UpdateRoleRequest adalah body request untuk update role user
type UpdateRoleRequest struct {
	Roles []string `json:"roles" example:"[\"student\",\"teacher\"]"`
}

type SetTeacherSubjectsInput struct {
	SubjectIDs []uint `json:"subject_ids"`
}

func (s *Service) SetTeacherSubjects(id uint, input SetTeacherSubjectsInput) (*AdminUserResponse, error) {
	if err := s.userRepo.SetTeacherSubjects(id, input.SubjectIDs); err != nil {
		return nil, err
	}
	u, err := s.userRepo.Get(id)
	if err != nil {
		return nil, err
	}
	return &AdminUserResponse{
		ID:            u.ID,
		Name:          u.Name,
		Email:         u.Email,
		Roles:         roleNames(*u),
		AvatarURL:     u.AvatarURL,
		PaymentStatus: u.PaymentStatus,
		CreatedAt:     u.CreatedAt.Format("2006-01-02"),
		Subjects:      subjectInfos(u.Subjects),
	}, nil
}

func (s *Service) UpdateUserRole(id uint, roles []string) error {
	validRoles := map[string]bool{"student": true, "teacher": true, "admin": true, "user": true}
	for _, r := range roles {
		if !validRoles[r] {
			return errors.New("role tidak valid: " + r)
		}
	}
	if len(roles) == 0 {
		return errors.New("minimal 1 role")
	}
	// hanya teacher & admin yang boleh multi-role; student/user harus single-role
	if len(roles) > 1 {
		for _, r := range roles {
			if r == "student" || r == "user" {
				return errors.New("role " + r + " tidak boleh digabung dengan role lain")
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

type UpdateProfileInput struct {
	Name       *string `json:"name"`
	ClassID    *uint   `json:"class_id"`
	SubjectIDs *[]uint `json:"subject_ids"`
}

func (s *Service) UpdateProfile(id uint, input UpdateProfileInput) (*UserResponse, error) {
	if input.Name != nil {
		if err := s.userRepo.UpdateName(id, *input.Name); err != nil {
			return nil, errInternal
		}
	}
	if input.ClassID != nil {
		if err := s.userRepo.UpdateClassID(id, *input.ClassID); err != nil {
			return nil, errInternal
		}
	}
	if input.SubjectIDs != nil {
		if err := s.userRepo.SetTeacherSubjects(id, *input.SubjectIDs); err != nil {
			return nil, errInternal
		}
	}

	user, err := s.userRepo.Get(id)
	if err != nil {
		return nil, errNotFound
	}
	resp := toResponse(*user)
	return &resp, nil
}

func (s *Service) DeleteUser(id uint) error {
	return s.userRepo.Delete(id)
}

func toResponse(u models.User) UserResponse {
	return UserResponse{
		ID:            u.ID,
		Name:          u.Name,
		Email:         u.Email,
		Roles:         roleNames(u),
		AvatarURL:     u.AvatarURL,
		PaymentStatus: u.PaymentStatus,
		ClassID:       u.ClassID,
		Subjects:      subjectInfos(u.Subjects),
	}
}

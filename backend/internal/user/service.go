package user

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"bimbel2/backend/internal/models"
)

const sessionDuration = 30 * 24 * time.Hour // 1 bulan

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	AvatarURL     string `json:"avatar_url"`
	PaymentStatus string `json:"payment_status"`
	ClassID       *uint  `json:"class_id"`
}

type AdminUserResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	AvatarURL     string `json:"avatar_url"`
	PaymentStatus string `json:"payment_status"`
	CreatedAt     string `json:"created_at"`
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
		token, err := s.createSession(user.ID)
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
		token, err := s.createSession(user.ID)
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
		Role:      "student",
	}
	if err := s.userRepo.Create(user); err != nil {
		return nil, errInternal
	}

	token, err := s.createSession(user.ID)
	if err != nil {
		return nil, errInternal
	}
	return &AuthResponse{Token: token, User: toResponse(*user)}, nil
}

func (s *Service) Logout(token string) error {
	return s.sessionRepo.Delete(token)
}

func (s *Service) ValidateSession(token string) (*models.User, error) {
	session, err := s.sessionRepo.GetByToken(token)
	if err != nil {
		return nil, err
	}
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

func (s *Service) ListUsers() ([]AdminUserResponse, error) {
	users, err := s.userRepo.List()
	if err != nil {
		return nil, err
	}
	result := make([]AdminUserResponse, len(users))
	for i, u := range users {
		result[i] = AdminUserResponse{
			ID:        u.ID,
			Name:      u.Name,
			Email:     u.Email,
			Role:      u.Role,
			AvatarURL:     u.AvatarURL,
			PaymentStatus: u.PaymentStatus,
					CreatedAt: u.CreatedAt.Format("2006-01-02"),
		}
	}
	return result, nil
}

func (s *Service) UpdateUserRole(id uint, role string) error {
	validRoles := map[string]bool{"student": true, "teacher": true, "admin": true}
	if !validRoles[role] {
		return errors.New("role tidak valid")
	}
	return s.userRepo.UpdateRole(id, role)
}

func (s *Service) UpdatePaymentStatus(id uint, status string) error {
	valid := map[string]bool{"pending": true, "paid": true}
	if !valid[status] {
		return errors.New("status tidak valid")
	}
	return s.userRepo.UpdatePaymentStatus(id, status)
}

type UpdateProfileInput struct {
	Name    *string `json:"name"`
	ClassID *uint   `json:"class_id"`
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
		Role:          u.Role,
		AvatarURL:     u.AvatarURL,
		PaymentStatus: u.PaymentStatus,
		ClassID:       u.ClassID,
	}
}

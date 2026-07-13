package user

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"bimbel2/backend/internal/models"

	"golang.org/x/crypto/bcrypt"
)

const sessionDuration = 30 * 24 * time.Hour // 1 bulan

type RegisterInput struct {
	Name            string `json:"name" validate:"required,min=3"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
	Role            string `json:"role" validate:"required,oneof=student teacher"`
}

type LoginInput struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type UserResponse struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

type Service struct {
	userRepo    *UserRepository
	sessionRepo *SessionRepository
}

func NewService(userRepo *UserRepository, sessionRepo *SessionRepository) *Service {
	return &Service{userRepo: userRepo, sessionRepo: sessionRepo}
}

func (s *Service) Register(input RegisterInput) (*AuthResponse, error) {
	if input.Password != input.ConfirmPassword {
		return nil, errPasswordMismatch
	}

	existing, _ := s.userRepo.GetByEmail(input.Email)
	if existing != nil {
		return nil, errEmailExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errInternal
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hash),
		Role:     input.Role,
	}
	if err := s.userRepo.Create(&user); err != nil {
		return nil, errInternal
	}

	token, err := s.createSession(user.ID)
	if err != nil {
		return nil, errInternal
	}

	return &AuthResponse{Token: token, User: toResponse(user)}, nil
}

func (s *Service) Login(input LoginInput) (*AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(input.Email)
	if err != nil {
		return nil, errInvalidCreds
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		return nil, errInvalidCreds
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

func toResponse(u models.User) UserResponse {
	return UserResponse{ID: u.ID, Name: u.Name, Email: u.Email, Role: u.Role}
}

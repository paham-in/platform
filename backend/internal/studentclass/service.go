package studentclass

import (
	"errors"
	"fmt"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/notification"

	"gorm.io/gorm"
)

type UserRef struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type ClassRef struct {
	ID          uint   `json:"id"`
	Name        string `json:"name"`
	ProgramName string `json:"program_name"`
}

type StudentClassEnrollmentResponse struct {
	ID        uint     `json:"id"`
	UserID    uint     `json:"user_id"`
	User      UserRef  `json:"user"`
	ClassID   uint     `json:"class_id"`
	Class     ClassRef `json:"class"`
	Expiry    string   `json:"expiry"`
	CreatedAt string   `json:"created_at"`
}

type Service struct {
	repo     *Repository
	db       *gorm.DB
	notifSvc *notification.Service
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
}

func (s *Service) SetNotificationService(n *notification.Service) {
	s.notifSvc = n
}

type ListFilter struct {
	UserID    uint   `json:"user_id"`
	ClassID   uint   `json:"class_id"`
	ProgramID uint   `json:"program_id"`
	Search    string `json:"search"`
}

func (s *Service) List(filter ListFilter) ([]StudentClassEnrollmentResponse, error) {
	sp, err := s.repo.List(filter.UserID, filter.ClassID, filter.ProgramID, filter.Search)
	if err != nil {
		return nil, err
	}
	result := make([]StudentClassEnrollmentResponse, len(sp))
	for i, v := range sp {
		result[i] = s.toResponse(v)
	}
	return result, nil
}

func (s *Service) Get(id uint) (*StudentClassEnrollmentResponse, error) {
	sp, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*sp)
	return &r, nil
}

type CreateInput struct {
	UserID  uint   `json:"user_id"`
	ClassID uint   `json:"class_id"`
	Expiry  string `json:"expiry"` // "YYYY-MM-DD"
}

func (s *Service) Create(input CreateInput) (*StudentClassEnrollmentResponse, error) {
	if input.UserID == 0 {
		return nil, errors.New("user_id wajib diisi")
	}
	if input.ClassID == 0 {
		return nil, errors.New("class_id wajib diisi")
	}
	if input.Expiry == "" {
		return nil, errors.New("expiry wajib diisi")
	}
	sp := models.StudentClassEnrollment{
		UserID:  input.UserID,
		ClassID: input.ClassID,
		Expiry:  input.Expiry,
	}
	// upsert: 1 user hanya boleh 1 akses per kelas
	if err := s.repo.Upsert(&sp); err != nil {
		return nil, err
	}
	created, err := s.repo.Get(sp.ID)
	if err != nil {
		return nil, err
	}

	if s.notifSvc != nil {
		var cls models.Class
		s.db.First(&cls, input.ClassID)
		title := "Akses kelas diberikan"
		body := fmt.Sprintf("Kamu mendapatkan akses ke kelas %s hingga %s", cls.Name, input.Expiry)
		s.notifSvc.Notify(input.UserID, title, body, "student_class_enrollment", "/dashboard/my-classes")
	}

	r := s.toResponse(*created)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) toResponse(sp models.StudentClassEnrollment) StudentClassEnrollmentResponse {
	var u models.User
	var cls models.Class
	s.db.Model(&models.User{}).Where("id = ?", sp.UserID).First(&u)
	s.db.Model(&models.Class{}).Where("id = ?", sp.ClassID).First(&cls)
	programName := ""
	if cls.ProgramID != nil {
		var prog models.Program
		s.db.Model(&models.Program{}).Where("id = ?", *cls.ProgramID).First(&prog)
		programName = prog.Name
	}
	return StudentClassEnrollmentResponse{
		ID:      sp.ID,
		UserID:  sp.UserID,
		User:    UserRef{ID: u.ID, Name: u.Name},
		ClassID: sp.ClassID,
		Class:   ClassRef{ID: cls.ID, Name: cls.Name, ProgramName: programName},
		Expiry:  sp.Expiry,
		CreatedAt: sp.CreatedAt.Format("2006-01-02"),
	}
}

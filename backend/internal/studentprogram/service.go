package studentprogram

import (
	"errors"

	"bimbel2/backend/internal/models"

	"gorm.io/gorm"
)

type UserRef struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type ProgramRef struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

type StudentProgramResponse struct {
	ID        uint     `json:"id"`
	UserID    uint     `json:"user_id"`
	User      UserRef  `json:"user"`
	ProgramID uint     `json:"program_id"`
	Program   ProgramRef `json:"program"`
	Expiry    string   `json:"expiry"`
	CreatedAt string   `json:"created_at"`
}

type Service struct {
	repo *Repository
	db   *gorm.DB
}

func NewService(repo *Repository, db *gorm.DB) *Service {
	return &Service{repo: repo, db: db}
}

type ListFilter struct {
	UserID    uint `json:"user_id"`
	ProgramID uint `json:"program_id"`
}

func (s *Service) List(filter ListFilter) ([]StudentProgramResponse, error) {
	sp, err := s.repo.List(filter.UserID, filter.ProgramID)
	if err != nil {
		return nil, err
	}
	result := make([]StudentProgramResponse, len(sp))
	for i, v := range sp {
		result[i] = s.toResponse(v)
	}
	return result, nil
}

func (s *Service) Get(id uint) (*StudentProgramResponse, error) {
	sp, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*sp)
	return &r, nil
}

type CreateInput struct {
	UserID    uint   `json:"user_id"`
	ProgramID uint   `json:"program_id"`
	Expiry    string `json:"expiry"` // "YYYY-MM-DD"
}

func (s *Service) Create(input CreateInput) (*StudentProgramResponse, error) {
	if input.UserID == 0 {
		return nil, errors.New("user_id wajib diisi")
	}
	if input.ProgramID == 0 {
		return nil, errors.New("program_id wajib diisi")
	}
	if input.Expiry == "" {
		return nil, errors.New("expiry wajib diisi")
	}
	sp := models.StudentProgram{
		UserID:    input.UserID,
		ProgramID: input.ProgramID,
		Expiry:    input.Expiry,
	}
	// upsert: 1 user hanya boleh 1 akses per program
	if err := s.repo.Upsert(&sp); err != nil {
		return nil, err
	}
	created, err := s.repo.Get(sp.ID)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*created)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) toResponse(sp models.StudentProgram) StudentProgramResponse {
	var u models.User
	var prog models.Program
	s.db.Model(&models.User{}).Where("id = ?", sp.UserID).First(&u)
	s.db.Model(&models.Program{}).Where("id = ?", sp.ProgramID).First(&prog)
	return StudentProgramResponse{
		ID:        sp.ID,
		UserID:    sp.UserID,
		User:      UserRef{ID: u.ID, Name: u.Name},
		ProgramID: sp.ProgramID,
		Program:   ProgramRef{ID: prog.ID, Name: prog.Name},
		Expiry:    sp.Expiry,
		CreatedAt: sp.CreatedAt.Format("2006-01-02"),
	}
}

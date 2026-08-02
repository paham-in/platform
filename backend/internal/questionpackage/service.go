package questionpackage

import (
	"errors"

	"bimbel2/backend/internal/models"
)

// QuestionBankMini — simplified view of a question for package response
type QuestionBankMini struct {
	ID           uint     `json:"id"`
	ChapterID    uint     `json:"chapter_id"`
	Question     string   `json:"question"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correct_index"`
}

// PackageQuestionResponse
type PackageQuestionResponse struct {
	ID        uint               `json:"id"`
	Question  string             `json:"question"`
	Options   []string           `json:"options"`
}

// PackageResponse
type PackageResponse struct {
	ID          uint                     `json:"id"`
	Name        string                   `json:"name"`
	Description string                   `json:"description"`
	Questions   []PackageQuestionResponse `json:"questions"`
	CreatedAt   string                   `json:"created_at"`
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type CreateInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	QuestionIDs []uint `json:"question_ids"`
}

func (s *Service) Create(input CreateInput) (*PackageResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama paket wajib diisi")
	}

	pkg := models.QuestionPackage{
		Name:        input.Name,
		Description: input.Description,
	}
	if err := s.repo.Create(&pkg); err != nil {
		return nil, err
	}
	if len(input.QuestionIDs) > 0 {
		if err := s.repo.SetQuestions(pkg.ID, input.QuestionIDs); err != nil {
			return nil, err
		}
	}
	created, err := s.repo.Get(pkg.ID)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*created)
	return &r, nil
}

type UpdateInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	QuestionIDs *[]uint `json:"question_ids"`
}

func (s *Service) Update(id uint, input UpdateInput) (*PackageResponse, error) {
	pkg, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	if input.Name != nil {
		pkg.Name = *input.Name
	}
	if input.Description != nil {
		pkg.Description = *input.Description
	}
	if err := s.repo.Update(pkg); err != nil {
		return nil, err
	}
	if input.QuestionIDs != nil {
		if err := s.repo.SetQuestions(id, *input.QuestionIDs); err != nil {
			return nil, err
		}
	}
	updated, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*updated)
	return &r, nil
}

func (s *Service) List() ([]PackageResponse, error) {
	packages, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]PackageResponse, len(packages))
	for i, pkg := range packages {
		result[i] = s.toResponse(pkg)
	}
	return result, nil
}

func (s *Service) Get(id uint) (*PackageResponse, error) {
	pkg, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.toResponse(*pkg)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) toResponse(pkg models.QuestionPackage) PackageResponse {
	questions := make([]PackageQuestionResponse, len(pkg.Questions))
	for i, q := range pkg.Questions {
		questions[i] = PackageQuestionResponse{
			ID:        q.ID,
			Question:  q.Question,
			Options:   q.Options,
		}
	}
	return PackageResponse{
		ID:          pkg.ID,
		Name:        pkg.Name,
		Description: pkg.Description,
		Questions:   questions,
		CreatedAt:   pkg.CreatedAt.Format("2006-01-02 15:04"),
	}
}

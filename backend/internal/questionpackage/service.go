package questionpackage

import (
	"errors"

	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/storage"
)

// PackageQuestionResponse
type PackageQuestionResponse struct {
	ID       uint   `json:"id"`
	Question string `json:"question"`
}

// PackageResponse
type PackageResponse struct {
	ID          uint                     `json:"id"`
	Name        string                   `json:"name"`
	Description string                   `json:"description"`
	SubjectID   uint                     `json:"subject_id"`
	SubjectName string                   `json:"subject_name"`
	IsFree      bool                     `json:"is_free"`
	Questions   []PackageQuestionResponse `json:"questions"`
	CreatedAt   string                   `json:"created_at"`
}

type Service struct {
	repo    *Repository
	storage *storage.ObjectStorage
}

func NewService(repo *Repository, store *storage.ObjectStorage) *Service {
	return &Service{repo: repo, storage: store}
}

type CreateInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	SubjectID   uint   `json:"subject_id"`
	IsFree      bool   `json:"is_free"`
}

func (s *Service) Create(input CreateInput) (*PackageResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama paket wajib diisi")
	}
	if input.SubjectID == 0 {
		return nil, errors.New("mata pelajaran wajib diisi")
	}

	pkg := models.QuestionPackage{
		Name:        input.Name,
		Description: input.Description,
		SubjectID:   input.SubjectID,
		IsFree:      input.IsFree,
	}
	if err := s.repo.Create(&pkg); err != nil {
		return nil, err
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
	SubjectID   *uint   `json:"subject_id"`
	IsFree      *bool   `json:"is_free"`
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
	if input.SubjectID != nil {
		pkg.SubjectID = *input.SubjectID
	}
	if input.IsFree != nil {
		pkg.IsFree = *input.IsFree
	}
	if err := s.repo.Update(pkg); err != nil {
		return nil, err
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

// ListVisible untuk akses murid/user. includePremium=false membatasi ke paket free.
func (s *Service) ListVisible(includePremium bool) ([]PackageResponse, error) {
	packages, err := s.repo.ListVisible(includePremium)
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
			ID:       q.ID,
			Question: s.storage.RewriteContentImages(q.Question),
		}
	}
	return PackageResponse{
		ID:          pkg.ID,
		Name:        pkg.Name,
		Description: pkg.Description,
		SubjectID:   pkg.SubjectID,
		SubjectName: pkg.Subject.Name,
		IsFree:      pkg.IsFree,
		Questions:   questions,
		CreatedAt:   pkg.CreatedAt.Format("2006-01-02 15:04"),
	}
}

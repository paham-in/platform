package subject

import (
	"errors"
	"strings"

	"bimbel2/backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type SubjectResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	ProgramID     *uint  `json:"program_id,omitempty"`
	MaterialCount int64  `json:"material_count"`
	ClassIDs      []uint `json:"class_ids"`
}

func (s *Service) List() ([]SubjectResponse, error) {
	subjects, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]SubjectResponse, len(subjects))
	for i, sub := range subjects {
		r, _ := s.buildResponse(sub)
		result[i] = *r
	}
	return result, nil
}

func (s *Service) Get(id uint) (*SubjectResponse, error) {
	sub, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	return s.buildResponse(*sub)
}

type CreateInput struct {
	Name      string `json:"name"`
	ProgramID *uint  `json:"program_id"`
	ClassIDs  []uint `json:"class_ids"`
}

func (s *Service) Create(input CreateInput) (*SubjectResponse, error) {
	if input.ProgramID == nil || *input.ProgramID == 0 {
		return nil, errors.New("program wajib diisi")
	}
	if outside, err := s.repo.HasClassOutsideProgram(*input.ProgramID, input.ClassIDs); err != nil {
		return nil, err
	} else if outside {
		return nil, errors.New("kelas harus berada di program yang sama")
	}
	slug := strings.ToLower(strings.ReplaceAll(input.Name, " ", "-"))
	subject := models.Subject{
		Name:      input.Name,
		Slug:      slug,
		ProgramID: input.ProgramID,
	}
	if err := s.repo.Create(&subject); err != nil {
		return nil, err
	}
	if len(input.ClassIDs) > 0 {
		if err := s.repo.SetClasses(subject.ID, input.ClassIDs); err != nil {
			return nil, err
		}
	}
	return s.Get(subject.ID)
}

type UpdateInput struct {
	Name      *string `json:"name"`
	ProgramID *uint   `json:"program_id"`
	ClassIDs  *[]uint `json:"class_ids"`
}

func (s *Service) Update(id uint, input UpdateInput) (*SubjectResponse, error) {
	sub, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	programID := sub.ProgramID
	if input.ProgramID != nil {
		programID = input.ProgramID
	}
	// gabungkan kelas existing + kelas baru untuk validasi terhadap program
	classIDs := []uint{}
	if existing, err := s.repo.GetClassIDs(id); err == nil {
		classIDs = append(classIDs, existing...)
	}
	if input.ClassIDs != nil {
		classIDs = append(classIDs, *input.ClassIDs...)
	}
	if programID != nil && *programID != 0 {
		if outside, err := s.repo.HasClassOutsideProgram(*programID, classIDs); err != nil {
			return nil, err
		} else if outside {
			return nil, errors.New("kelas harus berada di program yang sama")
		}
	}
	updates := map[string]any{}
	if input.Name != nil {
		updates["name"] = *input.Name
		updates["slug"] = strings.ToLower(strings.ReplaceAll(*input.Name, " ", "-"))
	}
	if input.ProgramID != nil {
		updates["program_id"] = *input.ProgramID
	}
	if len(updates) > 0 {
		if err := s.repo.Update(id, updates); err != nil {
			return nil, err
		}
	}
	if input.ClassIDs != nil {
		if err := s.repo.SetClasses(id, *input.ClassIDs); err != nil {
			return nil, err
		}
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *Service) buildResponse(sub models.Subject) (*SubjectResponse, error) {
	classIDs, _ := s.repo.GetClassIDs(sub.ID)
	count, _ := s.repo.MaterialCount(sub.ID)
	return &SubjectResponse{
		ID:            sub.ID,
		Name:          sub.Name,
		Slug:          sub.Slug,
		ProgramID:     sub.ProgramID,
		MaterialCount: count,
		ClassIDs:      classIDs,
	}, nil
}

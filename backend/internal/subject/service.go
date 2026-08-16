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

func (s *Service) List(search string, classID uint) ([]ListSubjectsResponse, error) {
	subjects, err := s.repo.List(search, classID)
	if err != nil {
		return nil, err
	}
	result := make([]ListSubjectsResponse, len(subjects))
	for i, sub := range subjects {
		result[i] = s.newListSubjectsResponse(sub)
	}
	return result, nil
}

func (s *Service) Create(input AdminCreateSubjectRequest) (*AdminCreateSubjectResponse, error) {
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
	// subject + relasi class_subjects dalam satu transaksi.
	if err := s.repo.CreateWithClasses(&subject, input.ClassIDs); err != nil {
		return nil, err
	}
	sub, err := s.repo.Get(subject.ID)
	if err != nil {
		return nil, err
	}
	r := s.newAdminCreateSubjectResponse(*sub)
	return &r, nil
}

func (s *Service) Update(id uint, input AdminUpdateSubjectRequest) (*AdminUpdateSubjectResponse, error) {
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
	// update subject + relasi class_subjects dalam satu transaksi.
	newClassIDs := []uint{}
	if input.ClassIDs != nil {
		newClassIDs = *input.ClassIDs
	}
	if err := s.repo.UpdateWithClasses(id, updates, newClassIDs, input.ClassIDs != nil); err != nil {
		return nil, err
	}
	sub, err = s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := s.newAdminUpdateSubjectResponse(*sub)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

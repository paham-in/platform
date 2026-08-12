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
	GroupID     uint                     `json:"group_id"`
	GroupName   string                   `json:"group_name"`
	Questions   []PackageQuestionResponse `json:"questions"`
	CreatedAt   string                   `json:"created_at"`
}

// GroupResponse
type GroupResponse struct {
	ID           uint              `json:"id"`
	Name         string            `json:"name"`
	ClassID      uint              `json:"class_id"`
	ClassName    string            `json:"class_name"`
	IsFree       bool              `json:"is_free"`
	Description  string            `json:"description"`
	PackageCount int               `json:"package_count"`
	Packages     []PackageResponse `json:"packages"`
	CreatedAt    string            `json:"created_at"`
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
	GroupID     uint   `json:"group_id"`
}

func (s *Service) Create(input CreateInput) (*PackageResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama paket wajib diisi")
	}
	if input.SubjectID == 0 {
		return nil, errors.New("mata pelajaran wajib diisi")
	}
	if input.GroupID == 0 {
		return nil, errors.New("grup paket soal wajib diisi")
	}

	pkg := models.QuestionPackage{
		Name:        input.Name,
		Description: input.Description,
		SubjectID:   input.SubjectID,
		GroupID:     &input.GroupID,
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
	GroupID     *uint   `json:"group_id"`
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
	if input.GroupID != nil {
		pkg.GroupID = input.GroupID
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

// ListVisible untuk akses murid/user. classIDs non-nil membatasi grup premium ke
// kelas tertentu (nil = semua, staff); paket tanpa grup tidak pernah dikembalikan.
func (s *Service) ListVisible(classIDs []uint) ([]PackageResponse, error) {
	packages, err := s.repo.ListVisible(classIDs)
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

// ErrNoAccess dipakai GetVisible ketika paket di luar hak akses user.
var ErrNoAccess = errors.New("tidak ada akses ke paket ini")

// GetVisible mengambil detail paket untuk murid/user. classIDs nil = staff
// (lihat semua). Paket tanpa grup selalu ditolak untuk non-staff.
func (s *Service) GetVisible(id uint, classIDs []uint) (*PackageResponse, error) {
	pkg, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	if pkg.GroupID == nil {
		return nil, ErrNoAccess
	}
	if classIDs != nil && !pkg.Group.IsFree {
		allowed := false
		for _, cid := range classIDs {
			if cid == pkg.Group.ClassID {
				allowed = true
				break
			}
		}
		if !allowed {
			return nil, ErrNoAccess
		}
	}
	r := s.toResponse(*pkg)
	return &r, nil
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

type GroupCreateInput struct {
	Name        string `json:"name"`
	ClassID     uint   `json:"class_id"`
	IsFree      bool   `json:"is_free"`
	Description string `json:"description"`
}

func (s *Service) CreateGroup(input GroupCreateInput) (*GroupResponse, error) {
	if input.Name == "" {
		return nil, errors.New("nama grup wajib diisi")
	}
	if input.ClassID == 0 {
		return nil, errors.New("kelas wajib diisi")
	}

	group := models.QuestionPackageGroup{
		Name:        input.Name,
		ClassID:     input.ClassID,
		IsFree:      input.IsFree,
		Description: input.Description,
	}
	if err := s.repo.CreateGroup(&group); err != nil {
		return nil, err
	}
	created, err := s.repo.GetGroup(group.ID)
	if err != nil {
		return nil, err
	}
	r := s.toGroupResponse(*created)
	return &r, nil
}

type GroupUpdateInput struct {
	Name        *string `json:"name"`
	ClassID     *uint   `json:"class_id"`
	IsFree      *bool   `json:"is_free"`
	Description *string `json:"description"`
}

func (s *Service) UpdateGroup(id uint, input GroupUpdateInput) (*GroupResponse, error) {
	group, err := s.repo.GetGroup(id)
	if err != nil {
		return nil, err
	}
	if input.Name != nil {
		group.Name = *input.Name
	}
	if input.ClassID != nil {
		group.ClassID = *input.ClassID
	}
	if input.IsFree != nil {
		group.IsFree = *input.IsFree
	}
	if input.Description != nil {
		group.Description = *input.Description
	}
	if err := s.repo.UpdateGroup(group); err != nil {
		return nil, err
	}
	updated, err := s.repo.GetGroup(id)
	if err != nil {
		return nil, err
	}
	r := s.toGroupResponse(*updated)
	return &r, nil
}

func (s *Service) DeleteGroup(id uint) error {
	return s.repo.DeleteGroup(id)
}

// ListGroups mengembalikan daftar grup. classIDs nil = semua (staff); non-nil
// membatasi ke kelas yang boleh diakses student (termasuk grup free).
func (s *Service) ListGroups(classIDs []uint) ([]GroupResponse, error) {
	groups, err := s.repo.ListGroups(classIDs)
	if err != nil {
		return nil, err
	}
	result := make([]GroupResponse, len(groups))
	for i, g := range groups {
		result[i] = s.toGroupResponse(g)
	}
	return result, nil
}

func (s *Service) GetGroup(id uint) (*GroupResponse, error) {
	group, err := s.repo.GetGroup(id)
	if err != nil {
		return nil, err
	}
	r := s.toGroupResponse(*group)
	return &r, nil
}

func (s *Service) toResponse(pkg models.QuestionPackage) PackageResponse {
	questions := make([]PackageQuestionResponse, len(pkg.Questions))
	for i, q := range pkg.Questions {
		questions[i] = PackageQuestionResponse{
			ID:       q.ID,
			Question: s.storage.RewriteContentImages(q.Question),
		}
	}
	groupID := uint(0)
	groupName := ""
	if pkg.Group.ID != 0 {
		groupID = pkg.Group.ID
		groupName = pkg.Group.Name
	}
	return PackageResponse{
		ID:          pkg.ID,
		Name:        pkg.Name,
		Description: pkg.Description,
		SubjectID:   pkg.SubjectID,
		SubjectName: pkg.Subject.Name,
		IsFree:      pkg.IsFree,
		GroupID:     groupID,
		GroupName:   groupName,
		Questions:   questions,
		CreatedAt:   pkg.CreatedAt.Format("2006-01-02 15:04"),
	}
}

func (s *Service) toGroupResponse(g models.QuestionPackageGroup) GroupResponse {
	packages := make([]PackageResponse, len(g.Packages))
	for i, p := range g.Packages {
		packages[i] = s.toResponse(p)
	}
	return GroupResponse{
		ID:           g.ID,
		Name:         g.Name,
		ClassID:      g.ClassID,
		ClassName:    g.Class.Name,
		IsFree:       g.IsFree,
		Description:  g.Description,
		PackageCount: len(g.Packages),
		Packages:     packages,
		CreatedAt:    g.CreatedAt.Format("2006-01-02 15:04"),
	}
}

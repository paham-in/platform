package subject

import "bimbel2/backend/internal/models"

// ErrorResponse adalah envelope error generik yang dipakai semua handler
// sengaja dibiarkan shared (isi selalu sama: pesan error), bukan response
// khusus satu handler.
type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

//, handler: ListSubjects (GET /subjects)

type ListSubjectsResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	ProgramID     *uint  `json:"program_id,omitempty"`
	MaterialCount int64  `json:"material_count"`
	ClassIDs      []uint `json:"class_ids"`
}

func (s *Service) newListSubjectsResponse(sub models.Subject) ListSubjectsResponse {
	classIDs, _ := s.repo.GetClassIDs(sub.ID)
	count, _ := s.repo.MaterialCount(sub.ID)
	return ListSubjectsResponse{
		ID:            sub.ID,
		Name:          sub.Name,
		Slug:          sub.Slug,
		ProgramID:     sub.ProgramID,
		MaterialCount: count,
		ClassIDs:      classIDs,
	}
}

//, handler: AdminCreateSubject (POST /admin/subjects)

type AdminCreateSubjectResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	ProgramID     *uint  `json:"program_id,omitempty"`
	MaterialCount int64  `json:"material_count"`
	ClassIDs      []uint `json:"class_ids"`
}

func (s *Service) newAdminCreateSubjectResponse(sub models.Subject) AdminCreateSubjectResponse {
	classIDs, _ := s.repo.GetClassIDs(sub.ID)
	count, _ := s.repo.MaterialCount(sub.ID)
	return AdminCreateSubjectResponse{
		ID:            sub.ID,
		Name:          sub.Name,
		Slug:          sub.Slug,
		ProgramID:     sub.ProgramID,
		MaterialCount: count,
		ClassIDs:      classIDs,
	}
}

//, handler: AdminUpdateSubject (PATCH /admin/subjects/:id)

type AdminUpdateSubjectResponse struct {
	ID            uint   `json:"id"`
	Name          string `json:"name"`
	Slug          string `json:"slug"`
	ProgramID     *uint  `json:"program_id,omitempty"`
	MaterialCount int64  `json:"material_count"`
	ClassIDs      []uint `json:"class_ids"`
}

func (s *Service) newAdminUpdateSubjectResponse(sub models.Subject) AdminUpdateSubjectResponse {
	classIDs, _ := s.repo.GetClassIDs(sub.ID)
	count, _ := s.repo.MaterialCount(sub.ID)
	return AdminUpdateSubjectResponse{
		ID:            sub.ID,
		Name:          sub.Name,
		Slug:          sub.Slug,
		ProgramID:     sub.ProgramID,
		MaterialCount: count,
		ClassIDs:      classIDs,
	}
}

//, handler: AdminDeleteSubject (DELETE /admin/subjects/:id)

type AdminDeleteSubjectResponse struct {
	Message string `json:"message" example:"berhasil dihapus"`
}

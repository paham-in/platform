package subject

// — handler: AdminCreateSubject (POST /admin/subjects) —

type AdminCreateSubjectRequest struct {
	Name      string `json:"name"`
	ProgramID *uint  `json:"program_id"`
	ClassIDs  []uint `json:"class_ids"`
}

// — handler: AdminUpdateSubject (PATCH /admin/subjects/:id) —

type AdminUpdateSubjectRequest struct {
	Name      *string `json:"name"`
	ProgramID *uint   `json:"program_id"`
	ClassIDs  *[]uint `json:"class_ids"`
}

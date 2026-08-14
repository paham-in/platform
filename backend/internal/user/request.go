package user

// — handler: AdminCreateUser (POST /admin/users) —
// Membuat akun murid manual (misal murid yang belum punya akun sendiri).
// Akses kelas diatur terpisah lewat student_classes setelah admin approve langganan.
type AdminCreateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// — handler: AdminMergeUser (POST /admin/users/:id/merge) —
type AdminMergeUserRequest struct {
	TargetID uint `json:"target_id"`
}

// — handler: AdminUpdateEmail (PATCH /admin/users/:id/email) —
type AdminUpdateEmailRequest struct {
	Email string `json:"email"`
}

// — handler: AdminUpdateRole (PATCH /admin/users/:id/role) —
type AdminUpdateRoleRequest struct {
	Roles []string `json:"roles" example:"[\"student\",\"teacher\"]"`
}

// — handler: AdminUpdateTeacherSubjects (PATCH /admin/users/:id/subjects) —
type AdminUpdateTeacherSubjectsRequest struct {
	SubjectIDs []uint `json:"subject_ids"`
}

// — handler: AdminUpdateTeacherPermissions (PATCH /admin/users/:id/permissions) —
type AdminUpdateTeacherPermissionsRequest struct {
	CanManageMaterials        *bool `json:"can_manage_materials"`
	CanManageQuestionPackages *bool `json:"can_manage_question_packages"`
}

// — handler: AdminTogglePayment (PATCH /admin/users/:id/payment) —
type AdminTogglePaymentRequest struct {
	Status string `json:"status"`
}

// — handler: UpdateProfile (PATCH /me) —
type UpdateProfileRequest struct {
	Name *string `json:"name"`
}

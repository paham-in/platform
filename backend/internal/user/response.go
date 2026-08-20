package user

import "bimbel2/backend/internal/models"

// ErrorResponse adalah envelope error generik yang dipakai semua handler —
// sengaja dibiarkan shared (isi selalu sama: pesan error), bukan response
// khusus satu handler.
type ErrorResponse struct {
	Error string `json:"error" example:"error message"`
}

// — handler: Logout (POST /logout) —

type LogoutResponse struct {
	Message string `json:"message" example:"berhasil logout"`
}

// — handler: AdminUpdateRole (PATCH /admin/users/:id/role) —

type AdminUpdateRoleResponse struct {
	Message string `json:"message" example:"role berhasil diubah"`
}

// — handler: AdminUpdateEmail (PATCH /admin/users/:id/email) —

type AdminUpdateEmailResponse struct {
	Message string `json:"message" example:"email berhasil diubah"`
}

// — handler: AdminUpdateTeacherPermissions (PATCH /admin/users/:id/permissions) —

type AdminUpdateTeacherPermissionsResponse struct {
	Message string `json:"message" example:"izin berhasil diubah"`
}

// — handler: AdminDeleteUser (DELETE /admin/users/:id) —

type AdminDeleteUserResponse struct {
	Message string `json:"message" example:"user berhasil dihapus"`
}

// — handler: AdminTogglePayment (PATCH /admin/users/:id/payment) —

type AdminTogglePaymentResponse struct {
	Message string `json:"message" example:"status berhasil diubah"`
}

// SubjectInfo adalah sub-object di dalam semua bentuk profil user.
type SubjectInfo struct {
	ID   uint   `json:"id"`
	Name string `json:"name"`
}

func subjectInfos(subjects []models.Subject) []SubjectInfo {
	res := make([]SubjectInfo, len(subjects))
	for i, s := range subjects {
		res[i] = SubjectInfo{ID: s.ID, Name: s.Name}
	}
	return res
}

func tpBool(u *models.TeacherPermission, field string) bool {
	if u == nil {
		return false
	}
	switch field {
	case "materials":
		return u.CanManageMaterials
	case "packages":
		return u.CanManageQuestionPackages
	}
	return false
}

// AuthResponse dipakai service OAuth (GoogleCallback redirect) — bukan response
// JSON handler, jadi tetap shared sebagai DTO service.
type AuthResponse struct {
	Token string     `json:"token"`
	User  MeResponse `json:"user"`
}

// — handler: Me (GET /me) —

type MeResponse struct {
	ID                        uint          `json:"id"`
	Name                      string        `json:"name"`
	Email                     string        `json:"email"`
	Roles                     []string      `json:"roles"`
	AvatarURL                 string        `json:"avatar_url"`
	PaymentStatus             string        `json:"payment_status"`
	Subjects                  []SubjectInfo `json:"subjects"`
	CanManageMaterials        bool          `json:"can_manage_materials"`
	CanManageQuestionPackages bool          `json:"can_manage_question_packages"`
}

func newMeResponse(u models.User) MeResponse {
	return MeResponse{
		ID:                        u.ID,
		Name:                      u.Name,
		Email:                     u.Email,
		Roles:                     roleNames(u),
		AvatarURL:                 u.AvatarURL,
		PaymentStatus:             u.PaymentStatus,
		Subjects:                  subjectInfos(u.Subjects),
		CanManageMaterials:        tpBool(u.TeacherPermission, "materials"),
		CanManageQuestionPackages: tpBool(u.TeacherPermission, "packages"),
	}
}

// — handler: UpdateProfile (PATCH /me) —

type UpdateProfileResponse struct {
	ID                        uint          `json:"id"`
	Name                      string        `json:"name"`
	Email                     string        `json:"email"`
	Roles                     []string      `json:"roles"`
	AvatarURL                 string        `json:"avatar_url"`
	PaymentStatus             string        `json:"payment_status"`
	Subjects                  []SubjectInfo `json:"subjects"`
	CanManageMaterials        bool          `json:"can_manage_materials"`
	CanManageQuestionPackages bool          `json:"can_manage_question_packages"`
}

func newUpdateProfileResponse(u models.User) UpdateProfileResponse {
	return UpdateProfileResponse{
		ID:                        u.ID,
		Name:                      u.Name,
		Email:                     u.Email,
		Roles:                     roleNames(u),
		AvatarURL:                 u.AvatarURL,
		PaymentStatus:             u.PaymentStatus,
		Subjects:                  subjectInfos(u.Subjects),
		CanManageMaterials:        tpBool(u.TeacherPermission, "materials"),
		CanManageQuestionPackages: tpBool(u.TeacherPermission, "packages"),
	}
}

// — handler: AdminListUsers (GET /admin/users) & AdminListStudents (GET /admin/students) —

type AdminListUsersResponse struct {
	ID                        uint          `json:"id"`
	Name                      string        `json:"name"`
	Email                     string        `json:"email"`
	Roles                     []string      `json:"roles"`
	AvatarURL                 string        `json:"avatar_url"`
	PaymentStatus             string        `json:"payment_status"`
	HasGoogle                 bool          `json:"has_google"`
	HasPassword               bool          `json:"has_password"`
	CreatedAt                 string        `json:"created_at"`
	Subjects                  []SubjectInfo `json:"subjects"`
	CanManageMaterials        bool          `json:"can_manage_materials"`
	CanManageQuestionPackages bool          `json:"can_manage_question_packages"`
}

func newAdminListUsersResponse(u models.User) AdminListUsersResponse {
	return AdminListUsersResponse{
		ID:                        u.ID,
		Name:                      u.Name,
		Email:                     u.Email,
		Roles:                     roleNames(u),
		AvatarURL:                 u.AvatarURL,
		PaymentStatus:             u.PaymentStatus,
		HasGoogle:                 u.GoogleID != "",
		HasPassword:               u.Password != nil,
		CreatedAt:                 u.CreatedAt.Format("2006-01-02"),
		Subjects:                  subjectInfos(u.Subjects),
		CanManageMaterials:        tpBool(u.TeacherPermission, "materials"),
		CanManageQuestionPackages: tpBool(u.TeacherPermission, "packages"),
	}
}

// — handler: AdminCreateUser (POST /admin/users) —

type AdminCreateUserResponse struct {
	ID                        uint          `json:"id"`
	Name                      string        `json:"name"`
	Email                     string        `json:"email"`
	Roles                     []string      `json:"roles"`
	AvatarURL                 string        `json:"avatar_url"`
	PaymentStatus             string        `json:"payment_status"`
	HasGoogle                 bool          `json:"has_google"`
	HasPassword               bool          `json:"has_password"`
	CreatedAt                 string        `json:"created_at"`
	Subjects                  []SubjectInfo `json:"subjects"`
	CanManageMaterials        bool          `json:"can_manage_materials"`
	CanManageQuestionPackages bool          `json:"can_manage_question_packages"`
}

func newAdminCreateUserResponse(u models.User) AdminCreateUserResponse {
	return AdminCreateUserResponse{
		ID:                        u.ID,
		Name:                      u.Name,
		Email:                     u.Email,
		Roles:                     roleNames(u),
		AvatarURL:                 u.AvatarURL,
		PaymentStatus:             u.PaymentStatus,
		HasGoogle:                 u.GoogleID != "",
		HasPassword:               u.Password != nil,
		CreatedAt:                 u.CreatedAt.Format("2006-01-02"),
		Subjects:                  subjectInfos(u.Subjects),
		CanManageMaterials:        tpBool(u.TeacherPermission, "materials"),
		CanManageQuestionPackages: tpBool(u.TeacherPermission, "packages"),
	}
}

// — handler: AdminMergeUser (POST /admin/users/:id/merge) —

type AdminMergeUserResponse struct {
	ID                        uint          `json:"id"`
	Name                      string        `json:"name"`
	Email                     string        `json:"email"`
	Roles                     []string      `json:"roles"`
	AvatarURL                 string        `json:"avatar_url"`
	PaymentStatus             string        `json:"payment_status"`
	HasGoogle                 bool          `json:"has_google"`
	HasPassword               bool          `json:"has_password"`
	CreatedAt                 string        `json:"created_at"`
	Subjects                  []SubjectInfo `json:"subjects"`
	CanManageMaterials        bool          `json:"can_manage_materials"`
	CanManageQuestionPackages bool          `json:"can_manage_question_packages"`
}

func newAdminMergeUserResponse(u models.User) AdminMergeUserResponse {
	return AdminMergeUserResponse{
		ID:                        u.ID,
		Name:                      u.Name,
		Email:                     u.Email,
		Roles:                     roleNames(u),
		AvatarURL:                 u.AvatarURL,
		PaymentStatus:             u.PaymentStatus,
		HasGoogle:                 u.GoogleID != "",
		HasPassword:               u.Password != nil,
		CreatedAt:                 u.CreatedAt.Format("2006-01-02"),
		Subjects:                  subjectInfos(u.Subjects),
		CanManageMaterials:        tpBool(u.TeacherPermission, "materials"),
		CanManageQuestionPackages: tpBool(u.TeacherPermission, "packages"),
	}
}

// — handler: AdminUpdateTeacherSubjects (PATCH /admin/users/:id/subjects) —

type AdminUpdateTeacherSubjectsResponse struct {
	ID                        uint          `json:"id"`
	Name                      string        `json:"name"`
	Email                     string        `json:"email"`
	Roles                     []string      `json:"roles"`
	AvatarURL                 string        `json:"avatar_url"`
	PaymentStatus             string        `json:"payment_status"`
	HasGoogle                 bool          `json:"has_google"`
	HasPassword               bool          `json:"has_password"`
	CreatedAt                 string        `json:"created_at"`
	Subjects                  []SubjectInfo `json:"subjects"`
	CanManageMaterials        bool          `json:"can_manage_materials"`
	CanManageQuestionPackages bool          `json:"can_manage_question_packages"`
}

func newAdminUpdateTeacherSubjectsResponse(u models.User) AdminUpdateTeacherSubjectsResponse {
	return AdminUpdateTeacherSubjectsResponse{
		ID:                        u.ID,
		Name:                      u.Name,
		Email:                     u.Email,
		Roles:                     roleNames(u),
		AvatarURL:                 u.AvatarURL,
		PaymentStatus:             u.PaymentStatus,
		HasGoogle:                 u.GoogleID != "",
		HasPassword:               u.Password != nil,
		CreatedAt:                 u.CreatedAt.Format("2006-01-02"),
		Subjects:                  subjectInfos(u.Subjects),
		CanManageMaterials:        tpBool(u.TeacherPermission, "materials"),
		CanManageQuestionPackages: tpBool(u.TeacherPermission, "packages"),
	}
}

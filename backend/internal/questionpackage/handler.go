package questionpackage

import (
	"errors"
	"strconv"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/storage"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type Handler struct {
	svc *Service
	db  *gorm.DB
}

func NewHandler(svc *Service, db *gorm.DB) *Handler {
	return &Handler{svc: svc, db: db}
}

// callerAccess mengambil identitas & role pemanggil dari context middleware.
func callerAccess(c *fiber.Ctx) Access {
	callerID, _ := c.Locals("user_id").(uint)
	a := Access{CallerID: callerID}
	roles, _ := c.Locals("roles").([]string)
	for _, r := range roles {
		switch r {
		case "admin":
			a.IsAdmin = true
			a.IsStaff = true
		case "teacher":
			a.IsStaff = true
		}
	}
	return a
}

// scopeClassIDs mengembalikan class_id yang boleh diakses utk scoping konten.
// admin/teacher → nil (semua); student → kelas aktif, [] kosong kalau tak punya
// (supaya cuma koleksi free yang muncul).
func (h *Handler) scopeClassIDs(c *fiber.Ctx) []uint {
	roles, ok := c.Locals("roles").([]string)
	if ok {
		for _, r := range roles {
			if r == "admin" || r == "teacher" {
				return nil
			}
		}
	}
	ids := middleware.AccessibleClassIDs(c, h.db)
	if ids == nil {
		ids = []uint{}
	}
	return ids
}

// ListPackages mengembalikan daftar paket soal
// @Summary      List question packages
// @Description  Mengembalikan daftar paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} PackageResponse
// @Router       /admin/question-packages [get]
func (h *Handler) ListPackages(c *fiber.Ctx) error {
	packages, err := h.svc.List(callerAccess(c))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(packages)
}

// GetPackage mengembalikan detail paket soal
// @Summary      Get question package
// @Description  Mengembalikan detail paket soal beserta soalnya
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Package ID"
// @Success      200 {object} PackageResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/question-packages/{id} [get]
func (h *Handler) GetPackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	pkg, err := h.svc.Get(uint(id), callerAccess(c))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	return c.JSON(pkg)
}

// CreatePackage membuat paket soal baru
// @Summary      Create question package
// @Description  Membuat paket soal baru
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data paket"
// @Success      201 {object} PackageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages [post]
func (h *Handler) CreatePackage(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	pkg, err := h.svc.Create(input, callerAccess(c).CallerID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(pkg)
}

// UpdatePackage mengubah paket soal
// @Summary      Update question package
// @Description  Mengubah nama, deskripsi, atau soal dalam paket
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int       true "Package ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} PackageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages/{id} [patch]
func (h *Handler) UpdatePackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	pkg, err := h.svc.Update(uint(id), input, callerAccess(c))
	if err != nil {
		if errors.Is(err, ErrNotOwner) {
			return c.Status(403).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, ErrNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(pkg)
}

// DeletePackage menghapus paket soal
// @Summary      Delete question package
// @Description  Menghapus paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Package ID"
// @Success      200 {object} MessageResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/question-packages/{id} [delete]
func (h *Handler) DeletePackage(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.Delete(uint(id), callerAccess(c)); err != nil {
		if errors.Is(err, ErrNotOwner) {
			return c.Status(403).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, ErrNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus paket"})
	}
	return c.JSON(MessageResponse{Message: "paket berhasil dihapus"})
}

// AdminListCollections mengembalikan daftar koleksi paket soal
// @Summary      List question package collections
// @Description  Mengembalikan daftar koleksi paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} CollectionResponse
// @Router       /admin/question-package-collections [get]
func (h *Handler) AdminListCollections(c *fiber.Ctx) error {
	collections, err := h.svc.ListCollections(nil)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(collections)
}

// AdminCreateCollection membuat koleksi paket soal baru
// @Summary      Create question package collection
// @Description  Membuat koleksi paket soal baru (bundel per kelas)
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CollectionCreateInput true "Data koleksi"
// @Success      201 {object} CollectionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-package-collections [post]
func (h *Handler) AdminCreateCollection(c *fiber.Ctx) error {
	var input CollectionCreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	collection, err := h.svc.CreateCollection(input, callerAccess(c).CallerID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(collection)
}

// AdminUpdateCollection mengubah koleksi paket soal
// @Summary      Update question package collection
// @Description  Mengubah koleksi paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int                 true "Collection ID"
// @Param        body body CollectionUpdateInput true "Data update"
// @Success      200 {object} CollectionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-package-collections/{id} [patch]
func (h *Handler) AdminUpdateCollection(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	var input CollectionUpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	collection, err := h.svc.UpdateCollection(uint(id), input, callerAccess(c))
	if err != nil {
		if errors.Is(err, ErrCollectionNotOwner) {
			return c.Status(403).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, ErrCollectionNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(collection)
}

// AdminDeleteCollection menghapus koleksi paket soal
// @Summary      Delete question package collection
// @Description  Menghapus koleksi paket soal; paket di dalamnya tetap ada tapi lepas dari koleksi
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Collection ID"
// @Success      200 {object} MessageResponse
// @Failure      404 {object} ErrorResponse
// @Router       /admin/question-package-collections/{id} [delete]
func (h *Handler) AdminDeleteCollection(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}
	if err := h.svc.DeleteCollection(uint(id), callerAccess(c)); err != nil {
		if errors.Is(err, ErrCollectionNotOwner) {
			return c.Status(403).JSON(ErrorResponse{Error: err.Error()})
		}
		if errors.Is(err, ErrCollectionNotFound) {
			return c.Status(404).JSON(ErrorResponse{Error: err.Error()})
		}
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menghapus koleksi"})
	}
	return c.JSON(MessageResponse{Message: "koleksi berhasil dihapus"})
}

// MyPackages mengembalikan daftar paket soal untuk murid/user.
// @Summary      List visible question packages
// @Description  Mengembalikan daftar paket soal. User hanya melihat paket dalam koleksi
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} PackageResponse
// @Router       /question-packages [get]
func (h *Handler) MyPackages(c *fiber.Ctx) error {
	packages, err := h.svc.ListVisible(h.scopeClassIDs(c))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(packages)
}

// MyPackage mengembalikan detail paket soal untuk murid/user.
// @Summary      Get visible question package
// @Description  Mengambil detail paket soal. Paket premium hanya untuk yang punya
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Package Public ID"
// @Success      200 {object} PackageResponse
// @Failure      404 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /question-packages/{id} [get]
func (h *Handler) MyPackage(c *fiber.Ctx) error {
	publicID := c.Params("id")
	pkg, err := h.svc.GetVisibleByPublicID(publicID, h.scopeClassIDs(c))
	if err != nil {
		if errors.Is(err, ErrNoAccess) {
			return c.Status(403).JSON(ErrorResponse{Error: "paket ini belum tersedia untukmu"})
		}
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	return c.JSON(pkg)
}

// MyCollections mengembalikan daftar koleksi paket soal untuk murid/user.
// @Summary      List visible question package collections
// @Description  Mengembalikan daftar koleksi paket soal. Koleksi premium hanya untuk
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Success      200 {array} CollectionResponse
// @Router       /question-package-collections [get]
func (h *Handler) MyCollections(c *fiber.Ctx) error {
	collections, err := h.svc.ListCollections(h.scopeClassIDs(c))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(collections)
}

// MyCollection mengembalikan detail koleksi paket soal untuk murid/user.
// @Summary      Get visible question package collection
// @Description  Mengambil detail koleksi paket soal beserta paket di dalamnya
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Collection Public ID"
// @Success      200 {object} CollectionResponse
// @Failure      404 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /question-package-collections/{id} [get]
func (h *Handler) MyCollection(c *fiber.Ctx) error {
	publicID := c.Params("id")
	classIDs := h.scopeClassIDs(c)
	collection, err := h.svc.GetCollectionByPublicID(publicID, classIDs)
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "koleksi tidak ditemukan"})
	}

	allowed := collection.IsFree || classIDs == nil // staff → semua
	if !allowed {
		for _, cid := range classIDs {
			if cid == collection.ClassID {
				allowed = true
				break
			}
		}
	}
	if !allowed {
		return c.Status(403).JSON(ErrorResponse{Error: "koleksi ini belum tersedia untukmu"})
	}
	return c.JSON(collection)
}

// WorkQuestions mengembalikan daftar soal untuk dikerjakan student (tanpa jawaban).
// @Summary      Get work questions
// @Description  Mengembalikan soal dalam paket untuk dikerjakan student (tanpa kunci jawaban)
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Package Public ID"
// @Success      200 {array} WorkQuestionResponse
// @Failure      403 {object} ErrorResponse
// @Router       /question-packages/{id}/work/questions [get]
func (h *Handler) WorkQuestions(c *fiber.Ctx) error {
	publicID := c.Params("id")
	pkg, err := h.svc.GetVisibleByPublicID(publicID, h.scopeClassIDs(c))
	if err != nil {
		if errors.Is(err, ErrNoAccess) {
			return c.Status(403).JSON(ErrorResponse{Error: "paket ini belum tersedia untukmu"})
		}
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	questions, err := h.svc.ListQuestionsForPackage(pkg.ID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil soal"})
	}
	result := make([]WorkQuestionResponse, len(questions))
	for i, q := range questions {
		answers := make([]WorkAnswerResponse, len(q.Answers))
		for j, a := range q.Answers {
			answers[j] = WorkAnswerResponse{
				ID:      a.ID,
				Content: a.Content, // sudah di-rewrite di service
			}
		}
		result[i] = WorkQuestionResponse{
			ID:       q.ID,
			Question: q.Question,
			Answers:  answers,
		}
	}
	return c.JSON(result)
}

// WorkQuestionResponse, soal untuk student (dengan opsi jawaban, tanpa kunci).
type WorkQuestionResponse struct {
	ID       uint                       `json:"id"`
	Question string                     `json:"question"`
	Answers  []WorkAnswerResponse       `json:"answers"`
}

type WorkAnswerResponse struct {
	ID      uint   `json:"id"`
	Content string `json:"content"`
}

// SubmitAnswer menyimpan jawaban student.
// @Summary      Submit answer
// @Description  Menyimpan jawaban student dan mengembalikan hasil + pembahasan
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id    path string          true "Package Public ID"
// @Param        body  body SubmitAnswerInput true "Data jawaban"
// @Success      200 {object} SubmitAnswerResponse
// @Failure      400 {object} ErrorResponse
// @Router       /question-packages/{id}/work/submit [post]
func (h *Handler) SubmitAnswer(c *fiber.Ctx) error {
	publicID := c.Params("id")
	pkg, err := h.svc.GetVisibleByPublicID(publicID, h.scopeClassIDs(c))
	if err != nil {
		if errors.Is(err, ErrNoAccess) {
			return c.Status(403).JSON(ErrorResponse{Error: "paket ini belum tersedia untukmu"})
		}
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	userID := c.Locals("user_id").(uint)
	var input SubmitAnswerInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.QuestionID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "question_id wajib diisi"})
	}
	isCorrect, explanation, correctAnswerIDs, err := h.svc.SubmitAnswer(userID, pkg.ID, input.QuestionID, input.AnswerID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(SubmitAnswerResponse{
		IsCorrect:        isCorrect,
		Explanation:      explanation,
		CorrectAnswerIDs: correctAnswerIDs,
	})
}

type SubmitAnswerInput struct {
	QuestionID uint `json:"question_id"`
	AnswerID   uint `json:"answer_id"`
}

type SubmitAnswerResponse struct {
	IsCorrect        bool   `json:"is_correct"`
	Explanation      string `json:"explanation"`
	CorrectAnswerIDs []uint `json:"correct_answer_ids"`
}

// GetWorkProgress mengembalikan progress student di paket, termasuk jawaban terpilih dan pembahasan.
// @Summary      Get work progress
// @Description  Mengembalikan jumlah soal yang sudah dikerjakan + ID soal yang selesai + jawaban terpilih + pembahasan
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path string true "Package Public ID"
// @Success      200 {object} WorkProgressResponse
// @Failure      403 {object} ErrorResponse
// @Router       /question-packages/{id}/work/progress [get]
func (h *Handler) GetWorkProgress(c *fiber.Ctx) error {
	publicID := c.Params("id")
	pkg, err := h.svc.GetVisibleByPublicID(publicID, h.scopeClassIDs(c))
	if err != nil {
		if errors.Is(err, ErrNoAccess) {
			return c.Status(403).JSON(ErrorResponse{Error: "paket ini belum tersedia untukmu"})
		}
		return c.Status(404).JSON(ErrorResponse{Error: "paket tidak ditemukan"})
	}
	userID := c.Locals("user_id").(uint)
	completedIDs, err := h.svc.GetStudentProgress(userID, pkg.ID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil progress"})
	}
	total := len(pkg.Questions)
	selectedAnswers, explanations, isCorrectMap, correctAnswerIDs, err := h.svc.GetProgressDetail(userID, pkg.ID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil detail progress"})
	}
	return c.JSON(WorkProgressResponse{
		TotalCount:       total,
		CompletedCount:   len(completedIDs),
		CompletedIDs:     completedIDs,
		SelectedAnswers:  selectedAnswers,
		Explanations:     explanations,
		IsCorrect:        isCorrectMap,
		CorrectAnswerIDs: correctAnswerIDs,
	})
}

type WorkProgressResponse struct {
	TotalCount       int             `json:"total_count"`
	CompletedCount   int             `json:"completed_count"`
	CompletedIDs     []uint          `json:"completed_ids"`
	SelectedAnswers  map[uint]uint   `json:"selected_answers"`
	Explanations     map[uint]string `json:"explanations"`
	IsCorrect        map[uint]bool   `json:"is_correct"`
	CorrectAnswerIDs map[uint][]uint `json:"correct_answer_ids"`
}

func Routes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	admin.Get("/question-packages", h.ListPackages)
	admin.Get("/question-packages/:id", h.GetPackage)
	admin.Post("/question-packages", h.CreatePackage)
	admin.Patch("/question-packages/:id", h.UpdatePackage)
	admin.Delete("/question-packages/:id", h.DeletePackage)
	admin.Get("/question-package-collections", h.AdminListCollections)
	admin.Post("/question-package-collections", h.AdminCreateCollection)
	admin.Patch("/question-package-collections/:id", h.AdminUpdateCollection)
	admin.Delete("/question-package-collections/:id", h.AdminDeleteCollection)
}

func AuthRoutes(auth fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc, db)

	auth.Get("/question-packages", h.MyPackages)
	auth.Get("/question-packages/:id", h.MyPackage)
	auth.Get("/question-package-collections", h.MyCollections)
	auth.Get("/question-package-collections/:id", h.MyCollection)

	auth.Get("/question-packages/:id/work/questions", h.WorkQuestions)
	auth.Post("/question-packages/:id/work/submit", h.SubmitAnswer)
	auth.Get("/question-packages/:id/work/progress", h.GetWorkProgress)
}

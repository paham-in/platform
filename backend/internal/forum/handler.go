package forum

import (
	"strconv"
	"time"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/notification"
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

func userIDFrom(c *fiber.Ctx) uint {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return 0
	}
	return u.ID
}

// ListQuestions mengembalikan daftar pertanyaan
// @Summary      List questions
// @Description  Mengembalikan daftar semua pertanyaan, diurutkan terbaru
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id query int false "Filter by subject"
// @Param        mine query bool false "Filter by current user"
// @Param        unanswered query bool false "Filter unanswered only"
// @Param        search query string false "Search by content or author name"
// @Success      200 {array} QuestionResponse
// @Router       /questions [get]
func (h *Handler) ListQuestions(c *fiber.Ctx) error {
	subjectID := c.Query("subject_id")
	mine := c.Query("mine")
	unanswered := c.Query("unanswered")
	search := c.Query("search")
	var sid *uint
	if subjectID != "" {
		id, err := strconv.ParseUint(subjectID, 10, 64)
		if err == nil {
			v := uint(id)
			sid = &v
		}
	}

	var userID *uint
	if mine == "true" {
		uid := userIDFrom(c)
		if uid != 0 {
			userID = &uid
		}
	}

	questions, err := h.svc.List(sid, userID, unanswered == "true", search)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}

	currentUser := userIDFrom(c)
	result := make([]QuestionResponse, len(questions))
	for i, q := range questions {
		r := QuestionResponse{
			ID:           q.ID,
			PublicID:     q.PublicID,
			Content:      h.svc.RewriteContent(q.Content),
		PlainContent: q.PlainContent,
		UserName:     q.User.Name,
			UserAvatar:   q.User.AvatarURL,
			SubjectID:    q.SubjectID,
			IsOwner:      q.UserID == currentUser,
			CreatedAt:    q.CreatedAt.Format("2006-01-02 15:04"),
			AnswerCount:  len(q.Answers),
		}
		if len(q.Answers) > 0 {
			top := q.Answers[0]
			r.TopAnswer = &AnswerPreview{
				PlainContent: top.PlainContent,
				UserName:     top.User.Name,
				UserAvatar:   top.User.AvatarURL,
				CreatedAt:    top.CreatedAt.Format("2006-01-02 15:04"),
			}
		}
		if q.Subject.Name != "" {
			r.SubjectName = q.Subject.Name
		}
		result[i] = r
	}
	return c.JSON(result)
}

// GetQuestion mengambil detail pertanyaan
// @Summary      Get question
// @Description  Mengembalikan detail pertanyaan berdasarkan ID
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Question ID"
// @Success      200 {object} QuestionResponse
// @Failure      404 {object} ErrorResponse
// @Router       /questions/{id} [get]
func (h *Handler) GetQuestion(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	publicID := c.Params("id")

	question, err := h.svc.GetByPublicID(publicID)
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "pertanyaan tidak ditemukan"})
	}

	r := QuestionResponse{
		ID:           question.ID,
		PublicID:     question.PublicID,
		Content:      h.svc.RewriteContent(question.Content),
		PlainContent: question.PlainContent,
		UserName:     question.User.Name,
		UserAvatar:   question.User.AvatarURL,
		SubjectID:    question.SubjectID,
		IsOwner:      question.UserID == userID,
		CreatedAt:    question.CreatedAt.Format("2006-01-02 15:04"),
		AnswerCount:  len(question.Answers),
	}
	if len(question.Answers) > 0 {
		top := question.Answers[0]
		r.TopAnswer = &AnswerPreview{
			PlainContent: top.PlainContent,
			UserName:     top.User.Name,
			UserAvatar:   top.User.AvatarURL,
			CreatedAt:    top.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	if question.Subject.Name != "" {
		r.SubjectName = question.Subject.Name
	}
	return c.JSON(r)
}

// CreateQuestion membuat pertanyaan baru
// @Summary      Create question
// @Description  Membuat pertanyaan baru
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateQuestionInput true "Data pertanyaan"
// @Success      201 {object} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Failure      403 {object} ErrorResponse
// @Router       /questions [post]
func (h *Handler) CreateQuestion(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	var input CreateQuestionInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Content == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "content wajib diisi"})
	}
	// subjek wajib, tiap pertanyaan harus masuk ke mata pelajaran tertentu.
	if input.SubjectID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "subject_id wajib diisi"})
	}
	var subject models.Subject
	if err := h.db.First(&subject, input.SubjectID).Error; err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "subjek tidak ditemukan"})
	}
	// hanya user yang sudah berlangganan (konten/les privat) yang boleh bertanya;
	// admin/teacher otomatis lolos. Sisanya read-only.
	if !middleware.CanAccessPremium(c, h.db) {
		return c.Status(403).JSON(ErrorResponse{Error: "kamu perlu berlangganan untuk membuat pertanyaan"})
	}

	question, err := h.svc.Create(userID, input.Content, &input.SubjectID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan pertanyaan"})
	}

	user, _ := h.svc.GetUser(userID)
	return c.Status(201).JSON(QuestionResponse{
		ID:           question.ID,
		PublicID:     question.PublicID,
		Content:      question.Content,
		PlainContent: question.PlainContent,
		UserName:     user.Name,
		UserAvatar:   user.AvatarURL,
		SubjectID:    question.SubjectID,
		IsOwner:      true,
		CreatedAt:    time.Now().Format("2006-01-02 15:04"),
	})
}

// UpdateQuestion mengubah pertanyaan (hanya milik sendiri)
// @Summary      Update question
// @Description  Mengubah content pertanyaan (hanya pemilik). Gambar temp di-commit ke permanen dan aset content disinkronkan.
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Question ID"
// @Param        body body CreateQuestionInput true "Data pertanyaan"
// @Success      200 {object} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /questions/{id} [put]
func (h *Handler) UpdateQuestion(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	publicID := c.Params("id")
	q, err := h.svc.GetByPublicID(publicID)
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "pertanyaan tidak ditemukan"})
	}

	var input CreateQuestionInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Content == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "content wajib diisi"})
	}
	if input.SubjectID == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "subject_id wajib diisi"})
	}
	var subject models.Subject
	if err := h.db.First(&subject, input.SubjectID).Error; err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "subjek tidak ditemukan"})
	}

	question, err := h.svc.Update(q.ID, userID, input.Content, &input.SubjectID)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	user, _ := h.svc.GetUser(userID)
	return c.JSON(QuestionResponse{
		ID:           question.ID,
		PublicID:     question.PublicID,
		Content:      h.svc.RewriteContent(question.Content),
		PlainContent: question.PlainContent,
		UserName:     user.Name,
		UserAvatar:   user.AvatarURL,
		SubjectID:    question.SubjectID,
		IsOwner:      true,
		CreatedAt:    question.CreatedAt.Format("2006-01-02 15:04"),
	})
}

// DeleteQuestion menghapus pertanyaan
// @Summary      Delete question
// @Description  Menghapus pertanyaan (hanya milik sendiri)
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Question ID"
// @Success      200 {object} MessageResponse
// @Router       /questions/{id} [delete]
func (h *Handler) DeleteQuestion(c *fiber.Ctx) error {
	publicID := c.Params("id")
	q, err := h.svc.GetByPublicID(publicID)
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "pertanyaan tidak ditemukan"})
	}

	userID := userIDFrom(c)
	if err := h.svc.Delete(q.ID, userID); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

type QuestionResponse struct {
	ID           uint          `json:"id"`
	PublicID     string        `json:"public_id"`
	Content      string        `json:"content"`
	PlainContent string        `json:"plain_content"`
	SubjectName  string        `json:"subject_name,omitempty"`
	UserName     string        `json:"user_name"`
	UserAvatar   string        `json:"user_avatar,omitempty"`
	SubjectID    *uint         `json:"subject_id,omitempty"`
	IsOwner      bool          `json:"is_owner"`
	CreatedAt    string        `json:"created_at"`
	AnswerCount  int           `json:"answer_count"`
	TopAnswer    *AnswerPreview `json:"top_answer,omitempty"`
}

type AnswerPreview struct {
	PlainContent string `json:"plain_content"`
	UserName     string `json:"user_name"`
	UserAvatar   string `json:"user_avatar,omitempty"`
	CreatedAt    string `json:"created_at"`
}

type CreateQuestionInput struct {
	Content   string `json:"content"`
	SubjectID uint   `json:"subject_id"` // wajib, pertanyaan harus masuk ke mata pelajaran
}

// AdminDeleteQuestion menghapus pertanyaan (admin)
// @Summary      Admin delete question
// @Description  Menghapus pertanyaan (admin)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Question ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/questions/{id} [delete]
// AdminListQuestions mengembalikan daftar pertanyaan (admin)
// @Summary      Admin list questions
// @Description  Mengembalikan daftar semua pertanyaan (admin)
// @Tags         Admin
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        subject_id query int false "Filter by subject"
// @Param        search query string false "Search by content or author name"
// @Success      200 {array} QuestionResponse
// @Router       /admin/questions [get]
func (h *Handler) AdminListQuestions(c *fiber.Ctx) error {
	return h.ListQuestions(c)
}

func (h *Handler) AdminDeleteQuestion(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.AdminDelete(uint(id)); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func AdminRoutes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo)
	svc.SetStorage(store)
	h := NewHandler(svc, db)

	admin.Get("/questions", h.AdminListQuestions)
	admin.Delete("/questions/:id", h.AdminDeleteQuestion)
}

func Routes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage, notifSvc *notification.Service) {
	repo := NewRepository(db)
	svc := NewService(repo)
	svc.SetStorage(store)
	svc.SetNotificationService(notifSvc)
	h := NewHandler(svc, db)

	app.Get("/questions", middleware.OptionalSessionResolver(db), h.ListQuestions)
	app.Get("/questions/:id", middleware.OptionalSessionResolver(db), h.GetQuestion)
	app.Post("/questions", middleware.SessionRequired(), middleware.SessionResolver(db), h.CreateQuestion)
	app.Put("/questions/:id", middleware.SessionRequired(), middleware.SessionResolver(db), h.UpdateQuestion)
	app.Delete("/questions/:id", middleware.SessionRequired(), middleware.SessionResolver(db), h.DeleteQuestion)
}

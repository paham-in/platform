package forum

import (
	"strconv"
	"time"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"

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
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
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
// @Param        subject_id query int false "Filter by subject"
// @Param        mine query bool false "Filter by current user"
// @Success      200 {array} QuestionResponse
// @Router       /questions [get]
func (h *Handler) ListQuestions(c *fiber.Ctx) error {
	subjectID := c.Query("subject_id")
	mine := c.Query("mine")
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

	questions, err := h.svc.List(sid, userID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}

	currentUser := userIDFrom(c)
	result := make([]QuestionResponse, len(questions))
	for i, q := range questions {
		r := QuestionResponse{
			ID:           q.ID,
			Content:      q.Content,
			PlainContent: q.PlainContent,
			Status:       q.Status,
			Upvotes:      q.Upvotes,
			UserName:     q.User.Name,
			UserAvatar:   q.User.AvatarURL,
			SubjectID:    q.SubjectID,
			IsOwner:      q.UserID == currentUser,
			CreatedAt:    q.CreatedAt.Format("2006-01-02 15:04"),
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
// @Param        id path int true "Question ID"
// @Success      200 {object} QuestionResponse
// @Failure      404 {object} ErrorResponse
// @Router       /questions/{id} [get]
func (h *Handler) GetQuestion(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	question, err := h.svc.GetByID(uint(id))
	if err != nil {
		return c.Status(404).JSON(ErrorResponse{Error: "pertanyaan tidak ditemukan"})
	}

	r := QuestionResponse{
		ID:           question.ID,
		Content:      question.Content,
		PlainContent: question.PlainContent,
		Status:       question.Status,
		Upvotes:      question.Upvotes,
		UserName:     question.User.Name,
		UserAvatar:   question.User.AvatarURL,
		SubjectID:    question.SubjectID,
		IsOwner:      question.UserID == userID,
		CreatedAt:    question.CreatedAt.Format("2006-01-02 15:04"),
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

	question, err := h.svc.Create(userID, input.Content, input.SubjectID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan pertanyaan"})
	}

	user, _ := h.svc.GetUser(userID)
	return c.Status(201).JSON(QuestionResponse{
		ID:           question.ID,
		Content:      question.Content,
		PlainContent: question.PlainContent,
		Status:       question.Status,
		UserName:     user.Name,
		UserAvatar:   user.AvatarURL,
		SubjectID:    question.SubjectID,
		IsOwner:      true,
		CreatedAt:    time.Now().Format("2006-01-02 15:04"),
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
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	userID := userIDFrom(c)
	if err := h.svc.Delete(uint(id), userID); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

type QuestionResponse struct {
	ID           uint   `json:"id"`
	Content      string `json:"content"`
	PlainContent string `json:"plain_content"`
	Status       string `json:"status"`
	Upvotes      int    `json:"upvotes"`
	SubjectName  string `json:"subject_name,omitempty"`
	UserName     string `json:"user_name"`
	UserAvatar   string `json:"user_avatar,omitempty"`
	SubjectID    *uint  `json:"subject_id,omitempty"`
	IsOwner      bool   `json:"is_owner"`
	CreatedAt    string `json:"created_at"`
}

type CreateQuestionInput struct {
	Content   string `json:"content"`
	SubjectID *uint  `json:"subject_id,omitempty"`
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

func AdminRoutes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	admin.Get("/questions", h.AdminListQuestions)
	admin.Delete("/questions/:id", h.AdminDeleteQuestion)
}

func Routes(app fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	app.Get("/questions", middleware.OptionalSessionResolver(db), h.ListQuestions)
	app.Get("/questions/:id", middleware.OptionalSessionResolver(db), h.GetQuestion)

	auth := app.Group("", middleware.SessionRequired(), middleware.SessionResolver(db))
	auth.Post("/questions", h.CreateQuestion)
	auth.Delete("/questions/:id", h.DeleteQuestion)
}

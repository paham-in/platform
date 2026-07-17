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
// @Success      200 {array} QuestionResponse
// @Router       /questions [get]
func (h *Handler) ListQuestions(c *fiber.Ctx) error {
	subjectID := c.Query("subject_id")
	var sid *uint
	if subjectID != "" {
		id, err := strconv.ParseUint(subjectID, 10, 64)
		if err == nil {
			v := uint(id)
			sid = &v
		}
	}

	questions, err := h.svc.List(sid)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}

	currentUser := userIDFrom(c)
	result := make([]QuestionResponse, len(questions))
	for i, q := range questions {
		r := QuestionResponse{
			ID:        q.ID,
			Title:     q.Title,
			Content:   q.Content,
			Status:    q.Status,
			Upvotes:   q.Upvotes,
			UserName:  q.User.Name,
			UserAvatar: q.User.AvatarURL,
			SubjectID: q.SubjectID,
			IsOwner:   q.UserID == currentUser,
			CreatedAt: q.CreatedAt.Format("2006-01-02 15:04"),
		}
		if q.Subject.Name != "" {
			r.SubjectName = q.Subject.Name
		}
		result[i] = r
	}
	return c.JSON(result)
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
	if input.Title == "" || input.Content == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "title dan content wajib diisi"})
	}

	question, err := h.svc.Create(userID, input.Title, input.Content, input.SubjectID)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal menyimpan pertanyaan"})
	}

	user, _ := h.svc.GetUser(userID)
	return c.Status(201).JSON(QuestionResponse{
		ID:         question.ID,
		Title:      question.Title,
		Content:    question.Content,
		Status:     question.Status,
		UserName:   user.Name,
		UserAvatar: user.AvatarURL,
		SubjectID:  question.SubjectID,
		IsOwner:    true,
		CreatedAt:  time.Now().Format("2006-01-02 15:04"),
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
	ID          uint   `json:"id"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Status      string `json:"status"`
	Upvotes     int    `json:"upvotes"`
	SubjectName string `json:"subject_name,omitempty"`
	UserName    string `json:"user_name"`
	UserAvatar  string `json:"user_avatar,omitempty"`
	SubjectID   *uint  `json:"subject_id,omitempty"`
	IsOwner     bool   `json:"is_owner"`
	CreatedAt   string `json:"created_at"`
}

type CreateQuestionInput struct {
	Title     string `json:"title"`
	Content   string `json:"content"`
	SubjectID *uint  `json:"subject_id,omitempty"`
}

func Routes(app fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	app.Get("/questions", h.ListQuestions)

	auth := app.Group("", middleware.SessionRequired(), middleware.SessionResolver(db))
	auth.Post("/questions", h.CreateQuestion)
	auth.Delete("/questions/:id", h.DeleteQuestion)
}

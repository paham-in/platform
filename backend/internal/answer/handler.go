package answer

import (
	"strconv"
	"time"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type AnswerResponse struct {
	ID           uint   `json:"id"`
	Content      string `json:"content"`
	PlainContent string `json:"plain_content"`
	UserName     string `json:"user_name"`
	UserAvatar   string `json:"user_avatar,omitempty"`
	CreatedAt    string `json:"created_at"`
}

type CreateAnswerInput struct {
	Content string `json:"content"`
}

func userIDFrom(c *fiber.Ctx) uint {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return 0
	}
	return u.ID
}

// ListAnswers mengembalikan daftar jawaban untuk sebuah pertanyaan
// @Summary      List answers
// @Description  Mengembalikan daftar jawaban berdasarkan ID pertanyaan
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Param        question_id path int true "Question ID"
// @Success      200 {array} AnswerResponse
// @Router       /questions/{question_id}/answers [get]
func (h *Handler) ListAnswers(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("question_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	answers, err := h.svc.ListByQuestion(uint(id))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}

	result := make([]AnswerResponse, len(answers))
	for i, a := range answers {
		result[i] = AnswerResponse{
			ID:           a.ID,
			Content:      a.Content,
			PlainContent: a.PlainContent,
			UserName:     a.User.Name,
			UserAvatar:   a.User.AvatarURL,
			CreatedAt:    a.CreatedAt.Format("2006-01-02 15:04"),
		}
	}
	return c.JSON(result)
}

// CreateAnswer menambahkan jawaban ke pertanyaan
// @Summary      Create answer
// @Description  Menambahkan jawaban ke pertanyaan
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Param        body body CreateAnswerInput true "Data jawaban"
// @Success      201 {object} AnswerResponse
// @Failure      400 {object} ErrorResponse
// @Router       /questions/{question_id}/answers [post]
func (h *Handler) CreateAnswer(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	questionID, err := strconv.ParseUint(c.Params("question_id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	var input CreateAnswerInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if input.Content == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "content wajib diisi"})
	}

	answer, err := h.svc.Create(uint(questionID), userID, input.Content)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(AnswerResponse{
		ID:           answer.ID,
		Content:      answer.Content,
		PlainContent: answer.PlainContent,
		UserName:     answer.User.Name,
		UserAvatar:   answer.User.AvatarURL,
		CreatedAt:    time.Now().Format("2006-01-02 15:04"),
	})
}

func PublicRoutes(app fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	questionRepo := NewQuestionRepository(db)
	svc := NewService(repo, questionRepo)
	h := NewHandler(svc)

	app.Get("/questions/:question_id/answers", middleware.OptionalSessionResolver(db), h.ListAnswers)
}

func AuthRoutes(app fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	questionRepo := NewQuestionRepository(db)
	svc := NewService(repo, questionRepo)
	h := NewHandler(svc)

	app.Post("/questions/:question_id/answers", middleware.SessionRequired(), middleware.SessionResolver(db), h.CreateAnswer)
}

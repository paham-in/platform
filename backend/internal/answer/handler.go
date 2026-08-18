package answer

import (
	"regexp"
	"strconv"
	"time"

	"bimbel2/backend/internal/middleware"
	"bimbel2/backend/internal/models"
	"bimbel2/backend/internal/notification"
	"bimbel2/backend/internal/push"
	"bimbel2/backend/internal/storage"

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
	VideoURL     string `json:"video_url"`
	UserName     string `json:"user_name"`
	UserAvatar   string `json:"user_avatar,omitempty"`
	IsOwner      bool   `json:"is_owner"`
	CreatedAt    string `json:"created_at"`
}

type CreateAnswerInput struct {
	Content  string `json:"content"`
	VideoURL string `json:"video_url"`
}

// reYoutube memvalidasi link YouTube (youtube.com/watch|embed|shorts atau youtu.be).
var reYoutube = regexp.MustCompile(`^(https?://)?(www\.)?(youtube\.com/(watch\?v=|embed/|shorts/)|youtu\.be/)[a-zA-Z0-9_-]{11}`)

func hasTeacherRole(c *fiber.Ctx) bool {
	u, ok := c.Locals("user").(*models.User)
	if !ok || u == nil {
		return false
	}
	for _, r := range u.Roles {
		if r.Name == "teacher" {
			return true
		}
	}
	return false
}

type MessageResponse struct {
	Message string `json:"message"`
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
// @Security     BearerAuth
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

	currentUser := userIDFrom(c)
	result := make([]AnswerResponse, len(answers))
	for i, a := range answers {
		result[i] = AnswerResponse{
			ID:           a.ID,
			Content:      h.svc.RewriteContent(a.Content),
			PlainContent: a.PlainContent,
			VideoURL:     a.VideoURL,
			UserName:     a.User.Name,
			UserAvatar:   a.User.AvatarURL,
			IsOwner:      a.UserID == currentUser,
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
// @Failure      403 {object} ErrorResponse
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
	if input.Content == "" && input.VideoURL == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "content atau video_url wajib diisi"})
	}
	// hanya guru yang boleh menjawab — admin/student read-only supaya jawaban
	// di forum benar-benar akurat.
	if !hasTeacherRole(c) {
		return c.Status(403).JSON(ErrorResponse{Error: "hanya guru yang bisa menjawab pertanyaan"})
	}
	if input.VideoURL != "" && !reYoutube.MatchString(input.VideoURL) {
		return c.Status(400).JSON(ErrorResponse{Error: "format video_url tidak valid"})
	}

	answer, err := h.svc.Create(uint(questionID), userID, input.Content, input.VideoURL)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}

	return c.Status(201).JSON(AnswerResponse{
		ID:           answer.ID,
		Content:      h.svc.RewriteContent(answer.Content),
		PlainContent: answer.PlainContent,
		VideoURL:     answer.VideoURL,
		UserName:     answer.User.Name,
		UserAvatar:   answer.User.AvatarURL,
		IsOwner:      true,
		CreatedAt:    time.Now().Format("2006-01-02 15:04"),
	})
}

// DeleteAnswer menghapus jawaban
// @Summary      Delete answer
// @Description  Menghapus jawaban (hanya milik sendiri)
// @Tags         Forum
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        question_id path int true "Question ID"
// @Param        id path int true "Answer ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /questions/{question_id}/answers/{id} [delete]
func (h *Handler) DeleteAnswer(c *fiber.Ctx) error {
	userID := userIDFrom(c)
	if userID == 0 {
		return c.Status(401).JSON(ErrorResponse{Error: "unauthorized"})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
	}

	if err := h.svc.Delete(uint(id), userID); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(MessageResponse{Message: "berhasil dihapus"})
}

func PublicRoutes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	questionRepo := NewQuestionRepository(db)
	svc := NewService(repo, questionRepo)
	svc.SetStorage(store)
	h := NewHandler(svc)

	app.Get("/questions/:question_id/answers", middleware.OptionalSessionResolver(db), h.ListAnswers)
}

func AuthRoutes(app fiber.Router, db *gorm.DB, store *storage.ObjectStorage, pushSvc *push.Service, notifSvc *notification.Service) {
	repo := NewRepository(db)
	questionRepo := NewQuestionRepository(db)
	svc := NewService(repo, questionRepo)
	svc.SetPushService(pushSvc)
	svc.SetNotificationService(notifSvc)
	svc.SetStorage(store)
	h := NewHandler(svc)

	app.Post("/questions/:question_id/answers", h.CreateAnswer)
	app.Delete("/questions/:question_id/answers/:id", h.DeleteAnswer)
}
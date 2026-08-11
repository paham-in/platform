package questionbank

import (
	"strconv"

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
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

// ListQuestions mengembalikan daftar soal dalam paket
// @Summary      List package questions
// @Description  Mengembalikan daftar soal dalam sebuah paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id path int true "Package ID"
// @Success      200 {array} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages/{id}/questions [get]
func (h *Handler) ListQuestions(c *fiber.Ctx) error {
	packageID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id paket tidak valid"})
	}
	questions, err := h.svc.ListByPackage(uint(packageID))
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(questions)
}

// CreateQuestion menambah soal baru ke dalam paket
// @Summary      Create package question
// @Description  Menambah soal baru ke dalam paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int       true "Package ID"
// @Param        body body CreateInput true "Data soal"
// @Success      201 {object} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages/{id}/questions [post]
func (h *Handler) CreateQuestion(c *fiber.Ctx) error {
	packageID, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id paket tidak valid"})
	}

	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	// Ambil user_id dari session (pembuat soal) — tidak bisa dipalsukan frontend.
	if userID, ok := c.Locals("user_id").(uint); ok && userID > 0 {
		input.UserID = userID
	}

	question, err := h.svc.Create(uint(packageID), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(question)
}

// UpdateQuestion mengubah soal dalam paket
// @Summary      Update package question
// @Description  Mengubah soal dalam paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int       true "Package ID"
// @Param        qid  path int       true "Question ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages/{id}/questions/{qid} [patch]
func (h *Handler) UpdateQuestion(c *fiber.Ctx) error {
	_, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id paket tidak valid"})
	}
	id, err := strconv.ParseUint(c.Params("qid"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id soal tidak valid"})
	}

	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	question, err := h.svc.Update(uint(id), input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.JSON(question)
}

// DeleteQuestion menghapus soal dalam paket
// @Summary      Delete package question
// @Description  Menghapus soal dari paket soal
// @Tags         QuestionPackage
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id  path int true "Package ID"
// @Param        qid path int true "Question ID"
// @Success      200 {object} MessageResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/question-packages/{id}/questions/{qid} [delete]
func (h *Handler) DeleteQuestion(c *fiber.Ctx) error {
	_, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id paket tidak valid"})
	}
	id, err := strconv.ParseUint(c.Params("qid"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id soal tidak valid"})
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "gagal menghapus soal"})
	}
	return c.JSON(MessageResponse{Message: "soal berhasil dihapus"})
}

func Routes(admin fiber.Router, db *gorm.DB, store *storage.ObjectStorage) {
	repo := NewRepository(db)
	svc := NewService(repo, store)
	h := NewHandler(svc)

	admin.Get("/question-packages/:id/questions", h.ListQuestions)
	admin.Post("/question-packages/:id/questions", h.CreateQuestion)
	admin.Patch("/question-packages/:id/questions/:qid", h.UpdateQuestion)
	admin.Delete("/question-packages/:id/questions/:qid", h.DeleteQuestion)
}

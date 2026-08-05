package questionbank

import (
	"strconv"

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

// ListQuestions mengembalikan daftar soal bank
// @Summary      List question bank
// @Description  Mengembalikan daftar soal, bisa difilter dengan chapter_id
// @Tags         QuestionBank
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        chapter_id query int false "Filter by chapter ID"
// @Success      200 {array} QuestionResponse
// @Router       /admin/questions-bank [get]
func (h *Handler) ListQuestions(c *fiber.Ctx) error {
	if chapterIDStr := c.Query("chapter_id"); chapterIDStr != "" {
		chapterID, err := strconv.ParseUint(chapterIDStr, 10, 64)
		if err != nil {
			return c.Status(400).JSON(ErrorResponse{Error: "chapter_id tidak valid"})
		}
		questions, err := h.svc.ListByChapter(uint(chapterID))
		if err != nil {
			return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
		}
		return c.JSON(questions)
	}

	questions, err := h.svc.List()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(questions)
}

// CreateQuestion menambah soal baru
// @Summary      Create question
// @Description  Menambah soal baru ke bank soal
// @Tags         QuestionBank
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body CreateInput true "Data soal"
// @Success      201 {object} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/questions-bank [post]
func (h *Handler) CreateQuestion(c *fiber.Ctx) error {
	var input CreateInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}

	question, err := h.svc.Create(input)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: err.Error()})
	}
	return c.Status(201).JSON(question)
}

// UpdateQuestion mengubah soal
// @Summary      Update question
// @Description  Mengubah soal di bank soal
// @Tags         QuestionBank
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        id   path int       true "Question ID"
// @Param        body body UpdateInput true "Data update"
// @Success      200 {object} QuestionResponse
// @Failure      400 {object} ErrorResponse
// @Router       /admin/questions-bank/{id} [patch]
func (h *Handler) UpdateQuestion(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "id tidak valid"})
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

// DeleteQuestions menghapus banyak soal sekaligus
// @Summary      Bulk delete questions
// @Description  Menghapus banyak soal dari bank soal dalam satu request
// @Tags         QuestionBank
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        body body object true "Daftar ID soal yang akan dihapus" SchemaExample({"ids":[1,2,3]})
// @Success      200 {object} BulkDeleteResult
// @Router       /admin/questions-bank [delete]
func (h *Handler) BulkDeleteQuestions(c *fiber.Ctx) error {
	var input struct {
		Ids []uint `json:"ids"`
	}
	if err := c.BodyParser(&input); err != nil {
		return c.Status(400).JSON(ErrorResponse{Error: "format data tidak valid"})
	}
	if len(input.Ids) == 0 {
		return c.Status(400).JSON(ErrorResponse{Error: "ids wajib diisi"})
	}
	result := h.svc.BulkDelete(input.Ids)
	return c.JSON(result)
}

// ListQuestionsPaginated mengembalikan daftar soal bank dengan pagination
// @Summary      List question bank (paginated)
// @Description  Mengembalikan daftar soal dengan pagination, bisa difilter dengan chapter_id
// @Tags         QuestionBank
// @Accept       json
// @Produce      json
// @Security     BearerAuth
// @Param        chapter_id query int false "Filter by chapter ID"
// @Param        page query int false "Page number (default 1)"
// @Param        per_page query int false "Items per page (default 10)"
// @Success      200 {object} PaginatedResponse
// @Router       /admin/questions-bank/paginated [get]
func (h *Handler) ListQuestionsPaginated(c *fiber.Ctx) error {
	chapterID, _ := strconv.ParseUint(c.Query("chapter_id"), 10, 64)
	page, _ := strconv.Atoi(c.Query("page"))
	if page == 0 {
		page = 1
	}
	perPage, _ := strconv.Atoi(c.Query("per_page"))
	if perPage == 0 {
		perPage = 10
	}

	result, err := h.svc.ListPaginated(uint(chapterID), page, perPage)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data"})
	}
	return c.JSON(result)
}

func Routes(admin fiber.Router, db *gorm.DB) {
	repo := NewRepository(db)
	svc := NewService(repo)
	h := NewHandler(svc)

	admin.Get("/questions-bank", h.ListQuestions)
	admin.Get("/questions-bank/paginated", h.ListQuestionsPaginated)
	admin.Post("/questions-bank", h.CreateQuestion)
	admin.Patch("/questions-bank/:id", h.UpdateQuestion)
	admin.Delete("/questions-bank", h.BulkDeleteQuestions)
}

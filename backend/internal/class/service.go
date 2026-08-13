package class

import (
	"strings"

	"bimbel2/backend/internal/models"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

type ClassResponse struct {
	ID               uint    `json:"id"`
	Name             string  `json:"name"`
	Slug             string  `json:"slug"`
	PricePerSession  float64 `json:"price_per_session"`
	GroupPrice       float64 `json:"group_price"`
}

func (s *Service) List() ([]ClassResponse, error) {
	classes, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	result := make([]ClassResponse, len(classes))
	for i, c := range classes {
		result[i] = toResponse(c)
	}
	return result, nil
}

func (s *Service) Get(id uint) (*ClassResponse, error) {
	c, err := s.repo.Get(id)
	if err != nil {
		return nil, err
	}
	r := toResponse(*c)
	return &r, nil
}

func (s *Service) Create(name string, price, groupPrice float64) (*ClassResponse, error) {
	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	class := models.Class{
		Name:            name,
		Slug:            slug,
		PricePerSession: price,
		GroupPrice:      groupPrice,
	}
	if err := s.repo.Create(&class); err != nil {
		return nil, err
	}
	r := toResponse(class)
	return &r, nil
}

func (s *Service) Update(id uint, name string, price, groupPrice *float64) (*ClassResponse, error) {
	updates := map[string]interface{}{}
	if name != "" {
		updates["name"] = name
		updates["slug"] = strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	}
	if price != nil {
		updates["price_per_session"] = *price
	}
	if groupPrice != nil {
		updates["group_price"] = *groupPrice
	}
	if err := s.repo.Update(id, updates); err != nil {
		return nil, err
	}
	return s.Get(id)
}

func (s *Service) Delete(id uint) error {
	return s.repo.Delete(id)
}

func toResponse(c models.Class) ClassResponse {
	return ClassResponse{
		ID:               c.ID,
		Name:             c.Name,
		Slug:             c.Slug,
		PricePerSession:  c.PricePerSession,
		GroupPrice:       c.GroupPrice,
	}
}

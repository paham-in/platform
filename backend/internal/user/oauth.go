package user

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"bimbel2/backend/internal/config"

	"github.com/gofiber/fiber/v2"
)

type OAuthConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	AppURL       string
}

type googleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func NewOAuthHandler(svc *Service, cfg *config.Config) *Handler {
	return &Handler{svc: svc, oauthCfg: &OAuthConfig{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.GoogleCallbackURL,
		AppURL:       cfg.AppURL,
	}}
}

// GoogleLogin redirects user to Google consent screen
// @Summary      Login with Google
// @Description  Redirect to Google OAuth consent screen
// @Tags         Auth
// @Success      302
// @Router       /auth/google [get]
func (h *Handler) GoogleLogin(c *fiber.Ctx) error {
	state, err := generateState()
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal generate state"})
	}

	// store state in session/cookie for CSRF validation
	c.Cookie(&fiber.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		MaxAge:   300, // 5 menit
		HTTPOnly: true,
	})

	authURL := fmt.Sprintf(
		"https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=email%%20profile&state=%s",
		url.QueryEscape(h.oauthCfg.ClientID),
		url.QueryEscape(h.oauthCfg.RedirectURL),
		state,
	)

	return c.Redirect(authURL, fiber.StatusFound)
}

// GoogleCallback handles the OAuth callback from Google
// @Summary      Google OAuth callback
// @Description  Exchange code for token, get user info, create session
// @Tags         Auth
// @Success      302
// @Router       /auth/google/callback [get]
func (h *Handler) GoogleCallback(c *fiber.Ctx) error {
	code := c.Query("code")
	state := c.Query("state")
	cookieState := c.Cookies("oauth_state")

	if code == "" {
		return c.Status(400).JSON(ErrorResponse{Error: "code tidak ditemukan"})
	}

	// validate state (CSRF protection)
	if cookieState == "" || state != cookieState {
		return c.Status(400).JSON(ErrorResponse{Error: "state tidak valid"})
	}

	// clear state cookie
	c.ClearCookie("oauth_state")

	// exchange code for access token
	token, err := h.exchangeCode(code)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mendapatkan token: " + err.Error()})
	}

	// fetch user info from Google
	userInfo, err := h.fetchUserInfo(token)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: "gagal mengambil data user: " + err.Error()})
	}

	// login or create user
	result, err := h.svc.LoginOrCreateWithGoogle(userInfo.ID, userInfo.Email, userInfo.Name, userInfo.Picture)
	if err != nil {
		return c.Status(500).JSON(ErrorResponse{Error: err.Error()})
	}

	// redirect to frontend with token
	return c.Redirect(h.oauthCfg.AppURL+"/auth/callback?token="+result.Token, fiber.StatusFound)
}

func (h *Handler) exchangeCode(code string) (string, error) {
	resp, err := http.PostForm("https://oauth2.googleapis.com/token", url.Values{
		"code":          {code},
		"client_id":     {h.oauthCfg.ClientID},
		"client_secret": {h.oauthCfg.ClientSecret},
		"redirect_uri":  {h.oauthCfg.RedirectURL},
		"grant_type":    {"authorization_code"},
	})
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var result struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", err
	}
	if result.Error != "" {
		return "", fmt.Errorf("google error: %s", result.Error)
	}

	return result.AccessToken, nil
}

func (h *Handler) fetchUserInfo(accessToken string) (*googleUserInfo, error) {
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo googleUserInfo
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

func generateState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

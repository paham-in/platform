package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	DBHost    string
	DBPort    string
	DBUser    string
	DBPass    string
	DBName    string
	JWTSecret string
	AdminName string
	AdminEmail string
	AdminPass string
}

func Load() *Config {
	godotenv.Load()

	return &Config{
		Port:       getEnv("PORT", "8080"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPass:     getEnv("DB_PASS", "postgres"),
		DBName:     getEnv("DB_NAME", "bimbel"),
		JWTSecret:  getEnv("JWT_SECRET", "secret-key-change-in-production"),
		AdminName:  getEnv("ADMIN_NAME", "Admin Bimbel"),
		AdminEmail: getEnv("ADMIN_EMAIL", "admin@bimbel.com"),
		AdminPass:  getEnv("ADMIN_PASS", "admin123"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

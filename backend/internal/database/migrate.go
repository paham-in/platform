package database

import (
	"embed"
	"fmt"
	"net/url"

	"bimbel2/backend/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// RunMigrations menjalankan skema migrasi (golang-migrate) dari folder
// migrations/*.sql. Dipanggil di startup sebelum seed. Semua migrasi sudah
// pernah dijalan = no-op.
func RunMigrations(cfg *config.Config) error {
	src, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("load migrations: %w", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", src, migrateURL(cfg))
	if err != nil {
		return fmt.Errorf("init migrate: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("run migrate: %w", err)
	}
	return nil
}

func migrateURL(cfg *config.Config) string {
	user := url.QueryEscape(cfg.DBUser)
	pass := url.QueryEscape(cfg.DBPass)
	dbname := url.PathEscape(cfg.DBName)
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, pass, cfg.DBHost, cfg.DBPort, dbname)
}
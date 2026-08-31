CREATE TABLE IF NOT EXISTS roles (
    id         bigserial PRIMARY KEY,
    created_at timestamptz,
    updated_at timestamptz,
    deleted_at timestamptz,
    name       varchar(20) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name ON roles (name);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at ON roles (deleted_at);
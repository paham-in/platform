CREATE TABLE IF NOT EXISTS teacher_permissions (
    id                          bigserial PRIMARY KEY,
    created_at                  timestamptz,
    updated_at                  timestamptz,
    deleted_at                  timestamptz,
    user_id                     bigint NOT NULL,
    can_manage_materials        boolean DEFAULT false,
    can_manage_question_packages boolean DEFAULT false,
    CONSTRAINT fk_users_teacher_permission FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_permissions_user_id ON teacher_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_permissions_deleted_at ON teacher_permissions (deleted_at);
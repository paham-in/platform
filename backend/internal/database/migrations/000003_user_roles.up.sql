CREATE TABLE IF NOT EXISTS user_roles (
    role_id bigint NOT NULL,
    user_id bigint NOT NULL,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    PRIMARY KEY (role_id, user_id)
);
CREATE TABLE IF NOT EXISTS forum_answer_assets (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    answer_id   bigint NOT NULL,
    object_name varchar(255) NOT NULL,
    CONSTRAINT fk_forum_answer_assets_answer FOREIGN KEY (answer_id) REFERENCES forum_answers (id)
);

CREATE INDEX IF NOT EXISTS idx_forum_answer_assets_answer_id ON forum_answer_assets (answer_id);
CREATE INDEX IF NOT EXISTS idx_forum_answer_assets_deleted_at ON forum_answer_assets (deleted_at);
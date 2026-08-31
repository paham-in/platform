CREATE TABLE IF NOT EXISTS material_assets (
    id          bigserial PRIMARY KEY,
    created_at  timestamptz,
    updated_at  timestamptz,
    deleted_at  timestamptz,
    material_id bigint NOT NULL,
    object_name varchar(255) NOT NULL,
    CONSTRAINT fk_material_assets_material FOREIGN KEY (material_id) REFERENCES materials (id)
);

CREATE INDEX IF NOT EXISTS idx_material_assets_material_id ON material_assets (material_id);
CREATE INDEX IF NOT EXISTS idx_material_assets_deleted_at ON material_assets (deleted_at);
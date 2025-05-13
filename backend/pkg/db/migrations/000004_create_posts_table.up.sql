CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    image TEXT,
    visibility TEXT CHECK (visibility IN ('public', 'private', 'selected')) NOT NULL DEFAULT 'public',
    allowed_ids UUID [],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
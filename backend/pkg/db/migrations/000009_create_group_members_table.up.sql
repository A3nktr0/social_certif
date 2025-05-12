CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
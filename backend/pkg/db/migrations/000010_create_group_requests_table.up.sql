CREATE TABLE IF NOT EXISTS group_requests (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT CHECK (
        status IN ('pending', 'accepted', 'rejected', 'invited')
    ) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);
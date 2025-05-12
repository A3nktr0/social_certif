CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (char_length(content) <= 5000),
    is_emoji_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (
            recipient_id IS NOT NULL
            AND group_id IS NULL
        )
        OR (
            recipient_id IS NULL
            AND group_id IS NOT NULL
        )
    )
);
CREATE INDEX idx_messages_private ON messages (sender_id, recipient_id);
CREATE INDEX idx_messages_group ON messages (group_id);
CREATE INDEX idx_messages_created ON messages (created_at);
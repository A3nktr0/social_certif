ALTER TABLE posts
ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
-- If a post is tied to a group, it's not public-facing
ALTER TABLE posts
ADD CONSTRAINT group_post_visibility_check CHECK (
        (
            group_id IS NULL
            AND visibility IN ('public', 'private', 'selected')
        )
        OR (
            group_id IS NOT NULL
            AND visibility = 'group'
        )
    );
-- Drop the old visibility CHECK constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_visibility_check;
-- Re-add it with 'group' included in the allowed values
ALTER TABLE posts
ADD CONSTRAINT posts_visibility_check CHECK (
        visibility IN ('public', 'private', 'selected', 'group')
    );
-- Drop and re-add the group logic constraint (already defined in step 11)
ALTER TABLE posts DROP CONSTRAINT IF EXISTS group_post_visibility_check;
-- Re-apply the correct logic between group_id and visibility
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
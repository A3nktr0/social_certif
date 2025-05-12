-- 1. Create the ENUM type
CREATE TYPE follow_status AS ENUM ('pending', 'accepted');
-- 2. Alter the `follows.status` column to use the ENUM type
ALTER TABLE follows
ALTER COLUMN status TYPE follow_status USING status::follow_status;
-- 3. (Optional but recommended) Drop the old CHECK constraint
-- This removes the now-redundant validation
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_status_check;
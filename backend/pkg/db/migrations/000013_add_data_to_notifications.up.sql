ALTER TABLE notifications
ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
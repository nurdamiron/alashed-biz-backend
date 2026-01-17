-- Add user preferences (theme preference)

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "dark"}'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users USING GIN (preferences);

-- Set default theme for existing users
UPDATE users SET preferences = jsonb_set(COALESCE(preferences, '{}'::jsonb), '{theme}', '"dark"') WHERE preferences IS NULL OR preferences->>'theme' IS NULL;

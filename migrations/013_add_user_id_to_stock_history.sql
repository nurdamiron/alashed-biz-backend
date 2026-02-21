-- Migration: Add user_id column to stock_history if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='stock_history' AND column_name='user_id'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_stock_history_user_id ON stock_history(user_id);
  END IF;
END $$;

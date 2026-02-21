-- Migration: Add missing columns to stock_history if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='stock_history' AND column_name='user_id'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_stock_history_user_id ON stock_history(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='stock_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
  END IF;
END $$;

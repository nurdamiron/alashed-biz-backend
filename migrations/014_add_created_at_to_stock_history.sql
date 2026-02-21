-- Migration: Add created_at to stock_history if missing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='stock_history' AND column_name='created_at'
  ) THEN
    ALTER TABLE stock_history ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
  END IF;
END $$;

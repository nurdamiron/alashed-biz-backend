-- Migration: Add missing indexes for better query performance
-- Uses DO blocks to safely skip indexes if columns don't exist

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_history' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_stock_history_user_id ON stock_history(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_status_history' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_order_status_history_user_id ON order_status_history(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='task_comments' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(id) WHERE is_active = TRUE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employees' AND column_name='is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(id) WHERE is_active = TRUE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(id) WHERE is_active = TRUE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='warehouse_locations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouse_locations' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_warehouse_locations_active ON warehouse_locations(id) WHERE is_active = TRUE;
    END IF;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_status_history' AND column_name='changed_at') THEN
    CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_history' AND column_name='created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='stock_reservations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_reservations' AND column_name='status') THEN
      CREATE INDEX IF NOT EXISTS idx_stock_reservations_status_expires ON stock_reservations(status, expires_at) WHERE status = 'active';
    END IF;
  END IF;
END $$;

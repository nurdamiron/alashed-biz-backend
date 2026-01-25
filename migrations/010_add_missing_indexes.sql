-- Migration: Add missing indexes for better query performance
-- These indexes optimize common lookup and filtering patterns

-- Foreign key indexes (for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_user_id ON stock_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_user_id ON order_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

-- Partial indexes for active records (very efficient for filtering active/inactive)
CREATE INDEX IF NOT EXISTS idx_products_active ON products(id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_warehouse_locations_active ON warehouse_locations(id) WHERE is_active = TRUE;

-- Temporal indexes for historical queries
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_history_created_at ON stock_history(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status_deadline ON tasks(status, deadline);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status_expires ON stock_reservations(status, expires_at) WHERE status = 'active';

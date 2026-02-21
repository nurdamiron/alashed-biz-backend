-- Migration: Add source column to orders table
-- Tracks where the order came from (Kaspi, Instagram, WhatsApp, Сайт, etc.)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'Магазин';

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);

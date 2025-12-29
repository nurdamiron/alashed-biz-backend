-- Migration: Warehouse improvements (GTIN, Suppliers, Locations)
-- Date: 2025-12-29
-- Description: Add warehouse management features without ESF integration yet

-- =====================================================
-- 1. SUPPLIERS (Поставщики)
-- =====================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tin VARCHAR(12),                   -- ИИН/БИН (12 цифр в РК)
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  contact_person VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. IMPROVE PRODUCTS (Улучшение товаров)
-- =====================================================
-- Добавляем важные поля для учета
ALTER TABLE products
ADD COLUMN IF NOT EXISTS gtin VARCHAR(14),              -- Глобальный штрих-код
ADD COLUMN IF NOT EXISTS serial_numbers TEXT[],         -- IMEI/серийники (для техники)
ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS images TEXT[],                 -- Фото товаров
ADD COLUMN IF NOT EXISTS marking_code VARCHAR(100),     -- Код маркировки (Data Matrix)
ADD COLUMN IF NOT EXISTS is_marked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS origin_country VARCHAR(2);     -- Код страны (KZ, CN, etc)

-- =====================================================
-- 3. WAREHOUSE LOCATIONS (Адресное хранение)
-- =====================================================
CREATE TABLE IF NOT EXISTS warehouse_locations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,  -- "A1-Shelf-2", "Zone-B-Rack-3"
  name VARCHAR(255),                 -- "Склад основной, стеллаж А1, полка 2"
  zone VARCHAR(50),                  -- "Zone-A"
  aisle VARCHAR(10),                 -- Проход
  rack VARCHAR(10),                  -- Стеллаж
  shelf VARCHAR(10),                 -- Полка
  capacity INTEGER,                  -- Вместимость (опционально)
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. PRODUCT LOCATIONS (Размещение товаров)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_locations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES warehouse_locations(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_qty INTEGER DEFAULT 0,    -- Зарезервировано под заказы
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, location_id)
);

-- =====================================================
-- 5. STOCK RESERVATIONS (Резервирование товаров)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_reservations (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id INTEGER REFERENCES warehouse_locations(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,              -- Авто-снятие через 24ч
  released_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'released', 'completed'
  notes TEXT
);

-- =====================================================
-- 6. FISCAL RECEIPTS (Фискальные чеки)
-- =====================================================
CREATE TABLE IF NOT EXISTS fiscal_receipts (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  receipt_type VARCHAR(20) DEFAULT 'sale', -- 'sale', 'refund'
  receipt_number VARCHAR(100),
  fiscal_sign VARCHAR(255),          -- Фискальный признак
  qr_code_url VARCHAR(500),          -- Ссылка на чек
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  shift_id VARCHAR(100),
  cashier_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  fiscal_date TIMESTAMP,
  response_json JSONB,               -- Полный ответ от Webkassa
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'error'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. IMPROVE ORDERS (Добавить фискализацию)
-- =====================================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS fiscal_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_fiscalized BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 8. IMPROVE STOCK HISTORY (Улучшить историю)
-- =====================================================
ALTER TABLE stock_history
ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES warehouse_locations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50), -- 'receipt', 'sale', 'adjustment', 'return'
ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);

-- =====================================================
-- 9. INDEXES (Индексы для производительности)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_products_gtin ON products(gtin);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_tin ON suppliers(tin);

CREATE INDEX IF NOT EXISTS idx_product_locations_product ON product_locations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_locations_location ON product_locations(location_id);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order ON stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product ON stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON stock_reservations(status);

CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_order ON fiscal_receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_receipts_status ON fiscal_receipts(status);

-- =====================================================
-- 10. UPDATE UNITS (Классификатор РК)
-- =====================================================
-- Добавляем коды единиц измерения по КПВЭД РК
ALTER TABLE units_of_measurement
ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- Обновляем существующие единицы
UPDATE units_of_measurement SET code = '006' WHERE abbreviation = 'шт';
UPDATE units_of_measurement SET code = '166' WHERE abbreviation = 'кг';
UPDATE units_of_measurement SET code = '112' WHERE abbreviation = 'л';
UPDATE units_of_measurement SET code = '055' WHERE abbreviation = 'м';
UPDATE units_of_measurement SET code = '778' WHERE abbreviation = 'уп';

-- Добавляем дополнительные единицы для РК
INSERT INTO units_of_measurement (code, name, abbreviation) VALUES
  ('715', 'Комплект', 'компл'),
  ('796', 'Пара', 'пар'),
  ('163', 'Грамм', 'г'),
  ('113', 'Миллилитр', 'мл')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. COMMENTS (Комментарии к таблицам)
-- =====================================================
COMMENT ON TABLE suppliers IS 'Поставщики товаров';
COMMENT ON TABLE warehouse_locations IS 'Адреса хранения на складе (ячейки, стеллажи)';
COMMENT ON TABLE product_locations IS 'Размещение товаров по ячейкам';
COMMENT ON TABLE stock_reservations IS 'Резервирование товаров под заказы';
COMMENT ON TABLE fiscal_receipts IS 'Фискальные чеки (Webkassa)';

COMMENT ON COLUMN products.gtin IS 'Глобальный номер товара (штрих-код 13-14 цифр)';
COMMENT ON COLUMN products.serial_numbers IS 'Серийные номера/IMEI для техники (массив)';
COMMENT ON COLUMN products.marking_code IS 'Код маркировки Data Matrix (обязательные товары)';
COMMENT ON COLUMN suppliers.tin IS 'ИИН/БИН поставщика (12 цифр, РК)';
COMMENT ON COLUMN units_of_measurement.code IS 'Код единицы измерения по КПВЭД РК';

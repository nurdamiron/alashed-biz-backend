import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting seed...\n');

    await client.query('BEGIN');

    // 1. Создать тестового пользователя (admin)
    console.log('👤 Creating admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id`,
      ['admin@alashed.kz', passwordHash, 'Администратор', 'admin']
    );
    const userId = userResult.rows[0].id;
    console.log(`✅ Admin user created (ID: ${userId})\n`);

    // 2. Создать поставщиков
    console.log('🏭 Creating suppliers...');
    const suppliers = [
      { name: 'ТОО "Казахстан Снаб"', tin: '240540123456', phone: '+77001234567', email: 'info@kazsnab.kz' },
      { name: 'ИП Иванов', tin: '850215123456', phone: '+77017654321', email: 'ivanov@mail.kz' },
      { name: 'ТОО "ТехноПлюс"', tin: '200101234567', phone: '+77089876543', email: 'techno@tech.kz' },
    ];

    const supplierIds: number[] = [];
    for (const s of suppliers) {
      const result = await client.query(
        `INSERT INTO suppliers (name, tin, phone, email, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [s.name, s.tin, s.phone, s.email]
      );
      if (result.rows.length > 0) {
        supplierIds.push(result.rows[0].id);
        console.log(`  ✅ ${s.name}`);
      }
    }
    console.log('');

    // 3. Создать категории
    console.log('📁 Creating categories...');
    const categories = ['Электроника', 'Одежда', 'Продукты', 'Бытовая техника'];
    const categoryIds: number[] = [];
    for (const cat of categories) {
      const result = await client.query(
        `INSERT INTO categories (name, created_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING RETURNING id`,
        [cat]
      );
      if (result.rows.length > 0) {
        categoryIds.push(result.rows[0].id);
        console.log(`  ✅ ${cat}`);
      }
    }
    console.log('');

    // 4. Создать бренды
    console.log('🏷️  Creating brands...');
    const brands = ['Samsung', 'Apple', 'Xiaomi', 'LG'];
    const brandIds: number[] = [];
    for (const brand of brands) {
      const result = await client.query(
        `INSERT INTO brands (name, created_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING RETURNING id`,
        [brand]
      );
      if (result.rows.length > 0) {
        brandIds.push(result.rows[0].id);
        console.log(`  ✅ ${brand}`);
      }
    }
    console.log('');

    // 5. Создать товары
    console.log('📦 Creating products...');
    const products = [
      {
        name: 'iPhone 15 Pro',
        sku: 'IPHONE-15-PRO',
        description: 'Смартфон Apple iPhone 15 Pro 256GB',
        categoryId: categoryIds[0],
        brandId: brandIds[1],
        supplierId: supplierIds[0],
        price: 550000,
        costPrice: 480000,
        quantity: 15,
        barcode: '4547890123456',
        gtin: '04547890123456',
        minStockLevel: 5,
      },
      {
        name: 'Samsung Galaxy S24',
        sku: 'SAMSUNG-S24',
        description: 'Смартфон Samsung Galaxy S24 128GB',
        categoryId: categoryIds[0],
        brandId: brandIds[0],
        supplierId: supplierIds[1],
        price: 420000,
        costPrice: 370000,
        quantity: 25,
        barcode: '8801234567890',
        gtin: '08801234567890',
        minStockLevel: 10,
      },
      {
        name: 'Xiaomi Redmi Note 13',
        sku: 'XIAOMI-NOTE13',
        description: 'Смартфон Xiaomi Redmi Note 13 128GB',
        categoryId: categoryIds[0],
        brandId: brandIds[2],
        supplierId: supplierIds[2],
        price: 150000,
        costPrice: 120000,
        quantity: 50,
        barcode: '6941234567890',
        gtin: '06941234567890',
        minStockLevel: 15,
      },
      {
        name: 'LG Холодильник',
        sku: 'LG-FRIDGE-500',
        description: 'Холодильник LG 500L двухкамерный',
        categoryId: categoryIds[3],
        brandId: brandIds[3],
        supplierId: supplierIds[0],
        price: 350000,
        costPrice: 280000,
        quantity: 8,
        barcode: '8806123456789',
        gtin: '08806123456789',
        minStockLevel: 3,
      },
    ];

    for (const p of products) {
      await client.query(
        `INSERT INTO products (name, sku, description, category_id, brand_id, supplier_id, unit_id, price, cost_price, quantity, min_stock_level, barcode, gtin, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9, $10, $11, $12, true, NOW(), NOW())
         ON CONFLICT (sku) DO NOTHING`,
        [p.name, p.sku, p.description, p.categoryId, p.brandId, p.supplierId, p.price, p.costPrice, p.quantity, p.minStockLevel, p.barcode, p.gtin]
      );
      console.log(`  ✅ ${p.name}`);
    }
    console.log('');

    // 6. Создать клиентов
    console.log('👥 Creating customers...');
    const customers = [
      { name: 'Иванов Иван', phone: '+77011234567', email: 'ivanov@example.com' },
      { name: 'Петров Петр', phone: '+77019876543', email: 'petrov@example.com' },
      { name: 'Сидорова Анна', phone: '+77015556677', email: 'sidorova@example.com' },
    ];

    for (const c of customers) {
      await client.query(
        `INSERT INTO customers (name, phone, email, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [c.name, c.phone, c.email]
      );
      console.log(`  ✅ ${c.name}`);
    }
    console.log('');

    await client.query('COMMIT');

    console.log('✅ Seed completed successfully!\n');
    console.log('📝 Test credentials:');
    console.log('   Email: admin@alashed.kz');
    console.log('   Password: admin123\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seed error:', error);
  process.exit(1);
});

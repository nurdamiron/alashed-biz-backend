# Alashed Business API 🚀

Backend API для управления заказами, задачами, складом и фискализацией (Казахстан).

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify
- **Database:** PostgreSQL
- **Architecture:** DDD (Domain-Driven Design)
- **Auth:** JWT
- **Fiscal:** Webkassa API (РК)
- **Location:** Kazakhstan specific features

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials

# Run migrations
npm run migrate

# Seed test data (optional)
npm run seed

# Start development server
npm run dev
```

### Docker

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f api
```

## Новые возможности (v2.1)

### ✅ Управление поставщиками
- CRUD операции для поставщиков
- Поддержка ИИН/БИН (12 цифр, РК)
- Валидация номеров налогоплательщиков

### ✅ Адресное хранение на складе
- Локации склада (зоны, стеллажи, полки)
- Привязка товаров к конкретным ячейкам
- Приемка товаров с указанием места хранения

### ✅ Фискализация (Webkassa)
- Интеграция с Webkassa API
- Автоматическое создание фискальных чеков
- QR-коды чеков для клиентов
- Тестовый режим для разработки

### ✅ Расширенный учет товаров
- GTIN (глобальный штрих-код)
- Серийные номера (IMEI для техники)
- Коды маркировки (Data Matrix)
- История движения по локациям

## Project Structure

```
src/
├── config/              # Configuration
├── shared/              # Shared kernel
│   ├── domain/          # Base classes (Entity, ValueObject, etc.)
│   ├── application/     # Use case interfaces, Result monad
│   └── infrastructure/  # Database, auth utilities
├── domains/             # Business domains (DDD)
│   ├── auth/            # Аутентификация и пользователи
│   ├── orders/          # Заказы клиентов
│   ├── tasks/           # Задачи для сотрудников
│   ├── inventory/       # Склад и товары + локации
│   ├── suppliers/       # Поставщики (NEW!)
│   ├── fiscal/          # Фискализация Webkassa (NEW!)
│   ├── analytics/       # Аналитика
│   ├── notifications/   # Уведомления
│   ├── staff/           # Сотрудники
│   └── ai/              # AI помощник (Gemini)
├── http/                # HTTP layer
│   └── routes/
├── middleware/          # Fastify middleware
└── di/                  # Dependency injection
```

## API Documentation

Swagger UI: `http://localhost:3000/docs`

### Основные эндпоинты

**Suppliers (Поставщики):**
- `GET /suppliers` - Список поставщиков
- `POST /suppliers` - Создать поставщика
- `GET /suppliers/:id` - Получить поставщика
- `PUT /suppliers/:id` - Обновить поставщика
- `DELETE /suppliers/:id` - Деактивировать поставщика

**Inventory (Склад):**
- `GET /inventory/locations` - Локации склада
- `POST /inventory/locations` - Создать локацию
- `GET /inventory/products/:id/locations` - Где лежит товар
- `POST /inventory/receive` - Приемка товара

**Fiscal (Фискализация):**
- `POST /fiscal/receipts` - Создать фискальный чек
- `GET /fiscal/receipts/:orderId` - Получить чек по заказу

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Запуск dev сервера |
| `npm run build` | Сборка для продакшена |
| `npm start` | Запуск продакшен сервера |
| `npm run migrate` | Запуск миграций БД |
| `npm test` | Запуск тестов |

## Environment Variables

Ключевые переменные окружения:

```bash
# Сервер
PORT=3000
NODE_ENV=development

# База данных (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname
DB_SSL=true

# JWT
JWT_SECRET=your-256-bit-secret

# Webkassa (Фискализация РК)
WEBKASSA_API_URL=https://devkkm.webkassa.kz/api
WEBKASSA_TOKEN=your_token
WEBKASSA_CASHBOX_ID=your_cashbox_id
WEBKASSA_TEST_MODE=true  # false для продакшена
```

Полный список см. в `.env.example`

## Миграции

### Запуск миграций

```bash
# Все миграции по порядку
npm run migrate

# Или вручную через psql
psql -d your_database < migrations/001_initial_schema.sql
psql -d your_database < migrations/002_warehouse_improvements.sql
```

### Структура миграций

- **001_initial_schema.sql** - Базовая схема (users, products, orders, tasks)
- **002_warehouse_improvements.sql** - Поставщики, фискализация, GTIN

### Тестовые данные

Запустите `npm run seed` чтобы создать:
- **Админ пользователь:** admin@alashed.kz / admin123
- **3 поставщика** с ИИН/БИН
- **4 товара** (iPhone, Samsung, Xiaomi, LG)
- **3 клиента** для тестовых заказов

## Бизнес-процессы

### 1. Приемка товара от поставщика (упрощенная, без локаций)

```typescript
// 1. Создать поставщика (если нет)
POST /suppliers
{
  "name": "ТОО Поставщик",
  "tin": "123456789012",  // БИН 12 цифр
  "phone": "+77001234567"
}

// 2. Принять товар (просто увеличить остаток)
POST /inventory/receive
{
  "productId": 15,
  "quantity": 100,
  "supplierId": 5,
  "documentNumber": "SNT-12345",
  "notes": "Приемка от поставщика"
}

// Товар автоматически привязывается к поставщику
```

### 2. Продажа с фискальным чеком

```typescript
// 1. Создать заказ
POST /orders
{
  "customerId": 10,
  "customerName": "Иванов Иван",
  "customerPhone": "+77001234567",
  "items": [
    { "productId": 15, "quantity": 2, "unitPrice": 50000 }
  ],
  "paymentMethod": "card"
}

// 2. Фискализировать (создать чек)
POST /fiscal/receipts
{
  "orderId": 123,
  "cashierId": 1
}

// Ответ:
{
  "receiptNumber": "TEST-1234567890",
  "fiscalSign": "FSABC123",
  "qrCodeUrl": "https://webkassa.kz/receipt/TEST-1234567890",
  "amount": 100000,
  "status": "success"
}

// 3. Отправить QR-код клиенту (SMS/WhatsApp)
```

### 3. Просмотр товаров и остатков

```typescript
// Получить список всех товаров
GET /inventory

// Поиск товара
GET /inventory/search?q=iPhone

// Просмотр истории движений
GET /inventory/15/logs

// Ответ:
[
  {
    "quantityChange": 100,
    "quantityBefore": 50,
    "quantityAfter": 150,
    "reason": "Приемка от поставщика",
    "userName": "Администратор",
    "createdAt": "2025-12-29T12:00:00Z"
  }
]
```

## Deployment

### AWS EC2

```bash
# On server
git pull origin main
npm ci --production
npm run build
npm run migrate
pm2 reload ecosystem.config.cjs
```

### Docker

```bash
docker build -t alashed-api .
docker run -d -p 3000:3000 --env-file .env alashed-api
```

## Особенности для РК

- **ИИН/БИН валидация**: 12 цифр, автоматическая проверка формата
- **НДС 12%**: Используется в фискальных чеках
- **Webkassa интеграция**: Тестовый и продакшн режимы
- **Единицы измерения**: Классификатор КПВЭД РК (шт, кг, л, м, компл)

## Roadmap (будущие фичи)

- [ ] Интеграция с ИС ЭСФ (esf.gov.kz)
- [ ] ЭЦП подпись (Kalkan Crypt)
- [ ] Виртуальный склад налоговой
- [ ] Автоматическое списание при продаже физлицам
- [ ] Мобильное приложение для кладовщиков (PWA)
- [ ] Email/SMS уведомления
- [ ] Отчеты для налоговой

## License

Private

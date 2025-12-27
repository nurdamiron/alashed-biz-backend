# Alashed Business API

Backend API for Orders, Tasks, and Inventory Management.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Fastify
- **Database:** PostgreSQL
- **Architecture:** DDD (Domain-Driven Design)
- **Auth:** JWT

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

## Project Structure

```
src/
├── config/              # Configuration
├── shared/              # Shared kernel
│   ├── domain/          # Base classes (Entity, ValueObject, etc.)
│   ├── application/     # Use case interfaces, Result monad
│   └── infrastructure/  # Database, auth utilities
├── domains/             # Business domains (DDD)
│   ├── auth/
│   ├── orders/
│   ├── tasks/
│   ├── inventory/
│   ├── analytics/
│   └── ai/
├── http/                # HTTP layer
│   └── routes/
├── middleware/          # Fastify middleware
└── di/                  # Dependency injection
```

## API Documentation

Swagger UI available at: `http://localhost:3000/docs`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm test` | Run tests |

## Environment Variables

See `.env.example` for all required variables.

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

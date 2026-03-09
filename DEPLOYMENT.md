# Production Deployment Guide (EC2 + HTTPS)

## Архитектура

```
Internet
   │
   ├── https://biz.alashed.kz       → Nginx (static files, Vite build)
   └── https://api.biz.alashed.kz  → Nginx → Fastify :3000 (PM2)
                                              ↓
                                       PostgreSQL :5432
```

SSL сертификаты — Let's Encrypt (бесплатно, автообновление каждые 90 дней).

---

## Требования к EC2

- Ubuntu 22.04 LTS
- Минимум t2.small (1 CPU, 2GB RAM)
- Security Group: порты 22, 80, 443
- DNS: домены `biz.alashed.kz` и `api.biz.alashed.kz` должны указывать на IP сервера

---

## Быстрый деплой

### Шаг 1 — Подключиться к EC2

```bash
chmod 400 alashed-key.pem
ssh -i alashed-key.pem ubuntu@YOUR_EC2_IP
```

### Шаг 2 — Запустить скрипт деплоя

```bash
curl -fsSL https://raw.githubusercontent.com/nurdamiron/alashed-biz-backend/main/deploy-ec2.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

Скрипт автоматически:
- Устанавливает Node.js 20, PostgreSQL, Nginx, PM2, Certbot
- Клонирует и билдит backend + frontend
- Настраивает Nginx для обоих доменов
- Получает SSL сертификаты от Let's Encrypt
- Настраивает автообновление сертификатов
- Включает firewall (UFW)

### Шаг 3 — Заполнить секреты

```bash
nano /var/www/alashed-biz-backend/.env
```

Обязательно заполнить:
```env
DATABASE_URL=postgresql://alashed:CHANGE_ME_STRONG_PASSWORD@localhost:5432/alashed_biz
JWT_SECRET=         # openssl rand -base64 48
JWT_REFRESH_SECRET= # openssl rand -base64 48
GEMINI_API_KEY=
WEBKASSA_LOGIN=
WEBKASSA_PASSWORD=
VAPID_PUBLIC_KEY=   # npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### Шаг 4 — Перезапустить backend

```bash
pm2 restart alashed-api
pm2 status
```

---

## Ручной деплой (шаг за шагом)

### 1. Установить зависимости

```bash
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx postgresql postgresql-contrib

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2
```

### 2. База данных

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE alashed_biz;
CREATE USER alashed WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE alashed_biz TO alashed;
ALTER DATABASE alashed_biz OWNER TO alashed;
\q
```

### 3. Backend

```bash
sudo mkdir -p /var/www
sudo git clone https://github.com/nurdamiron/alashed-biz-backend.git /var/www/alashed-biz-backend
sudo chown -R ubuntu:ubuntu /var/www/alashed-biz-backend
cd /var/www/alashed-biz-backend

npm ci --production
npm run build
cp .env.example .env
nano .env  # заполнить

npm run migrate

pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # скопировать и выполнить выданную команду
```

### 4. Frontend

```bash
sudo git clone https://github.com/nurdamiron/alashed-biz-frontend.git /var/www/alashed-biz-frontend
sudo chown -R ubuntu:ubuntu /var/www/alashed-biz-frontend
cd /var/www/alashed-biz-frontend

# Указать URL бекенда
echo "VITE_API_URL=https://api.biz.alashed.kz/api" > .env.production

npm ci
npm run build

sudo mkdir -p /var/www/html/alashed-frontend
sudo cp -r dist/* /var/www/html/alashed-frontend/
```

### 5. Nginx

```bash
# Backend (API)
sudo tee /etc/nginx/sites-available/alashed-backend > /dev/null << 'EOF'
server {
    listen 80;
    server_name api.biz.alashed.kz;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }
}
EOF

# Frontend (статика)
sudo tee /etc/nginx/sites-available/alashed-frontend > /dev/null << 'EOF'
server {
    listen 80;
    server_name biz.alashed.kz;

    root /var/www/html/alashed-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/alashed-backend  /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/alashed-frontend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL сертификаты (Let's Encrypt)

Убедись, что DNS уже указывает на IP сервера, потом:

```bash
# Backend
sudo certbot --nginx -d api.biz.alashed.kz \
    --email admin@alashed.kz --agree-tos --non-interactive --redirect

# Frontend
sudo certbot --nginx -d biz.alashed.kz \
    --email admin@alashed.kz --agree-tos --non-interactive --redirect

# Проверить автообновление
sudo certbot renew --dry-run
```

Certbot автоматически:
- Получает сертификат
- Обновляет Nginx конфиг (добавляет HTTPS listen 443, redirect с 80)
- Настраивает systemd timer для автообновления каждые 90 дней

### 7. Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Обновление приложения

### Backend

```bash
cd /var/www/alashed-biz-backend
git pull origin main
npm ci --production
npm run build
npm run migrate
pm2 restart alashed-api
```

### Frontend

```bash
cd /var/www/alashed-biz-frontend
git pull origin main
npm ci
npm run build
sudo cp -r dist/* /var/www/html/alashed-frontend/
```

---

## Мониторинг

```bash
pm2 status                       # статус процессов
pm2 logs alashed-api             # логи backend в реальном времени
pm2 monit                        # CPU/Memory в реальном времени
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Бэкап базы данных

```bash
# Бэкап
pg_dump -U alashed alashed_biz > backup_$(date +%Y%m%d_%H%M).sql

# Восстановление
psql -U alashed alashed_biz < backup_20260101_1200.sql
```

---

## Troubleshooting

### Backend не стартует

```bash
pm2 logs alashed-api --lines 50
# Проверить .env, порт, базу данных
sudo lsof -i :3000
```

### Ошибка certbot "domain not resolving"

DNS должен указывать на IP EC2 перед запуском certbot.
Проверить: `dig biz.alashed.kz +short`

### Nginx 502 Bad Gateway

```bash
pm2 status  # backend должен быть online
curl http://localhost:3000/health
```

### SSL не обновляется

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

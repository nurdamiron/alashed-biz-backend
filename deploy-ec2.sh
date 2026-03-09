#!/bin/bash

# ============================================================
# Alashed Business - Full Production Deploy Script (EC2)
# Deploys: Backend (Fastify) + Frontend (Nginx static) + SSL
#
# Domains:
#   Frontend : https://app.alashed.kz
#   Backend  : https://api.biz.alashed.kz
#
# Usage:
#   chmod +x deploy-ec2.sh
#   ./deploy-ec2.sh
# ============================================================

set -e

FRONTEND_DOMAIN="biz.alashed.kz"
BACKEND_DOMAIN="api.biz.alashed.kz"
BACKEND_PORT=3000
BACKEND_DIR="/var/www/alashed-biz-backend"
FRONTEND_DIR="/var/www/alashed-biz-frontend"
FRONTEND_REPO="https://github.com/nurdamiron/alashed-biz-frontend.git"
BACKEND_REPO="https://github.com/nurdamiron/alashed-biz-backend.git"
CERTBOT_EMAIL="admin@alashed.kz"

echo "================================================================"
echo " Alashed Business - Full Deploy"
echo " Frontend : https://${FRONTEND_DOMAIN}"
echo " Backend  : https://${BACKEND_DOMAIN}"
echo "================================================================"

# ─────────────────────────────────────────
# 1. System packages
# ─────────────────────────────────────────
echo ""
echo "[1/9] Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

# ─────────────────────────────────────────
# 2. Node.js 20
# ─────────────────────────────────────────
echo ""
echo "[2/9] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node: $(node -v) | npm: $(npm -v)"

# ─────────────────────────────────────────
# 3. PostgreSQL (Removed: Using AWS RDS)
# ─────────────────────────────────────────
echo ""
echo "[3/9] Skipping PostgreSQL local installation (Using AWS RDS)..."
# ─────────────────────────────────────────
# 4. PM2 + Nginx + Certbot
# ─────────────────────────────────────────
echo ""
echo "[4/9] Installing PM2, Nginx, Certbot..."
sudo npm install -g pm2 --silent

if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

if ! command -v certbot &> /dev/null; then
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# ─────────────────────────────────────────
# 5. Deploy Backend
# ─────────────────────────────────────────
echo ""
echo "[5/9] Deploying backend..."
sudo mkdir -p /var/www
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    sudo git pull origin main
else
    sudo git clone "$BACKEND_REPO" "$BACKEND_DIR"
    sudo chown -R "$USER:$USER" "$BACKEND_DIR"
fi

cd "$BACKEND_DIR"
npm ci --production
npm run build

# Create .env if missing
if [ ! -f ".env" ]; then
    JWT_SECRET=$(openssl rand -base64 48)
    JWT_REFRESH_SECRET=$(openssl rand -base64 48)
    cat > .env << EOF
PORT=${BACKEND_PORT}
NODE_ENV=production

# Database
DATABASE_URL=postgresql://alashed:CHANGE_ME_STRONG_PASSWORD@localhost:5432/alashed_biz
DB_SSL=false

# JWT
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://${FRONTEND_DOMAIN}
ALLOWED_ORIGINS=https://${FRONTEND_DOMAIN}

# AI (Gemini)
GEMINI_API_KEY=

# Webkassa (Fiscal - Kazakhstan)
WEBKASSA_URL=https://kkm.webkassa.kz
WEBKASSA_LOGIN=
WEBKASSA_PASSWORD=

# Push Notifications (VAPID)
# Generate new keys: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@alashed.kz

# AWS S3 (Media storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-north-1
AWS_S3_BUCKET=alashed-media
EOF
    echo ""
    echo "  [!] .env created. Edit it before going live:"
    echo "      nano ${BACKEND_DIR}/.env"
fi

# Migrations
npm run migrate 2>/dev/null || echo "  [!] Migration failed or already applied"

# Start with PM2
pm2 delete alashed-api 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# PM2 auto-start on reboot
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | tail -1 | bash || true

# ─────────────────────────────────────────
# 6. Deploy Frontend
# ─────────────────────────────────────────
echo ""
echo "[6/9] Deploying frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    sudo git pull origin main
else
    sudo git clone "$FRONTEND_REPO" "$FRONTEND_DIR"
    sudo chown -R "$USER:$USER" "$FRONTEND_DIR"
fi

cd "$FRONTEND_DIR"
npm ci

# Production env for frontend build
cat > .env.production << EOF
VITE_API_URL=https://${BACKEND_DOMAIN}/api
EOF

npm run build

# Point Nginx to built files
sudo mkdir -p /var/www/html/alashed-frontend
sudo cp -r dist/* /var/www/html/alashed-frontend/

# ─────────────────────────────────────────
# 7. Nginx — HTTP config (pre-SSL)
# ─────────────────────────────────────────
echo ""
echo "[7/9] Configuring Nginx..."

# Backend (API)
sudo tee /etc/nginx/sites-available/alashed-backend > /dev/null << EOF
server {
    listen 80;
    server_name ${BACKEND_DOMAIN};

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90s;
    }
}
EOF

# Frontend (static SPA)
sudo tee /etc/nginx/sites-available/alashed-frontend > /dev/null << EOF
server {
    listen 80;
    server_name ${FRONTEND_DOMAIN};

    root /var/www/html/alashed-frontend;
    index index.html;

    # SPA fallback — always serve index.html
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for service worker
    location = /sw.js {
        add_header Cache-Control "no-cache";
    }
}
EOF

# Enable sites
sudo ln -sf /etc/nginx/sites-available/alashed-backend  /etc/nginx/sites-enabled/alashed-backend
sudo ln -sf /etc/nginx/sites-available/alashed-frontend /etc/nginx/sites-enabled/alashed-frontend
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx

# ─────────────────────────────────────────
# 8. SSL — Let's Encrypt via Certbot
# ─────────────────────────────────────────
echo ""
echo "[8/9] Obtaining SSL certificates..."

# Backend certificate
sudo certbot --nginx \
    -d "$BACKEND_DOMAIN" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect

# Frontend certificate
sudo certbot --nginx \
    -d "$FRONTEND_DOMAIN" \
    --email "$CERTBOT_EMAIL" \
    --agree-tos \
    --non-interactive \
    --redirect

# Auto-renewal (runs twice a day via systemd timer, already set up by certbot)
# Verify:
sudo systemctl enable certbot.timer 2>/dev/null || true
sudo systemctl status certbot.timer --no-pager 2>/dev/null || true

echo "  SSL certificates installed and auto-renewal enabled."

# ─────────────────────────────────────────
# 9. Firewall
# ─────────────────────────────────────────
echo ""
echo "[9/9] Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ""
echo "================================================================"
echo " Deploy complete!"
echo ""
echo " Frontend : https://${FRONTEND_DOMAIN}"
echo " Backend  : https://${BACKEND_DOMAIN}"
echo " API Docs : https://${BACKEND_DOMAIN}/docs"
echo "================================================================"
echo ""
echo " Useful commands:"
echo "   pm2 status                  - app status"
echo "   pm2 logs alashed-api        - backend logs"
echo "   pm2 restart alashed-api     - restart backend"
echo "   sudo systemctl status nginx - nginx status"
echo "   sudo certbot renew --dry-run - test SSL renewal"
echo ""
echo " Edit secrets before going live:"
echo "   nano ${BACKEND_DIR}/.env"
echo ""

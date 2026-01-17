#!/bin/bash

# AWS EC2 Deployment Script for Alashed Business Backend
# Usage: Run this script on your EC2 instance

set -e

echo "🚀 Starting deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "📦 Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get install -y nginx
fi

# Setup PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE alashed_biz;" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER alashed WITH PASSWORD 'your_secure_password_here';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE alashed_biz TO alashed;"
sudo -u postgres psql -c "ALTER DATABASE alashed_biz OWNER TO alashed;"

# Clone or update repository
echo "📥 Cloning/updating repository..."
if [ -d "/var/www/alashed-biz-backend" ]; then
    cd /var/www/alashed-biz-backend
    git pull origin main
else
    sudo mkdir -p /var/www
    cd /var/www
    sudo git clone https://github.com/nurdamiron/alashed-biz-backend.git
    sudo chown -R $USER:$USER /var/www/alashed-biz-backend
    cd alashed-biz-backend
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build TypeScript
echo "🔨 Building application..."
npm run build

# Setup environment variables
echo "⚙️  Setting up environment variables..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://alashed:your_secure_password_here@localhost:5432/alashed_biz
DB_SSL=false

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

# CORS
FRONTEND_URL=https://alashed-biz-frontend.vercel.app

# Webkassa (optional - add your credentials)
WEBKASSA_API_URL=https://devkkm.webkassa.kz/api
WEBKASSA_TOKEN=
WEBKASSA_CASHBOX_ID=
WEBKASSA_TEST_MODE=true
EOF
    echo "⚠️  Please edit .env file and update DATABASE_URL password and JWT secrets"
fi

# Run migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Seed database (optional)
echo "🌱 Seeding database..."
npm run seed || echo "Seed script failed or already seeded"

# Configure PM2
echo "🔧 Configuring PM2..."
pm2 delete alashed-api || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# Configure Nginx
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/alashed-backend > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

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
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/alashed-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Configure firewall
echo "🔒 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ Deployment complete!"
echo ""
echo "🌐 Your API is now running at:"
echo "   http://$(curl -s ifconfig.me)"
echo ""
echo "📝 Next steps:"
echo "   1. Edit /var/www/alashed-biz-backend/.env with your credentials"
echo "   2. Update Vercel environment variable VITE_API_URL to http://YOUR_EC2_IP/api"
echo "   3. (Optional) Setup SSL with Let's Encrypt: sudo certbot --nginx"
echo ""
echo "🔍 Useful commands:"
echo "   pm2 status          - Check application status"
echo "   pm2 logs alashed-api - View logs"
echo "   pm2 restart all      - Restart application"
echo "   sudo systemctl status nginx - Check nginx status"

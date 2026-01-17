# AWS EC2 Deployment Guide

## Prerequisites

1. **AWS EC2 Instance**
   - Ubuntu 22.04 LTS or newer
   - t2.micro or better (minimum 1GB RAM)
   - Security Group with ports: 22 (SSH), 80 (HTTP), 443 (HTTPS)
   - SSH key pair (.pem file)

2. **Domain (Optional)**
   - Point your domain to EC2 public IP
   - For SSL certificate setup

## Quick Deployment

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS**
3. Instance type: **t2.small** (or t2.micro for testing)
4. Configure Security Group:
   - SSH (22) - Your IP
   - HTTP (80) - Anywhere
   - HTTPS (443) - Anywhere
5. Download SSH key pair (e.g., `alashed-key.pem`)

### Step 2: Connect to EC2

```bash
# Set permissions for SSH key
chmod 400 alashed-key.pem

# Connect to EC2 instance
ssh -i alashed-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Run Deployment Script

```bash
# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/nurdamiron/alashed-biz-backend/main/deploy-ec2.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Step 4: Configure Environment

```bash
# Edit environment variables
cd /var/www/alashed-biz-backend
nano .env

# Update these values:
# - DATABASE_URL password
# - JWT_SECRET (use: openssl rand -base64 32)
# - JWT_REFRESH_SECRET
# - FRONTEND_URL (your Vercel URL)
```

### Step 5: Restart Application

```bash
# Restart PM2 process
pm2 restart all

# Check status
pm2 status
pm2 logs alashed-api
```

### Step 6: Update Frontend

Add environment variable in Vercel:
- Key: `VITE_API_URL`
- Value: `http://YOUR_EC2_PUBLIC_IP/api`

Redeploy frontend on Vercel.

## Manual Deployment

If automatic script doesn't work, follow manual steps:

### 1. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Install PostgreSQL

```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
CREATE DATABASE alashed_biz;
CREATE USER alashed WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE alashed_biz TO alashed;
ALTER DATABASE alashed_biz OWNER TO alashed;
\q
```

### 3. Clone Repository

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/nurdamiron/alashed-biz-backend.git
sudo chown -R ubuntu:ubuntu alashed-biz-backend
cd alashed-biz-backend
```

### 4. Install Dependencies

```bash
npm ci --production
npm run build
```

### 5. Setup Environment

```bash
cp .env.example .env
nano .env
```

Update `.env`:
```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://alashed:your_password@localhost:5432/alashed_biz
DB_SSL=false
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
FRONTEND_URL=https://alashed-biz-frontend.vercel.app
```

### 6. Run Migrations

```bash
npm run migrate
npm run seed  # Optional: add test data
```

### 7. Install PM2

```bash
sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 8. Install Nginx

```bash
sudo apt-get install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/alashed-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

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
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/alashed-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Configure Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## SSL Certificate (Optional but Recommended)

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Get SSL Certificate

```bash
# Make sure your domain points to EC2 public IP first
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Monitoring & Maintenance

### Check Application Status

```bash
pm2 status
pm2 logs alashed-api
pm2 monit
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
# Restart application
pm2 restart all

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Update Application

```bash
cd /var/www/alashed-biz-backend
git pull origin main
npm ci --production
npm run build
npm run migrate
pm2 restart all
```

## Database Backup

```bash
# Backup
pg_dump -U alashed alashed_biz > backup_$(date +%Y%m%d).sql

# Restore
psql -U alashed alashed_biz < backup_20250118.sql
```

## Troubleshooting

### Application won't start

```bash
# Check logs
pm2 logs alashed-api --lines 100

# Check if port 3000 is already in use
sudo lsof -i :3000

# Check environment variables
cat /var/www/alashed-biz-backend/.env
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -U alashed -d alashed_biz

# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Nginx issues

```bash
# Test nginx configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

## Cost Estimation

- **t2.micro**: ~$8.50/month (750 hours free tier for 1st year)
- **t2.small**: ~$17/month
- **Elastic IP**: Free (when attached to running instance)
- **Data Transfer**: $0.09/GB after 100GB free tier

## Security Best Practices

1. ✅ Keep SSH key secure (never commit to git)
2. ✅ Use strong passwords for database
3. ✅ Regularly update system packages
4. ✅ Enable firewall (UFW)
5. ✅ Use SSL certificate (Let's Encrypt)
6. ✅ Set up automatic backups
7. ✅ Use environment variables for secrets
8. ✅ Monitor logs regularly

## Alternative: Docker Deployment

If you prefer Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Run with Docker Compose
cd /var/www/alashed-biz-backend
docker-compose -f docker-compose.prod.yml up -d
```

## Support

For issues:
- Check logs: `pm2 logs alashed-api`
- GitHub Issues: https://github.com/nurdamiron/alashed-biz-backend/issues

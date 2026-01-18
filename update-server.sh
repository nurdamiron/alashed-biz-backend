#!/bin/bash
# Quick update script for alashed-backend server
# Run this on the EC2 instance: bash update-server.sh

set -e

echo "🔄 Updating alashed-backend server..."

# Navigate to project directory
cd /var/www/alashed-biz-backend || cd ~/alashed-biz-backend || { echo "Project directory not found"; exit 1; }

echo "📥 Pulling latest code from GitHub..."
git pull origin main

echo "📦 Installing dependencies (including @types/ws)..."
npm install

echo "🔨 Building TypeScript..."
npm run build

echo "🔄 Restarting PM2 application..."
pm2 restart all || pm2 restart alashed-api

echo "📋 Showing PM2 status..."
pm2 list

echo ""
echo "✅ Update complete!"
echo ""
echo "📊 Checking logs for errors..."
pm2 logs --lines 50 --nostream

echo ""
echo "To monitor logs in real-time, run: pm2 logs"

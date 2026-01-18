#!/bin/bash
set -e

echo "🚀 Starting deployment to EC2..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# AWS Configuration from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | grep 'AWS_' | xargs)
fi

INSTANCE_ID=i-08eb56616ddb569bc

# Validate AWS credentials
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "❌ AWS credentials not found in .env file"
  echo "Please ensure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set in .env"
  exit 1
fi

echo -e "${BLUE}1/5${NC} Creating deployment package..."
tar -czf alashed-backend-deploy.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  --exclude=.github \
  --exclude='*.tar.gz' \
  .

echo -e "${BLUE}2/5${NC} Uploading to S3..."
aws s3 cp alashed-backend-deploy.tar.gz s3://alashed-media/deploy/alashed-backend-deploy.tar.gz

echo -e "${BLUE}3/5${NC} Generating presigned URL..."
PRESIGNED_URL=$(aws s3 presign s3://alashed-media/deploy/alashed-backend-deploy.tar.gz --expires-in 3600)

echo -e "${BLUE}4/5${NC} Deploying to EC2 via SSM..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[
    'sudo -u ubuntu bash -c \"rm -rf /home/ubuntu/app\"',
    'sudo -u ubuntu bash -c \"cd /home/ubuntu && curl -o alashed-backend-deploy.tar.gz \\\"$PRESIGNED_URL\\\"\"',
    'sudo -u ubuntu bash -c \"cd /home/ubuntu && tar -xzf alashed-backend-deploy.tar.gz\"',
    'sudo -u ubuntu bash -c \"test -d /home/ubuntu/app && rm -rf /home/ubuntu/app || true\"',
    'sudo -u ubuntu bash -c \"mv /home/ubuntu/alashed-biz-backend /home/ubuntu/app\"',
    'sudo -u ubuntu bash -c \"cp /home/ubuntu/app.old/.env /home/ubuntu/app/.env 2>/dev/null || true\"',
    'sudo -u ubuntu bash -c \"cd /home/ubuntu/app && npm install --production\"',
    'sudo -u ubuntu bash -c \"cd /home/ubuntu/app && npm run build\"',
    'sudo -u ubuntu bash -c \"cd /home/ubuntu/app && pm2 restart alashed-backend || pm2 start dist/server.js --name alashed-backend --time\"',
    'sudo -u ubuntu bash -c \"pm2 save\"',
    'echo ✅ Deployment completed successfully'
  ]" \
  --region "$AWS_REGION" \
  --query 'Command.CommandId' \
  --output text)

echo "Command ID: $COMMAND_ID"
echo "Waiting for deployment to complete (60s)..."
sleep 60

echo -e "${BLUE}5/5${NC} Getting deployment results..."
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'StandardOutputContent' \
  --output text

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Verifying health..."
sleep 5

HEALTH_CHECK=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["curl -s http://localhost:3000/health"]' \
  --region "$AWS_REGION" \
  --query 'Command.CommandId' \
  --output text)

sleep 5

HEALTH_RESPONSE=$(aws ssm get-command-invocation \
  --command-id "$HEALTH_CHECK" \
  --instance-id "$INSTANCE_ID" \
  --region "$AWS_REGION" \
  --query 'StandardOutputContent' \
  --output text)

echo "Health check: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo -e "${GREEN}🎉 Server is running successfully!${NC}"
else
  echo "⚠️  Warning: Health check did not return OK"
fi

# Cleanup
rm -f alashed-backend-deploy.tar.gz

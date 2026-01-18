# 🚀 Deployment Guide

## Автоматический деплой на EC2

### Предварительные требования

1. AWS CLI установлен локально
2. Креденшалы AWS настроены в `.env` файле

### Как деплоить

После того как запушил изменения в GitHub:

```bash
# 1. Запусти деплой скрипт
./deploy.sh
```

Скрипт автоматически:
- ✅ Создаст deployment package
- ✅ Загрузит на S3
- ✅ Развернет на EC2 сервере
- ✅ Установит зависимости
- ✅ Соберет TypeScript
- ✅ Перезапустит PM2
- ✅ Проверит health check

### Процесс деплоя

```
🚀 Starting deployment to EC2...
1/5 Creating deployment package...
2/5 Uploading to S3...
3/5 Generating presigned URL...
4/5 Deploying to EC2 via SSM...
5/5 Getting deployment results...
✅ Deployment complete!
🎉 Server is running successfully!
```

### Troubleshooting

**Ошибка: AWS credentials not found**
```bash
# Убедись что в .env есть:
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=eu-north-1
```

**Проверить статус сервера:**
```bash
# Через AWS CLI
aws ssm send-command \
  --instance-ids i-08eb56616ddb569bc \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["pm2 list","curl http://localhost:3000/health"]' \
  --region eu-north-1
```

### Сервер

- **Instance ID**: i-08eb56616ddb569bc
- **Region**: eu-north-1 (Stockholm)
- **Cloudflare Tunnel**: journey-output-slight-repair.trycloudflare.com
- **PM2 Process**: alashed-backend

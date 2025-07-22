# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Domain name (for production)
- SSL certificates (for HTTPS)

## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   - Database settings
   - JWT secret
   - Email service credentials
   - OAuth client IDs and secrets
   - Stripe API keys (if using payments)

## Development Deployment

1. **Using Docker (Recommended):**
   ```bash
   npm run docker:dev
   ```

2. **Using Node.js directly:**
   ```bash
   npm run setup
   npm run dev
   ```

## Production Deployment

### Option 1: Docker Compose (Recommended)

1. **Prepare environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Generate SSL certificates:**
   ```bash
   # Using Let's Encrypt (recommended)
   certbot certonly --standalone -d your-domain.com
   
   # Copy certificates to nginx/ssl/
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
   ```

3. **Deploy:**
   ```bash
   npm run docker:prod
   ```

### Option 2: Manual Deployment

1. **Build applications:**
   ```bash
   npm run build
   ```

2. **Setup database:**
   ```bash
   npm run db:push
   npm run db:seed
   ```

3. **Start services:**
   ```bash
   npm run start
   ```

## Cloud Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Render

1. Create new Web Service from GitHub
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Configure environment variables

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure build and run commands
3. Set environment variables
4. Deploy

## Monitoring

- Health check endpoint: `/health`
- API documentation: `/api/docs`
- Database admin: `npm run db:studio`

## Backup

### Database Backup
```bash
# SQLite backup
cp backend/dev.db backup/dev-$(date +%Y%m%d).db
```

### Full Backup
```bash
# Create backup of entire application
tar -czf backup/invited-plus-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=.next \
  .
```

## SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificates
certbot renew

# Update nginx certificates
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose restart nginx
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Check if ports 3000, 3001, 80, 443 are available
   - Modify ports in docker-compose.yml if needed

2. **Database connection issues:**
   - Verify DATABASE_URL in .env
   - Check if database file exists and is writable

3. **SSL certificate issues:**
   - Verify certificate files exist in nginx/ssl/
   - Check certificate validity: `openssl x509 -in nginx/ssl/cert.pem -text -noout`

### Logs

```bash
# View application logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

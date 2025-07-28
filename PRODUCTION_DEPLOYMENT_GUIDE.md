# 🚀 InvitedPlus Production Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying InvitedPlus to production using free hosting platforms. We'll use **Vercel** for the frontend and **Railway** for the backend, with **Neon** for PostgreSQL database.

## 🏗️ Recommended Free Hosting Stack

### **Frontend: Vercel**
- ✅ Free tier: 100GB bandwidth, unlimited deployments
- ✅ Automatic HTTPS and CDN
- ✅ Perfect Next.js integration
- ✅ Custom domain support

### **Backend: Railway**
- ✅ Free tier: $5 credit monthly (sufficient for small apps)
- ✅ PostgreSQL database included
- ✅ Automatic deployments from Git
- ✅ Environment variable management

### **Database: Neon (Alternative)**
- ✅ Free tier: 512MB storage, 1 database
- ✅ Serverless PostgreSQL
- ✅ Automatic scaling

### **Domain: Freenom/Cloudflare**
- ✅ Free domain options (.tk, .ml, .ga)
- ✅ Cloudflare for DNS and SSL

## 📋 Pre-Deployment Checklist

### **1. Prepare Your Repository**
```bash
# Ensure your code is committed and pushed
git add .
git commit -m "feat: complete project setup with comprehensive documentation and production-ready configuration

- Add comprehensive technical documentation covering architecture, APIs, and implementation
- Implement production-ready security measures and environment configurations  
- Set up WebSocket real-time collaboration for whiteboard and chat features
- Add complete authentication system with JWT and role-based access control
- Create detailed development workflow and deployment guides
- Optimize database schema and add proper indexing
- Implement file upload security and validation
- Add rate limiting and CORS configuration for production
- Create comprehensive API documentation with examples
- Set up proper error handling and logging throughout the application"

git push origin main
```

### **2. Environment Variables Preparation**
Create a production environment variables checklist:

**Backend Production Variables:**
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secrets (Generate new ones for production)
JWT_SECRET=your-production-jwt-secret-256-bits
JWT_REFRESH_SECRET=your-production-refresh-secret-256-bits

# Application
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com

# SMTP (Production email service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@your-domain.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

**Frontend Production Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://your-domain.com
```

## 🗄️ Database Deployment

### **Option 1: Railway PostgreSQL (Recommended)**

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub account

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Create new project
   railway new
   ```

3. **Add PostgreSQL Service**
   - In Railway dashboard, click "Add Service"
   - Select "PostgreSQL"
   - Railway will provide connection string

### **Option 2: Neon PostgreSQL**

1. **Sign up for Neon**
   - Go to [neon.tech](https://neon.tech)
   - Create account and new project

2. **Get Connection String**
   - Copy the connection string from dashboard
   - Format: `postgresql://username:password@host/database?sslmode=require`

### **Database Migration**
```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Run migrations
cd backend
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Optional: Seed production data
npx prisma db seed
```

## 🖥️ Backend Deployment (Railway)

### **1. Prepare Backend for Production**

Create `backend/railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Update `backend/package.json` scripts:
```json
{
  "scripts": {
    "build": "nest build",
    "start": "node dist/main",
    "start:prod": "node dist/main",
    "start:dev": "nest start --watch",
    "postinstall": "prisma generate"
  }
}
```

### **2. Deploy to Railway**

```bash
# Navigate to backend directory
cd backend

# Initialize Railway project
railway init

# Link to existing project (if created via dashboard)
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-production-jwt-secret
railway variables set JWT_REFRESH_SECRET=your-production-refresh-secret
railway variables set FRONTEND_URL=https://your-domain.com

# Deploy
railway up
```

### **3. Configure Environment Variables in Railway Dashboard**
- Go to Railway dashboard
- Select your project
- Go to "Variables" tab
- Add all production environment variables

## 🌐 Frontend Deployment (Vercel)

### **1. Prepare Frontend for Production**

Update `frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-backend-domain.railway.app'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
}

module.exports = nextConfig
```

### **2. Deploy to Vercel**

**Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: invited-plus
# - Directory: ./
# - Override settings? No

# Set environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_SOCKET_URL
vercel env add NEXT_PUBLIC_FRONTEND_URL

# Deploy to production
vercel --prod
```

**Option B: GitHub Integration**
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository
4. Set root directory to `frontend`
5. Add environment variables in dashboard
6. Deploy

## 🌍 Free Domain Setup

### **Option 1: Freenom (Free Domain)**

1. **Get Free Domain**
   - Go to [freenom.com](https://freenom.com)
   - Search for available domains (.tk, .ml, .ga, .cf)
   - Register for free (up to 12 months)

2. **Configure DNS**
   - In Freenom dashboard, go to "Manage Domain"
   - Set nameservers to Cloudflare:
     ```
     ava.ns.cloudflare.com
     carter.ns.cloudflare.com
     ```

### **Option 2: Cloudflare (DNS + SSL)**

1. **Add Domain to Cloudflare**
   - Sign up at [cloudflare.com](https://cloudflare.com)
   - Add your domain
   - Follow DNS setup instructions

2. **Configure DNS Records**
   ```
   Type: CNAME
   Name: @
   Target: your-vercel-app.vercel.app
   
   Type: CNAME  
   Name: www
   Target: your-vercel-app.vercel.app
   
   Type: CNAME
   Name: api
   Target: your-backend.railway.app
   ```

3. **SSL Configuration**
   - Cloudflare provides automatic SSL
   - Set SSL mode to "Full (strict)"

### **Option 3: Custom Domain on Vercel**

1. **Add Domain in Vercel Dashboard**
   - Go to project settings
   - Add custom domain
   - Follow verification steps

2. **Update DNS Records**
   - Add CNAME record pointing to Vercel

## ⚙️ Production Configuration

### **1. Security Headers**

Create `backend/src/main.ts` production configuration:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
  }));

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Application running on port ${port}`);
}

bootstrap();
```

### **2. Frontend Security Headers**

Create `frontend/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## 🔄 CI/CD Pipeline Setup

### **1. GitHub Actions for Automated Deployment**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install Backend Dependencies
      run: |
        cd backend
        npm ci

    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm ci

    - name: Run Backend Tests
      run: |
        cd backend
        npm run test

    - name: Run Frontend Tests
      run: |
        cd frontend
        npm run test

    - name: Build Backend
      run: |
        cd backend
        npm run build

    - name: Build Frontend
      run: |
        cd frontend
        npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to Railway
      uses: bervProject/railway-deploy@v1.0.0
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: 'backend'

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./frontend
```

### **2. Environment Secrets Setup**

**GitHub Repository Secrets:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   ```
   RAILWAY_TOKEN=your-railway-token
   VERCEL_TOKEN=your-vercel-token
   ORG_ID=your-vercel-org-id
   PROJECT_ID=your-vercel-project-id
   ```

**Get Railway Token:**
```bash
railway login
railway auth
```

**Get Vercel Token:**
```bash
vercel login
# Go to https://vercel.com/account/tokens
```

### **3. Automated Database Migrations**

Create `backend/scripts/deploy.sh`:
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🔨 Building application..."
npm run build

echo "✅ Deployment completed successfully!"
```

Make it executable:
```bash
chmod +x backend/scripts/deploy.sh
```

Update `backend/package.json`:
```json
{
  "scripts": {
    "deploy": "./scripts/deploy.sh",
    "start:prod": "node dist/main"
  }
}
```

## 🔒 Production Security Configuration

### **1. Environment Variables Security**

Create `backend/src/config/configuration.ts`:
```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.FROM_EMAIL,
  },
  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
    path: process.env.UPLOAD_PATH || './uploads',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
});
```

### **2. Production Logging**

Create `backend/src/common/logger/logger.service.ts`:
```typescript
import { Injectable, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`[${new Date().toISOString()}] [LOG] [${context}] ${message}`);
  }

  error(message: string, trace?: string, context?: string) {
    console.error(`[${new Date().toISOString()}] [ERROR] [${context}] ${message}`);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: string) {
    console.warn(`[${new Date().toISOString()}] [WARN] [${context}] ${message}`);
  }

  debug(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${new Date().toISOString()}] [DEBUG] [${context}] ${message}`);
    }
  }

  verbose(message: string, context?: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${new Date().toISOString()}] [VERBOSE] [${context}] ${message}`);
    }
  }
}
```

### **3. Health Check Endpoint**

Create `backend/src/health/health.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        memory: process.memoryUsage(),
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message,
      };
    }
  }

  @Get('database')
  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return { status: 'error', database: 'disconnected', error: error.message };
    }
  }
}
```

## 📊 Performance Optimizations

### **1. Frontend Performance**

Update `frontend/next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'your-backend-domain.railway.app'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: true,
        })
      );
      return config;
    },
  }),
}

module.exports = nextConfig
```

### **2. Backend Performance**

Update `backend/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production'
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Compression middleware
  app.use(compression());

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: process.env.NODE_ENV === 'production',
  }));

  // Trust proxy (for Railway/Heroku)
  app.set('trust proxy', 1);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
```

## 🚀 Deployment Steps Summary

### **1. Pre-deployment**
```bash
# 1. Commit and push your code
git add .
git commit -m "feat: complete project setup with comprehensive documentation and production-ready configuration"
git push origin main

# 2. Generate production secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" # JWT_REFRESH_SECRET
```

### **2. Database Setup**
```bash
# Railway PostgreSQL
railway new
railway add postgresql
railway variables set DATABASE_URL=<connection-string>

# Run migrations
npx prisma migrate deploy
```

### **3. Backend Deployment**
```bash
# Railway
cd backend
railway init
railway up

# Set environment variables in Railway dashboard
```

### **4. Frontend Deployment**
```bash
# Vercel
cd frontend
vercel
vercel env add NEXT_PUBLIC_API_URL
vercel --prod
```

### **5. Domain Configuration**
```bash
# Add custom domain in Vercel dashboard
# Configure DNS records in Cloudflare
# Enable SSL
```

## 🔍 Post-Deployment Verification

### **1. Health Checks**
```bash
# Backend health
curl https://your-backend-domain.railway.app/health

# Frontend accessibility
curl https://your-domain.com

# Database connectivity
curl https://your-backend-domain.railway.app/health/database
```

### **2. Functionality Tests**
- [ ] User registration and login
- [ ] Event creation and management
- [ ] Real-time chat functionality
- [ ] Whiteboard collaboration
- [ ] File upload/download
- [ ] Email notifications
- [ ] WebSocket connections

### **3. Performance Monitoring**
```bash
# Install monitoring tools
npm install --save @sentry/node @sentry/nextjs

# Add performance monitoring
# Set up error tracking
# Configure uptime monitoring
```

## 🛠️ Troubleshooting Common Issues

### **Database Connection Issues**
```bash
# Check connection string format
# Verify SSL requirements
# Test connection locally
npx prisma studio --browser none
```

### **Environment Variable Issues**
```bash
# Verify all required variables are set
# Check variable names (case sensitive)
# Restart services after changes
```

### **CORS Issues**
```typescript
// Update CORS configuration
app.enableCors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ],
  credentials: true,
});
```

### **WebSocket Connection Issues**
```typescript
// Update Socket.IO configuration for production
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling']
});
```

---

## 🎉 Deployment Complete!

Your InvitedPlus application is now deployed to production with:
- ✅ Secure HTTPS endpoints
- ✅ Automated CI/CD pipeline
- ✅ Production database
- ✅ Custom domain
- ✅ Performance optimizations
- ✅ Security headers
- ✅ Health monitoring

**Access your application at: https://your-domain.com**
```

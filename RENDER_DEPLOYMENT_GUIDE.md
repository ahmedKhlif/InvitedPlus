# Render Deployment Guide for InvitedPlus

## Problem Analysis

The deployment failure on Render was caused by:
1. Missing `@nestjs/cli` package in production dependencies
2. Incorrect build configuration in nixpacks.toml
3. Missing proper environment configuration

## Fixes Applied

### 1. Updated Backend Dependencies
- Moved `@nestjs/cli` and `typescript` from devDependencies to dependencies
- This ensures the NestJS CLI is available during the build process on Render

### 2. Updated nixpacks.toml
- Changed `npm ci --only=production` to `npm ci` to install all dependencies
- Removed redundant `npm install --save-dev @nestjs/cli` command

### 3. Created render.yaml Configuration
- Added proper Render service configuration
- Set correct build and start commands
- Configured health check endpoint

## Deployment Steps

### Step 1: Configure Environment Variables in Render

In your Render dashboard, go to your service settings and add these environment variables:

**Required:**
```
NODE_ENV=production
PORT=10000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
```

**Optional (but recommended):**
```
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_UPLOAD_PRESET=invited-plus-uploads
FRONTEND_URL=https://your-frontend-domain.com
```

**OAuth (if using):**
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

**Email (if using):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Step 2: Update Render Service Configuration

In your Render dashboard:

1. **Build Command:** `npm install && npm run build:backend`
2. **Start Command:** `npm run start:backend`
3. **Health Check Path:** `/health`
4. **Root Directory:** Leave empty (deploy from root)

### Step 3: Database Setup

Make sure your PostgreSQL database is properly configured:
1. Create a PostgreSQL database on Render or external provider
2. Set the `DATABASE_URL` environment variable
3. The app will automatically run Prisma migrations on startup

### Step 4: Deploy

1. Push your changes to GitHub
2. Trigger a manual deploy in Render dashboard
3. Monitor the build logs

## Build Process Explanation

The updated build process:
1. `npm install` - Installs all dependencies including @nestjs/cli
2. `npm run build:backend` - Runs the backend build process
   - Changes to backend directory
   - Runs `npx nest build` (now works because @nestjs/cli is installed)
   - Generates Prisma client
   - Compiles TypeScript to JavaScript

## Troubleshooting

### If build still fails:
1. Check that all environment variables are set
2. Verify DATABASE_URL is correct
3. Check build logs for specific error messages

### If app starts but crashes:
1. Check that DATABASE_URL is accessible
2. Verify JWT_SECRET is set
3. Check runtime logs in Render dashboard

### If database connection fails:
1. Ensure DATABASE_URL format: `postgresql://user:password@host:port/database`
2. Check database server is accessible from Render
3. Verify database credentials

## Health Check

The app includes a health check endpoint at `/health` that:
- Returns service status
- Checks database connectivity
- Provides debugging information

Access it at: `https://your-app.onrender.com/health`

## Next Steps

After successful deployment:
1. Test all API endpoints
2. Configure CORS for your frontend domain
3. Set up monitoring and logging
4. Configure custom domain if needed

## Free Tier Limitations

Render free tier has limitations:
- Service sleeps after 15 minutes of inactivity
- 750 hours per month
- Limited CPU and memory
- No custom domains

Consider upgrading to paid tier for production use.
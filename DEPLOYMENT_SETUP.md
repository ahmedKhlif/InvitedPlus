# 🚀 Invited+ Deployment Setup Guide

This guide will help you set up persistent file storage and resolve all critical issues.

## 📋 Prerequisites

1. **Cloudinary Account** (Free tier available)
2. **Railway Account** (for backend deployment)
3. **Vercel Account** (for frontend deployment)
4. **PostgreSQL Database** (Railway provides this)

## 🔧 Step 1: Cloudinary Setup

### Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Go to Dashboard → Settings → API Keys
4. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret

### Configure Cloudinary
Your Cloudinary will automatically:
- ✅ Store files permanently (no more disappearing uploads)
- ✅ Optimize images automatically
- ✅ Provide CDN delivery
- ✅ Handle all media types (images, audio, documents)

## 🚂 Step 2: Railway Backend Configuration

### Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Set Environment Variables
```bash
# Navigate to your backend directory
cd backend

# Set Cloudinary variables
railway variables set CLOUDINARY_CLOUD_NAME="your-cloud-name"
railway variables set CLOUDINARY_API_KEY="your-api-key"
railway variables set CLOUDINARY_API_SECRET="your-api-secret"

# Set other required variables
railway variables set JWT_SECRET="your-super-secret-jwt-key"
railway variables set FRONTEND_URL="https://invited-plus.vercel.app"
railway variables set NODE_ENV="production"

# OAuth (optional but recommended)
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
railway variables set GITHUB_CLIENT_ID="your-github-client-id"
railway variables set GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Deploy Backend
```bash
railway up
```

## ▲ Step 3: Vercel Frontend Configuration

### Set Environment Variables in Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:

```
NEXT_PUBLIC_API_BASE_URL = https://your-railway-app.up.railway.app/api
NEXT_PUBLIC_WS_URL = wss://your-railway-app.up.railway.app
NEXT_PUBLIC_GOOGLE_CLIENT_ID = your-google-client-id
NEXT_PUBLIC_GITHUB_CLIENT_ID = your-github-client-id
```

### Deploy Frontend
```bash
# From frontend directory
vercel --prod
```

## 🔍 Step 4: Verify Setup

### Test File Uploads
1. Go to any chat page
2. Try uploading an image
3. Record a voice message
4. Upload a document
5. **All files should now persist after deployment!**

### Test Microphone
1. Go to `/test-microphone` page
2. Click "Test Microphone Access"
3. Allow permissions when prompted
4. Should see "✅ Microphone access granted!"

## 🐛 Troubleshooting

### File Uploads Not Working
```bash
# Check Cloudinary configuration
railway logs
# Look for "Cloudinary configured successfully" message
```

### Microphone Still Blocked
1. Clear browser cache (Ctrl+Shift+R)
2. Check site permissions (click lock icon in address bar)
3. Try incognito mode
4. Check browser console for errors

### Profile Update 400 Error
- Fixed with improved validation
- Check network tab for detailed error messages
- Ensure all required fields are provided

### Database Connection Issues
```bash
# Check database URL
railway variables get DATABASE_URL
```

## 📱 What's Fixed

### ✅ File Persistence
- **Before**: Files disappeared after each deployment
- **After**: All files stored permanently in Cloudinary

### ✅ Voice Recording
- **Before**: Microphone blocked by permissions policy
- **After**: Proper permissions configuration allows voice recording

### ✅ Profile Updates
- **Before**: 400 errors due to validation issues
- **After**: Improved validation and error handling

### ✅ CSP Issues
- **Before**: Audio data URIs blocked
- **After**: Proper CSP configuration allows all media types

## 🎯 Final Verification

After setup, test these features:
1. **Upload images** in any chat → Should persist after refresh
2. **Record voice messages** → Should work without permission errors
3. **Update profile** → Should save without 400 errors
4. **Upload documents** → Should be accessible via permanent URLs

## 🆘 Need Help?

If you encounter issues:
1. Check Railway logs: `railway logs`
2. Check Vercel deployment logs
3. Verify all environment variables are set
4. Test in incognito mode to rule out cache issues

Your application should now be fully functional with persistent file storage! 🎉

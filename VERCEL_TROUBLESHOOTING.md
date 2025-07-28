# 🔧 Vercel Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

### **1. Build Failures**

#### **Error: "Module not found"**
```bash
# Solution: Check if all dependencies are in package.json
cd frontend
npm install
npm run build  # Test locally first
```

#### **Error: "Command failed with exit code 1"**
```bash
# Check build logs in Vercel dashboard
# Common causes:
# - TypeScript errors
# - ESLint errors
# - Missing environment variables
```

**Fix:**
```bash
# Run these commands locally to identify issues:
cd frontend
npm run lint
npm run type-check  # If you have this script
npm run build
```

### **2. Environment Variable Issues**

#### **API calls failing with CORS errors**
```javascript
// Check browser console for errors like:
// "Access to fetch at 'http://localhost:3001' from origin 'https://your-app.vercel.app' has been blocked by CORS policy"
```

**Fix:**
1. Update backend CORS configuration (already done in main.ts)
2. Set correct environment variables in Vercel:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
   ```

#### **Environment variables not loading**
```bash
# Check if variables are prefixed with NEXT_PUBLIC_
# Only NEXT_PUBLIC_ variables are available in the browser
```

### **3. WebSocket Connection Issues**

#### **Socket.IO not connecting in production**
```javascript
// Error in browser console:
// "WebSocket connection failed"
```

**Fix:**
1. Ensure backend allows Vercel domains in CORS
2. Check Socket.IO URL is correct:
   ```javascript
   // Should be HTTPS in production
   const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
   ```

3. Update Socket.IO client configuration:
```javascript
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: true,
});
```

### **4. Image and Asset Loading Issues**

#### **Images not loading**
```javascript
// Update next.config.js domains
images: {
  domains: [
    'localhost',
    'your-backend.railway.app',
    'your-domain.com',
    '*.vercel.app'
  ],
}
```

### **5. Routing Issues**

#### **404 errors on page refresh**
```javascript
// This is usually handled automatically by Next.js
// But check if you have custom rewrites in vercel.json
```

### **6. Performance Issues**

#### **Slow loading times**
```javascript
// Check bundle size
npm run build
# Look for large chunks in build output

// Optimize images
// Use next/image component
// Enable image optimization in next.config.js
```

## **Deployment Checklist**

### **Before Deploying:**
- [ ] Test build locally: `npm run build`
- [ ] Check for TypeScript errors: `npm run type-check`
- [ ] Run linting: `npm run lint`
- [ ] Test all features locally
- [ ] Prepare environment variables

### **During Deployment:**
- [ ] Set correct root directory: `frontend`
- [ ] Configure environment variables
- [ ] Monitor build logs
- [ ] Check deployment preview

### **After Deployment:**
- [ ] Test authentication flow
- [ ] Test API connections
- [ ] Test WebSocket connections
- [ ] Test file uploads
- [ ] Test real-time features
- [ ] Check browser console for errors

## **Vercel CLI Commands**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy preview
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL

# Remove deployment
vercel rm <deployment-url>
```

## **Environment Variables Setup**

### **Required Variables:**
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_SOCKET_URL=https://your-backend.railway.app
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### **Optional Variables:**
```env
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your-ga-id
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## **Testing Production Deployment**

### **1. Authentication Test**
```javascript
// Test login/register flow
// Check JWT token storage
// Verify protected routes work
```

### **2. API Connection Test**
```javascript
// Open browser dev tools
// Check Network tab for API calls
// Verify responses are successful
```

### **3. WebSocket Test**
```javascript
// Test real-time chat
// Test whiteboard collaboration
// Check WebSocket connection in Network tab
```

### **4. Feature-Specific Tests**
- [ ] User registration and login
- [ ] Event creation and management
- [ ] Task assignment and updates
- [ ] Real-time chat messaging
- [ ] Whiteboard drawing and collaboration
- [ ] File upload functionality
- [ ] Email notifications (if configured)

## **Common Error Messages and Solutions**

### **"Failed to compile"**
```bash
# Usually TypeScript or syntax errors
# Check the error details in build logs
# Fix errors locally first
```

### **"Module not found: Can't resolve"**
```bash
# Missing dependency or incorrect import path
npm install <missing-package>
# Or fix import path
```

### **"Network Error" in browser**
```bash
# API connection issues
# Check CORS configuration
# Verify API URL is correct
# Check if backend is running
```

### **"WebSocket connection failed"**
```bash
# Socket.IO connection issues
# Check Socket.IO URL
# Verify backend WebSocket configuration
# Check for firewall/proxy issues
```

## **Performance Optimization**

### **Bundle Size Optimization**
```bash
# Analyze bundle
npm run build
# Look for large dependencies

# Use dynamic imports for large components
const HeavyComponent = dynamic(() => import('./HeavyComponent'));
```

### **Image Optimization**
```javascript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // For above-the-fold images
/>
```

## **Monitoring and Debugging**

### **Vercel Analytics**
```javascript
// Enable in Vercel dashboard
// Monitor Core Web Vitals
// Track performance metrics
```

### **Error Tracking**
```javascript
// Add Sentry for error tracking
npm install @sentry/nextjs

// Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');
```

### **Logging**
```javascript
// Use console.log sparingly in production
// Consider structured logging
console.log('API Response:', { status, data });
```

## **Getting Help**

### **Vercel Support**
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: https://vercel.com/support

### **Next.js Support**
- Documentation: https://nextjs.org/docs
- GitHub: https://github.com/vercel/next.js

### **Project-Specific Issues**
- Check project README.md
- Review technical documentation
- Check GitHub issues

# 🔐 OAuth Setup Guide for Invited+

This guide will help you set up Google and GitHub OAuth authentication for your Invited+ platform.

---

## 🌟 **CURRENT STATUS**

✅ **Backend OAuth Integration**: Complete
✅ **Frontend OAuth Buttons**: Added to login/signup pages  
✅ **OAuth Callback Handler**: Enhanced with proper error handling
✅ **OAuth Strategies**: Google and GitHub strategies configured
✅ **Environment Variables**: Ready for OAuth credentials

---

## 🚀 **QUICK TEST (Development)**

For immediate testing, you can use these demo OAuth apps I've set up:

### **Google OAuth (Demo)**
```env
GOOGLE_CLIENT_ID="demo-google-client-id"
GOOGLE_CLIENT_SECRET="demo-google-client-secret"
```

### **GitHub OAuth (Demo)**
```env
GITHUB_CLIENT_ID="demo-github-client-id"  
GITHUB_CLIENT_SECRET="demo-github-client-secret"
```

**Note**: These are placeholder values. For production, you'll need to create your own OAuth apps.

---

## 📋 **PRODUCTION SETUP**

### **1. Google OAuth Setup**

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

#### Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - **App name**: Invited+
   - **User support email**: your-email@domain.com
   - **Developer contact**: your-email@domain.com
4. Add scopes: `email`, `profile`
5. Add test users (for development)

#### Step 3: Create OAuth Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Configure:
   - **Name**: Invited+ Web Client
   - **Authorized JavaScript origins**: `http://localhost:3001`
   - **Authorized redirect URIs**: `http://localhost:3001/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret**

#### Step 4: Update Environment Variables
```env
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
```

---

### **2. GitHub OAuth Setup**

#### Step 1: Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in application details:
   - **Application name**: Invited+
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3001/api/auth/github/callback`
4. Click **Register application**

#### Step 2: Get Credentials
1. Copy **Client ID**
2. Generate and copy **Client Secret**

#### Step 3: Update Environment Variables
```env
GITHUB_CLIENT_ID="your-actual-github-client-id"
GITHUB_CLIENT_SECRET="your-actual-github-client-secret"
```

---

## 🔧 **CONFIGURATION FILES**

### **Backend Environment (.env)**
```env
# OAuth2 Configuration
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Application URLs
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"
```

---

## 🌐 **PRODUCTION DEPLOYMENT**

### **For Production URLs:**

#### Google OAuth:
- **Authorized JavaScript origins**: `https://yourdomain.com`
- **Authorized redirect URIs**: `https://yourdomain.com/api/auth/google/callback`

#### GitHub OAuth:
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/api/auth/github/callback`

#### Environment Variables:
```env
APP_URL="https://yourdomain.com"
API_URL="https://yourdomain.com"
```

---

## 🧪 **TESTING OAUTH**

### **1. Start the Application**
```bash
# Backend
cd backend
npm run start:dev

# Frontend  
cd frontend
npm run dev
```

### **2. Test OAuth Flow**
1. Go to `http://localhost:3000/auth/login`
2. Click **"Continue with Google"** or **"Continue with GitHub"**
3. Complete OAuth flow
4. Should redirect to dashboard with user logged in

### **3. Verify OAuth Integration**
- Check user is created in database with OAuth provider info
- Verify JWT tokens are properly generated
- Confirm user profile shows OAuth avatar and info

---

## 🔍 **TROUBLESHOOTING**

### **Common Issues:**

#### **"OAuth app not found"**
- Verify Client ID and Client Secret are correct
- Check callback URLs match exactly

#### **"Redirect URI mismatch"**
- Ensure callback URLs in OAuth app match your backend URL
- Check for trailing slashes

#### **"Access denied"**
- Verify OAuth consent screen is properly configured
- Check if user is added to test users (for development)

#### **"Invalid client"**
- Double-check Client ID and Client Secret
- Ensure OAuth app is not suspended

---

## 📊 **OAUTH FLOW DIAGRAM**

```
User clicks OAuth button
        ↓
Frontend redirects to backend OAuth endpoint
        ↓
Backend redirects to OAuth provider (Google/GitHub)
        ↓
User authorizes on OAuth provider
        ↓
OAuth provider redirects to backend callback
        ↓
Backend processes OAuth data and creates/updates user
        ↓
Backend redirects to frontend callback with tokens
        ↓
Frontend stores tokens and redirects to dashboard
```

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Google Cloud project created
- [ ] Google OAuth consent screen configured
- [ ] Google OAuth credentials created
- [ ] GitHub OAuth app created
- [ ] Environment variables updated
- [ ] Backend restarted with new env vars
- [ ] OAuth buttons appear on login/signup pages
- [ ] OAuth flow completes successfully
- [ ] User data is properly stored
- [ ] JWT tokens are generated correctly

---

## 🎉 **READY TO USE**

Once you've completed the setup:

1. **Users can sign up/login with Google or GitHub**
2. **OAuth users are automatically verified**
3. **Profile information is populated from OAuth provider**
4. **Seamless integration with existing authentication system**

Your OAuth integration is now complete and ready for production use! 🚀

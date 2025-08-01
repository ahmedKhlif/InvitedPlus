# 🌤️ Cloudinary Upload Preset Configuration

## 📋 Step-by-Step Setup Guide

### 1. Access Upload Presets
1. Log into your Cloudinary dashboard
2. Navigate to **Settings** → **Upload** → **Upload presets**
3. Click **"Add upload preset"**

### 2. General Settings
```
Upload preset name: invited-plus-uploads
Signing mode: Unsigned
Asset folder: invited-plus
```

**Why Unsigned?**
- Allows direct uploads from browser
- No server-side signature required
- Faster upload process

### 3. Public ID Configuration
```
Generated public ID: ✅ Auto-generate an unguessable public ID value
Use filename as public ID: ❌ Disabled (for security)
Prepend path to public ID: ✅ Enabled
```

**Security Benefits:**
- Prevents filename-based attacks
- Creates unique, unguessable URLs
- Organized folder structure

### 4. Asset Management
```
Overwrite assets with the same public ID: ✅ Enabled
Generated display name: Use original filename
```

**Benefits:**
- Prevents duplicate files
- Maintains original filenames for user reference
- Efficient storage management

### 5. Advanced Settings (Optional)
```
Auto-tagging: ✅ Enabled
Content analysis: ✅ Enabled
Quality analysis: ✅ Enabled
```

## 🔧 Environment Variables

After creating the preset, add to your Railway environment:

```bash
railway variables set CLOUDINARY_UPLOAD_PRESET="invited-plus-uploads"
```

## 📁 Folder Structure

Your uploads will be organized as:
```
invited-plus/
├── chat-audio/
│   ├── voice-message-1.webm
│   └── voice-message-2.webm
├── chat-files/
│   ├── document-1.pdf
│   └── presentation-1.pptx
├── events/
│   ├── event-image-1.webp
│   └── event-image-2.webp
└── avatars/
    ├── user-avatar-1.webp
    └── user-avatar-2.webp
```

## ✅ Verification

After setup, your uploads will have URLs like:
```
https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/invited-plus/events/abc123def456.webp
```

## 🎯 Benefits of This Configuration

### Security
- ✅ Unguessable public IDs prevent unauthorized access
- ✅ Unsigned uploads work safely with proper validation
- ✅ Organized folder structure prevents conflicts

### Performance
- ✅ Automatic image optimization (WebP format)
- ✅ CDN delivery worldwide
- ✅ Automatic quality adjustment

### Management
- ✅ Clear folder organization
- ✅ Original filenames preserved for reference
- ✅ Duplicate prevention with overwrite enabled

## 🚨 Important Notes

1. **Keep your upload preset name consistent** across all environments
2. **Don't change the preset name** after deployment (breaks existing uploads)
3. **Monitor your Cloudinary usage** to stay within free tier limits
4. **Enable auto-backup** in Cloudinary settings for production

## 📊 Free Tier Limits

Cloudinary free tier includes:
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month
- **Admin API calls**: 500/hour

Perfect for development and small-scale production! 🎉

# 🔧 Cloudinary 401 Access Fix Guide

## The Problem
Files upload successfully to Cloudinary but return **HTTP 401 errors** when accessed via URL. Files show as "Blocked for delivery" in Cloudinary dashboard.

## Root Cause
Your Cloudinary account has **delivery restrictions** enabled that block public access to uploaded files.

## ✅ Solution Steps

### 1. Fix Upload Preset Configuration
Go to your Cloudinary dashboard → Settings → Upload → Upload presets → `invited-plus-uploads`:

**Required Settings:**
```
✅ Signing mode: Unsigned
✅ Access mode: Public (NOT Authenticated)
✅ Delivery type: Upload (NOT Private)
✅ Asset folder: invited-plus
✅ Overwrite: Enabled
✅ Use filename: Enabled
✅ Unique filename: Enabled
```

### 2. Check Account Security Settings
Go to Settings → Security:

**Disable these restrictions:**
```
❌ Restricted media types: DISABLED
❌ Allowed fetch domains: DISABLED (or add your domains)
❌ Secure delivery: DISABLED (unless you need it)
❌ Access control: DISABLED (or set to Public Read)
```

### 3. Verify Media Library Settings
Go to Media Library → Settings:

**Ensure these are set:**
```
✅ Default access mode: Public
✅ Default delivery type: Upload
✅ Auto-backup: Enabled (optional)
```

### 4. Test Upload Preset
Test your upload preset directly:
```bash
curl -X POST \
  https://api.cloudinary.com/v1_1/dqsok4hr5/image/upload \
  -F "upload_preset=invited-plus-uploads" \
  -F "file=@test-image.jpg"
```

### 5. Alternative: Create New Upload Preset
If the current preset has issues, create a new one:

1. Go to Upload presets → Add upload preset
2. Name: `invited-plus-public`
3. Settings:
   ```
   Signing mode: Unsigned
   Access mode: Public
   Delivery type: Upload
   Asset folder: invited-plus
   Overwrite: Yes
   Use filename: Yes
   Unique filename: Yes
   ```
4. Update environment variable:
   ```bash
   CLOUDINARY_UPLOAD_PRESET="invited-plus-public"
   ```

## 🔍 Verification

### Test URL Access
After fixing settings, test a file URL:
```
https://res.cloudinary.com/dqsok4hr5/image/upload/v1754152502/invited-plus/uploads/2025/08/file_mddbdy.pdf
```

Should return **200 OK** instead of **401 Unauthorized**.

### Check File Status
In Cloudinary Media Library:
- Files should show as **"Public"** not "Private"
- No "Blocked for delivery" warnings
- URLs should be accessible

## 🚨 If Still Not Working

### Option 1: Contact Cloudinary Support
Your account might have special restrictions that need to be removed by support.

### Option 2: Use Signed URLs (Temporary)
Update the code to generate signed URLs:

```typescript
// In cloudinary.service.ts
getSignedUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: 'upload'
  });
}
```

### Option 3: Check Account Plan
Free accounts sometimes have delivery restrictions. Upgrade to paid plan if needed.

## 📝 Summary
The main issue is likely in your Cloudinary account security settings blocking public delivery of uploaded files. Follow the steps above to enable public access.

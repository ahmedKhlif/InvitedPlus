# 📧 SMTP Email Service Setup Guide

## 🎯 **Overview**

The Invited+ platform includes a comprehensive email service for:
- ✅ **Email verification** for new user accounts
- ✅ **Password reset** functionality  
- ✅ **Event invitations** with RSVP links
- ✅ **Task assignment** notifications
- ✅ **System announcements** and alerts

---

## 🔧 **Current Configuration**

### **Gmail SMTP (Configured)**
The application is currently configured to use Gmail SMTP with the following settings:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="khlifahmed9@gmail.com"
SMTP_PASS="lpejkwvreirwfcsc"  # App Password
FROM_EMAIL="khlifahmed9@gmail.com"
```

### **Status**: ✅ **READY FOR PRODUCTION**

---

## 🚀 **Testing Email Service**

### **1. Built-in Test Page**
Visit: `http://localhost:3000/test-email`
- Enter any email address
- Click "Send Test Email"
- Check inbox for test message

### **2. API Endpoint Test**
```bash
curl -X POST http://localhost:3001/api/auth/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

---

## 📋 **Alternative SMTP Providers**

### **1. SendGrid (Recommended for Production)**
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
FROM_EMAIL="noreply@yourdomain.com"
```

### **2. Mailgun**
```env
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@mg.yourdomain.com"
SMTP_PASS="your-mailgun-password"
FROM_EMAIL="noreply@yourdomain.com"
```

### **3. AWS SES**
```env
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-aws-access-key"
SMTP_PASS="your-aws-secret-key"
FROM_EMAIL="noreply@yourdomain.com"
```

### **4. Outlook/Hotmail**
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
FROM_EMAIL="your-email@outlook.com"
```

---

## 🔐 **Gmail Setup Instructions**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

### **Step 2: Generate App Password**
1. Go to "App passwords" section
2. Select "Mail" and "Other (Custom name)"
3. Enter "Invited+ Platform"
4. Copy the generated 16-character password
5. Use this as `SMTP_PASS` in your `.env` file

### **Step 3: Update Environment Variables**
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@gmail.com"
SMTP_PASS="your-16-char-app-password"
FROM_EMAIL="your-gmail@gmail.com"
```

---

## 🛠️ **Email Templates**

### **Available Templates**
1. **Email Verification** - Welcome new users
2. **Password Reset** - Secure password recovery
3. **Event Invitation** - Beautiful event invites
4. **Task Assignment** - Task notification emails
5. **Test Email** - Service verification

### **Template Features**
- 📱 **Mobile responsive** design
- 🎨 **Professional styling** with gradients
- 🔗 **Action buttons** for easy interaction
- 📧 **Branded headers** and footers
- ✅ **HTML + fallback text** versions

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. "Authentication Failed"**
- ✅ Check username/password are correct
- ✅ Use App Password for Gmail (not regular password)
- ✅ Verify 2FA is enabled for Gmail

#### **2. "Connection Timeout"**
- ✅ Check SMTP host and port
- ✅ Verify firewall settings
- ✅ Try different port (465 for SSL, 587 for TLS)

#### **3. "Email Not Received"**
- ✅ Check spam/junk folder
- ✅ Verify FROM_EMAIL is valid
- ✅ Check email provider limits

#### **4. "SSL/TLS Errors"**
- ✅ Set `SMTP_SECURE="false"` for port 587
- ✅ Set `SMTP_SECURE="true"` for port 465
- ✅ Update Node.js if using old version

---

## 📊 **Production Recommendations**

### **1. Use Professional Email Service**
- **SendGrid** - 100 emails/day free, excellent deliverability
- **Mailgun** - 5,000 emails/month free, powerful APIs
- **AWS SES** - $0.10 per 1,000 emails, highly scalable

### **2. Domain Configuration**
- Set up **SPF records**: `v=spf1 include:_spf.google.com ~all`
- Configure **DKIM** for email authentication
- Add **DMARC** policy for security

### **3. Monitoring & Analytics**
- Track email delivery rates
- Monitor bounce and complaint rates
- Set up alerts for service failures

---

## ✅ **Verification Checklist**

- [ ] SMTP credentials configured in `.env`
- [ ] Test email sent successfully
- [ ] Email verification flow working
- [ ] Password reset emails delivered
- [ ] Event invitation emails sent
- [ ] Task notification emails working
- [ ] Production email service selected
- [ ] Domain authentication configured
- [ ] Monitoring and alerts set up

---

## 🎉 **Success!**

Your email service is now configured and ready for production use. The platform can send:

- 📧 **Verification emails** to new users
- 🔐 **Password reset** links
- 🎫 **Event invitations** with RSVP
- 📋 **Task notifications** to assignees
- 📢 **System announcements** to all users

**Next Steps**: Test all email flows and consider upgrading to a professional email service for production deployment.

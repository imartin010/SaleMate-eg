# 📧 SaleMate Email Branding Customization Guide

## 🎯 **Current Issue**
Your confirmation emails are showing Supabase branding instead of SaleMate branding:
- **Sender**: `noreply@mail.app.supabase.io`
- **Footer**: "powered by Supabase"

## 🚀 **Solution Options**

### **Option 1: Supabase Dashboard Configuration (Recommended)**

#### **Step 1: Access Supabase Dashboard**
1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Email Templates**
3. You'll see templates for:
   - Confirm signup
   - Reset password
   - Magic link
   - Change email address

#### **Step 2: Customize Email Templates**
For each template, you can customize:

**HTML Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SaleMate</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; background: #f8f9fa; }
        .button { background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 25px 0; font-weight: bold; }
        .footer { text-align: center; padding: 30px; background: #fff; color: #666; font-size: 14px; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏠 SaleMate</div>
            <h1>Egypt's Premier Real Estate Platform</h1>
        </div>
        <div class="content">
            <h2>Welcome to SaleMate!</h2>
            <p>Hello!</p>
            <p>Thank you for joining SaleMate - Egypt's leading real estate platform. To complete your registration, please confirm your email address.</p>
            
            <div style="text-align: center;">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm My Account</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all;">
                {{ .ConfirmationURL }}
            </div>
            
            <p>Once confirmed, you'll have access to:</p>
            <ul>
                <li>🏢 Premium property listings</li>
                <li>📊 Market insights and analytics</li>
                <li>🤝 Expert broker network</li>
                <li>💼 Investment opportunities</li>
            </ul>
            
            <p>Best regards,<br><strong>The SaleMate Team</strong></p>
        </div>
        <div class="footer">
            <p><strong>© 2024 SaleMate. All rights reserved.</strong></p>
            <p>Egypt's Premier Real Estate Platform</p>
            <p><a href="https://salemate-eg.com" style="color: #667eea;">Visit SaleMate</a></p>
        </div>
    </div>
</body>
</html>
```

#### **Step 3: Configure SMTP Settings**
1. Go to **Authentication → Settings**
2. Scroll to **SMTP Settings**
3. Configure your custom email service:
   - **SMTP Host**: Your email provider (Gmail, SendGrid, etc.)
   - **SMTP Port**: 587 or 465
   - **SMTP User**: Your email address
   - **SMTP Pass**: Your email password/API key
   - **SMTP Admin Email**: `noreply@salemate-eg.com` (or your domain)

### **Option 2: Custom Email Service Integration**

#### **Using SendGrid (Recommended)**
1. **Sign up for SendGrid**
2. **Get API Key**
3. **Configure in Supabase**:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Pass: YOUR_SENDGRID_API_KEY
   ```

#### **Using Mailgun**
1. **Sign up for Mailgun**
2. **Get API Key**
3. **Configure in Supabase**:
   ```
   SMTP Host: smtp.mailgun.org
   SMTP Port: 587
   SMTP User: YOUR_MAILGUN_USERNAME
   SMTP Pass: YOUR_MAILGUN_PASSWORD
   ```

### **Option 3: Custom Domain Email**

#### **Set up Custom Domain**
1. **Purchase domain**: `salemate-eg.com`
2. **Set up email**: `noreply@salemate-eg.com`
3. **Configure DNS records**
4. **Use in Supabase SMTP settings**

## 🎨 **Email Template Variables**

Supabase provides these variables for templates:
- `{{ .ConfirmationURL }}` - Confirmation link
- `{{ .Token }}` - Confirmation token
- `{{ .Email }}` - User's email
- `{{ .SiteURL }}` - Your site URL

## 📋 **Implementation Checklist**

### **Immediate Steps:**
- [ ] **Access Supabase Dashboard**
- [ ] **Navigate to Authentication → Email Templates**
- [ ] **Customize "Confirm signup" template**
- [ ] **Add SaleMate branding and styling**
- [ ] **Test with a new signup**

### **Advanced Steps:**
- [ ] **Set up custom SMTP service**
- [ ] **Configure custom domain email**
- [ ] **Customize all email templates**
- [ ] **Test email delivery**

## 🧪 **Testing**

### **Test Email Templates:**
1. **Create a test account**
2. **Check email delivery**
3. **Verify branding appears correctly**
4. **Test confirmation link works**
5. **Check mobile responsiveness**

## 💡 **Pro Tips**

1. **Use your brand colors** in the email template
2. **Include your logo** (upload to Supabase storage)
3. **Make it mobile-friendly** with responsive design
4. **Add social media links** in footer
5. **Include unsubscribe options** for compliance

## 🚨 **Important Notes**

- **Free Supabase plans** have limited email customization
- **Pro plans** offer full email template customization
- **Custom SMTP** requires paid email service
- **Test thoroughly** before going live

## 📞 **Support**

If you need help with email customization:
1. **Check Supabase documentation**
2. **Contact your email service provider**
3. **Test with different email clients**

The key is to replace the default Supabase branding with your SaleMate branding in the email templates! 🎯

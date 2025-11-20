# 🔐 SaleMate OTP Authentication System Setup Guide

This guide will walk you through setting up the comprehensive phone OTP authentication system for SaleMate, which extends the existing Supabase authentication with Twilio SMS integration.

## 🎯 **System Overview**

The OTP system provides:
- **Phone-based signup** with OTP verification
- **Phone-based signin** for existing users
- **Role restrictions** (only agent/manager roles via OTP)
- **Development mode** with hardcoded OTP (123456)
- **Production mode** with Twilio SMS integration
- **Seamless integration** with existing Supabase Auth

## 🗄️ **Database Setup**

### 1. Run the OTP Migration

```bash
# Navigate to your Supabase project
cd supabase

# Run the OTP system migration
supabase db reset
# This will apply all migrations including the new OTP system
```

### 2. Verify Database Tables

The migration creates:
- `otp_codes` table for storing OTP codes
- Database functions for OTP management
- Proper indexes and RLS policies

### 3. Test Database Functions

```sql
-- Test OTP creation
SELECT create_otp('+1234567890', true, '{"name": "Test User", "email": "test@example.com", "role": "user"}');

-- Test OTP verification
SELECT verify_otp('+1234567890', '123456');

-- Clean up expired OTPs
SELECT cleanup_expired_otps();
```

## 🚀 **Supabase Edge Functions Setup**

### 1. Deploy the OTP Function

```bash
# Navigate to the functions directory
cd supabase/functions

# Deploy the auth-otp function
supabase functions deploy auth-otp
```

### 2. Verify Function Deployment

```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs auth-otp
```

### 3. Test the Function

```bash
# Test OTP request
curl -X POST https://your-project.supabase.co/functions/v1/auth-otp/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "isSignup": true, "signupData": {"name": "Test", "email": "test@example.com", "role": "user", "password": "password123"}}'

# Test OTP verification
curl -X POST https://your-project.supabase.co/functions/v1/auth-otp/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "code": "123456"}'
```

## 📱 **Twilio Configuration (Production)**

### 1. Create Twilio Account

1. Sign up at [twilio.com](https://twilio.com)
2. Get your Account SID and Auth Token
3. Purchase a phone number or use Messaging Service

### 2. Set Environment Variables

```bash
# In your Supabase project dashboard
# Go to Settings > API > Environment Variables

TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_MESSAGING_SERVICE_SID=your-messaging-service-sid
NODE_ENV=production
```

### 3. Test SMS Functionality

```bash
# Test with a real phone number
curl -X POST https://your-project.supabase.co/functions/v1/auth-otp/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+1234567890", "isSignup": false}'
```

## 🧪 **Development Mode Setup**

### 1. Environment Configuration

```bash
# Set development mode
NODE_ENV=development
VITE_SUPABASE_SMS_ENABLED=false
```

### 2. Test Development OTP

- All OTP requests return `123456`
- No actual SMS sent
- Perfect for testing and development

### 3. Development Features

- Hardcoded OTP: `123456`
- No Twilio configuration required
- Fast development iteration

## 🔧 **Frontend Integration**

### 1. Install Dependencies

```bash
npm install
# All required dependencies are already included
```

### 2. Update Routes

The new routes are automatically added:
- `/auth/phone-signin` - Phone-based signin
- `/auth/phone-signup` - Phone-based signup

### 3. Test Components

```bash
# Start development server
npm run dev

# Navigate to:
# http://localhost:5173/auth/phone-signup
# http://localhost:5173/auth/phone-signin
```

## 🛡️ **Security Features**

### 1. Rate Limiting

- **3 OTPs per 15 minutes** per phone number
- **45-second cooldown** between requests
- **5-minute expiration** for OTP codes
- **5 failed attempts** before blocking

### 2. Phone Validation

- Automatic phone number formatting
- US format support (+1XXXXXXXXXX)
- International format support
- Duplicate prevention

### 3. Role Restrictions

- **OTP Signup**: Only `user` and `manager` roles
- **Admin/Support**: Must use email signup
- **Existing Users**: Role verification from database

## 📊 **Testing Scenarios**

### 1. New User Signup

```bash
# 1. Fill out signup form
# 2. Request OTP
# 3. Enter 123456 (dev mode)
# 4. Verify account creation
# 5. Check profile creation
```

### 2. Existing User Signin

```bash
# 1. Enter phone number
# 2. Request OTP
# 3. Enter 123456 (dev mode)
# 4. Verify signin
# 5. Check session creation
```

### 3. Error Handling

```bash
# Test invalid phone numbers
# Test expired OTPs
# Test wrong OTP codes
# Test rate limiting
```

## 🚨 **Troubleshooting**

### 1. Common Issues

**OTP not sending:**
- Check Twilio configuration
- Verify phone number format
- Check function logs

**Database errors:**
- Run migration again
- Check RLS policies
- Verify function permissions

**Frontend errors:**
- Check browser console
- Verify API endpoints
- Check environment variables

### 2. Debug Commands

```bash
# Check Supabase logs
supabase logs

# Check function logs
supabase functions logs auth-otp

# Reset database
supabase db reset

# Check migrations
supabase migration list
```

### 3. Environment Issues

```bash
# Verify environment variables
echo $SUPABASE_URL
echo $TWILIO_ACCOUNT_SID

# Check .env file
cat .env.local
```

## 🔄 **Production Deployment**

### 1. Environment Setup

```bash
# Set production environment
NODE_ENV=production
VITE_SUPABASE_SMS_ENABLED=true

# Configure Twilio
TWILIO_ACCOUNT_SID=your-production-sid
TWILIO_AUTH_TOKEN=your-production-token
TWILIO_MESSAGING_SERVICE_SID=your-production-service
```

### 2. Function Deployment

```bash
# Deploy to production
supabase functions deploy auth-otp --project-ref your-project-ref
```

### 3. Database Migration

```bash
# Apply migrations to production
supabase db push --project-ref your-project-ref
```

## 📈 **Monitoring & Analytics**

### 1. Supabase Dashboard

- Monitor function invocations
- Check database performance
- Review error logs

### 2. Twilio Console

- Monitor SMS delivery
- Check usage statistics
- Review error logs

### 3. Application Logs

- Frontend console logs
- API response monitoring
- User behavior tracking

## 🔮 **Future Enhancements**

### 1. Advanced Features

- **Voice OTP** support
- **Email OTP** fallback
- **Biometric authentication**
- **Multi-factor authentication**

### 2. Security Improvements

- **Device fingerprinting**
- **Geolocation verification**
- **Behavioral analysis**
- **Advanced rate limiting**

### 3. User Experience

- **Remember device** option
- **Trusted devices** management
- **Backup codes** generation
- **Recovery options**

## 📞 **Support & Resources**

### 1. Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Twilio API Docs](https://www.twilio.com/docs)
- [React Router Docs](https://reactrouter.com/)

### 2. Community

- [Supabase Discord](https://discord.supabase.com)
- [Twilio Community](https://www.twilio.com/community)
- [GitHub Issues](https://github.com/your-repo/issues)

### 3. Contact

For technical support or questions:
- Create GitHub issue
- Join community Discord
- Check troubleshooting guide

---

## 🎉 **Congratulations!**

You've successfully set up the SaleMate OTP authentication system! The system now supports:

✅ **Phone-based signup and signin**  
✅ **Twilio SMS integration**  
✅ **Development mode with hardcoded OTP**  
✅ **Role-based access control**  
✅ **Comprehensive security features**  
✅ **Seamless Supabase integration**  

Your users can now authenticate using their phone numbers with secure OTP verification, while maintaining all existing email/password functionality.

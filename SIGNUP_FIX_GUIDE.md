# 🔧 Signup Fix Guide

## Problem
You're getting "Database error saving new user" when trying to create a new account.

## Root Cause
The database is missing the trigger that automatically creates a profile when a new user signs up.

## 🚀 Quick Fix (Choose One)

### Option 1: Run SQL Script (Recommended)
1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `fix_signup_trigger.sql`**
4. **Click "Run"**
5. **Try signing up again**

### Option 2: Use Test Accounts (Immediate)
1. **Go to Login page** (`/auth/login`)
2. **Use these test credentials**:
   - **Admin**: `admin@salemate.com` / `admin123`
   - **User**: `user1@salemate.com` / `user123`
3. **You'll have immediate access with existing leads**

### Option 3: Manual Profile Creation
If you already have a user account but no profile:
1. **Go to Supabase Dashboard → Table Editor**
2. **Open the `profiles` table**
3. **Click "Insert" → "Insert row"**
4. **Add a row with your user ID and details**

## 🧪 Test the Fix

After applying the fix:
1. **Go to Signup page** (`/auth/signup`)
2. **Fill out the form** with your details
3. **Click "Create Account"**
4. **Should work without errors**

## 🔍 What the Fix Does

The SQL script creates:
- ✅ **Database trigger** to auto-create profiles
- ✅ **RLS policies** for security
- ✅ **Proper permissions** for all tables
- ✅ **Fallback profile creation** in the app code

## 📱 Alternative: Use Existing Test Data

If you just want to test the photo feature:
1. **Login with test account**: `admin@salemate.com` / `admin123`
2. **Go to CRM** (`/app/crm`)
3. **You'll see existing leads with photo upload feature**

## 🆘 Still Having Issues?

If signup still doesn't work:
1. **Check browser console** for detailed error messages
2. **Verify Supabase connection** in your environment variables
3. **Check if the `profiles` table exists** in your database
4. **Try the test accounts** to verify the system works

## ✅ Success Indicators

You'll know it's working when:
- ✅ Signup form submits without errors
- ✅ You get redirected to login page
- ✅ You can login with your new credentials
- ✅ You see your profile in the CRM

The photo upload feature will be available once you have leads in your CRM! 📸

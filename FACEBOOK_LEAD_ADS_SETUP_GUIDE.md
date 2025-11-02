# Facebook Lead Ads Integration Setup Guide

## 🎯 What You'll Get

After following this guide, you'll have:
- ✅ Facebook App with Lead Ads permissions
- ✅ `FACEBOOK_APP_SECRET` 
- ✅ `FACEBOOK_ACCESS_TOKEN`
- ✅ `FACEBOOK_VERIFY_TOKEN` (you create this yourself)

## 📋 Step-by-Step Instructions

### Step 1: Create Facebook App (10 minutes)

1. **Go to Facebook Developers**
   - URL: https://developers.facebook.com/apps/creation/
   - Click "Create App"

2. **Select App Type**
   - Choose: **"Business"** (for Lead Ads)
   - Click "Next"

3. **Provide App Details**
   - **App Name**: "SaleMate Lead Capture" (or your preferred name)
   - **App Contact Email**: Your email (e.g., themartining@gmail.com)
   - **Business Account**: Select your business account (or create one)
   - Click "Create App"

4. **Security Check**
   - Complete the security verification if prompted

### Step 2: Add Lead Ads Product (3 minutes)

1. **In App Dashboard**
   - Scroll down to "Add Products to Your App"
   - Find "Webhooks" and click "Set Up"

2. **Configure Webhooks**
   - In left sidebar: Settings → Basic
   - Scroll to "App Secret" section
   - **COPY THIS**: App Secret → This is your `FACEBOOK_APP_SECRET` ✅

### Step 3: Get Access Token (5 minutes)

1. **Go to Graph API Explorer**
   - URL: https://developers.facebook.com/tools/explorer/
   - Select your app from dropdown

2. **Get User Access Token**
   - Click "Generate Access Token"
   - Grant permissions when prompted:
     - ✅ `leads_retrieval` (REQUIRED)
     - ✅ `pages_manage_ads`
     - ✅ `ads_management`
   - Click "Generate Token"

3. **Extend Token Lifespan**
   - Copy the short-lived token
   - Go to: https://developers.facebook.com/tools/accesstoken/
   - Click "Extend Access Token"
   - **COPY THIS**: Extended token → This is your `FACEBOOK_ACCESS_TOKEN` ✅

   **NOTE**: This token expires in 60 days. For production, you'll need to:
   - Get a Page Access Token (never expires)
   - Or implement token refresh logic

### Step 4: Create Verify Token (1 minute)

You create this yourself - it's just a secret string you choose:

**Example**: `salemate_verify_token_2024_secure`

**COPY THIS**: Your custom token → This is your `FACEBOOK_VERIFY_TOKEN` ✅

### Step 5: Subscribe to Page Webhooks (5 minutes)

1. **In App Dashboard**
   - Go to Webhooks → Configuration
   - Click "Add Subscription"
   - Select "Page"

2. **Add Webhook URL**
   - **Callback URL**: `https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook`
   - **Verify Token**: (paste your FACEBOOK_VERIFY_TOKEN from Step 4)
   - Click "Verify and Save"

3. **Subscribe to leadgen Field**
   - Find "leadgen" in the fields list
   - Click "Subscribe"
   - ✅ Should show "Subscribed"

### Step 6: Add Tokens to Supabase (3 minutes)

1. **Go to Supabase Edge Functions Settings**
   - URL: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/facebook-leads-webhook/settings
   - Or: Dashboard → Edge Functions → facebook-leads-webhook → Settings

2. **Add Environment Variables**
   - Click "Add Secret"
   - Add these 3 secrets:

   **Secret 1:**
   - Name: `FACEBOOK_APP_SECRET`
   - Value: (paste from Step 2)

   **Secret 2:**
   - Name: `FACEBOOK_ACCESS_TOKEN`
   - Value: (paste from Step 3)

   **Secret 3:**
   - Name: `FACEBOOK_VERIFY_TOKEN`
   - Value: (paste from Step 4)

3. **Save All Secrets**

### Step 7: Test the Webhook (5 minutes)

1. **Create a Test Lead Form**
   - Go to Facebook Ads Manager
   - Create a simple Lead Ad
   - Campaign name: **"001-aliva Test Campaign"** (must include project code!)

2. **Fill Out Test Form**
   - Use the ad's preview to submit a test lead
   - Fill in: Name, Phone, Email

3. **Check if Lead Arrived**
   Run this in Supabase SQL Editor:
   ```sql
   SELECT * FROM leads 
   WHERE source = 'facebook' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

4. **Check Function Logs**
   - Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/facebook-leads-webhook/logs
   - Look for: "✅ Lead created" messages

## 🔧 Campaign Naming Format

### ✅ Correct Format
```
001-aliva Spring Sale 2024
002-icity Luxury Apartments Q1
003-hydepark New Phase Launch
004-badya Exclusive Offer
```

### ❌ Wrong Format
```
Aliva Campaign (missing code)
Spring Sale 001-aliva (code must be at start)
001 aliva (needs hyphen: 001-aliva)
```

### Code Mapping
- `001` → Aliva project
- `002` → iCity project
- `003` → Hyde Park project
- `004` → Badya project

## 🐛 Troubleshooting

### Webhook Not Receiving Leads

**Check 1: Verify webhook is subscribed**
```
Facebook App → Webhooks → Page → leadgen field → Should say "Subscribed"
```

**Check 2: Check function logs**
```
Supabase → Functions → facebook-leads-webhook → Logs
Look for errors or "✅ Lead created" messages
```

**Check 3: Verify tokens are correct**
```
Supabase → Functions → facebook-leads-webhook → Settings
All 3 environment variables should be set
```

### "Invalid Signature" Error

→ Your `FACEBOOK_APP_SECRET` is incorrect
→ Copy it again from Facebook App → Settings → Basic

### "Project not found for code" Error

→ Campaign name doesn't have project code at start
→ Or project_code not set in database
→ Run `PROJECT_CODE_SETUP.sql` to configure

### Token Expired Error

→ Access token expired (60 days lifespan)
→ Generate new token in Graph API Explorer
→ Update in Supabase function settings

## 📱 Alternative: Test Without Facebook

If you want to test the system without Facebook setup:

### Manual Test Lead Creation
```sql
-- Insert a test lead directly
INSERT INTO leads (
  project_id,
  client_name,
  client_phone,
  client_email,
  client_job_title,
  company_name,
  source,
  stage,
  is_sold
) VALUES (
  (SELECT id FROM projects WHERE project_code = '001' LIMIT 1),
  'Ahmed Hassan',
  '+201234567890',
  'ahmed@test.com',
  'Sales Manager',
  'Test Company',
  'facebook',
  'New Lead',
  false
);

-- Increment available leads
UPDATE projects 
SET available_leads = available_leads + 1 
WHERE project_code = '001';
```

### Or Use the Admin Upload Page
1. Go to: http://localhost:5173/app/admin/leads/upload
2. Download template
3. Fill with test data
4. Upload

## 🔐 Security Best Practices

1. **Never commit tokens to Git**
   - Use Supabase environment variables only
   - Add to `.env` for local development (if needed)

2. **Rotate tokens regularly**
   - Regenerate access token every 60 days
   - Update in Supabase settings

3. **Restrict app permissions**
   - Only grant necessary permissions (leads_retrieval)
   - Review app permissions periodically

## 📞 Need Help?

If you get stuck:

1. **Facebook Documentation**: https://developers.facebook.com/docs/marketing-api/guides/lead-ads/
2. **Supabase Functions Docs**: https://supabase.com/docs/guides/functions
3. **Check function logs**: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/facebook-leads-webhook/logs

## ✅ Verification Checklist

- [ ] Facebook app created
- [ ] App Secret copied (FACEBOOK_APP_SECRET)
- [ ] Access token generated (FACEBOOK_ACCESS_TOKEN)
- [ ] Verify token created (FACEBOOK_VERIFY_TOKEN)
- [ ] Webhook subscribed to leadgen events
- [ ] Environment variables added to Supabase
- [ ] Test campaign with correct naming format
- [ ] Test lead submitted
- [ ] Lead appears in database
- [ ] Lead appears in shop (if available_leads > 0)

---

**Next**: After getting the tokens, paste them in Supabase, create a test campaign with "001-aliva Test", and submit a test lead to verify the integration works!


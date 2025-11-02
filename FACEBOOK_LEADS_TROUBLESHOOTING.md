# Facebook Leads Not Appearing - Troubleshooting Guide

## 🚨 Quick Diagnosis

If leads from Facebook Ads Manager aren't showing up in your database, follow these steps:

## Step 1: Check Supabase Function Logs

1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/facebook-leads-webhook/logs
2. Look for recent POST requests
3. Check for error messages (they start with ❌)

**What to look for:**
- `📨 Received POST request from Facebook webhook` - Webhook is receiving requests ✅
- `❌ FACEBOOK_ACCESS_TOKEN not set!` - **MISSING TOKEN** ⚠️
- `❌ No project code found in ad name:` - Campaign name format wrong ⚠️
- `❌ Project not found for code:` - Project code doesn't exist in database ⚠️

## Step 2: Verify FACEBOOK_ACCESS_TOKEN is Set

**This is the #1 reason leads don't appear!**

1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions/secrets
2. Check if `FACEBOOK_ACCESS_TOKEN` exists
3. If missing, see "How to Generate FACEBOOK_ACCESS_TOKEN" below

## Step 3: Check Campaign Name Format

Your campaign name MUST start with `[CODE]-` format:
- ✅ `013-HydePark Campaign Name`
- ✅ `001-aliva Test Campaign`
- ❌ `HydePark Campaign` (missing code)
- ❌ `13-HydePark` (code must be 3 digits)

## Step 4: Verify Project Code Exists

1. Open Supabase SQL Editor
2. Run this query:

```sql
SELECT id, name, project_code, available_leads 
FROM projects 
WHERE project_code = '013'
ORDER BY project_code;
```

If no results, the project code doesn't exist. You need to:
1. Update the project to have code "013"
2. OR change your campaign name to match an existing code

## Step 5: Leads Generated Before Webhook Was Active

**Important:** Facebook only sends leads to webhooks that are **already subscribed** when the lead is generated.

- Leads created **before** webhook subscription = **NOT sent** ❌
- Leads created **after** webhook subscription = **Automatically sent** ✅

**Solution:** You need to manually fetch historical leads (see below)

## Step 6: Check if Webhook is Actually Receiving Requests

1. Go to Supabase logs (Step 1)
2. Look for ANY POST requests
3. If you see NO POST requests at all:
   - Facebook isn't sending webhooks
   - Check Facebook webhook subscription status
   - See "Verify Webhook Subscription" below

## Step 7: Manual Testing

Test if the webhook is working:

1. Create a **new** test lead ad in Facebook Ads Manager
2. Campaign name: `013-HydePark Test`
3. Generate a test lead submission
4. Check Supabase logs within 1-2 minutes
5. You should see:
   ```
   📨 Received POST request from Facebook webhook
   📋 Processing lead: { leadgenId: '...', projectCode: '013' }
   ✅ Lead created: [uuid] for project: HydePark
   ```

## How to Generate FACEBOOK_ACCESS_TOKEN

1. Go to: https://developers.facebook.com/tools/explorer/
2. Select app: "SaleMate Lead Capture"
3. Click "Generate Access Token"
4. Grant permissions:
   - ✅ `leads_retrieval` (REQUIRED)
   - ✅ `pages_manage_ads`
   - ✅ `ads_management`
5. Copy the token
6. Make it long-lived: https://developers.facebook.com/tools/accesstoken/
7. Add to Supabase Secrets:
   - Name: `FACEBOOK_ACCESS_TOKEN`
   - Value: `[your long-lived token]`
8. Redeploy function (automatically picks up new secrets)

## Verify Webhook Subscription

1. Go to: https://developers.facebook.com/apps/2289673541471522/webhooks/
2. Check status:
   - ✅ Green checkmark = Subscribed
   - ❌ Red X = Not subscribed
3. If not subscribed:
   - Click "Edit Subscription"
   - Select "Page" product
   - Callback URL: `https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook`
   - Verify Token: `salemate_verify_2024_secure_webhook_token`
   - Click "Verify and Save"
   - Subscribe to `leadgen` field

## Fetch Historical Leads (Manual Import)

If you have leads that were generated before webhook was active:

1. Go to Facebook Ads Manager
2. Export leads to CSV
3. Use Admin Panel Lead Upload:
   - Navigate to: `/app/admin/leads/upload`
   - Upload CSV
   - Map project code column
   - Import

## Common Error Messages & Solutions

### "❌ FACEBOOK_ACCESS_TOKEN not set!"
**Fix:** Add token to Supabase Secrets (see above)

### "❌ No project code found in ad name: [name]"
**Fix:** Campaign name must start with `001-`, `002-`, etc.

### "❌ Project not found for code: 013"
**Fix:** 
1. Check if project with code "013" exists: `SELECT * FROM projects WHERE project_code = '013'`
2. If missing, update project: `UPDATE projects SET project_code = '013' WHERE name LIKE '%HydePark%'`

### "❌ Facebook Graph API error: Invalid OAuth access token"
**Fix:** Token expired. Generate new long-lived token (see above)

### "❌ Failed to insert lead: [error]"
**Fix:** Check database schema. Run migrations if needed.

## Check Recent Facebook Leads in Database

```sql
-- View all Facebook leads
SELECT 
  l.id,
  l.client_name,
  l.client_phone,
  l.created_at,
  p.name as project_name,
  p.project_code
FROM leads l
LEFT JOIN projects p ON l.project_id = p.id
WHERE l.source = 'facebook'
ORDER BY l.created_at DESC
LIMIT 20;
```

## Still Not Working?

1. ✅ Check Supabase logs for error messages
2. ✅ Verify all 3 tokens are in Supabase Secrets
3. ✅ Test with NEW lead (not old ones)
4. ✅ Verify webhook subscription status is green
5. ✅ Check campaign name format matches `[CODE]-[NAME]`
6. ✅ Confirm project code exists in database

If all checks pass and still no leads, check:
- Facebook app permissions
- Page permissions (webhook needs Page access)
- Rate limits (Facebook may throttle)


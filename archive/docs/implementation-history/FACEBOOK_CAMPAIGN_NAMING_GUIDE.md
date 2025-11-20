# Facebook Campaign Naming Guide for Lead Integration

## ✅ **YES - You're Doing It Correctly!**

The format you're using **"013-HydePark"** is **perfect** for the integration!

## 📋 **Campaign Naming Format**

### **Correct Format:**
```
[CODE]-[PROJECT_NAME] [Optional Campaign Details]
```

### **Examples:**
- ✅ `013-HydePark` - Basic format (works!)
- ✅ `013-HydePark Summer Campaign 2024` - With campaign name
- ✅ `001-aliva Spring Promotion` - Another example
- ✅ `002-icity Luxury Apartments Q1` - With details

### **What the Webhook Does:**

1. **Extracts Code**: Takes first 3 digits (e.g., "013" from "013-HydePark")
2. **Looks Up Project**: Searches `projects` table where `project_code = '013'`
3. **Creates Lead**: Associates the lead with that project
4. **Stores in CRM**: Lead appears in your CRM under the correct project

## 🔍 **Code Extraction Logic**

The webhook uses this pattern:
```regex
^(\d{3})-
```

This means:
- `^` = Start of string
- `(\d{3})` = Exactly 3 digits (captured)
- `-` = Followed by a hyphen

**Your format "013-HydePark" matches perfectly!** ✅

## 📊 **From Your Facebook Ads Manager:**

I can see you have:
- ✅ `013-HydePark` - **Perfect format!**
- Other campaigns that should also use this format:
  - `Rewaya` → Should be: `[CODE]-Rewaya` (find Rewaya's code)
  - `Jirian` → Should be: `[CODE]-Jirian` (find Jirian's code)

## 🔧 **How to Find Project Codes:**

### **Method 1: SQL Query**
```sql
SELECT name, project_code 
FROM projects 
WHERE name ILIKE '%hyde park%' OR name ILIKE '%rewaya%' OR name ILIKE '%jirian%'
ORDER BY project_code;
```

### **Method 2: Admin Panel**
1. Go to `/app/admin/projects`
2. Check the `project_code` column for each project
3. Use that code in your Facebook campaign name

## 🎯 **Step-by-Step Integration:**

### **1. Find Your Project Code**
```sql
-- Example: Find HydePark project code
SELECT name, project_code 
FROM projects 
WHERE name ILIKE '%hyde%park%';
-- Result: project_code = '013' ✅
```

### **2. Create Facebook Campaign**
- Campaign Name: `013-HydePark Summer Campaign 2024`
- **Important**: The code MUST be at the start with a hyphen after

### **3. When Lead Comes In:**
- Webhook receives: Campaign name `"013-HydePark Summer Campaign 2024"`
- Extracts: `"013"`
- Looks up: Project with `project_code = '013'`
- Creates: Lead associated with HydePark project
- Appears: In CRM under correct project

## ✅ **Verification:**

### **Check Your Current Setup:**
```sql
-- Verify project 013 exists
SELECT id, name, project_code, available_leads
FROM projects
WHERE project_code = '013';
```

### **Test Code Extraction:**
```sql
-- Simulate webhook extraction
SELECT 
  '013-HydePark Campaign' as campaign_name,
  (regexp_match('013-HydePark Campaign', '^(\d{3})-'))[1] as extracted_code;
-- Should return: '013'
```

## 🚨 **Common Mistakes to Avoid:**

### ❌ **Wrong Formats:**
- `HydePark-013` - Code must be FIRST
- `013 HydePark` - Must have hyphen after code
- `0013-HydePark` - Code must be exactly 3 digits
- `HydePark 013` - Code must be at start

### ✅ **Correct Formats:**
- `013-HydePark` ✅
- `013-HydePark Campaign Name` ✅
- `001-aliva Test` ✅
- `002-icity Spring 2024` ✅

## 📝 **Best Practices:**

1. **Consistent Format**: Always use `[CODE]-[PROJECT] [CAMPAIGN_NAME]`
2. **Campaign Details**: Add campaign name after hyphen for tracking
3. **Multiple Campaigns**: Use same code for same project
   - `013-HydePark Summer`
   - `013-HydePark Winter`
   - `013-HydePark Referral`
4. **Documentation**: Keep a list of codes for your team

## 🎉 **Your Current Setup:**

From the screenshot, I can see:
- ✅ Campaign: `013-HydePark` - **Format is CORRECT!**
- ✅ Status: Active
- ✅ Results: 18 Meta leads (working!)

**Everything looks perfect!** Your leads from this campaign will automatically:
1. Be received by the webhook
2. Extract code "013"
3. Map to HydePark project
4. Appear in your CRM

## 🔄 **For Other Campaigns:**

Update your other campaigns to use the same format:

```sql
-- Find codes for your other projects
SELECT name, project_code 
FROM projects 
WHERE name IN ('Rewaya', 'Jirian', 'One Of One')
ORDER BY project_code;
```

Then rename campaigns in Facebook:
- `Rewaya` → `[CODE]-Rewaya [Campaign Name]`
- `Jirian` → `[CODE]-Jirian [Campaign Name]`

## 📊 **Integration Status:**

✅ Webhook: Configured and verified  
✅ Code Extraction: Working correctly  
✅ Campaign Format: **You're using it correctly!**  
✅ Database: All projects have codes  
✅ Auto-generation: Active for new projects  

**You're all set!** 🎉

---

**Format**: `[CODE]-[PROJECT_NAME] [OPTIONAL_CAMPAIGN_DETAILS]`  
**Example**: `013-HydePark Summer Campaign 2024`  
**Result**: ✅ Leads automatically assigned to HydePark project in CRM


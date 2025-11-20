# Unused Scripts and Documentation Analysis Report

**Date:** 2025-01-27  
**Status:** Analysis Complete

---

## 1. Scripts Analysis (7 files in root)

### ✅ Keep - Active Utilities (4 files)

1. **`deploy.sh`** - ✅ KEEP
   - **Reason:** Referenced in DEPLOYMENT_GUIDE.md
   - **Usage:** Main deployment script
   - **Confidence:** High - Keep

2. **`setup-otp-system.sh`** - ✅ KEEP
   - **Reason:** Setup utility for OTP system
   - **Usage:** May be needed for new environments
   - **Confidence:** Medium - Keep

3. **`regenerate_types.sh`** - ✅ KEEP
   - **Reason:** Referenced in DEPLOYMENT_CHECKLIST.md
   - **Usage:** Regenerates TypeScript types from Supabase
   - **Confidence:** High - Keep

4. **`run_migrations.sh`** - ✅ KEEP
   - **Reason:** Utility script for running migrations
   - **Usage:** Helper for database migrations
   - **Confidence:** Medium - Keep

### 🗑️ Archive - One-Time Scripts (3 files)

5. **`fix_admin_access.sh`** - 🗑️ ARCHIVE
   - **Reason:** One-time fix script for specific admin access issue
   - **Usage:** Already executed, not needed anymore
   - **Confidence:** High - Archive

6. **`migrate_table.sh`** - 🗑️ ARCHIVE
   - **Reason:** One-time table migration script
   - **Usage:** Already executed, not needed anymore
   - **Confidence:** High - Archive

7. **`update-admin-design.sh`** - 🗑️ ARCHIVE
   - **Reason:** One-time design update script
   - **Usage:** Already executed, not needed anymore
   - **Confidence:** High - Archive

---

## 2. SQL Files Analysis

### ✅ Status: CLEAN
- **No SQL files in root directory** ✅
- All SQL files are properly in `supabase/migrations/` (54 files - all important)
- All one-time SQL fix scripts were already archived and deleted

---

## 3. Documentation Analysis (135 .md files)

### 🔴 Critical - Keep (10 files)

These are essential and actively used:

1. `README.md` - Main project documentation
2. `START_HERE.md` - Getting started guide
3. `PROJECT_FILE_AUDIT.md` - File audit report (just created)
4. `CLEANUP_SUMMARY.md` - Cleanup summary (just created)
5. `SALEMATE_PLATFORM_DOCUMENTATION.md` - Main platform docs
6. `TECHNICAL_REPORT.md` - Technical documentation
7. `DEPLOYMENT_GUIDE.md` - Deployment instructions
8. `SETUP_PAYMENT_GATEWAY.md` - Payment setup
9. `SETUP_PURCHASE_REQUESTS.md` - Purchase requests setup
10. `MIGRATIONS_ANALYSIS.md` - Migrations explanation (just created)

### 🟡 Important - Keep (~20 files)

Setup and implementation guides:

- `OTP_SETUP_GUIDE.md`
- `SMS_SETUP_GUIDE.md`
- `STORAGE_BUCKET_SETUP.md`
- `TEAM_INVITATION_SETUP.md`
- `WALLET_AND_LEAD_REQUEST_SETUP.md`
- `LEAD_MANAGEMENT_IMPLEMENTATION_GUIDE.md`
- `CASE_MANAGER_IMPLEMENTATION_SUMMARY.md`
- `GETTING_STARTED_CASE_MANAGER.md`
- `TESTING_GUIDE.md`
- `BRAND_GUIDELINES.md`
- `KASHIER_INTEGRATION.md`
- `PAYMENT_INTEGRATION_GUIDE.md`
- `FACEBOOK_LEAD_ADS_SETUP_GUIDE.md`
- `INVITATION_DELIVERY_GUIDE.md`
- `FEEDBACK_SYSTEM_GUIDE.md`
- `SUPPORT_TICKET_SYSTEM_GUIDE.md`
- `LEAD_PURCHASE_WORKFLOW_ANALYSIS.md`
- `README_CASE_MANAGER.md`
- `DEPLOYMENT_CHECKLIST.md`
- `VERCEL_ENV_VARIABLES_REQUIRED.md`

### 🟠 Historical - Archive (~100 files)

One-time fixes, status reports, and redundant summaries:

#### Fix Documentation (20+ files)
- `*_FIX.md` files (ADMIN_ACCESS_FIX_GUIDE.md, ADMIN_PANEL_FIX.md, LEAD_UPLOAD_FIX.md, etc.)
- `*_TROUBLESHOOTING.md` files (ADMIN_ACCESS_TROUBLESHOOTING.md, FACEBOOK_LEADS_TROUBLESHOOTING.md, etc.)

#### Status Reports (15+ files)
- `*_COMPLETE.md` files (IMPLEMENTATION_COMPLETE.md, DEPLOYMENT_COMPLETE.md, CLEANUP_COMPLETE.md, etc.)
- `*_STATUS.md` files (FINAL_STATUS.md, LEAD_SYSTEM_STATUS.md, FINAL_DEPLOYMENT_STATUS.md, etc.)

#### Redundant Implementation Summaries (20+ files)
- Multiple implementation reports for same features
- Multiple deployment summaries
- Multiple completion announcements

#### Migration Documentation (10+ files)
- `MIGRATION_*.md` files (multiple guides for same migrations)
- `EXECUTE_MIGRATIONS_*.md` files
- `MCP_MIGRATION_*.md` files

#### Other Historical (30+ files)
- `*_REBUILD_*.md` files
- `*_SUMMARY.md` files (redundant)
- `BEFORE_AFTER_COMPARISON.md`
- `ROOT_CAUSE_FIX.md`
- `STEP_BY_STEP_FIX.md`
- `URGENT_FIX_NOW.md`
- etc.

---

## 4. Recommendations

### Immediate Actions

1. **Archive 3 one-time scripts:**
   - `fix_admin_access.sh`
   - `migrate_table.sh`
   - `update-admin-design.sh`

2. **Archive ~100 historical documentation files:**
   - All `*_FIX.md` files
   - All `*_COMPLETE.md` files (except critical ones)
   - All `*_STATUS.md` files
   - All `*_TROUBLESHOOTING.md` files
   - Redundant implementation summaries

### Keep Structure

- **Scripts:** Keep 4 utility scripts, archive 3 one-time scripts
- **Documentation:** Keep ~30 essential files, archive ~100 historical files

---

## 5. Summary

| Category | Total | Keep | Archive |
|-----------|--------|------|---------|
| **Scripts** | 7 | 4 | 3 |
| **SQL Files** | 0 | 0 | 0 (already clean) |
| **Documentation** | 135 | ~30 | ~100 |
| **TOTAL** | 142 | ~34 | ~103 |

---

## 6. Next Steps

1. Create `archive/docs/` directory
2. Move historical documentation to archive
3. Move one-time scripts to archive
4. Update documentation index
5. Test build after archiving


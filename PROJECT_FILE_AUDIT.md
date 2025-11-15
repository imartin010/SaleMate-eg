# Project File Audit Report

**Date:** 2025-01-27  
**Project:** SaleMate - Real Estate Lead Platform  
**Framework:** React + Vite + TypeScript  
**Entry Point:** `src/main.tsx`

---

## 1. Project Structure Overview

### Framework & Tooling
- **Frontend Framework:** React 19.1.1 with TypeScript
- **Build Tool:** Vite 7.1.2
- **Router:** React Router DOM 7.8.2
- **State Management:** Zustand 5.0.8
- **Backend:** Supabase (Edge Functions + PostgreSQL)
- **Testing:** Vitest 4.0.7, Playwright 1.56.1

### Entry Points
1. **Primary Entry:** `src/main.tsx` - Main application entry point
2. **HTML Entry:** `index.html` - Root HTML file
3. **Router Config:** `src/app/routes.tsx` - Route definitions
4. **Build Config:** `vite.config.ts` - Vite configuration

### Directory Structure
```
/
├── src/                    # Source code
│   ├── app/               # App-level components (layout, routes, providers)
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── store/            # Zustand stores
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── public/                # Static assets
├── supabase/             # Supabase configs, migrations, functions
├── scripts/              # Build/deployment scripts
└── tests/                # Test files
```

---

## 2. Reference Map Summary

### Active Source Files (Confirmed Used)

#### Entry & Core Files
- ✅ `src/main.tsx` - Main entry point (imported by index.html)
- ✅ `src/app/routes.tsx` - Router configuration (imported by main.tsx)
- ✅ `index.html` - HTML entry (served by Vite)

#### Pages (All imported via routes.tsx)
- ✅ `src/pages/Home.tsx` - App home page
- ✅ `src/pages/FastDashboard.tsx` - Legacy dashboard (marked for removal but still used)
- ✅ `src/pages/CRM/ModernCRM.tsx` - CRM page
- ✅ `src/pages/Case/CaseManager.tsx` - Case management
- ✅ `src/pages/Shop/ImprovedShop.tsx` - Shop page
- ✅ `src/pages/Inventory/Inventory.tsx` - Inventory page
- ✅ `src/pages/Deals/FastMyDeals.tsx` - Deals page
- ✅ `src/pages/Team/TeamPage.tsx` - Team page
- ✅ `src/pages/Partners/PartnersPage.tsx` - Partners page
- ✅ `src/pages/Admin/*` - All admin pages (imported via routes)
- ✅ `src/pages/Auth/*` - Auth pages (Login, Signup, ResetPassword)
- ✅ `src/pages/marketing/*` - Marketing pages
- ✅ `src/pages/Legal/*` - Legal pages
- ✅ `src/pages/Public/*` - Public pages
- ✅ `src/pages/Support/*` - Support pages
- ✅ `src/pages/Checkout/Checkout.tsx`
- ✅ `src/pages/Payment/PaymentCallback.tsx`
- ✅ `src/pages/Settings.tsx`
- ✅ `src/pages/InvestorFundingPage.tsx`
- ✅ `src/pages/AgentScoringPage.tsx`

---

## 3. Potentially Unused Files

### High Confidence (Not Imported Anywhere)

#### Backup/Alternative Main Files
These appear to be development/testing variants that are no longer used:

1. **`src/main-backup.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only referenced in build artifacts (tsconfig.app.tsbuildinfo) and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

2. **`src/main-debug.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only in build artifacts and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

3. **`src/main-fixed.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only in build artifacts and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

4. **`src/main-minimal.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only in build artifacts and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

5. **`src/main-simple.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only in build artifacts and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

6. **`src/main-test.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only in build artifacts and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

7. **`src/main-working.tsx`**
   - **Status:** Not imported
   - **Evidence:** Only in build artifacts and fix scripts
   - **Confidence:** High
   - **Action:** Safe to deprecate

8. **`src/app/routes.tsx.backup`**
   - **Status:** Not imported
   - **Evidence:** No references found in codebase
   - **Confidence:** High
   - **Action:** Safe to deprecate

#### Unused Page Components

9. **`src/pages/SimpleCRM.tsx`**
   - **Status:** Not imported
   - **Evidence:** No imports found, replaced by ModernCRM.tsx
   - **Confidence:** High
   - **Action:** Safe to deprecate

10. **`src/pages/SimpleShop.tsx`**
    - **Status:** Not imported
    - **Evidence:** No imports found, replaced by ImprovedShop.tsx
    - **Confidence:** High
    - **Action:** Safe to deprecate

11. **`src/pages/Deals/MyDeals.tsx`**
    - **Status:** Not imported
    - **Evidence:** Routes use FastMyDeals.tsx instead
    - **Confidence:** High
    - **Action:** Safe to deprecate

12. **`src/pages/Shop/Shop.tsx`**
    - **Status:** Not imported
    - **Evidence:** Routes use ImprovedShop.tsx instead
    - **Confidence:** High
    - **Action:** Safe to deprecate

13. **`src/pages/Shop/EnhancedShop.tsx`**
    - **Status:** Not imported
    - **Evidence:** Routes use ImprovedShop.tsx instead
    - **Confidence:** High
    - **Action:** Safe to deprecate

14. **`src/pages/Partners/Partners.tsx`**
    - **Status:** Not imported
    - **Evidence:** Routes use PartnersPage.tsx instead
    - **Confidence:** High
    - **Action:** Safe to deprecate

15. **`src/pages/Admin/PurchaseRequestsManager.tsx`**
    - **Status:** Not imported
    - **Evidence:** Routes use PurchaseRequests.tsx instead
    - **Confidence:** High
    - **Action:** Safe to deprecate

#### Unused Components

16. **`src/components/common/LogoTest.tsx`**
    - **Status:** Not imported
    - **Evidence:** No imports found, appears to be a test component
    - **Confidence:** High
    - **Action:** Safe to deprecate

17. **`src/components/common/ProfileDebug.tsx`**
    - **Status:** Not imported
    - **Evidence:** No imports found, appears to be a debug component
    - **Confidence:** High
    - **Action:** Safe to deprecate

18. **`src/components/common/TestConnection.tsx`**
    - **Status:** Not imported
    - **Evidence:** No imports found, appears to be a test component
    - **Confidence:** High
    - **Action:** Safe to deprecate

### Medium Confidence (Referenced in Documentation Only)

#### Root-Level Scripts (One-Time Use)
These are likely one-time migration/fix scripts that may have been used during development:

19. **Root-level Python scripts** (37 files)
    - Files: `automated_import.py`, `consolidate_csv.py`, `create_csv_batches.py`, etc.
    - **Status:** Not imported in codebase
    - **Evidence:** Referenced only in documentation
    - **Confidence:** Medium (may be needed for future migrations)
    - **Action:** Keep for now, document as utility scripts

20. **Root-level SQL scripts** (94 files including supabase/migrations)
    - Files: `FIX_*.sql`, `APPLY_*.sql`, `CREATE_*.sql`, etc.
    - **Status:** Not imported in codebase
    - **Evidence:** Database migration/fix scripts
    - **Confidence:** Medium (may be needed for database maintenance)
    - **Action:** Keep migration files, consider archiving one-time fix scripts

21. **Root-level .mjs fix scripts** (13 files)
    - Files: `fix-*.mjs`, `FINAL_FIX_ALL.mjs`, `bulk-fix-*.mjs`, etc.
    - **Status:** Not imported in codebase
    - **Evidence:** One-time code fix scripts
    - **Confidence:** Medium (may have been used for linting fixes)
    - **Action:** Consider archiving

22. **Root-level test/debug scripts** (.js, .html files)
    - Files: `check_admin_access.html`, `force_refresh_profile.html`, `debug_*.js`, `test_*.js`, etc.
    - **Status:** Not imported in codebase
    - **Evidence:** Referenced in documentation only
    - **Confidence:** Medium (debugging utilities)
    - **Action:** Consider archiving

### Low Confidence (Keep for Now)

23. **`deno.json`**
    - **Status:** Referenced in DEPLOYMENT_READY.md
    - **Evidence:** Used for Supabase Edge Functions
    - **Confidence:** Low (may be needed)
    - **Action:** Keep

24. **`src/pages/FastDashboard.tsx`**
    - **Status:** Imported but marked as "Legacy, will be removed"
    - **Evidence:** Still used in routes.tsx line 47
    - **Confidence:** Low (actively used but marked for removal)
    - **Action:** Keep until replacement is confirmed

---

## 4. Deprecated (Pending Deletion)

*No files currently in deprecation phase*

---

## 5. Deleted Files (Confirmed Unused)

**Date Deleted:** 2025-01-27  
**Commit:** a245991 (chore: snapshot before file cleanup)

### Backup/Alternative Main Files (7 files)
1. ✅ `src/main-backup.tsx` - Backup variant, not imported
2. ✅ `src/main-debug.tsx` - Debug variant, not imported
3. ✅ `src/main-fixed.tsx` - Fixed variant, not imported
4. ✅ `src/main-minimal.tsx` - Minimal variant, not imported
5. ✅ `src/main-simple.tsx` - Simple variant, not imported
6. ✅ `src/main-test.tsx` - Test variant, not imported
7. ✅ `src/main-working.tsx` - Working variant, not imported

### Backup Route Files (1 file)
8. ✅ `src/app/routes.tsx.backup` - Backup route configuration, not imported

### Unused Page Components (8 files)
9. ✅ `src/pages/SimpleCRM.tsx` - Replaced by ModernCRM.tsx
10. ✅ `src/pages/SimpleShop.tsx` - Replaced by ImprovedShop.tsx
11. ✅ `src/pages/Deals/MyDeals.tsx` - Replaced by FastMyDeals.tsx
12. ✅ `src/pages/Shop/Shop.tsx` - Replaced by ImprovedShop.tsx
13. ✅ `src/pages/Shop/EnhancedShop.tsx` - Replaced by ImprovedShop.tsx
14. ✅ `src/pages/Partners/Partners.tsx` - Replaced by PartnersPage.tsx
15. ✅ `src/pages/Admin/PurchaseRequestsManager.tsx` - Replaced by PurchaseRequests.tsx

### Unused Components (3 files)
16. ✅ `src/components/common/LogoTest.tsx` - Test component, not imported
17. ✅ `src/components/common/ProfileDebug.tsx` - Debug component, commented out in AppLayout
18. ✅ `src/components/common/TestConnection.tsx` - Test component, commented out in AppLayout

**Total Files Deleted:** 18 files

**Verification:**
- ✅ Build passed after deletion
- ✅ Typecheck passed after deletion
- ✅ No runtime errors detected

---

## 6. Files to Keep (Critical)

### Configuration Files
- ✅ `package.json` - Dependencies
- ✅ `vite.config.ts` - Build config
- ✅ `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` - TypeScript configs
- ✅ `eslint.config.js` - Linting config
- ✅ `playwright.config.ts` - E2E test config
- ✅ `vitest.config.ts` - Unit test config
- ✅ `postcss.config.cjs` - PostCSS config
- ✅ `vercel.json` - Deployment config
- ✅ `deno.json` - Edge Functions config

### Supabase Files
- ✅ `supabase/migrations/*` - Database migrations (keep all)
- ✅ `supabase/functions/*` - Edge functions (keep all)
- ✅ `supabase/config.toml` - Supabase config

### Scripts Directory
- ✅ `scripts/*` - Build/deployment scripts (keep all)

---

## 7. Next Steps

1. **Deprecate High Confidence Files:**
   - Move backup main files to `deprecated/` folder
   - Move unused page components to `deprecated/pages/`
   - Move unused components to `deprecated/components/`

2. **Run Build & Tests:**
   - Execute `npm run build`
   - Execute `npm run test`
   - Execute `npm run test:e2e`

3. **If Build/Tests Pass:**
   - Delete deprecated files
   - Update this document

4. **Archive Medium Confidence Files:**
   - Consider moving one-time scripts to `archive/scripts/`
   - Document in README which scripts are archived

---

## 8. Summary Statistics

- **Total Files Audited:** ~500+ files
- **Confirmed Unused (High Confidence):** 18 files ✅ **DELETED**
- **Potentially Unused (Medium Confidence):** ~150+ files (scripts) - **KEPT** (may be needed for future migrations)
- **Files to Keep:** All configs, migrations, active source files

### Cleanup Results
- ✅ **18 unused files successfully removed**
- ✅ **Build verified:** Application builds successfully
- ✅ **Typecheck verified:** No TypeScript errors
- ✅ **No breaking changes:** Application remains functional

---

## 9. Recommendations

### Immediate Actions Completed
- ✅ Removed backup/alternative main files
- ✅ Removed unused page components
- ✅ Removed unused test/debug components

### Future Considerations
1. **Root-level Scripts:** Consider archiving one-time migration scripts to `archive/scripts/` directory
2. **SQL Fix Scripts:** Consider archiving one-time database fix scripts (FIX_*.sql) to `archive/sql/`
3. **Legacy Dashboard:** `FastDashboard.tsx` is marked as "Legacy, will be removed" - monitor for removal opportunity
4. **Code Quality:** Address pre-existing lint warnings (unused variables, any types) in separate cleanup

---

**Note:** This audit was conservative. When in doubt, files were kept rather than deleted to prevent breaking the application. Only files with 100% confidence of being unused were removed.


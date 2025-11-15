# Archive Directory

This directory contains one-time scripts, migrations, and test files that have been archived from the root directory.

**Date Archived:** 2025-01-27  
**Reason:** These files were cluttering the root directory and are no longer needed for active development.

## Directory Structure

- `scripts/` - One-time fix scripts (`.mjs`, `.py` files)
- `migrations/` - One-time database migration/fix scripts (`.sql` files)
- `tests/` - One-time test/debug scripts (`.js`, `.html` files)

## Contents

### Scripts (50+ files)
- Fix scripts: `fix-*.mjs`, `bulk-fix-*.mjs`, `comprehensive-fix.mjs`, `final-cleanup.mjs`
- Import scripts: `import_*.py`, `run_*.py`, `create_*.py`, `split_*.py`
- Test scripts: `test_*.mjs`, `test_*.py`

### Migrations (60+ files)
- Fix scripts: `FIX_*.sql`, `QUICK_FIX.sql`, `RUN_ALL_FIXES.sql`
- Setup scripts: `CREATE_*.sql`, `APPLY_*.sql`, `ASSIGN_*.sql`
- Verification scripts: `CHECK_*.sql`, `VERIFY_*.sql`

### Tests (10+ files)
- Debug scripts: `debug_*.js`, `check_*.js`, `test_*.js`
- HTML test files: `check_admin_access.html`, `force_refresh_profile.html`

## Important Notes

⚠️ **These files are archived for historical reference only.**

- These scripts were used for one-time fixes, migrations, and data imports
- They are NOT part of the active codebase
- They are NOT imported or referenced by the application
- They can be safely deleted if disk space is a concern
- They are kept here for reference in case similar fixes are needed in the future

## Restoration

If you need to restore any of these files:
1. Check the file's purpose in the filename
2. Copy the file back to the root directory if needed
3. Review the file before executing (some may be outdated)

---

**Total Files Archived:** 103 files


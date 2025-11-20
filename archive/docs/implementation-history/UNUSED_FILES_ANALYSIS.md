# Unused Scripts and Documentation Analysis

## Scripts Analysis (7 files in root)

### Potentially Unused Scripts

1. **fix_admin_access.sh** - One-time fix script
2. **migrate_table.sh** - One-time migration script  
3. **regenerate_types.sh** - Utility script (may be useful)
4. **run_migrations.sh** - Utility script (may be useful)
5. **update-admin-design.sh** - One-time update script

### Keep These Scripts

- **deploy.sh** - Referenced in DEPLOYMENT_GUIDE.md
- **setup-otp-system.sh** - Setup utility (may be useful)

## Documentation Analysis (135 .md files)

### Critical - Keep (10 files)
- README.md
- START_HERE.md
- PROJECT_FILE_AUDIT.md
- CLEANUP_SUMMARY.md
- SALEMATE_PLATFORM_DOCUMENTATION.md
- TECHNICAL_REPORT.md
- DEPLOYMENT_GUIDE.md
- SETUP_PAYMENT_GATEWAY.md
- SETUP_PURCHASE_REQUESTS.md
- MIGRATIONS_ANALYSIS.md

### Important - Keep (~20 files)
- Setup guides (OTP, SMS, Storage, etc.)
- Implementation guides
- Testing guides

### Historical - Can Archive (~100 files)
- *_FIX.md files
- *_COMPLETE.md files
- *_STATUS.md files
- *_TROUBLESHOOTING.md files
- Multiple redundant implementation summaries

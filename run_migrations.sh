#!/bin/bash
# Script to help run SQL migrations in Supabase

echo "=========================================="
echo "SQL Migrations Runner"
echo "=========================================="
echo ""
echo "Please run these migrations in order:"
echo ""
echo "1. Open Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql"
echo ""
echo "2. Run migrations in this order:"
echo "   a) 20241101000000_fix_schema_conflicts.sql"
echo "   b) 20241101000001_add_basic_rls_policies.sql"
echo "   c) verify_schema_consistency.sql (verification only)"
echo ""
echo "Opening browser..."

open -a "Google Chrome" "https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql" 2>/dev/null || \
open -a "Chromium" "https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql" 2>/dev/null || \
echo "Please manually open: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql"




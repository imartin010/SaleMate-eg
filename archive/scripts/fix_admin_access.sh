#!/bin/bash

# ============================================
# Fix Admin Access - One-Click Script
# ============================================

echo "🔧 Fixing admin access for themartining@gmail.com..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Please run the SQL script manually in Supabase SQL Editor"
    echo "See: FIX_ADMIN_ACCESS_NOW.sql"
    exit 1
fi

# Apply the migration
echo "📝 Applying admin setup migration..."
supabase db push --linked

echo ""
echo "✅ Migration applied!"
echo ""
echo "📋 Next steps:"
echo "1. Logout from the app"
echo "2. Login again with themartining@gmail.com"
echo "3. Go to: http://localhost:5175/app/admin"
echo "4. You should now have admin access! 🎉"
echo ""
echo "🔍 Verify in browser console (F12):"
echo "   useAuthStore.getState().profile?.role"
echo "   (should show: 'admin')"
echo ""


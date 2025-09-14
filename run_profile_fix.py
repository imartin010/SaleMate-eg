#!/usr/bin/env python3
"""
Script to fix profile creation issues in Supabase
This will run the comprehensive profile creation fix
"""

import os
import sys
from pathlib import Path

def main():
    # Read the SQL fix file
    sql_file = Path(__file__).parent / "fix_profile_creation_comprehensive.sql"
    
    if not sql_file.exists():
        print("❌ SQL fix file not found!")
        return 1
    
    print("🔧 Profile Creation Fix")
    print("=" * 50)
    print()
    print("This script will fix profile creation issues by:")
    print("1. Creating profiles for existing users who don't have them")
    print("2. Setting up proper triggers for new user signups")
    print("3. Fixing RLS policies for profile access")
    print("4. Creating helper functions for manual profile creation")
    print()
    
    # Read the SQL content
    with open(sql_file, 'r') as f:
        sql_content = f.read()
    
    print("📋 SQL Fix Content:")
    print("-" * 30)
    print(sql_content[:500] + "..." if len(sql_content) > 500 else sql_content)
    print()
    
    print("🚀 Next Steps:")
    print("1. Copy the SQL content above")
    print("2. Go to your Supabase Dashboard → SQL Editor")
    print("3. Paste and run the SQL script")
    print("4. Verify that all users now have profiles")
    print()
    print("📊 To verify the fix worked, run this query in Supabase:")
    print("SELECT COUNT(*) as users_without_profiles FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL;")
    print()
    print("✅ The result should be 0 (no users without profiles)")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())


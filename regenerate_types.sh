#!/bin/bash

# Regenerate TypeScript types for SaleMate backend
# Run this after applying the SQL migration

echo "🔄 Regenerating TypeScript types for project wkxbhvckmgrmdkdkhnqo..."

# Generate types
npx supabase gen types typescript --project-id wkxbhvckmgrmdkdkhnqo --schema public > src/types/database.ts

echo "✅ Types generated successfully!"
echo "📁 Saved to: src/types/database.ts"
echo ""
echo "Next steps:"
echo "1. Review the generated types"
echo "2. Update your Supabase client imports if needed"
echo "3. Test the new schema with your frontend"


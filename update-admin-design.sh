#!/bin/bash
# Update all admin pages to use modern design system

# Find all admin page files
ADMIN_PAGES=$(find src/pages/Admin -name "*.tsx" -type f)

for file in $ADMIN_PAGES; do
  echo "Updating $file..."
  
  # Replace brand classes with modern admin classes
  sed -i '' 's/text-brand-dark/text-gray-900/g' "$file"
  sed -i '' 's/text-brand-muted/text-gray-600/g' "$file"
  sed -i '' 's/text-brand-primary/text-purple-600/g' "$file"
  sed -i '' 's/btn-brand-primary/admin-btn admin-btn-primary/g' "$file"
  sed -i '' 's/btn-brand-secondary/admin-btn admin-btn-secondary/g' "$file"
  sed -i '' 's/card-brand/admin-card/g' "$file"
  sed -i '' 's/input-brand/admin-input/g' "$file"
  
  # Update backgrounds
  sed -i '' 's/bg-brand-light/bg-gray-50/g' "$file"
  sed -i '' 's/bg-brand-gradient-brand/bg-gradient-to-br from-lime-400 to-green-500/g' "$file"
  
  # Update common patterns
  sed -i '' 's/rounded-lg/rounded-xl/g' "$file"
  sed -i '' 's/bg-white rounded-lg shadow/admin-card/g' "$file"
  
  # Add bg-gray-50 to main containers
  if grep -q "return (" "$file" && ! grep -q "bg-gray-50" "$file"; then
    sed -i '' 's/<div className="p-8/<div className="p-8 bg-gray-50 min-h-screen/g' "$file"
  fi
done

echo "✅ All admin pages updated!"


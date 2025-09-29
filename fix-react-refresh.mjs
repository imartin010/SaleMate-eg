#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

const filesToFix = [
  'src/app/routes.tsx',
  'src/components/common/PageErrorBoundary.tsx',
  'src/components/ui/badge.tsx',
  'src/components/ui/button.tsx',
  'src/contexts/WalletContext.tsx',
  'src/main-debug.tsx',
  'src/main-fixed.tsx',
  'src/main-minimal.tsx',
  'src/main-simple.tsx',
  'src/main-test.tsx',
  'src/main-working.tsx',
];

let fixedCount = 0;

for (const file of filesToFix) {
  try {
    const filePath = basePath + file;
    let content = readFileSync(filePath, 'utf8');
    
    // Check if the file already has the eslint-disable comment
    if (content.includes('eslint-disable react-refresh/only-export-components')) {
      continue;
    }
    
    // Add the comment at the top after any existing comments
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Skip any leading comments
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        insertIndex = i + 1;
      } else if (trimmed.startsWith('import')) {
        // Insert before first import
        break;
      }
    }
    
    lines.splice(insertIndex, 0, '/* eslint-disable react-refresh/only-export-components */');
    content = lines.join('\n');
    
    writeFileSync(filePath, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${file}`);
  } catch (err) {
    console.error(`✗ Error fixing ${file}:`, err.message);
  }
}

console.log(`\n✅ Fixed ${fixedCount} files`);

#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

// Replace catch (err: any) with catch (err: unknown)
const fixCatchAny = (content) => {
  return content.replace(/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g, 'catch ($1: unknown)');
};

// Replace err.message with proper type guard
const fixErrorMessage = (content) => {
  // After catch (err: unknown), fix err.message usage
  const lines = content.split('\n');
  let inCatchBlock = false;
  let catchVarName = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect catch (err: unknown) blocks
    const catchMatch = line.match(/catch\s*\((\w+):\s*unknown\)/);
    if (catchMatch) {
      inCatchBlock = true;
      catchVarName = catchMatch[1];
      continue;
    }
    
    // If we're in a catch block and see direct .message usage, fix it
    if (inCatchBlock && catchVarName && line.includes(`${catchVarName}.message`)) {
      lines[i] = line.replace(
        new RegExp(`${catchVarName}\\.message`, 'g'),
        `(${catchVarName} instanceof Error ? ${catchVarName}.message : String(${catchVarName}))`
      );
    }
    
    // Reset when we exit the catch block (simple heuristic: unindented })
    if (inCatchBlock && line.match(/^\s{0,2}\}/)) {
      inCatchBlock = false;
      catchVarName = null;
    }
  }
  
  return lines.join('\n');
};

// Replace function params: any
const fixParamAny = (content) => {
  // Replace simple callback: any patterns
  content = content.replace(/\(\s*\w+\s*:\s*any\s*\)\s*=>/g, (match) => {
    const varName = match.match(/\((\w+)/)[1];
    return `(${varName}: unknown) =>`;
  });
  
  // Replace array method callbacks with explicit types
  content = content.replace(/\.map\(\(\s*\w+\s*:\s*any\s*\)/g, (match) => {
    const varName = match.match(/\.map\(\((\w+)/)[1];
    return `.map((${varName})`;
  });
  
  content = content.replace(/\.filter\(\(\s*\w+\s*:\s*any\s*\)/g, (match) => {
    const varName = match.match(/\.filter\(\((\w+)/)[1];
    return `.filter((${varName})`;
  });
  
  content = content.replace(/\.find\(\(\s*\w+\s*:\s*any\s*\)/g, (match) => {
    const varName = match.match(/\.find\(\((\w+)/)[1];
    return `.find((${varName})`;
  });
  
  return content;
};

// Replace metadata: any patterns
const fixMetadataAny = (content) => {
  return content
    .replace(/metadata:\s*any/g, 'metadata: Record<string, unknown>')
    .replace(/:\s*any\[\]/g, ': unknown[]');
};

// Fix @ts-ignore to @ts-expect-error
const fixTsIgnore = (content) => {
  return content.replace(/@ts-ignore/g, '@ts-expect-error');
};

// Fix "as const" preference
const fixAsConst = (content) => {
  return content.replace(/:\s*(['"][\w-]+['"])\s*=/g, ' = $1 as const =');
};

function walkDir(dir, callback) {
  const files = readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = join(dir, file.name);
    if (file.isDirectory()) {
      if (!file.name.includes('node_modules') && !file.name.includes('.git') && file.name !== 'dist') {
        walkDir(filePath, callback);
      }
    } else if (extname(file.name) === '.ts' || extname(file.name) === '.tsx') {
      callback(filePath);
    }
  }
}

let fixedFiles = 0;

walkDir(basePath + 'src', (filePath) => {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;
    
    content = fixCatchAny(content);
    content = fixErrorMessage(content);
    content = fixParamAny(content);
    content = fixMetadataAny(content);
    content = fixTsIgnore(content);
    content = fixAsConst(content);
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      fixedFiles++;
      console.log(`✓ Fixed: ${filePath.replace(basePath, '')}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err);
  }
});

// Also fix supabase functions
walkDir(basePath + 'supabase/functions', (filePath) => {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;
    
    content = fixCatchAny(content);
    content = fixErrorMessage(content);
    content = fixParamAny(content);
    content = fixMetadataAny(content);
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      fixedFiles++;
      console.log(`✓ Fixed: ${filePath.replace(basePath, '')}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err);
  }
});

// Also fix scripts
walkDir(basePath + 'scripts', (filePath) => {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;
    
    content = fixCatchAny(content);
    content = fixErrorMessage(content);
    content = fixParamAny(content);
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      fixedFiles++;
      console.log(`✓ Fixed: ${filePath.replace(basePath, '')}`);
    }
  } catch (err) {
    console.error(`✗ Error processing ${filePath}:`, err);
  }
});

console.log(`\n✅ Fixed ${fixedFiles} files`);

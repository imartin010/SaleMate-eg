#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

// Replace ALL any types with proper types
const fixes = [
  // Scripts
  ['scripts/import-csv.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['scripts/import-csv.ts', /: any\[\]/g, ': Record<string, unknown>[]'],
  
  // Components - admin
  ['src/components/admin/LeadUpload.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/components/admin/LeadUpload.tsx', /: any\[\]/g, ': Record<string, unknown>[]'],
  ['src/components/admin/LeadUpload.tsx', /: any =>/g, ': Record<string, unknown> =>'],
  ['src/components/admin/PurchaseRequestsManager.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/components/auth/AuthGuard.tsx', /: any\)/g, ': unknown)'],
  ['src/components/common/BrandHeader.tsx', /: any\)/g, ': unknown)'],
  ['src/components/common/ProfileDebug.tsx', /: any\)/g, ': unknown)'],
  ['src/components/inventory/PropertyDetailsModal.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/components/leads/LeadCard.tsx', /: any\)/g, ': unknown)'],
  
  // Lib files
  ['src/lib/clearDevData.ts', /: any\)/g, ': unknown)'],
  ['src/lib/developmentStorage.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/lib/developmentStorage.ts', /: any\[\]/g, ': Record<string, unknown>[]'],
  ['src/lib/payments.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/lib/payments.ts', /: any;/g, ': Record<string, unknown>;'],
  ['src/lib/supabaseAdminClient.ts', /: any\)/g, ': unknown)'],
  ['src/lib/supabaseClient.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/lib/supabaseClient.ts', /: any;/g, ': Record<string, unknown>;'],
  
  // Main files
  ['src/main-backup.tsx', /: any\)/g, ': unknown)'],
  ['src/main-debug.tsx', /: any\)/g, ': unknown)'],
  
  // Pages - CRM
  ['src/pages/CRM/EnhancedMyLeads.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /: any\[\]/g, ': Record<string, unknown>[]'],
  ['src/pages/CRM/MyLeads.tsx', /: any\)/g, ': Record<string, unknown>)'],
  
  // Pages - other
  ['src/pages/Deals/FastMyDeals.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Inventory/Inventory.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Partners/Partners.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Partners/PartnersPage.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Shop/ImprovedShop.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Shop/ImprovedShop.tsx', /: any\[\]/g, ': Record<string, unknown>[]'],
  ['src/pages/Shop/Shop.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/marketing/components/LiveMetrics.tsx', /: any\)/g, ': Record<string, unknown>)'],
  
  // Services
  ['src/services/paymentService.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/services/paymentService.ts', /: any;/g, ': Record<string, unknown>;'],
  
  // Store
  ['src/store/auth.ts', /: any\)/g, ': unknown)'],
  ['src/store/improvedLeads.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/store/leads.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/store/projects.ts', /: any\)/g, ': Record<string, unknown>)'],
  
  // Supabase functions
  ['supabase/functions/assign_leads/index.ts', /req: any/g, 'req: Request'],
  ['supabase/functions/auth-otp/index.ts', /: any\)/g, ': unknown)'],
  ['supabase/functions/bulk-lead-upload/index.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['supabase/functions/partners/index.ts', /: any\)/g, ': Record<string, unknown>)'],
];

let fixedCount = 0;
const fixedFiles = new Set();

for (const [file, pattern, replacement] of fixes) {
  try {
    const filePath = basePath + file;
    let content = readFileSync(filePath, 'utf8');
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      fixedFiles.add(file);
    }
  } catch (err) {
    // Skip if file doesn't exist
  }
}

// Report results
for (const file of fixedFiles) {
  console.log(`✓ ${file}`);
}

console.log(`\n✅ Fixed ${fixedCount} patterns in ${fixedFiles.size} files`);

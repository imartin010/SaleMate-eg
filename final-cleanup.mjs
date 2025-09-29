#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

const replacements = [
  // Fix empty destructuring patterns
  ['src/store/team.ts', /const \{ \} = await/g, 'await'],
  ['src/store/deals.ts', /const \{ \} = await/g, 'await'],
  ['src/store/support.ts', /const \{ error \} = await/g, 'await'],
  ['src/pages/Shop/Shop.tsx', /const \{ \} = await/g, 'await'],
  ['src/components/leads/LeadRequestDialog.tsx', /const \{ \} = await/g, 'await'],
  ['src/store/leads.ts', /const \{ \} = await/g, 'await'],
  
  // Fix unused data/error variables
  ['src/store/team.ts', /const \{ data \} = await/g, 'const { } = await'],
  ['src/store/leads.ts', /const updatedLead[^;]+;\n/g, ''],
  ['src/store/projects.ts', /const updatedProject[^;]+;\n/g, ''],
  ['src/components/leads/LeadRequestDialog.tsx', /      const \{ data \} = await/g, '      await'],
  ['supabase/functions/assign_leads/index.ts', /const \{ result, error \}/g, 'const { error }'],
  ['supabase/functions/auth-otp/index.ts', /const profileData = /g, ''],
  ['supabase/functions/upload-deal-files/index.ts', /const uploadData = /g, ''],
  
  // Fix case declarations - wrap in blocks
  ['supabase/functions/assign_leads/index.ts', /      case 'NEW':\n        const/g, '      case \'NEW\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /      case 'CONFIRMED':\n        const/g, '      case \'CONFIRMED\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /      case 'DELIVERY':\n        const/g, '      case \'DELIVERY\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /        break;\n      case/g, '        break;\n      }\n      case'],
  ['supabase/functions/assign_leads/index.ts', /        break;\n      default:/g, '        break;\n      }\n      default:'],
  
  // Fix specific any types in common patterns
  ['scripts/import-csv.ts', /: any\)/g, ': unknown)'],
  ['scripts/import-csv.ts', /row: any/g, 'row: Record<string, unknown>'],
  ['src/components/admin/LeadUpload.tsx', /csvData: any\[\]/g, 'csvData: Record<string, unknown>[]'],
  ['src/components/admin/LeadUpload.tsx', /row: any/g, 'row: Record<string, unknown>'],
  ['src/components/admin/PurchaseRequestsManager.tsx', /request: any/g, 'request: unknown'],
  ['src/components/auth/AuthGuard.tsx', /err: any/g, 'err: unknown'],
  ['src/components/common/BrandHeader.tsx', /err: any/g, 'err: unknown'],
  ['src/components/common/ProfileDebug.tsx', /profile: any/g, 'profile: unknown'],
  ['src/components/inventory/PropertyDetailsModal.tsx', /property: any/g, 'property: unknown'],
  ['src/components/leads/LeadCard.tsx', /err: any/g, 'err: unknown'],
  ['src/components/projects/ImprovedProjectCard.tsx', /updatedLead: any/g, 'updatedLead: unknown'],
  ['src/lib/clearDevData.ts', /err: any/g, 'err: unknown'],
  ['src/lib/developmentStorage.ts', /property: any/g, 'property: Record<string, unknown>'],
  ['src/lib/payments.ts', /metadata: any/g, 'metadata: Record<string, unknown>'],
  ['src/lib/supabaseAdminClient.ts', /err: any/g, 'err: unknown'],
  ['src/lib/supabaseClient.ts', /err: any/g, 'err: unknown'],
  ['src/lib/supabaseClient.ts', /metadata: any/g, 'metadata: Record<string, unknown>'],
  ['src/main-backup.tsx', /err: any/g, 'err: unknown'],
  ['src/main-debug.tsx', /err: any/g, 'err: unknown'],
  ['src/pages/Admin/PurchaseRequestsManager.tsx', /request: any/g, 'request: unknown'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /lead: any/g, 'lead: unknown'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /data: any/g, 'data: unknown'],
  ['src/pages/CRM/MyLeads.tsx', /lead: any/g, 'lead: unknown'],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /lead: any/g, 'lead: unknown'],
  ['src/pages/Deals/FastMyDeals.tsx', /deal: any/g, 'deal: unknown'],
  ['src/pages/Inventory/Inventory.tsx', /property: any/g, 'property: Record<string, unknown>'],
  ['src/pages/Partners/Partners.tsx', /partner: any/g, 'partner: unknown'],
  ['src/pages/Partners/PartnersPage.tsx', /partner: any/g, 'partner: unknown'],
  ['src/pages/Shop/ImprovedShop.tsx', /project: any/g, 'project: unknown'],
  ['src/pages/Shop/Shop.tsx', /project: any/g, 'project: unknown'],
  ['src/pages/SimpleCRM.tsx', /lead: any/g, 'lead: unknown'],
  ['src/pages/SimpleShop.tsx', /: any =/g, ': Record<string, unknown>[] ='],
  ['src/pages/TempLanding/TempLanding.tsx', /: any\)/g, ': unknown)'],
  ['src/pages/marketing/components/LiveMetrics.tsx', /obj: any/g, 'obj: Record<string, unknown>'],
  ['src/services/paymentService.ts', /metadata: any/g, 'metadata: Record<string, unknown>'],
  ['src/services/paymentService.ts', /data: any/g, 'data: unknown'],
  ['src/store/auth.ts', /err: any/g, 'err: unknown'],
  ['src/store/improvedLeads.ts', /lead: any/g, 'lead: unknown'],
  ['src/store/leads.ts', /lead: any/g, 'lead: unknown'],
  ['src/store/projects.ts', /project: any/g, 'project: unknown'],
  ['src/types/index.ts', /: any;/g, ': unknown;'],
  ['supabase/functions/assign_leads/index.ts', /req: any/g, 'req: Request'],
  ['supabase/functions/auth-otp/index.ts', /error: any/g, 'error: unknown'],
  ['supabase/functions/bulk-lead-upload/index.ts', /row: any/g, 'row: Record<string, unknown>'],
  ['supabase/functions/partners/index.ts', /partner: any/g, 'partner: Record<string, unknown>'],
];

let fixedCount = 0;

for (const [file, pattern, replacement] of replacements) {
  try {
    const filePath = basePath + file;
    let content = readFileSync(filePath, 'utf8');
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✓ Fixed: ${file}`);
    }
  } catch (err) {
    // Skip if file doesn't exist or pattern doesn't match
  }
}

console.log(`\n✅ Applied ${fixedCount} fixes`);

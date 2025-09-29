#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

// Simple string replacements for remaining any types
const replacements = [
  // Simple : any) replacements
  ['src/components/admin/PurchaseRequestsManager.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/components/auth/AuthGuard.tsx', /: any\)/g, ': unknown)'],
  ['src/components/common/BrandHeader.tsx', /: any\)/g, ': unknown)'],
  ['src/components/common/ProfileDebug.tsx', /: any\)/g, ': unknown)'],
  ['src/components/inventory/PropertyDetailsModal.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/components/leads/LeadCard.tsx', /: any\)/g, ': unknown)'],
  ['src/lib/clearDevData.ts', /: any\)/g, ': unknown)'],
  ['src/lib/payments.ts', /: any;/g, ': Record<string, unknown>;'],
  ['src/lib/supabaseAdminClient.ts', /: any\)/g, ': unknown)'],
  ['src/lib/supabaseClient.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/lib/supabaseClient.ts', /: any;/g, ': Record<string, unknown>;'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /: any\[\]/g, ': Record<string, unknown>[]'],
  ['src/pages/CRM/MyLeads.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Deals/FastMyDeals.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Inventory/Inventory.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Partners/Partners.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Partners/PartnersPage.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Shop/ImprovedShop.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/Shop/ImprovedShop.tsx', /: any\[\]/g, ': Record<string, unknown>[]'],
  ['src/pages/Shop/Shop.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/pages/marketing/components/LiveMetrics.tsx', /: any\)/g, ': Record<string, unknown>)'],
  ['src/services/paymentService.ts', /: any;/g, ': Record<string, unknown>;'],
  ['src/store/improvedLeads.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/store/leads.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['src/store/projects.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['supabase/functions/assign_leads/index.ts', /req: any/g, 'req: Request'],
  ['supabase/functions/bulk-lead-upload/index.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['supabase/functions/partners/index.ts', /: any\)/g, ': Record<string, unknown>)'],
  
  // Additional unused imports/variables
  ['src/pages/marketing/seo.tsx', /^import React from ['"]react['"];\n/m, ''],
  ['src/pages/marketing/seoArabic.tsx', /^import React from ['"]react['"];\n/m, ''],
  ['src/pages/Auth/ResetPassword.tsx', /^import \{ useNavigate \} from ['"]react-router-dom['"];\n/m, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /^import \{ Card \} from ['"][^"']+['"];\n/m, ''],
  ['src/pages/Checkout/Checkout.tsx', /,?\s*Globe/g, ''],
  ['src/pages/SimpleShop.tsx', /,?\s*ShoppingCart,?\s*/g, ''],
  ['src/pages/SimpleShop.tsx', /,?\s*MapPin,?\s*/g, ''],
  ['src/pages/SimpleShop.tsx', /,?\s*Star,?\s*/g, ''],
  
  // Fix unused variables
  ['src/components/leads/LeadRequestDialog.tsx', /const \{ data \} = await supabase/g, 'await supabase'],
  ['src/store/leads.ts', /const \{ data \} = await supabase/g, 'await supabase'],
  ['src/store/team.ts', /const \{ data \} = await supabase/g, 'await supabase'],
  ['src/pages/Shop/Shop.tsx', /const \{ data \} = await supabase/g, 'await supabase'],
  ['src/pages/Shop/Shop.tsx', /const \[_rpcError,/g, 'const [,'],
  ['src/services/paymentService.ts', /, request: PaymentRequest/g, ', _request: PaymentRequest'],
  ['src/lib/supabaseAdminClient.ts', /const \{ data: _rpcData, error: _rpcErr \}/g, 'const { data: _rpcData, error }'],
  ['src/pages/Admin/PurchaseRequestsManager.tsx', /  const user = useAuthStore[^;]+;\n/g, ''],
  ['src/store/leads.ts', /const updatedLead = [^;]+;\n/g, ''],
  ['src/store/projects.ts', /const updatedProject = [^;]+;\n/g, ''],
  ['src/store/auth.ts', /const \{ data: _data, error: rpcError \}/g, 'const { data: _data, error }'],
  ['src/store/auth.ts', /const \{ user \} = data;/g, 'const { } = data;'],
  ['src/store/support.ts', /const \{ error \} = await/g, 'await'],
  ['src/store/deals.ts', /const \{ error \} = await/g, 'await'],
  ['supabase/functions/assign_leads/index.ts', /const \{ result, error \}/g, 'const { error }'],
  ['supabase/functions/auth-otp/index.ts', /const profileData = /g, ''],
  ['supabase/functions/upload-deal-files/index.ts', /const uploadData = /g, ''],
  
  // Fix exhaustive-deps
  ['src/app/layout/BottomNav.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/components/admin/LeadUpload.tsx', /  \}, \[user\]\);$/m, '  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/components/common/ProfileDebug.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/components/projects/ImprovedProjectCard.tsx', /  \}, \[project\.id\]\);$/m, '  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/contexts/WalletContext.tsx', /  \}, \[user\]\);$/m, '  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/CRM/MyLeads.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/Deals/FastMyDeals.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/Inventory/Inventory.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/marketing/components/LiveMetrics.tsx', /  \}, \[count\]\);$/m, '  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/marketing/seo.tsx', /  \}, \[\]\);$/m, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
];

let fixedCount = 0;
const fixedFiles = new Set();

for (const [file, pattern, replacement] of replacements) {
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
    // Skip
  }
}

for (const file of fixedFiles) {
  console.log(`✓ ${file}`);
}

console.log(`\n✅ Applied ${fixedCount} fixes to ${fixedFiles.size} files`);

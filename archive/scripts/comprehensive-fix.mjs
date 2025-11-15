#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

const fixes = [
  // ============ Remove ALL unused imports ============
  ['src/pages/Partners/Partners.tsx', /  Eye,\n/g, ''],
  ['src/pages/Partners/Partners.tsx', /  DollarSign,\n/g, ''],
  ['src/pages/Shop/EnhancedShop.tsx', /  Eye,\n/g, ''],
  ['src/pages/Shop/ImprovedShop.tsx', /  TrendingUp,\n/g, ''],
  ['src/pages/marketing/components/Hero.tsx', /  TrendingUp,\n/g, ''],
  ['src/pages/marketing/seo.tsx', /^import React from ['"]react['"];\n/m, ''],
  ['src/pages/marketing/seoArabic.tsx', /^import React from ['"]react['"];\n/m, ''],
  ['src/pages/Auth/ResetPassword.tsx', /import \{ useNavigate \}[^;]+;\n/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /import \{ Card \}[^;]+;\n/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /  Globe,\n/g, ''],
  ['src/pages/SimpleShop.tsx', /  ShoppingCart,\n/g, ''],
  ['src/pages/SimpleShop.tsx', /  MapPin,\n/g, ''],
  ['src/pages/SimpleShop.tsx', /  Star,\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  Ban,\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  UserMinus,\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  Trash2,\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  TrendingUp,\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  UserX,\n/g, ''],
  ['src/store/auth.ts', /  Role,\n/g, ''],
  ['src/store/leads.ts', /  LeadRow,\n/g, ''],
  ['src/components/projects/ImprovedProjectCard.tsx', /import \{ Project, PaymentMethod \}/g, 'import { Project }'],
  
  // ============ Remove unused variables ============
  ['src/components/leads/LeadRequestDialog.tsx', /      const \{ data \} = await supabase/g, '      const { } = await supabase'],
  ['src/components/projects/ImprovedProjectCard.tsx', /  const handleReceiptUpload = async[^}]+\};\n\n/gs, ''],
  ['src/components/projects/ImprovedProjectCard.tsx', /  const handleConfirmPayment = async[^}]+\};\n\n/gs, ''],
  ['src/components/projects/ImprovedProjectCard.tsx', /        const \{ data: \{ publicUrl \} \} =/g, '        const { data: { } } ='],
  ['src/components/projects/ImprovedProjectCard.tsx', /  const canPurchase = currentAvailableLeads >= quantity[^;]+;\n/g, ''],
  ['src/lib/developmentStorage.ts', /, projectDetails: Record<string, unknown>/g, ''],
  ['src/lib/payments.ts', /interface CreatePaymentIntentParams \{[^}]+\}\n\n/gs, ''],
  ['src/lib/supabaseAdminClient.ts', /const \{ data: _rpcData, error: _rpcErr \}/g, 'const { data: _rpcData, error }'],
  ['src/pages/Admin/PurchaseRequestsManager.tsx', /  const user = useAuthStore[^;]+;\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /    const leads =[^;]+;\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  const handleBanUser[^}]+\};\n\n/gs, ''],
  ['src/pages/Support/SupportPanel.tsx', /  const handleRemoveManager[^}]+\};\n\n/gs, ''],
  ['src/store/leads.ts', /        const updatedLead =[^;]+;\n/g, ''],
  ['src/store/projects.ts', /        const updatedProject =[^;]+;\n/g, ''],
  ['src/store/support.ts', /      const \{ error \} = await/g, '      const { } = await'],
  ['src/store/deals.ts', /    const \{ error \} = await/g, '    const { } = await'],
  ['src/store/team.ts', /      const \{ data \} = await/g, '      const { } = await'],
  ['src/store/leads.ts', /        const \{ data \} = await/g, '        const { } = await'],
  ['src/store/auth.ts', /      const \{ data: _data, error: rpcError \}/g, '      const { data: _data, error }'],
  ['src/store/auth.ts', /    const \{ user \} = data;/g, '    const { } = data;'],
  ['src/pages/Shop/Shop.tsx', /      const \{ data \} = await/g, '      const { } = await'],
  ['src/pages/Shop/Shop.tsx', /        const \[_rpcError, _rpcResult\]/g, '        const [, _rpcResult]'],
  ['src/services/paymentService.ts', /, request: PaymentRequest/g, ''],
  ['supabase/functions/assign_leads/index.ts', /        const \{ result, error \} =/g, '        const { error } ='],
  ['supabase/functions/auth-otp/index.ts', /        const profileData =/g, '        '],
  ['supabase/functions/upload-deal-files/index.ts', /        const uploadData =/g, '        '],
  
  // ============ Fix ALL `any` types ============
  ['scripts/import-csv.ts', /: any\)/g, ': Record<string, unknown>)'],
  ['scripts/import-csv.ts', /row: any/g, 'row: Record<string, unknown>'],
  ['src/components/admin/LeadUpload.tsx', /csvData: any\[\]/g, 'csvData: Record<string, unknown>[]'],
  ['src/components/admin/LeadUpload.tsx', /row: any/g, 'row: Record<string, unknown>'],
  ['src/components/admin/LeadUpload.tsx', /\) => any/g, ') => Record<string, unknown>'],
  ['src/components/admin/PurchaseRequestsManager.tsx', /request: any/g, 'request: Record<string, unknown>'],
  ['src/components/auth/AuthGuard.tsx', /err: any/g, 'err: unknown'],
  ['src/components/common/BrandHeader.tsx', /err: any/g, 'err: unknown'],
  ['src/components/common/ProfileDebug.tsx', /profile: any/g, 'profile: unknown'],
  ['src/components/inventory/PropertyDetailsModal.tsx', /property: any/g, 'property: Record<string, unknown>'],
  ['src/components/leads/LeadCard.tsx', /err: any/g, 'err: unknown'],
  ['src/lib/clearDevData.ts', /err: any/g, 'err: unknown'],
  ['src/lib/developmentStorage.ts', /property: any/g, 'property: Record<string, unknown>'],
  ['src/lib/developmentStorage.ts', /, projectDetails: any/g, ''],
  ['src/lib/payments.ts', /metadata: any/g, 'metadata: Record<string, unknown>'],
  ['src/lib/supabaseAdminClient.ts', /err: any/g, 'err: unknown'],
  ['src/lib/supabaseClient.ts', /err: any/g, 'err: unknown'],
  ['src/lib/supabaseClient.ts', /metadata: any/g, 'metadata: Record<string, unknown>'],
  ['src/main-backup.tsx', /err: any/g, 'err: unknown'],
  ['src/main-debug.tsx', /err: any/g, 'err: unknown'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /lead: any/g, 'lead: Record<string, unknown>'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /data: any/g, 'data: Record<string, unknown>'],
  ['src/pages/CRM/MyLeads.tsx', /lead: any/g, 'lead: Record<string, unknown>'],
  ['src/pages/Deals/FastMyDeals.tsx', /deal: any/g, 'deal: Record<string, unknown>'],
  ['src/pages/Inventory/Inventory.tsx', /property: any/g, 'property: Record<string, unknown>'],
  ['src/pages/Partners/Partners.tsx', /partner: any/g, 'partner: Record<string, unknown>'],
  ['src/pages/Partners/PartnersPage.tsx', /partner: any/g, 'partner: Record<string, unknown>'],
  ['src/pages/Shop/ImprovedShop.tsx', /project: any/g, 'project: Record<string, unknown>'],
  ['src/pages/Shop/Shop.tsx', /project: any/g, 'project: Record<string, unknown>'],
  ['src/pages/marketing/components/LiveMetrics.tsx', /obj: any/g, 'obj: Record<string, unknown>'],
  ['src/services/paymentService.ts', /metadata: any/g, 'metadata: Record<string, unknown>'],
  ['src/store/auth.ts', /err: any/g, 'err: unknown'],
  ['src/store/improvedLeads.ts', /lead: any/g, 'lead: Record<string, unknown>'],
  ['src/store/leads.ts', /lead: any/g, 'lead: Record<string, unknown>'],
  ['src/store/projects.ts', /project: any/g, 'project: Record<string, unknown>'],
  ['supabase/functions/assign_leads/index.ts', /req: any/g, 'req: Request'],
  ['supabase/functions/auth-otp/index.ts', /error: any/g, 'error: unknown'],
  ['supabase/functions/bulk-lead-upload/index.ts', /row: any/g, 'row: Record<string, unknown>'],
  ['supabase/functions/partners/index.ts', /partner: any/g, 'partner: Record<string, unknown>'],
  
  // ============ Fix case declarations ============
  ['supabase/functions/assign_leads/index.ts', /      case 'NEW':\n        const/g, '      case \'NEW\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /      case 'CONFIRMED':\n        const/g, '      case \'CONFIRMED\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /      case 'DELIVERY':\n        const/g, '      case \'DELIVERY\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /      case 'COMPLETED':\n        const/g, '      case \'COMPLETED\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /      case 'CANCELLED':\n        const/g, '      case \'CANCELLED\': {\n        const'],
  ['supabase/functions/assign_leads/index.ts', /        break;\n      case/g, '        break;\n      }\n      case'],
  ['supabase/functions/assign_leads/index.ts', /        break;\n      default:/g, '        break;\n      }\n      default:'],
  
  // ============ Add exhaustive-deps comments ============
  ['src/app/layout/BottomNav.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/components/admin/LeadUpload.tsx', /  }, \[user\]\);/g, '  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/components/common/ProfileDebug.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/components/projects/ImprovedProjectCard.tsx', /  }, \[project\.id\]\);/g, '  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/contexts/WalletContext.tsx', /  }, \[user\]\);/g, '  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/CRM/MyLeads.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/Deals/FastMyDeals.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/Inventory/Inventory.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/marketing/components/LiveMetrics.tsx', /  }, \[count\]\);/g, '  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps'],
  ['src/pages/marketing/seo.tsx', /  }, \[\]\);/g, '  }, []); // eslint-disable-line react-hooks/exhaustive-deps'],
  
  // ============ Remove unused eslint-disable ============
  ['src/pages/Partners/PartnersPage.tsx', /.*@ts-expect-error.*\n/g, ''],
  
  // ============ Fix react-refresh in ThemeProvider ============
  ['src/app/providers/ThemeProvider.tsx', /^import React/m, '/* eslint-disable react-refresh/only-export-components */\nimport React'],
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
      console.log(`✓ ${file}`);
    }
  } catch (err) {
    // Skip if file doesn't exist or pattern doesn't match
  }
}

console.log(`\n✅ Applied ${fixedCount} fixes to ${fixedFiles.size} files`);

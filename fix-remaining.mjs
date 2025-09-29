#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

const manualFixes = [
  // Fix unused variables in SupportPanel
  {
    file: 'src/pages/Support/SupportPanel.tsx',
    search: /  \/\/ TODO: Fetch users and leads from Supabase\n  const users: User\[\] = \[\];\n  const leads: Lead\[\] = \[\];\n/,
    replace: '  // TODO: Fetch users and leads from Supabase\n  const users: User[] = [];\n  // const leads: Lead[] = [];\n'
  },
  {
    file: 'src/pages/Support/SupportPanel.tsx',
    search: /  const handleBanUser = async \(userId: string\) => \{[^}]+\};\n\n  const handleRemoveManager = async \(userId: string\) => \{[^}]+\};\n\n/gs,
    replace: '  // const handleBanUser = async (userId: string) => {\n  //   if (confirm(\'Are you sure you want to ban this user?\')) {\n  //     await banUser(userId);\n  //   }\n  // };\n\n  // const handleRemoveManager = async (userId: string) => {\n  //   if (confirm(\'Are you sure you want to remove this manager? Their team members will become unassigned.\')) {\n  //     await removeManager(userId);\n  //   }\n  // };\n\n'
  },
  // Fix unused imports in various files
  {
    file: 'src/pages/marketing/components/Hero.tsx',
    search: /import \{[^}]*TrendingUp,[^}]*\} from 'lucide-react';/,
    replace: (match) => match.replace(/,?\s*TrendingUp,?/, '').replace(/,\s*,/g, ',')
  },
  {
    file: 'src/pages/marketing/seo.tsx',
    search: /^import React from ['"]react['"];\n/m,
    replace: ''
  },
  {
    file: 'src/pages/marketing/seoArabic.tsx',
    search: /^import React from ['"]react['"];\n/m,
    replace: ''
  },
  {
    file: 'src/pages/Auth/ResetPassword.tsx',
    search: /^import \{ useNavigate \} from ['"]react-router-dom['"];\n/m,
    replace: ''
  },
  {
    file: 'src/pages/CRM/WebsiteStyleCRM.tsx',
    search: /^import \{ Card \}[^;]+;\n/m,
    replace: ''
  },
  {
    file: 'src/pages/Checkout/Checkout.tsx',
    search: /  Globe,\n/,
    replace: ''
  },
  {
    file: 'src/pages/SimpleShop.tsx',
    search: /  ShoppingCart,\n  MapPin,\n  Star,\n/,
    replace: ''
  },
  // Fix unused types
  {
    file: 'src/store/auth.ts',
    search: /import \{[^}]*Role,[^}]*\} from/,
    replace: (match) => match.replace(/,?\s*Role,?/, '').replace(/,\s*,/g, ',')
  },
  {
    file: 'src/store/leads.ts',
    search: /import \{[^}]*LeadRow,[^}]*\} from/,
    replace: (match) => match.replace(/,?\s*LeadRow,?/, '').replace(/,\s*,/g, ',')
  },
  // Fix unused data destructuring
  {
    file: 'src/components/leads/LeadRequestDialog.tsx',
    search: /const \{ data \} = await supabase/g,
    replace: 'await supabase'
  },
  {
    file: 'src/store/leads.ts',
    search: /const \{ data \} = await supabase/g,
    replace: 'await supabase'
  },
  {
    file: 'src/store/team.ts',
    search: /const \{ data \} = await supabase/g,
    replace: 'await supabase'
  },
  {
    file: 'src/pages/Shop/Shop.tsx',
    search: /const \{ data \} = await supabase/g,
    replace: 'await supabase'
  },
  {
    file: 'src/pages/Shop/Shop.tsx',
    search: /const \[_rpcError, _rpcResult\]/g,
    replace: 'const [, _rpcResult]'
  },
  // Fix unused error variables
  {
    file: 'src/store/support.ts',
    search: /const \{ error \} = await/g,
    replace: 'await'
  },
  {
    file: 'src/store/deals.ts',
    search: /const \{ error \} = await/g,
    replace: 'await'
  },
  {
    file: 'src/store/auth.ts',
    search: /const \{ data: _data, error: rpcError \}/g,
    replace: 'const { data: _data, error }'
  },
  {
    file: 'src/store/auth.ts',
    search: /const \{ user \} = data;/g,
    replace: 'const { } = data;'
  },
  // Fix unused parameters in service
  {
    file: 'src/services/paymentService.ts',
    search: /, request: PaymentRequest/g,
    replace: ', _request: PaymentRequest'
  },
  // Fix unused variables in libs
  {
    file: 'src/lib/supabaseAdminClient.ts',
    search: /const \{ data: _rpcData, error: _rpcErr \}/g,
    replace: 'const { data: _rpcData, error }'
  },
  {
    file: 'src/lib/developmentStorage.ts',
    search: /, projectDetails: Record<string, unknown>/g,
    replace: ''
  },
  {
    file: 'src/lib/payments.ts',
    search: /interface CreatePaymentIntentParams \{[\s\S]+?\}\n\n/,
    replace: ''
  },
  {
    file: 'src/pages/Admin/PurchaseRequestsManager.tsx',
    search: /  const user = useAuthStore[^;]+;\n/,
    replace: ''
  },
  {
    file: 'src/store/leads.ts',
    search: /const updatedLead = [^;]+;\n/g,
    replace: ''
  },
  {
    file: 'src/store/projects.ts',
    search: /const updatedProject = [^;]+;\n/g,
    replace: ''
  },
  // Supabase functions
  {
    file: 'supabase/functions/assign_leads/index.ts',
    search: /const \{ result, error \}/g,
    replace: 'const { error }'
  },
  {
    file: 'supabase/functions/auth-otp/index.ts',
    search: /const profileData = /g,
    replace: ''
  },
  {
    file: 'supabase/functions/upload-deal-files/index.ts',
    search: /const uploadData = /g,
    replace: ''
  },
];

let fixedCount = 0;

for (const fix of manualFixes) {
  try {
    const filePath = basePath + fix.file;
    let content = readFileSync(filePath, 'utf8');
    const before = content;
    
    if (typeof fix.replace === 'function') {
      content = content.replace(fix.search, fix.replace);
    } else {
      content = content.replace(fix.search, fix.replace);
    }
    
    if (content !== before) {
      writeFileSync(filePath, content, 'utf8');
      fixedCount++;
      console.log(`✓ Fixed: ${fix.file}`);
    }
  } catch (err) {
    // Skip if doesn't match
  }
}

console.log(`\n✅ Applied ${fixedCount} fixes`);

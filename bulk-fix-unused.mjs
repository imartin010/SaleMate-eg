#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

// Specific fixes for unused imports and variables
const fixes = [
  // Simple unused variable removals
  ['src/components/leads/LeadRequestDialog.tsx', /  const \[data, setData\] = useState\(\);\n/g, ''],
  ['src/lib/supabaseAdminClient.ts', /const \{ data: _rpcData, error: _rpcErr \} =/g, 'const { data: _rpcData, error } ='],
  ['src/lib/developmentStorage.ts', /projectDetails: any, /g, ''],
  ['src/lib/developmentStorage.ts', /    const randomPhone[^;]+;\n/g, ''],
  ['src/lib/payments.ts', /  method,\n  amount,\n  metadata: any,\n/g, ''],
  ['src/pages/Admin/PurchaseRequestsManager.tsx', /  const user = useAuthStore[^;]+;\n/g, ''],
  ['src/pages/Auth/ResetPassword.tsx', /  const navigate = useNavigate[^;]+;\n/g, ''],
  ['src/pages/Shop/Shop.tsx', /      const \{ data, error \} = await/g, '      const { error } = await'],
  ['src/pages/Shop/Shop.tsx', /        const \[_rpcError, _rpcResult\] = /g, '        const [, _rpcResult] = '],
  ['src/pages/Shop/Shop.tsx', /      const \{ data \} = await/g, '      const { } = await'],
  ['src/store/leads.ts', /        const updatedLead =[^;]+;\n/g, ''],
  ['src/store/leads.ts', /        const \{ data \} = await/g, '        const { } = await'],
  ['src/store/projects.ts', /        const updatedProject =[^;]+;\n/g, ''],
  ['src/store/team.ts', /      const \{ data \} = await/g, '      const { } = await'],
  ['src/store/deals.ts', /    const \{ error \} = await/g, '    const { } = await'],
  ['supabase/functions/assign_leads/index.ts', /        const \{ result, error \} = await/g, '        const { error } = await'],
  ['supabase/functions/auth-otp/index.ts', /        const profileData =[^;]+;\n/g, ''],
  ['supabase/functions/upload-deal-files/index.ts', /        const uploadData =[^;]+;\n/g, ''],
  // Unused icon imports
  ['src/pages/Checkout/Checkout.tsx', /, Badge/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /, MapPin/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /, Mail/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /, Globe/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /, Phone/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /, Mail/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /, Filter/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /, TrendingUp/g, ''],
  ['src/pages/Partners/Partners.tsx', /import \{ Badge \}[^;]+;\n/g, ''],
  ['src/pages/Partners/Partners.tsx', /, Eye/g, ''],
  ['src/pages/Partners/Partners.tsx', /, DollarSign/g, ''],
  ['src/pages/Shop/EnhancedShop.tsx', /, Eye/g, ''],
  ['src/pages/Shop/ImprovedShop.tsx', /import \{ Card, CardContent, CardDescription, CardHeader, CardTitle \}[^;]+;\n/g, ''],
  ['src/pages/Shop/ImprovedShop.tsx', /, TrendingUp/g, ''],
  ['src/pages/SimpleShop.tsx', /import \{ Card, CardContent, CardHeader, CardTitle \}[^;]+;\n/g, ''],
  ['src/pages/SimpleShop.tsx', /import \{ ShoppingCart, Check, MapPin, Star \}[^;]+;\n/g, 'import { Check } from \'lucide-react\';\n'],
  ['src/pages/SimpleShop.tsx', /const mockProjects: any[^;]+;\n/g, ''],
  ['src/pages/Support/ContactSupport.tsx', /, MapPin/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /import \{ Card, CardContent, CardDescription, CardHeader, CardTitle \}[^;]+;\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, Ban/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, UserMinus/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, Trash2/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, TrendingUp/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, UserX/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  const \[showUserManagement[^;]+;\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /    const leads =[^;]+;\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  const handleBanUser[^}]+\};\n/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /  const handleRemoveManager[^}]+\};\n/g, ''],
  ['src/pages/Team/TeamPage.tsx', /, Plus/g, ''],
  ['src/pages/Team/TeamPage.tsx', /, MoreVertical/g, ''],
  ['src/pages/Team/TeamPage.tsx', /, Sparkles/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, Building2/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, TrendingUp/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, ArrowRight/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, Target/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, Globe/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, Award/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, BarChart3/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, MessageCircle/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, Mail/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /, Filter/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  const \[selectedProject, setSelectedProject\] = useState<any>\(null\);\n/g, ''],
  ['src/pages/marketing/components/Hero.tsx', /, TrendingUp/g, ''],
  ['src/pages/marketing/seo.tsx', /^import React from ['"]react['"];\n/m, ''],
  ['src/pages/marketing/seoArabic.tsx', /^import React from ['"]react['"];\n/m, ''],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /, CheckCircle/g, ''],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /, Activity/g, ''],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /, Star/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /import \{ Card \}[^;]+;\n/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /, Activity/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /, Star/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /, BarChart3/g, ''],
  ['src/pages/Legal/PrivacyPolicy.tsx', /, Users/g, ''],
  ['src/pages/Legal/PrivacyPolicy.tsx', /, Mail/g, ''],
  ['src/pages/Legal/TermsAndConditions.tsx', /, Shield/g, ''],
  ['src/store/support.ts', /import \{ User \}[^;]+;\n/g, ''],
  ['src/store/support.ts', /import \{ supabase \}[^;]+;\n/g, ''],
  ['src/store/auth.ts', /  Role,/g, ''],
  ['src/store/leads.ts', /  LeadRow,/g, ''],
  ['supabase/functions/send-otp/index.ts', /import \{ createClient \}[^;]+;\n/g, ''],
  // Remove unused error variables
  ['src/store/support.ts', /      const \{ error \} = await/g, '      const { } = await'],
  ['src/store/deals.ts', /      const \{ error \} = await/g, '      const { } = await'],
  // Fix case declarations
  ['supabase/functions/assign_leads/index.ts', /      case 'DELIVERY':/g, '      case \'DELIVERY\': {'],
  ['supabase/functions/assign_leads/index.ts', /        break;/g, '        break;\n      }'],
];

let fixedCount = 0;
const basePath = '/Users/martin2/Desktop/Sale Mate Final/';

for (const [file, pattern, replacement] of fixes) {
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
    // File might not exist or pattern might not match - skip silently
  }
}

console.log(`\n✅ Applied ${fixedCount} fixes`);

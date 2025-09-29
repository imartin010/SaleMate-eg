#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const fixes = [
  // ImprovedProjectCard remaining vars
  ['src/components/projects/ImprovedProjectCard.tsx', /  const handleReceiptUpload = async[^}]+\};\n\n/g, ''],
  ['src/components/projects/ImprovedProjectCard.tsx', /  const handleConfirmPayment = async[^}]+\};\n\n/g, ''],
  ['src/components/projects/ImprovedProjectCard.tsx', /        const \{ data: \{ publicUrl \} \} =/g, '        const { data: { } } ='],
  ['src/components/projects/ImprovedProjectCard.tsx', /  const canPurchase = currentAvailableLeads >= quantity[^;]+;\n/g, ''],
  // ProjectCard
  ['src/components/projects/ProjectCard.tsx', /import \{ useOrderStore \}[^;]+;\n/g, ''],
  ['src/components/projects/ProjectCard.tsx', /, PaymentMethod/g, ''],
  // developmentStorage
  ['src/lib/developmentStorage.ts', /, projectDetails: any/g, ''],
  ['src/lib/developmentStorage.ts', /  const randomPhone = `\+201[^;]+;\n/g, ''],
  // payments  
  ['src/lib/payments.ts', /interface CreatePaymentIntentParams \{[^}]+\}\n\n/g, ''],
  // supabaseAdminClient
  ['src/lib/supabaseAdminClient.ts', /const \{ data: _rpcData, error: _rpcErr \}/g, 'const { data: _rpcData, error }'],
  // main-fixed
  ['src/main-fixed.tsx', /import \{ AppLayout \}[^;]+;\nimport \{ ThemeProvider \}[^;]+;\n/g, ''],
  // main-working
  ['src/main-working.tsx', /, index/g, ''],
  // Admin pages
  ['src/pages/Admin/PurchaseRequestsManager.tsx', /  DollarSign,/g, ''],
  ['src/pages/Admin/PurchaseRequestsManager.tsx', /  const user = useAuthStore[^;]+;\n/g, ''],
  // CRM pages
  ['src/pages/Auth/ResetPassword.tsx', /import \{ useNavigate \}[^;]+;\n/g, ''],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /  CheckCircle,/g, ''],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /  Activity,/g, ''],
  ['src/pages/CRM/EnhancedMyLeads.tsx', /  Star,/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /import \{ Card \}[^;]+;\n/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /  Activity,/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /  Star,/g, ''],
  ['src/pages/CRM/WebsiteStyleCRM.tsx', /  BarChart3,/g, ''],
  // Checkout
  ['src/pages/Checkout/Checkout.tsx', /import React, \{ useState, useEffect \}/g, 'import React, { useState }'],
  ['src/pages/Checkout/Checkout.tsx', /import \{ Badge \}[^;]+;\n/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /  MapPin,/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /  Mail,/g, ''],
  ['src/pages/Checkout/Checkout.tsx', /  Globe,/g, ''],
  // Deals
  ['src/pages/Deals/FastMyDeals.tsx', /  Phone,/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /  Mail,/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /  Filter,/g, ''],
  ['src/pages/Deals/FastMyDeals.tsx', /  TrendingUp,/g, ''],
  // Shop
  ['src/pages/Shop/Shop.tsx', /    const \{ data \} = await supabase/g, '    const { } = await supabase'],
  ['src/pages/Shop/Shop.tsx', /      const \[_rpcError, _rpcResult\] = await/g, '      const [, _rpcResult] = await'],
  ['src/pages/Shop/Shop.tsx', /      const \{ data \} = await supabase/g, '      const { } = await supabase'],
  // Store
  ['src/store/leads.ts', /        const updatedLead = \{[^}]+\};\n/g, ''],
  ['src/store/leads.ts', /        const \{ data \} = await supabase/g, '        const { } = await supabase'],
  ['src/store/projects.ts', /        const updatedProject = \{[^}]+\};\n/g, ''],
  // Leads
  ['src/components/leads/LeadRequestDialog.tsx', /      const \{ data \} = await supabase/g, '      const { } = await supabase'],
  // Marketing
  ['src/pages/marketing/components/Testimonials.tsx', /, index/g, ''],
  ['src/pages/marketing/components/ValueGrid.tsx', /, index/g, ''],
  ['src/pages/marketing/components/ValueGridArabic.tsx', /, index/g, ''],
  // Support
  ['src/pages/Support/SupportPanel.tsx', /, Ban/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, UserMinus/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, Trash2/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, TrendingUp/g, ''],
  ['src/pages/Support/SupportPanel.tsx', /, UserX/g, ''],
  // Team
  ['src/pages/Team/TeamPage.tsx', /  Plus,/g, ''],
  ['src/pages/Team/TeamPage.tsx', /  MoreVertical,/g, ''],
  ['src/pages/Team/TeamPage.tsx', /  Sparkles,/g, ''],
  // TempLanding
  ['src/pages/TempLanding/TempLanding.tsx', /  Building2,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  TrendingUp,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  ArrowRight,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  Target,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  Globe,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  Award,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  BarChart3,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  MessageCircle,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  Mail,/g, ''],
  ['src/pages/TempLanding/TempLanding.tsx', /  Filter,/g, ''],
  // Supabase functions
  ['supabase/functions/assign_leads/index.ts', /        const \{ result, error \} = await/g, '        const { error } = await'],
  ['supabase/functions/auth-otp/index.ts', /        const profileData = await/g, '        await'],
  ['supabase/functions/upload-deal-files/index.ts', /        const uploadData = supabase/g, '        supabase'],
  // Services
  ['src/services/paymentService.ts', /, request/g, ''],
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
    // Skip silently
  }
}

console.log(`\n✅ Applied ${fixedCount} fixes`);

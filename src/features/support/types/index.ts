// Support Ticket Topics and Issues

export const SUPPORT_TOPICS = {
  ACCOUNT_LOGIN: 'Account & Login Issues',
  PAYMENT_BILLING: 'Payment & Billing',
  LEADS_DATA: 'Leads Issues',
  SHOP: 'Shop (Buying Leads)',
  CRM: 'CRM Dashboard Issues',
  SYSTEM_TECHNICAL: 'System & Technical Issues',
  OTHER: 'Other / General Requests',
} as const;

export type SupportTopic = typeof SUPPORT_TOPICS[keyof typeof SUPPORT_TOPICS];

export interface SupportIssuesByTopic {
  [key: string]: string[];
}

export const SUPPORT_ISSUES: SupportIssuesByTopic = {
  'Account & Login Issues': [
    "Didn't receive verification email or OTP",
    'Profile information incorrect or not updating',
  ],
  'Payment & Billing': [
    'Payment failed / declined',
    'Payment deducted but not reflected',
    'Problem with checkout',
    'Need an invoice',
    'Payment succeeded but leads not delivered',
  ],
  'Leads Issues': [
    "Didn't receive my purchased leads",
    'Received duplicate or invalid leads',
    'Wrong leads assigned to my account',
    'Lead details incomplete or missing',
    'My leads disappeared from dashboard',
    'Problem downloading my leads in Excel file',
    'Leads quality / invalid phone numbers',
    'Leads not matching the selected project or platform',
  ],
  'Shop (Buying Leads)': [
    'Unable to select project or quantity',
    'Total price not updating correctly',
    'Button "Buy Now" not working',
    'Payment not redirecting after checkout',
    "Didn't get confirmation after purchase",
  ],
  'CRM Dashboard Issues': [
    'My Leads table not loading',
    'Filters or search not working',
    'Unable to update Lead Stage or Feedback',
    'Wrong numbers shown in lead counter',
    "CRM showing someone else's leads (access issue)",
    'Error while adding a new lead manually',
    'Dashboard analytics not refreshing',
  ],
  'System & Technical Issues': [
    'Page not loading / white screen',
    'Buttons or links not responding',
    'Slow performance or freezing',
    'Error messages appearing randomly',
    'Problem switching between tabs',
  ],
  'Other / General Requests': [
    'Suggestion for improvement',
    'Reporting a bug or error',
    'Need help understanding a feature',
    'Want to contact the Sale Mate team',
  ],
};

// Get issues for a specific topic
export const getIssuesForTopic = (topic: string): string[] => {
  return SUPPORT_ISSUES[topic] || [];
};

// Get all topic names as array
export const getAllTopics = (): string[] => {
  return Object.values(SUPPORT_TOPICS);
};

// Get topic icon name (Lucide icon name)
export const getTopicIcon = (topic: string): string => {
  const icons: { [key: string]: string } = {
    'Account & Login Issues': 'UserCircle',
    'Payment & Billing': 'CreditCard',
    'Leads Issues': 'Users',
    'Shop (Buying Leads)': 'ShoppingCart',
    'CRM Dashboard Issues': 'LayoutDashboard',
    'System & Technical Issues': 'Settings',
    'Other / General Requests': 'MessageSquare',
  };
  return icons[topic] || 'HelpCircle';
};

// Get topic color for badges
export const getTopicColor = (topic: string): string => {
  const colors: { [key: string]: string } = {
    'Account & Login Issues': 'bg-purple-100 text-purple-800 border-purple-200',
    'Payment & Billing': 'bg-green-100 text-green-800 border-green-200',
    'Leads Issues': 'bg-blue-100 text-blue-800 border-blue-200',
    'Shop (Buying Leads)': 'bg-orange-100 text-orange-800 border-orange-200',
    'CRM Dashboard Issues': 'bg-pink-100 text-pink-800 border-pink-200',
    'System & Technical Issues': 'bg-red-100 text-red-800 border-red-200',
    'Other / General Requests': 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[topic] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Get issue icon (Lucide icon name)
export const getIssueIcon = (issue: string): string => {
  const icons: { [key: string]: string } = {
    // Account & Login Issues
    "Didn't receive verification email or OTP": 'Mail',
    'Profile information incorrect or not updating': 'UserX',
    
    // Payment & Billing
    'Payment failed / declined': 'XCircle',
    'Payment deducted but not reflected': 'AlertTriangle',
    'Problem with checkout': 'ShoppingBag',
    'Need an invoice': 'FileText',
    'Payment succeeded but leads not delivered': 'PackageX',
    
    // Leads Issues
    "Didn't receive my purchased leads": 'Inbox',
    'Received duplicate or invalid leads': 'Copy',
    'Wrong leads assigned to my account': 'UserX',
    'Lead details incomplete or missing': 'FileQuestion',
    'My leads disappeared from dashboard': 'EyeOff',
    'Problem downloading my leads in Excel file': 'Download',
    'Leads quality / invalid phone numbers': 'PhoneOff',
    'Leads not matching the selected project or platform': 'Target',
    
    // Shop (Buying Leads)
    'Unable to select project or quantity': 'MousePointerClick',
    'Total price not updating correctly': 'Calculator',
    'Button "Buy Now" not working': 'MousePointer',
    'Payment not redirecting after checkout': 'ArrowRight',
    "Didn't get confirmation after purchase": 'MailQuestion',
    
    // CRM Dashboard Issues
    'My Leads table not loading': 'TableProperties',
    'Filters or search not working': 'SearchX',
    'Unable to update Lead Stage or Feedback': 'Edit',
    'Wrong numbers shown in lead counter': 'Hash',
    "CRM showing someone else's leads (access issue)": 'Lock',
    'Error while adding a new lead manually': 'UserPlus',
    'Dashboard analytics not refreshing': 'RefreshCw',
    
    // System & Technical Issues
    'Page not loading / white screen': 'MonitorX',
    'Buttons or links not responding': 'Ban',
    'Slow performance or freezing': 'Hourglass',
    'Error messages appearing randomly': 'Bug',
    'Problem switching between tabs': 'Tabs',
    
    // Other / General Requests
    'Suggestion for improvement': 'Lightbulb',
    'Reporting a bug or error': 'Bug',
    'Need help understanding a feature': 'Info',
    'Want to contact the Sale Mate team': 'MessageCircle',
  };
  return icons[issue] || 'Circle';
};


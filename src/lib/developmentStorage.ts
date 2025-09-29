// Development mode storage for tracking purchases and leads
// This simulates what would happen in production with a real database

export interface DevLead {
  id: string;
  projectId: string;
  projectName: string;
  buyerUserId: string;
  clientName: string;
  clientPhone: string;
  clientPhone2?: string;
  clientPhone3?: string;
  clientEmail: string;
  clientJobTitle?: string;
  platform: 'Facebook' | 'Google' | 'TikTok' | 'Other';
  stage: 'New Lead' | 'Potential' | 'Hot Case' | 'Meeting Done' | 'No Answer' | 'Call Back' | 'Whatsapp' | 'Wrong Number' | 'Non Potential';
  feedback?: string;
  createdAt: string;
}

export interface DevPurchase {
  id: string;
  userId: string;
  projectId: string;
  quantity: number;
  purchaseDate: string;
}

// Generate random Egyptian names
const egyptianNames = [
  'Ahmed Mohamed', 'Mohamed Ahmed', 'Mahmoud Hassan', 'Hassan Ali', 'Ali Mohamed',
  'Sarah Hassan', 'Fatma Ahmed', 'Nour Mohamed', 'Yasmin Ali', 'Mona Hassan',
  'Omar Khaled', 'Khaled Omar', 'Amr Tarek', 'Tarek Amr', 'Mostafa Ibrahim',
  'Aya Mohamed', 'Dina Hassan', 'Rania Ali', 'Heba Ahmed', 'Mariam Omar'
];

const platforms: DevLead['platform'][] = ['Facebook', 'Google', 'TikTok', 'Other'];
const stages: DevLead['stage'][] = ['New Lead', 'Potential', 'Hot Case'];

// Generate a random lead with realistic project-specific details
function generateRandomLead(projectId: string, projectName: string, buyerUserId: string): DevLead {
  const randomName = egyptianNames[Math.floor(Math.random() * egyptianNames.length)];
  const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
  const randomStage = stages[Math.floor(Math.random() * stages.length)];
  const randomEmail = `${randomName.toLowerCase().replace(' ', '.')}@gmail.com`;

  // Add some variation to make leads more realistic
  const phoneVariations = [
    `+2010${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    `+2011${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    `+2012${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    `+2015${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
  ];
  
  const selectedPhone = phoneVariations[Math.floor(Math.random() * phoneVariations.length)];
  
  // Generate additional phone numbers (30% chance for phone2, 15% chance for phone3)
  const clientPhone2 = Math.random() < 0.3 ? phoneVariations[Math.floor(Math.random() * phoneVariations.length)] : undefined;
  const clientPhone3 = Math.random() < 0.15 ? phoneVariations[Math.floor(Math.random() * phoneVariations.length)] : undefined;

  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    projectName,
    buyerUserId,
    clientName: randomName,
    clientPhone: selectedPhone,
    clientPhone2,
    clientPhone3,
    clientEmail: randomEmail,
    clientJobTitle: Math.random() < 0.7 ? getRandomJobTitle() : undefined,
    platform: randomPlatform,
    stage: randomStage,
    feedback: randomStage === 'Hot Case' ? 'Very interested in the project' : undefined,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString() // Random time in last 24 hours
  };
}

// Generate realistic job titles for Egyptian market
function getRandomJobTitle(): string {
  const jobTitles = [
    'Engineer', 'Doctor', 'Teacher', 'Accountant', 'Manager', 'Consultant',
    'Lawyer', 'Pharmacist', 'Architect', 'Business Owner', 'Sales Manager',
    'Marketing Manager', 'Financial Analyst', 'Project Manager', 'Dentist'
  ];
  return jobTitles[Math.floor(Math.random() * jobTitles.length)];
}

// Add purchased leads to localStorage
export function addPurchasedLeads(userId: string, projectId: string, projectName: string, quantity: number): DevLead[] {
  const newLeads: DevLead[] = [];
  
  // Generate the specified number of leads
  for (let i = 0; i < quantity; i++) {
    newLeads.push(generateRandomLead(projectId, projectName, userId));
  }

  // Get existing leads
  const existingLeads = getDevLeads(userId);
  const allLeads = [...existingLeads, ...newLeads];

  // Save to localStorage
  localStorage.setItem(`dev-leads-${userId}`, JSON.stringify(allLeads));

  // Track the purchase
  const purchase: DevPurchase = {
    id: `purchase-${Date.now()}`,
    userId,
    projectId,
    quantity,
    purchaseDate: new Date().toISOString()
  };

  const existingPurchases = getDevPurchases(userId);
  localStorage.setItem(`dev-purchases-${userId}`, JSON.stringify([...existingPurchases, purchase]));

  console.log(`✅ Added ${quantity} leads for user ${userId}:`, newLeads);
  return newLeads;
}

// Get user's leads from localStorage
export function getDevLeads(userId: string): DevLead[] {
  const stored = localStorage.getItem(`dev-leads-${userId}`);
  return stored ? JSON.parse(stored) : [];
}

// Get user's purchases from localStorage
export function getDevPurchases(userId: string): DevPurchase[] {
  const stored = localStorage.getItem(`dev-purchases-${userId}`);
  return stored ? JSON.parse(stored) : [];
}

// Get total purchased leads for a project
export function getTotalPurchasedLeads(userId: string, projectId: string): number {
  const purchases = getDevPurchases(userId);
  return purchases
    .filter(p => p.projectId === projectId)
    .reduce((total, p) => total + p.quantity, 0);
}

// Clear all development data (for testing)
export function clearDevData(userId: string) {
  localStorage.removeItem(`dev-leads-${userId}`);
  localStorage.removeItem(`dev-purchases-${userId}`);
  console.log(`🗑️ Cleared development data for user ${userId}`);
}

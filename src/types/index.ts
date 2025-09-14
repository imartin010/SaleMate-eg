export type UserRole = 'admin' | 'manager' | 'support' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  managerId?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  developer: string;
  region: string;
  availableLeads: number;
  description?: string;
  createdAt?: string;
  pricePerLead?: number; // CPL - Cost Per Lead
  coverImage?: string | null;
}

export type Platform = 'Facebook' | 'Google' | 'TikTok' | 'Other';
export type LeadStage = 'New Lead' | 'Potential' | 'Hot Case' | 'Meeting Done' | 'No Answer' | 'Call Back' | 'Whatsapp' | 'Wrong Number' | 'Non Potential';

export interface Lead {
  id: string;
  projectId: string;
  buyerUserId?: string;
  assignedToId?: string;
  clientName: string;
  clientPhone: string;
  clientPhone2?: string;
  clientPhone3?: string;
  clientEmail?: string;
  clientJobTitle?: string;
  platform: Platform;
  stage: LeadStage;
  feedback?: string;
  source?: string;
  batchId?: string;
  uploadUserId?: string;
  isSold?: boolean;
  soldAt?: string;
  cplPrice?: number;
  createdAt: string;
}

export type PaymentMethod = 'Instapay' | 'VodafoneCash' | 'BankTransfer';
export type OrderStatus = 'pending' | 'confirmed' | 'failed';

export interface Order {
  id: string;
  userId: string;
  projectId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  totalAmount?: number;
  createdAt: string;
}



export type SupportCaseStatus = 'open' | 'in_progress' | 'resolved';

export interface SupportCase {
  id: string;
  createdBy: string;
  assignedTo?: string;
  subject: string;
  description: string;
  status: SupportCaseStatus;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  commissionRate: number;
  logo?: string;
  website?: string;
}

export interface LeadFilters {
  projectId?: string;
  platform?: Platform;
  stage?: LeadStage;
  search?: string;
}

export interface PurchaseRequest {
  projectId: string;
  quantity: number;
  paymentMethod: PaymentMethod;
}

// Auth related types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// Enhanced Features Types

// Developer entity (separate from project)
export interface Developer {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
}

// Enhanced Project with developer relationship
export interface EnhancedProject extends Project {
  developerId?: string;
  developer?: Developer;
}

// Lead Batch for bulk upload
export interface LeadBatch {
  id: string;
  projectId: string;
  uploadUserId: string;
  batchName: string;
  totalLeads: number;
  successfulLeads: number;
  failedLeads: number;
  cplPrice: number;
  fileName?: string;
  fileUrl?: string;
  status: 'processing' | 'completed' | 'failed';
  errorDetails?: any;
  createdAt: string;
  updatedAt: string;
}

// Lead Purchase Request
export type PurchaseRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeadPurchaseRequest {
  id: string;
  buyerUserId: string;
  projectId: string;
  numberOfLeads: number;
  cplPrice: number;
  totalPrice: number;
  receiptFileUrl?: string;
  receiptFileName?: string;
  status: PurchaseRequestStatus;
  adminUserId?: string;
  adminNotes?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  buyer?: User;
  admin?: User;
  project?: Project;
}

// Lead Sale (tracking sold leads)
export interface LeadSale {
  id: string;
  purchaseRequestId: string;
  leadId: string;
  salePrice: number;
  soldAt: string;
  createdAt: string;
}

// Enhanced Partner with full details
export interface EnhancedPartner {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project Partner Commission
export interface ProjectPartnerCommission {
  id: string;
  projectId: string;
  partnerId: string;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  project?: Project;
  partner?: EnhancedPartner;
}

// Marketplace Project (for shop listing)
export interface MarketplaceProject {
  projectId: string;
  projectName: string;
  developerName: string;
  region: string;
  availableLeads: number;
  minCplPrice: number;
  maxCplPrice: number;
  avgCplPrice: number;
  description?: string;
}

// Project with Commission Info (for partners page)
export interface ProjectCommission {
  projectId: string;
  projectName: string;
  developerName: string;
  partners: Array<{
    partnerId: string;
    partnerName: string;
    commissionRate: number;
  }>;
}

// Bulk Upload Request
export interface BulkUploadRequest {
  projectId: string;
  cplPrice: number;
  batchName: string;
  csvData: string;
}

// Bulk Upload Response
export interface BulkUploadResponse {
  success: boolean;
  batchId: string;
  totalProcessed: number;
  successful: number;
  failed: number;
  errors?: string[];
  message: string;
}

// Purchase Request Creation
export interface CreatePurchaseRequest {
  projectId: string;
  numberOfLeads: number;
  receiptFileUrl?: string;
  receiptFileName?: string;
}

// Admin Purchase Request with Relations
export interface AdminPurchaseRequest extends LeadPurchaseRequest {
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  project: {
    id: string;
    name: string;
    developer: string;
    region: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

// BRData Properties - Real Estate Inventory
export interface BRDataProperty {
  id: string;
  unit_id?: string;
  original_unit_id?: string;
  sale_type?: string;
  unit_number?: string;
  unit_area?: number;
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  ready_by?: string;
  finishing?: string;
  garden_area?: number;
  roof_area?: number;
  floor_number?: number;
  building_number?: string;
  price_in_egp?: number;
  price_per_meter?: number;
  last_inventory_update?: string;
  image?: string;
  offers?: string;
  is_launch?: boolean;
  payment_plans?: string; // JSON string
  currency?: string;
  created_at: string;
  updated_at: string;
  
  // JSON fields
  compound?: {
    id?: string;
    name?: string;
  };
  area?: {
    id?: string;
    name?: string;
  };
  developer?: {
    id?: string;
    name?: string;
  };
  phase?: {
    id?: string;
    name?: string;
  };
  property_type?: {
    id?: string;
    name?: string;
  };
}

// Filters for BRData Properties
export interface BRDataPropertyFilters {
  search?: string;
  compound?: string;
  area?: string;
  developer?: string;
  property_type?: string;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  min_price_per_meter?: number;
  max_price_per_meter?: number;
  finishing?: string;
  sale_type?: string;
  is_launch?: boolean;
  floor_number?: number;
  unit_number?: string;
  building_number?: string;
  ready_by?: number;
}

// Sort options for BRData Properties
export type BRDataPropertySortField = 
  | 'price_in_egp' 
  | 'unit_area' 
  | 'number_of_bedrooms' 
  | 'number_of_bathrooms' 
  | 'price_per_meter'
  | 'floor_number'
  | 'unit_id'
  | 'ready_by' 
  | 'created_at';

export interface BRDataPropertySort {
  field: BRDataPropertySortField;
  direction: 'asc' | 'desc';
}



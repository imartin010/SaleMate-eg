/**
 * Enums and Constants
 * 
 * Type definitions for enums and constant values
 * 
 * @module shared/types/enums
 */

export type Platform = 'Facebook' | 'Google' | 'TikTok' | 'WhatsApp' | 'Website' | 'Other';

export type LeadStage = 
  | 'new_lead'
  | 'contacted' 
  | 'potential' 
  | 'low_budget'
  | 'meeting_scheduled' 
  | 'closed_deal'
  | 'no_response' 
  | 'not_interested'
  | 'future_follow_up';

export type PaymentMethod = 'card' | 'instapay' | 'bank_transfer' | 'vodafone_cash';

export type OrderStatus = 'pending' | 'confirmed' | 'failed';

export type PurchaseRequestStatus = 'pending' | 'approved' | 'rejected';

export type SupportCaseStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type SupportCasePriority = 'low' | 'medium' | 'high' | 'urgent';

export type UserRole = 'admin' | 'manager' | 'support' | 'user';

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


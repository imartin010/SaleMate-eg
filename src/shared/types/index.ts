/**
 * Shared Types
 * 
 * Central export for all shared TypeScript types
 * 
 * @module shared/types
 */

// Database types (generated from Supabase)
export type { Database, Json } from './database';

// Domain entities
export type {
  Profile,
  Lead,
  Project,
  User,
  UserRole,
  Partner,
  Developer,
  BRDataProperty,
} from './entities';

// Enums
export type {
  Platform,
  LeadStage,
  PaymentMethod,
  OrderStatus,
  PurchaseRequestStatus,
  SupportCaseStatus,
  SupportCasePriority,
  BRDataPropertySortField,
} from './enums';


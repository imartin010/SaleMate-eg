/**
 * Domain Entities
 * 
 * Core business entity types used across the application
 * 
 * @module shared/types/entities
 */

import type { Database } from './database';

// Re-export commonly used database types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];

// Legacy types for backward compatibility
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

export interface Partner {
  id: string;
  name: string;
  description: string;
  commissionRate: number;
  logo?: string;
  website?: string;
}

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
  payment_plans?: string;
  currency?: string;
  created_at: string;
  updated_at: string;
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


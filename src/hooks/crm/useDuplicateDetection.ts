import { useMemo } from 'react';
import { Lead } from './useLeads';

/**
 * Normalizes phone numbers for comparison (removes spaces, dashes, country codes, etc.)
 */
function normalizePhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Remove all whitespace, dashes, parentheses, dots
  let normalized = phone
    .replace(/\s+/g, '')
    .replace(/-/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\./g, '');
  
  // Remove common country code prefixes
  // Egypt: +20, 0020, 20
  // Remove +20 or 0020 at the start
  normalized = normalized.replace(/^\+20/, '').replace(/^0020/, '');
  
  // If it starts with 20 and has more than 10 digits, it's likely a country code
  if (normalized.startsWith('20') && normalized.length > 10) {
    normalized = normalized.substring(2);
  }
  
  // Remove leading zero if present (Egyptian mobile numbers)
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }
  
  // Remove any remaining + signs
  normalized = normalized.replace(/\+/g, '');
  
  // Remove any non-digit characters (except for safety)
  normalized = normalized.replace(/\D/g, '');
  
  return normalized;
}

/**
 * Gets all phone numbers from a lead (primary, secondary, tertiary)
 */
function getAllPhones(lead: Lead): string[] {
  const phones: string[] = [];
  const phone1 = normalizePhone(lead.client_phone);
  const phone2 = normalizePhone(lead.client_phone2);
  const phone3 = normalizePhone(lead.client_phone3);
  
  // Only add non-empty normalized phone numbers
  if (phone1 && phone1.length > 0) phones.push(phone1);
  if (phone2 && phone2.length > 0) phones.push(phone2);
  if (phone3 && phone3.length > 0) phones.push(phone3);
  
  return phones;
}

/**
 * Checks if two leads are duplicates based on phone number only
 */
function areLeadsDuplicates(lead1: Lead, lead2: Lead): boolean {
  const phones1 = getAllPhones(lead1);
  const phones2 = getAllPhones(lead2);
  
  // If either lead has no phone numbers, they can't be duplicates
  if (phones1.length === 0 || phones2.length === 0) return false;
  
  // Check if any phone number from lead1 matches any phone number from lead2
  for (const phone1 of phones1) {
    for (const phone2 of phones2) {
      if (phone1 === phone2) return true;
    }
  }
  
  return false;
}

export interface DuplicateGroup {
  leadIds: string[];
  count: number;
}

/**
 * Hook to detect duplicate leads and group them
 */
export function useDuplicateDetection(leads: Lead[]) {
  const duplicateMap = useMemo(() => {
    const map = new Map<string, string[]>(); // leadId -> array of duplicate lead IDs
    const processed = new Set<string>();

    // Debug: log total leads (only in development)
    if (import.meta.env.DEV) {
      console.log('[Duplicate Detection] Processing', leads.length, 'leads');
    }

    for (let i = 0; i < leads.length; i++) {
      const lead1 = leads[i];
      if (processed.has(lead1.id)) continue;

      const duplicates: string[] = [lead1.id];
      const lead1Phones = getAllPhones(lead1);
      
      // Skip if lead has no phone numbers
      if (lead1Phones.length === 0) continue;

      for (let j = i + 1; j < leads.length; j++) {
        const lead2 = leads[j];
        if (processed.has(lead2.id)) continue;

        if (areLeadsDuplicates(lead1, lead2)) {
          duplicates.push(lead2.id);
          processed.add(lead2.id);
          if (import.meta.env.DEV) {
            console.log('[Duplicate Detection] Found duplicate:', lead1.client_name, 'and', lead2.client_name);
          }
        }
      }

      if (duplicates.length > 1) {
        // Only add to map if there are actual duplicates
        duplicates.forEach(id => {
          map.set(id, duplicates.filter(did => did !== id)); // Store other duplicates for each lead
        });
        processed.add(lead1.id);
      }
    }

    if (import.meta.env.DEV) {
      console.log('[Duplicate Detection] Found', map.size, 'duplicate leads');
    }
    return map;
  }, [leads]);

  /**
   * Check if a lead is a duplicate
   */
  const isDuplicate = (leadId: string): boolean => {
    return duplicateMap.has(leadId);
  };

  /**
   * Get all duplicate lead IDs for a given lead
   */
  const getDuplicates = (leadId: string): string[] => {
    return duplicateMap.get(leadId) || [];
  };

  /**
   * Get all duplicate leads (including the original) for a given lead
   */
  const getAllDuplicates = (leadId: string): Lead[] => {
    const duplicateIds = getDuplicates(leadId);
    if (duplicateIds.length === 0) return [];

    const allIds = [leadId, ...duplicateIds];
    return leads.filter(lead => allIds.includes(lead.id));
  };

  return {
    isDuplicate,
    getDuplicates,
    getAllDuplicates,
    duplicateCount: duplicateMap.size,
  };
}


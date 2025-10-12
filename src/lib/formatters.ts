/**
 * Utility functions for formatting and extracting data
 */

/**
 * Extracts the name from a value that might be a string or an object with a name property
 * Handles cases where database returns {'id': 1357, 'name': 'Central Park - Aliva'}
 * @param value - The value to extract the name from
 * @returns The extracted name string
 */
export function extractName(value: any): string {
  if (!value) return '';
  
  // If it's already a string, return it
  if (typeof value === 'string') return value;
  
  // If it's an object with a 'name' property, extract it
  if (typeof value === 'object' && value !== null) {
    if ('name' in value) {
      // Recursively extract if name is also an object
      return extractName(value.name);
    }
    // Fallback: try to stringify the object
    return String(value);
  }
  
  // Fallback: convert to string
  return String(value);
}

/**
 * Formats phone numbers for display
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format based on length
  if (digits.length === 11 && digits.startsWith('0')) {
    // Egyptian format: 01234567890 -> 0123 456 7890
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  // Return as-is if doesn't match expected format
  return phone;
}

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Formats currency in Egyptian Pounds
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatEGP(amount: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats large numbers with K/M suffixes
 * @param num - The number to format
 * @returns Formatted number string (e.g., 1.5K, 2.3M)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}


/**
 * Subdomain detection utility
 * Detects the current subdomain from the window location
 */

export function getSubdomain(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname;
  
  // Debug logging (only in dev or if explicitly enabled)
  if (import.meta.env.DEV || localStorage.getItem('debug-subdomain') === 'true') {
    console.log('🔍 Subdomain detection - hostname:', hostname);
  }
  
  // Handle localhost for development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Check if there's a subdomain in the URL (e.g., performance.localhost:5173)
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0];
    }
    // For localhost, check localStorage or URL params for testing
    const testSubdomain = localStorage.getItem('test-subdomain');
    if (testSubdomain) {
      return testSubdomain;
    }
    return null;
  }

  // Parse subdomain from hostname
  const parts = hostname.split('.');
  
  // For salemate-eg.com domain structure
  // performance.salemate-eg.com -> ['performance', 'salemate-eg', 'com']
  // www.salemate-eg.com -> ['www', 'salemate-eg', 'com']
  // salemate-eg.com -> ['salemate-eg', 'com']
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Ignore 'www' subdomain
    if (subdomain !== 'www' && subdomain !== 'www2') {
      if (import.meta.env.DEV || localStorage.getItem('debug-subdomain') === 'true') {
        console.log('✅ Detected subdomain:', subdomain);
      }
      return subdomain;
    }
  }

  if (import.meta.env.DEV || localStorage.getItem('debug-subdomain') === 'true') {
    console.log('ℹ️ No subdomain detected (main domain)');
  }
  
  return null;
}

export function isPerformanceSubdomain(): boolean {
  const subdomain = getSubdomain();
  return subdomain === 'performance';
}

export function isMainDomain(): boolean {
  const subdomain = getSubdomain();
  return subdomain === null || subdomain === 'www';
}


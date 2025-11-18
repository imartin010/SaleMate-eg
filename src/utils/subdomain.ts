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
  
  // Check localStorage override first (for testing)
  const testSubdomain = localStorage.getItem('test-subdomain');
  if (testSubdomain) {
    if (import.meta.env.DEV || localStorage.getItem('debug-subdomain') === 'true') {
      console.log('✅ Using test subdomain from localStorage:', testSubdomain);
    }
    return testSubdomain;
  }
  
  // Handle localhost variations
  // performance.localhost -> ['performance', 'localhost']
  // localhost -> ['localhost']
  if (hostname.endsWith('localhost') || hostname === '127.0.0.1') {
    const parts = hostname.split('.');
    // If we have subdomain.localhost pattern (2 parts)
    if (parts.length === 2 && parts[1] === 'localhost' && parts[0] !== 'www') {
      if (import.meta.env.DEV || localStorage.getItem('debug-subdomain') === 'true') {
        console.log('✅ Detected localhost subdomain:', parts[0]);
      }
      return parts[0];
    }
    // Just localhost, no subdomain
    return null;
  }

  // Parse subdomain from hostname (production)
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


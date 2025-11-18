# Subdomain Setup Guide

## Overview

This guide explains how the subdomain routing is configured for the Salemate platform, specifically for the `performance.salemate-eg.com` subdomain.

## Architecture

The subdomain routing is handled **client-side** using a subdomain detection utility. This approach allows:

- Single codebase deployment
- Dynamic routing based on the current subdomain
- Easy addition of new subdomains in the future

## How It Works

### 1. Subdomain Detection

The `src/utils/subdomain.ts` utility detects the current subdomain from `window.location.hostname`:

- **Production**: Parses `performance.salemate-eg.com` → detects `performance`
- **Development**: Supports localhost testing via localStorage or URL structure

### 2. Router Selection

In `src/main.tsx`, the application conditionally loads different routers:

- **Main domain** (`salemate-eg.com`): Uses the main `router` with full app features
- **Performance subdomain** (`performance.salemate-eg.com`): Uses `performanceRouter` with minimal providers

### 3. Performance Router

The performance router (`src/app/routes/performanceRoutes.tsx`) is a separate routing configuration specifically for the performance subdomain. It currently includes:

- Home page at `/`
- Minimal error boundaries and loading states

## File Structure

```
src/
├── utils/
│   └── subdomain.ts              # Subdomain detection utility
├── app/
│   └── routes/
│       ├── routes.tsx            # Main app router
│       └── performanceRoutes.tsx # Performance subdomain router
├── pages/
│   └── Performance/
│       └── PerformanceHome.tsx   # Performance program home page
└── main.tsx                      # Entry point with router selection
```

## Vercel Configuration

### Required Steps

1. **Add Subdomain in Vercel Dashboard**:
   - Go to your project settings
   - Navigate to **Domains**
   - Add `performance.salemate-eg.com`
   - Verify DNS configuration

2. **DNS Configuration**:
   - Add a CNAME record pointing `performance.salemate-eg.com` to your Vercel deployment
   - Or use Vercel's automatic DNS configuration

3. **Deployment**:
   - The same build serves both domains
   - Client-side routing handles subdomain detection

### Current Vercel Config

The `vercel.json` file includes a catch-all rewrite that works for all subdomains:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Development Testing

### Local Testing

To test the performance subdomain locally:

1. **Option 1: Use localStorage** (Recommended for development)
   ```javascript
   // In browser console
   localStorage.setItem('test-subdomain', 'performance');
   // Reload the page
   ```

2. **Option 2: Modify hosts file** (Advanced)
   - Add to `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
     ```
     127.0.0.1 performance.localhost
     ```
   - Access via `http://performance.localhost:5173`

3. **Option 3: Use Vite proxy configuration** (Future enhancement)

## Adding New Subdomains

To add a new subdomain program:

1. **Create subdomain utility function**:
   ```typescript
   // In src/utils/subdomain.ts
   export function isNewSubdomain(): boolean {
     return getSubdomain() === 'newsubdomain';
   }
   ```

2. **Create new router**:
   ```typescript
   // src/app/routes/newSubdomainRoutes.tsx
   export const newSubdomainRouter = createBrowserRouter([...]);
   ```

3. **Update main.tsx**:
   ```typescript
   const activeRouter = isPerformanceSubdomain() 
     ? performanceRouter 
     : isNewSubdomain() 
     ? newSubdomainRouter 
     : router;
   ```

4. **Add subdomain in Vercel dashboard**

## Current Status

✅ **Completed**:
- Subdomain detection utility
- Performance router configuration
- Basic performance home page
- Main.tsx router selection logic
- Vercel configuration ready

⏳ **Pending**:
- Actual performance program features (to be implemented)
- DNS configuration in production
- Subdomain verification in Vercel

## Notes

- The performance subdomain currently uses minimal providers (no AuthProvider or WalletProvider) to keep it lightweight
- You can add these providers later if the performance program needs authentication
- All subdomain routing happens client-side, so the same build works for all domains


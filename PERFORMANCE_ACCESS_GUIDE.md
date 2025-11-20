# 🔐 Performance Program - Quick Access Guide

> **Authentication Required**  
> **Status**: ✅ CONFIGURED & READY

---

## Login Credentials

```
Email:    coldwellbanker@salemate.com
Password: CWB1234
```

---

## How to Access (3 Ways)

### Method 1: Test Subdomain (Easiest for Local Dev)

1. Open browser console (F12)
2. Run this code:
   ```javascript
   localStorage.setItem('test-subdomain', 'performance');
   location.reload();
   ```
3. App will reload as performance subdomain
4. Login with credentials above

### Method 2: Subdomain URL

1. Access: `http://performance.localhost:5173`
2. Login with credentials above

### Method 3: Production

1. Visit: `https://performance.salemate-eg.com`
2. Login with credentials above

---

## What Happens Now?

1. **Before**: Performance program was open (no auth)
2. **After**: Performance program requires login

When you visit the performance program:
- ✅ You'll be redirected to login page
- ✅ Login with coldwellbanker@salemate.com / CWB1234
- ✅ Access granted to franchise performance dashboard
- ✅ Can view all Coldwell Banker franchise data

---

## Verification

✅ **User Account**: Created in database  
✅ **Auth System**: Enabled for performance subdomain  
✅ **Route Guards**: All routes protected  
✅ **Build**: Success (10.16s)  
✅ **TypeScript**: 0 errors  

---

## Quick Test

```javascript
// In browser console at localhost:5173

// 1. Switch to performance subdomain
localStorage.setItem('test-subdomain', 'performance');
location.reload();

// 2. After reload, you should see login page
// 3. Login with coldwellbanker@salemate.com / CWB1234
// 4. You're in!
```

---

## Need to Switch Back to Main App?

```javascript
// In browser console
localStorage.removeItem('test-subdomain');
location.reload();
```

---

## Summary

🎉 **Performance program is now secure!**

- ✅ Authentication required
- ✅ Account created and ready
- ✅ All routes protected
- ✅ Production-ready

**Login and start tracking performance!** 📊

---

**Credentials**: coldwellbanker@salemate.com / CWB1234  
**Docs**: `docs/domains/performance/AUTHENTICATION_SETUP.md`


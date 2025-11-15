# Fix Kashier Secret Key with $ Character

## Problem
The secret key contains a `$` character, which has special meaning in shell/environment variables. This causes the system to truncate everything after the `$`.

**Full Secret Key:**
```
3af38a5ce34f829782f121a6e7f1a4e7$9d59ad8cde51a36290d5df3c60412857ca8bc754d7428f5bec40e3399eb6d5429f4b26fd224727352a1777d60d058d12
```

**What the system reads (truncated):**
```
3af38a5ce34f829782f121a6e7f1a4e7
```

## Solution: Escape the $ Character

### Option 1: Use Single Quotes (Recommended)

```bash
supabase secrets set KASHIER_SECRET_KEY='3af38a5ce34f829782f121a6e7f1a4e7$9d59ad8cde51a36290d5df3c60412857ca8bc754d7428f5bec40e3399eb6d5429f4b26fd224727352a1777d60d058d12'
```

### Option 2: Escape the $ with Backslash

```bash
supabase secrets set KASHIER_SECRET_KEY=3af38a5ce34f829782f121a6e7f1a4e7\$9d59ad8cde51a36290d5df3c60412857ca8bc754d7428f5bec40e3399eb6d5429f4b26fd224727352a1777d60d058d12
```

### Option 3: Use Double Backslash

```bash
supabase secrets set KASHIER_SECRET_KEY=3af38a5ce34f829782f121a6e7f1a4e7\\$9d59ad8cde51a36290d5df3c60412857ca8bc754d7428f5bec40e3399eb6d5429f4b26fd224727352a1777d60d058d12
```

## Steps to Fix

1. **Delete the old secret:**
   ```bash
   supabase secrets unset KASHIER_SECRET_KEY
   ```

2. **Set the new secret with proper escaping (use single quotes):**
   ```bash
   supabase secrets set KASHIER_SECRET_KEY='3af38a5ce34f829782f121a6e7f1a4e7$9d59ad8cde51a36290d5df3c60412857ca8bc754d7428f5bec40e3399eb6d5429f4b26fd224727352a1777d60d058d12'
   ```

3. **Verify it was set correctly:**
   ```bash
   supabase secrets list
   ```

4. **Also update in Vercel (for frontend):**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Edit `VITE_KASHIER_SECRET_KEY` if it exists
   - Make sure the full secret key is entered (Vercel's web interface handles special characters automatically)

## Important Notes

- **Always use single quotes** when setting secrets with special characters in the terminal
- Single quotes prevent shell interpretation of special characters like `$`, `!`, `*`, etc.
- The Supabase dashboard web interface handles this automatically, so you can also set it there directly

## After Fixing

Once the secret is properly set:
1. The Edge Function will use the FULL secret key
2. The hash calculation will be correct
3. The "Forbidden request" error should be resolved


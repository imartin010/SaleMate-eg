# 🧪 TEST NOW - Step-by-Step Guide

> Dev server is running on `http://localhost:5173`

---

## Test 1: CEO Dashboard (Ready Now!)

### Step 1: Open Browser
```
Go to: http://localhost:5173
```

### Step 2: Switch to Performance Subdomain
```javascript
// Open Browser Console (F12 or Cmd+Option+J)
// Copy and paste:
localStorage.setItem('test-subdomain', 'performance');
location.reload();
```

### Step 3: Login as CEO
```
Email: coldwellbanker@salemate.com
Password: CWB1234
```

### ✅ Expected Results:
- Auto-redirect to CEO Dashboard at `/dashboard`
- See "CEO View" badge in header
- See all 22 franchises in grid
- Blue & white Coldwell Banker colors
- Each franchise card shows:
  - Franchise name
  - Agent count
  - P&L amount
  - Performance per agent
- "Compare Franchises" button visible
- "Admin Panel" button at bottom

### Test CEO Features:
1. ✅ Click on any franchise card → Opens franchise details
2. ✅ Click "Compare Franchises" → Opens comparison modal
3. ✅ View aggregated metrics (total franchises, agents, revenue)
4. ✅ All data visible (no restrictions)

---

## Test 2: Franchise Employee (After Creating Accounts)

### Prerequisites:
Create franchise employee accounts via Supabase Dashboard (see `CREATE_FRANCHISE_ACCOUNTS_MANUAL.md`)

### Step 1: Logout
```javascript
// In console:
localStorage.clear();
location.reload();
```

### Step 2: Login as Franchise Employee
```
Email: meeting-point@coldwellbanker.com
Password: CWB2024
```

### ✅ Expected Results:
- Auto-redirect to `/franchise/meeting-point`
- See "Franchise Manager" badge in header
- See ONLY Meeting Point franchise data
- Cannot see other franchises
- All tabs functional:
  - Overview
  - P&L Statement
  - Transactions
  - Expenses
  - Settings

### Test Data Isolation:
1. ✅ Add 3 transactions
2. ✅ Add 2 expenses
3. ✅ Logout
4. ✅ Try to navigate to `/franchise/infinity` → Should redirect
5. ✅ Login as different franchise
6. ✅ Verify you don't see Meeting Point's data

---

## Test 3: Verify Data Isolation (Critical!)

### Step 1: Add Data as Franchise A
```
1. Login: meeting-point@coldwellbanker.com / CWB2024
2. Go to Transactions tab
3. Add 5 transactions with various amounts
4. Note the transaction amounts
5. Logout
```

### Step 2: Check as Franchise B
```
1. Login: infinity@coldwellbanker.com / CWB2024
2. Go to Transactions tab
3. Verify: Should show 0 transactions (NOT Meeting Point's)
4. Add 2 different transactions
5. Logout
```

### Step 3: Verify CEO Sees Both
```
1. Login: coldwellbanker@salemate.com / CWB1234
2. Click on "Meeting Point" franchise
3. Verify: See the 5 transactions from Step 1
4. Go back, click on "Infinity" franchise
5. Verify: See the 2 transactions from Step 2
6. Both franchises' data visible to CEO ✅
```

---

## Test 4: Permission Checks

### As Franchise Employee:
- ✅ Can add transactions to their franchise
- ✅ Can add expenses to their franchise
- ✅ Can edit their franchise settings
- ❌ Cannot access CEO dashboard
- ❌ Cannot access other franchises
- ❌ Cannot compare franchises

### As CEO:
- ✅ Can view all franchises
- ✅ Can drill into any franchise
- ✅ Can compare franchises
- ✅ Can edit any franchise
- ✅ Can add transactions/expenses to any franchise

---

## 🐛 Troubleshooting

### Issue: "Not redirecting to dashboard"
**Solution**: 
- Clear localStorage
- Check you're on performance subdomain
- Verify user has correct role in database

### Issue: "Can see other franchises"
**Solution**:
- Check RLS policies are applied
- Verify user role is 'franchise_employee' not 'admin'
- Check owner_user_id is set in performance_franchises

### Issue: "Cannot add transactions"
**Solution**:
- Verify franchise is active
- Check user is linked to franchise (owner_user_id)
- Verify RLS policies allow INSERT

---

## ✅ Success Checklist

- [ ] CEO can login
- [ ] CEO sees all 22 franchises
- [ ] CEO can view individual franchises
- [ ] CEO can compare franchises
- [ ] Franchise employee can login
- [ ] Franchise employee sees only their franchise
- [ ] Franchise employee can add transactions
- [ ] Franchise employee can add expenses
- [ ] Franchise employee cannot access other franchises
- [ ] Data isolation verified (A cannot see B's data)
- [ ] CEO can see all franchises' data

---

## 🎯 Current Status

**CEO Account**: ✅ Ready to test NOW
**System**: ✅ Fully functional
**Build**: ✅ Successful
**Server**: ✅ Running on localhost:5173

**Just open your browser and test!** 🚀

See `🎯_READY_TO_USE_🎯.md` for detailed instructions.

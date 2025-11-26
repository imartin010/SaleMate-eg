# Performance Program - Login Credentials

## Quick Access

### CEO Account (View All Franchises)
```
Email:    ceo@coldwellbanker.com
Password: CWB_CEO_2024
```
**Access**: All 22 franchises, aggregated dashboard, full system access

---

### Franchise Employee Accounts (Individual Franchises)

**Password for ALL franchises**: `CWB2024`

#### Complete List of Franchise Emails:

1. **Meeting Point**: `meeting-point@coldwellbanker.com`
2. **Infinity**: `infinity@coldwellbanker.com`
3. **Peak**: `peak@coldwellbanker.com`
4. **Elite**: `elite@coldwellbanker.com`
5. **Legacy**: `legacy@coldwellbanker.com`
6. **Empire**: `empire@coldwellbanker.com`
7. **Advantage**: `advantage@coldwellbanker.com`
8. **Core**: `core@coldwellbanker.com`
9. **Gate**: `gate@coldwellbanker.com`
10. **Rangers**: `rangers@coldwellbanker.com`
11. **Ninety**: `ninety@coldwellbanker.com`
12. **TM**: `tm@coldwellbanker.com`
13. **Winners**: `winners@coldwellbanker.com`
14. **Trust**: `trust@coldwellbanker.com`
15. **Stellar**: `stellar@coldwellbanker.com`
16. **Skyward**: `skyward@coldwellbanker.com`
17. **Hills**: `hills@coldwellbanker.com`
18. **Wealth**: `wealth@coldwellbanker.com`
19. **New Alex**: `new-alex@coldwellbanker.com`
20. **Platinum**: `platinum@coldwellbanker.com`
21. **Hub**: `hub@coldwellbanker.com`
22. **Experts**: `experts@coldwellbanker.com`

---

## How to Login

### Local Development
1. Go to: `http://localhost:5173`
2. Open browser console (F12)
3. Run:
   ```javascript
   localStorage.setItem('test-subdomain', 'performance');
   location.reload();
   ```
4. Login with any credentials above

### Direct URL
1. Go to: `http://performance.localhost:5173/auth/login`
2. Login with credentials

### Production
1. Go to: `https://performance.salemate-eg.com/auth/login`
2. Login with credentials

---

## What Each User Can Do

### CEO
✅ View all 22 franchises
✅ See aggregated metrics across all franchises
✅ Drill down into any franchise
✅ Compare franchises side-by-side
✅ View all transactions and expenses
✅ Edit any franchise settings

### Franchise Employee
✅ View only their franchise
✅ Add/edit transactions for their franchise
✅ Add/edit/delete expenses for their franchise
✅ Update franchise settings (headcount, status)
✅ View P&L statement and AI insights
❌ Cannot see other franchises
❌ Cannot access CEO dashboard
❌ Cannot compare with other franchises

---

## Daily Workflow

### For Franchise Employees (Every Day)
1. Login to your franchise dashboard
2. Add today's transactions (sales, reservations, contracts)
3. Record any expenses (rent, salaries, marketing, etc.)
4. Review P&L and AI insights
5. Update headcount if agents join/leave

### For CEO (Weekly/Monthly)
1. Login to CEO dashboard
2. Review all franchises' performance
3. Identify top performers
4. Identify franchises needing support
5. Compare franchise metrics
6. Make strategic decisions based on data

---

## Support

For any issues or questions:
- Email: support@salemate.com
- Check: `PERFORMANCE_MULTI_TENANT_SETUP.md` for technical details

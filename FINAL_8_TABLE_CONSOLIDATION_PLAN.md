# 🎯 Final 8-Table Consolidation Plan
## 15 Tables → 8 Tables (+1 Inventory = 9 Total)

---

## ✅ Your Decision

**Target:** 8 core tables + `salemate-inventory` (kept separate)  
**Total:** 9 tables  
**Reduction:** 40% (from 15 to 9)  
**Risk:** 🟡 MEDIUM  
**Timeline:** 2-3 months

---

## 📊 Current State: 15 Tables

### Core Business (5)
1. ✅ `profiles` - KEEP
2. ✅ `leads` - KEEP
3. ✅ `projects` - KEEP
4. ⚠️ `teams` - KEEP
5. ⚠️ `team_members` - KEEP (or merge with teams)

### Systems (7)
6. ⚠️ `activities` - MERGE → `events`
7. ⚠️ `commerce` - MERGE → `transactions`
8. ⚠️ `payments` - MERGE → `transactions`
9. ⚠️ `content` - ENHANCE (add metrics)
10. ⚠️ `content_metrics` - MERGE → `content`
11. ⚠️ `notifications` - MERGE → `events`
12. ⚠️ `system_logs` - MERGE → `events`

### Reference/Auth (3)
13. ⚠️ `entities` - MERGE → `system_data`
14. ⚠️ `auth_sessions` - MERGE → `system_data`
15. ⚠️ `wallet_ledger_entries` - MERGE → `transactions`

### Special (Not counted in consolidation)
- ✅ `salemate-inventory` - **KEEP AS IS** (23,157 rows)

---

## 🎯 Final Schema (9 Tables Total)

### Core Business (4 tables)
1. **`profiles`** - User accounts
2. **`leads`** - Lead management  
3. **`projects`** - Real estate projects
4. **`teams`** - Teams + team_members (merged or keep as 2)

### Unified Systems (3 tables)
5. **`events`** - All activities, notifications, system logs
6. **`transactions`** - All commerce, payments, wallet operations
7. **`content`** - CMS content + metrics

### System Data (1 table)
8. **`system_data`** - Entities + auth sessions

### Inventory (1 table - separate)
9. **`salemate-inventory`** - Property inventory (UNCHANGED)

---

## 🔥 Major Consolidations

### Consolidation #1: Events System
```
activities + notifications + system_logs → events
```
**Result:** 3 tables → 1 table  
**Complexity:** 🔥 HIGH

### Consolidation #2: Transactions System
```
commerce + payments + wallet_ledger_entries → transactions
```
**Result:** 3 tables → 1 table  
**Complexity:** 🔥 HIGH

### Consolidation #3: Content System
```
content + content_metrics → content (with metrics as JSONB)
```
**Result:** 2 tables → 1 table  
**Complexity:** 🟢 LOW

### Consolidation #4: System Data
```
entities + auth_sessions → system_data
```
**Result:** 2 tables → 1 table  
**Complexity:** 🟢 LOW

### Consolidation #5: Teams (Optional)
```
teams + team_members → teams (with JSONB members array)
OR keep as 2 separate tables for proper normalization
```
**Result:** 2 tables → 1 table (or keep as 2)  
**Complexity:** 🟡 MEDIUM

---

## 📋 Detailed Table Structures

### 1. `profiles` (UNCHANGED)
```sql
-- User accounts and authentication
-- Rows: ~10
-- Keep as-is
```

### 2. `leads` (UNCHANGED)
```sql
-- Lead/contact management
-- Rows: ~43,000
-- Keep as-is
```

### 3. `projects` (UNCHANGED)
```sql
-- Real estate project catalog
-- Rows: ~600
-- Keep as-is
```

### 4. `teams` (KEEP OR MERGE)
```sql
-- Option A: Keep as 2 tables (recommended)
teams (id, name, team_type, created_at, ...)
team_members (id, team_id, profile_id, role, status, ...)

-- Option B: Merge into 1 table
teams (
  id, name, team_type,
  members JSONB, -- [{profile_id, role, status}, ...]
  created_at, ...
)
```
**Recommendation:** Keep as 2 tables for proper normalization

### 5. `events` (NEW MEGA TABLE) ⚡
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'activity',      -- Tasks, feedback, support
    'notification',  -- User notifications
    'audit',        -- Audit logs
    'system',       -- System events
    'error',        -- Error logs
    'metric'        -- Analytics/metrics (optional)
  )),
  
  event_category TEXT, -- Subcategory based on event_type
  
  -- Core references
  profile_id UUID REFERENCES profiles(id),
  target_profile_id UUID REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id),
  
  -- Event data
  title TEXT,
  body TEXT,
  summary TEXT,
  
  -- Activity-specific fields
  activity_type TEXT,
  task_type TEXT,
  task_status TEXT,
  stage TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Notification-specific fields
  notification_url TEXT,
  notification_channels TEXT[],
  notification_status TEXT,
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Audit-specific fields
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Support-specific fields
  support_subject TEXT,
  support_topic TEXT,
  support_status TEXT,
  support_priority TEXT,
  thread_id UUID,
  
  -- Actor references
  actor_profile_id UUID REFERENCES profiles(id),
  assignee_profile_id UUID REFERENCES profiles(id),
  from_profile_id UUID REFERENCES profiles(id),
  to_profile_id UUID REFERENCES profiles(id),
  
  -- Flexible data
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Critical indexes
CREATE INDEX idx_events_type_created ON events(event_type, created_at DESC);
CREATE INDEX idx_events_profile ON events(profile_id, created_at DESC);
CREATE INDEX idx_events_target ON events(target_profile_id, created_at DESC);
CREATE INDEX idx_events_lead ON events(lead_id, created_at DESC);
CREATE INDEX idx_events_notifications ON events(target_profile_id, notification_status) 
  WHERE event_type = 'notification';
CREATE INDEX idx_events_metadata ON events USING GIN(metadata);
```

### 6. `transactions` (NEW MEGA TABLE) 💰
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction classification
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'commerce',    -- Purchase, request, allocation
    'payment',     -- Gateway payment
    'wallet',      -- Wallet ledger entry
    'refund',      -- Refund operation
    'adjustment',  -- Manual adjustment
    'topup',       -- Wallet topup
    'commission'   -- Partner commission
  )),
  
  transaction_category TEXT, -- Subcategory based on type
  
  -- Core references
  profile_id UUID NOT NULL REFERENCES profiles(id),
  project_id UUID REFERENCES projects(id),
  lead_id UUID REFERENCES leads(id),
  
  -- Financial data
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  quantity INTEGER,
  
  -- Commerce-specific
  commerce_type TEXT, -- 'purchase', 'request', 'allocation'
  
  -- Payment-specific
  payment_method TEXT, -- 'wallet', 'Instapay', 'Card', etc.
  provider TEXT, -- 'kashier', 'instapay', etc.
  provider_transaction_id TEXT,
  gateway_payment_intent_id TEXT,
  
  -- Wallet-specific
  ledger_entry_type TEXT, -- 'debit', 'credit'
  balance_before NUMERIC(14,2),
  balance_after NUMERIC(14,2),
  running_balance NUMERIC(14,2),
  
  -- Status and tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 
    'cancelled', 'approved', 'rejected', 'fulfilled'
  )),
  
  -- Receipts and approvals
  receipt_url TEXT,
  receipt_file_name TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  
  -- Notes
  description TEXT,
  notes TEXT,
  admin_notes TEXT,
  rejected_reason TEXT,
  
  -- References
  reference_type TEXT,
  reference_id UUID,
  parent_transaction_id UUID REFERENCES transactions(id),
  
  -- Flexible data
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  requested_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Critical indexes
CREATE INDEX idx_transactions_type_created ON transactions(transaction_type, created_at DESC);
CREATE INDEX idx_transactions_profile_status ON transactions(profile_id, status);
CREATE INDEX idx_transactions_project ON transactions(project_id);
CREATE INDEX idx_transactions_wallet ON transactions(profile_id, created_at DESC) 
  WHERE ledger_entry_type IS NOT NULL;
CREATE INDEX idx_transactions_provider ON transactions(provider, provider_transaction_id);
CREATE INDEX idx_transactions_reference ON transactions(reference_type, reference_id);
CREATE INDEX idx_transactions_metadata ON transactions USING GIN(metadata);
```

### 7. `content` (ENHANCED)
```sql
CREATE TABLE content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content classification
  content_type TEXT NOT NULL CHECK (content_type IN (
    'banner', 'email_template', 'sms_template', 
    'page', 'media', 'setting', 'feature_flag'
  )),
  
  -- Content data
  title TEXT,
  body TEXT,
  placement TEXT,
  media_url TEXT,
  media_type TEXT,
  
  -- Targeting
  audience JSONB DEFAULT '{}',
  
  -- Status and scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'live', 'archived', 'active', 'inactive'
  )),
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  
  -- CTA
  cta JSONB DEFAULT '{}',
  
  -- Settings/flags
  setting_key TEXT,
  setting_value JSONB,
  feature_key TEXT,
  feature_enabled BOOLEAN,
  
  -- Analytics (aggregated metrics stored as JSONB)
  metrics JSONB DEFAULT '{}', -- {impressions: 100, clicks: 20, ctr: 20%}
  
  -- Metadata
  created_by_profile_id UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_type_status ON content(content_type, status);
CREATE INDEX idx_content_setting_key ON content(setting_key) WHERE content_type = 'setting';
CREATE INDEX idx_content_feature_key ON content(feature_key) WHERE content_type = 'feature_flag';
```

### 8. `system_data` (NEW)
```sql
CREATE TABLE system_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data classification
  data_type TEXT NOT NULL CHECK (data_type IN (
    'entity',        -- Developer, partner, integration
    'auth_session',  -- OTP, session, token
    'config'         -- System configuration
  )),
  
  data_category TEXT, -- Subcategory
  
  -- Entity-specific fields
  entity_type TEXT, -- 'developer', 'partner', 'ad_integration'
  entity_name TEXT,
  entity_status TEXT,
  
  -- Auth session-specific fields
  session_type TEXT, -- 'otp_challenge', 'otp_attempt', 'session'
  profile_id UUID REFERENCES profiles(id),
  session_token TEXT,
  code_hash TEXT,
  channel TEXT, -- 'sms', 'email'
  phone_number TEXT,
  email TEXT,
  attempt_count INTEGER,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  
  -- Entity details
  description TEXT,
  logo_path TEXT,
  website TEXT,
  commission_rate NUMERIC(5,2),
  
  -- API credentials (for integrations)
  api_credentials JSONB,
  
  -- Status
  status TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Flexible data
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_system_data_type_category ON system_data(data_type, data_category);
CREATE INDEX idx_system_data_entity ON system_data(entity_type, entity_name) WHERE data_type = 'entity';
CREATE INDEX idx_system_data_session ON system_data(profile_id, session_type) WHERE data_type = 'auth_session';
CREATE INDEX idx_system_data_token ON system_data(session_token) WHERE data_type = 'auth_session';
```

### 9. `salemate-inventory` (UNCHANGED) ✅
```sql
-- Property inventory table
-- Rows: ~23,157
-- KEEP AS IS - NO CHANGES
```

---

## 🚀 Implementation Phases

### Phase 1: Events Consolidation (3 weeks)
**Consolidate:** activities + notifications + system_logs → events

**Tasks:**
1. Create `events` table
2. Migrate activities data
3. Migrate notifications data
4. Migrate system_logs data
5. Create compatibility views
6. Update application code
7. Test thoroughly
8. Drop old tables

**Effort:** 30-40 hours  
**Risk:** 🔴 HIGH (affects many features)

---

### Phase 2: Transactions Consolidation (3 weeks)
**Consolidate:** commerce + payments + wallet_ledger_entries → transactions

**Tasks:**
1. Create `transactions` table
2. Migrate commerce data
3. Migrate payments data
4. Migrate wallet_ledger_entries data
5. Create wallet balance functions
6. Update payment flows
7. Test financial operations
8. Drop old tables

**Effort:** 35-45 hours  
**Risk:** 🔴 HIGH (critical financial data)

---

### Phase 3: Content & System Data (1 week)
**Consolidate:** 
- content + content_metrics → content
- entities + auth_sessions → system_data

**Tasks:**
1. Enhance content table
2. Create system_data table
3. Migrate all data
4. Update queries
5. Drop old tables

**Effort:** 15-20 hours  
**Risk:** 🟢 LOW

---

### Phase 4: Teams Decision (Optional, 1 week)
**Decision:** Keep teams + team_members as 2 tables OR merge

**My Recommendation:** Keep as 2 tables
- Proper many-to-many relationship
- Easier queries
- Standard pattern

**If you want 8 exactly:** Merge into 1 table with JSONB members

---

## 💰 Total Effort

| Phase | Dev Hours | Test Hours | Total |
|-------|-----------|------------|-------|
| Phase 1: Events | 30-40 | 15 | 45-55 |
| Phase 2: Transactions | 35-45 | 20 | 55-65 |
| Phase 3: Content/System | 15-20 | 10 | 25-30 |
| Phase 4: Teams (opt) | 5-10 | 5 | 10-15 |
| **TOTAL** | **85-115** | **50** | **135-165 hours** |

**Timeline:** 2-3 months with proper testing

---

## 🎯 Final Result

**Current:** 15 tables + inventory = 16 total  
**Target:** 8 tables + inventory = **9 total**  
**Reduction:** 44% (from 16 to 9)

### The 9 Tables:
1. ✅ profiles
2. ✅ leads
3. ✅ projects
4. ✅ teams (+ team_members if merged, or keep as 2)
5. 🆕 events (was 3 tables)
6. 🆕 transactions (was 3 tables)
7. ✅ content (enhanced)
8. 🆕 system_data (was 2 tables)
9. ✅ salemate-inventory (unchanged)

---

## 🚨 Critical Success Factors

### Must-Have Before Starting
- [ ] Full database backup
- [ ] Staging environment ready
- [ ] All team members informed
- [ ] Testing plan documented
- [ ] Rollback procedures ready

### During Implementation
- [ ] Test each phase thoroughly
- [ ] Monitor performance
- [ ] Keep compatibility views
- [ ] Update documentation
- [ ] Regular backups

### After Each Phase
- [ ] Verify data integrity
- [ ] Check query performance
- [ ] Monitor error logs
- [ ] User acceptance testing
- [ ] Wait 1 week before next phase

---

## ✅ Next Steps

I'm ready to create the migration scripts. Would you like me to:

1. **Create all migration scripts now** (for all 4 phases)
2. **Start with Phase 1 only** (events consolidation)
3. **Show me detailed examples** of how queries will change
4. **Discuss teams consolidation** (2 tables vs 1 table)

Let me know and I'll proceed! 🚀

---

*Plan Approved: Awaiting confirmation to create migration scripts*  
*Target: 8 tables + salemate-inventory = 9 total*


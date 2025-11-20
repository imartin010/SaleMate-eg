# 📊 Database Tables Summary

## Overview
**Total Tables**: 15 tables
**Total Rows**: 66,888 rows across all tables
**RLS Enabled**: 13/15 tables (87%)

---

## Core Business Tables (5)

### 1. `profiles` 👤
- **Rows**: 9
- **Columns**: 13
- **Purpose**: User profiles and authentication
- **RLS**: ✅ Enabled
- **Key Features**: Role-based access (user, manager, support, admin), wallet balance, phone verification

### 2. `leads` 📋
- **Rows**: 43,217
- **Columns**: 29
- **Purpose**: Lead management and CRM
- **RLS**: ✅ Enabled
- **Key Features**: Stage tracking, assignment, budget, priority, contact history
- **Indexes**: 22 indexes for performance

### 3. `projects` 🏗️
- **Rows**: 610
- **Columns**: 11
- **Purpose**: Real estate projects
- **RLS**: ✅ Enabled
- **Key Features**: Project codes, pricing, auto-assign rules, developer relationships

### 4. `teams` 👥
- **Rows**: 0
- **Columns**: 6
- **Purpose**: Team organization
- **RLS**: ❌ Disabled
- **Key Features**: Team types (sales, support, partnership, admin)

### 5. `team_members` 👥
- **Rows**: 0
- **Columns**: 10
- **Purpose**: Team membership and invitations
- **RLS**: ❌ Disabled
- **Key Features**: Roles, status, invitation system (merged from team_invitations)

---

## Consolidated Activity Tables (7)

### 6. `activities` 🔄
- **Rows**: 25
- **Columns**: 34
- **Purpose**: Unified activity system (events, tasks, feedback, transfers, labels, recommendations, support)
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Activity types: event, task, feedback, transfer, label, recommendation, support
  - Support system (threads, messages)
  - Task management
  - Lead transfers
  - AI recommendations
- **Foreign Keys**: 5
- **Indexes**: 8

### 7. `commerce` 💰
- **Rows**: 56
- **Columns**: 24
- **Purpose**: Unified commerce transactions
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Types: purchase, request, allocation, refund, topup, commission
  - Payment methods, receipts, approvals
  - Project and lead associations
- **Foreign Keys**: 5
- **Indexes**: 5

### 8. `payments` 💳
- **Rows**: 0
- **Columns**: 25
- **Purpose**: Unified payment and wallet system
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Operation types: deposit, withdrawal, payment, refund, adjustment, gateway_charge, topup_request, payout
  - Provider integration
  - Balance tracking
- **Foreign Keys**: 2
- **Indexes**: 6

### 9. `content` 📄
- **Rows**: 1
- **Columns**: 20
- **Purpose**: Unified CMS content
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Types: banner, email_template, sms_template, page, media, setting, feature_flag
  - Audience targeting
  - Scheduling
- **Foreign Keys**: 1
- **Indexes**: 5

### 10. `content_metrics` 📊
- **Rows**: 0
- **Columns**: 5
- **Purpose**: Content analytics
- **RLS**: ✅ Enabled
- **Key Features**: Impressions, clicks, views, interactions
- **Foreign Keys**: 2
- **Indexes**: 3

### 11. `notifications` 🔔
- **Rows**: 0
- **Columns**: 13
- **Purpose**: User notifications
- **RLS**: ✅ Enabled
- **Key Features**: Multi-channel (inapp, email, SMS), context-aware, read tracking
- **Foreign Keys**: 1
- **Indexes**: 4

### 12. `system_logs` 📝
- **Rows**: 0
- **Columns**: 10
- **Purpose**: Unified audit and activity logging
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Log types: audit, activity, error, integration
  - IP tracking, user agent
- **Foreign Keys**: 1
- **Indexes**: 4

---

## New Unified Tables (3)

### 13. `entities` 🏢
- **Rows**: 155
- **Columns**: 18
- **Purpose**: Unified reference data
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Entity types: developer, partner, ad_integration, organization
  - 151 developers + 4 partners migrated
  - API credentials for integrations
- **Indexes**: 3

### 14. `auth_sessions` 🔐
- **Rows**: 9
- **Columns**: 18
- **Purpose**: Unified authentication sessions
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Session types: otp_challenge, otp_attempt, session, token
  - OTP verification tracking
  - 8 challenges + 1 attempt migrated
- **Foreign Keys**: 1
- **Indexes**: 4

### 15. `salemate-inventory` 🏘️
- **Rows**: 23,157
- **Columns**: 29
- **Purpose**: Property inventory
- **RLS**: ✅ Enabled
- **Key Features**: 
  - Unit details, pricing, area, bedrooms, bathrooms
  - Payment plans, offers, images
  - Developer and compound information
- **Indexes**: 7

---

## Table Statistics

| Category | Count | Total Rows | RLS Enabled |
|----------|-------|------------|-------------|
| Core Business | 5 | 43,836 | 3/5 |
| Consolidated | 7 | 82 | 7/7 |
| Unified | 3 | 23,321 | 3/3 |
| **TOTAL** | **15** | **67,239** | **13/15** |

---

## Consolidation History

### Original State
- **41+ tables** before consolidation

### After First Consolidation
- **23 tables** (reduced by 18 tables)

### After Further Consolidation
- **15 tables** (reduced by 8 more tables)

### Total Reduction
- **63% reduction** (26 tables removed)
- **171 rows migrated** in latest phase

---

## Key Consolidations

1. ✅ **Support System** → `activities` (support_threads, support_messages)
2. ✅ **Team Invitations** → `team_members` (team_invitations)
3. ✅ **Lead Labels** → `activities` (lead_label_ids)
4. ✅ **Commissions** → `commerce` (project_partner_commissions)
5. ✅ **OTP System** → `auth_sessions` (otp_challenges, otp_attempts)
6. ✅ **Reference Data** → `entities` (developers, partners, ad_integrations)

---

## Database Health

✅ **RLS Coverage**: 87% (13/15 tables)  
✅ **Indexes**: Well-indexed for performance  
✅ **Foreign Keys**: Proper relationships maintained  
✅ **Data Integrity**: All migrations successful  
✅ **Consolidation**: 63% reduction achieved  

---

**Last Updated**: After further consolidation phase  
**Status**: ✅ Production Ready


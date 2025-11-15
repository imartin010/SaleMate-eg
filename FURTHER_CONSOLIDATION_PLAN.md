# Further Consolidation Plan

## Current State
- **Total Tables**: 23
- **Goal**: Get closer to 12 tables

## Consolidation Opportunities

### 1. Support System → Activities Table
**Tables to consolidate**: `support_threads`, `support_messages`
**Target**: `activities` table
**Rationale**: Support threads are essentially activities with type='support', and messages are activity entries

### 2. Team Invitations → Team Members
**Tables to consolidate**: `team_invitations`
**Target**: `team_members` (already enhanced with invitation columns)
**Rationale**: We already added invitation columns to team_members, so team_invitations is redundant

### 3. OTP Tables → System Logs or Unified Auth Table
**Tables to consolidate**: `otp_challenges`, `otp_attempts`
**Target**: New `auth_sessions` table or `system_logs`
**Rationale**: OTP is authentication-related, could be part of auth system

### 4. Lead Labels → Activities
**Tables to consolidate**: `lead_label_ids`
**Target**: `activities` table (activity_type='label')
**Rationale**: Labels are already handled in activities table

### 5. Project Partner Commissions → Commerce
**Tables to consolidate**: `project_partner_commissions`
**Target**: `commerce` table (commerce_type='commission')
**Rationale**: Commissions are financial transactions, fit in commerce

### 6. Reference Data → Unified Entities Table
**Tables to consolidate**: `ad_integrations`, `developers`, `partners`
**Target**: New `entities` table with entity_type
**Rationale**: All are reference/lookup entities that could be unified

### 7. Inventory → Keep Separate or Projects
**Table**: `salemate-inventory`
**Decision**: Keep separate (it's core business data with 29 columns)

## Proposed New Schema (12 Tables)

1. **profiles** - User profiles
2. **leads** - Lead management
3. **projects** - Project information
4. **teams** - Team management
5. **team_members** - Team membership (with invitations)
6. **activities** - Unified activities (includes support, labels)
7. **commerce** - Unified commerce (includes commissions)
8. **payments** - Unified payments
9. **content** - Unified CMS content
10. **content_metrics** - Content metrics
11. **notifications** - Notifications
12. **system_logs** - System logs (or new auth_sessions for OTP)

**Plus**:
- `salemate-inventory` - Property inventory (core business data)
- `entities` - Unified reference data (ad_integrations, developers, partners)
- `auth_sessions` - Unified auth (OTP challenges, attempts)

**Total**: ~15 tables (down from 23)

## Implementation Steps

1. Consolidate support_threads + support_messages → activities
2. Merge team_invitations → team_members
3. Consolidate OTP tables → auth_sessions
4. Merge lead_label_ids → activities
5. Merge project_partner_commissions → commerce
6. Create entities table and migrate ad_integrations, developers, partners

Would you like me to proceed with this further consolidation?


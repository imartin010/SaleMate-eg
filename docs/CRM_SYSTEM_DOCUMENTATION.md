# CRM System Documentation

## Overview

The CRM (Customer Relationship Management) system is a comprehensive lead management solution built for real estate professionals. It provides complete CRUD operations, real-time updates, advanced filtering, multiple view modes, and analytics.

---

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Database Schema](#database-schema)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Components](#components)
7. [Hooks](#hooks)
8. [Usage Examples](#usage-examples)

---

## Frontend Architecture

### Main Page Component
**Location**: `src/pages/CRM/ModernCRM.tsx`

The main CRM page is a modern, responsive React component that provides:
- Three view modes: Cards, Table, and Kanban
- Real-time lead updates
- Advanced filtering and search
- Statistics dashboard
- Lead management operations

### Key Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Animations**: Smooth transitions using Framer Motion
- **Real-time Updates**: Supabase real-time subscriptions
- **Optimistic Updates**: Immediate UI feedback before server confirmation
- **Export Functionality**: CSV export of filtered leads

---

## Backend Architecture

### Database Table: `leads`

The CRM system uses the `leads` table in Supabase (PostgreSQL) as its primary data store.

### Row Level Security (RLS)

The system implements RLS policies to ensure users can only access their own leads:
- Users can view leads where `buyer_user_id`, `assigned_to_id`, or `owner_id` matches their user ID
- Users can create, update, and delete their own leads
- Managers can view and manage leads assigned to their team members

### Real-time Subscriptions

The system uses Supabase real-time channels to automatically update the UI when:
- New leads are created
- Leads are updated
- Leads are deleted

---

## Database Schema

### Table: `public.leads`

```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client Information
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_phone2 TEXT,
  client_phone3 TEXT,
  client_job_title TEXT,
  company_name TEXT,
  
  -- Lead Management
  project_id UUID REFERENCES projects(id) NOT NULL,
  buyer_user_id UUID REFERENCES profiles(id),
  assigned_to_id UUID REFERENCES profiles(id),
  owner_id UUID REFERENCES profiles(id),
  upload_user_id UUID REFERENCES profiles(id),
  
  -- Lead Status
  stage lead_stage DEFAULT 'New Lead',
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  
  -- Lead Details
  source TEXT CHECK (source IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp')),
  platform platform_type NOT NULL,
  budget NUMERIC(12, 2),
  feedback TEXT,
  cpl_price NUMERIC(10, 2),
  batch_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Enums

**`lead_stage`**:
- `'New Lead'`
- `'Potential'`
- `'Hot Case'`
- `'Meeting Done'`
- `'Closed Deal'`
- `'No Answer'`
- `'Call Back'`
- `'Whatsapp'`
- `'Non Potential'`
- `'Wrong Number'`
- `'Switched Off'`
- `'Low Budget'`

**`platform_type`**:
- `'facebook'`
- `'instagram'`
- `'google'`
- `'tiktok'`
- `'snapchat'`
- `'whatsapp'`

### Indexes

```sql
CREATE INDEX idx_leads_buyer_user_id ON public.leads(buyer_user_id);
CREATE INDEX idx_leads_assigned_to_id ON public.leads(assigned_to_id);
CREATE INDEX idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX idx_leads_project_id ON public.leads(project_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
```

### Foreign Key Relationships

- `project_id` → `projects.id`
- `buyer_user_id` → `profiles.id`
- `assigned_to_id` → `profiles.id`
- `owner_id` → `profiles.id`
- `upload_user_id` → `profiles.id`

---

## Features

### 1. Lead Management

#### Create Lead
- Manual lead entry via modal form
- Required fields: Name, Phone, Project, Source
- Optional fields: Email, Company, Job Title, Budget, Feedback
- Automatic assignment to current user

#### Update Lead
- Inline editing in table view
- Full edit modal with all fields
- Stage updates via dropdown
- Optimistic updates for instant feedback

#### Delete Lead
- Confirmation dialog
- Soft delete option (future enhancement)
- Audit trail preservation

### 2. View Modes

#### Cards View
- Grid layout (1-3 columns based on screen size)
- Quick action buttons (Call, WhatsApp, View Details)
- Stage badges with color coding
- Project and contact information

#### Table View
- Sortable columns
- Inline stage editing
- Bulk selection
- Responsive design with mobile optimizations

#### Kanban View
- Column-based organization by stage
- Drag-and-drop (future enhancement)
- Stage counts per column
- Quick actions on cards

### 3. Filtering & Search

#### Search
- Full-text search across:
  - Client name
  - Phone numbers
  - Email
  - Company name
  - Project name
  - Feedback text
  - Source

#### Filters
- **Stage**: Filter by lead stage
- **Project**: Filter by project
- **Platform**: Filter by source platform
- **Date Range**: Week, Month, Quarter, All

#### Active Filters Indicator
- Badge showing number of active filters
- Quick clear all option

### 4. Statistics Dashboard

Four key metrics displayed:
1. **Total Leads**: Count of all leads
2. **Hot Cases**: Leads in "Hot Case" stage
3. **Meetings**: Leads in "Meeting Done" stage
4. **Quality Rate**: Calculated as:
   ```
   (Potential + Hot Case + Meeting Done + Closed Deal + Call Back) / 
   (Total Leads - (New Leads + No Answer + Wrong Number + Switched Off)) * 100
   ```

### 5. Contact Actions

#### Call
- Direct `tel:` link for mobile devices
- Opens phone dialer

#### WhatsApp
- Pre-formatted WhatsApp message link
- Phone number sanitization

#### Email
- Direct `mailto:` link
- Opens default email client

### 6. Export

- CSV export of filtered leads
- Includes: Name, Phone, Email, Company, Project, Stage, Source, Budget, Created At
- Filename includes date: `leads-export-YYYY-MM-DD.csv`

### 7. Pagination

- 30 leads per page
- Page number navigation
- Previous/Next buttons
- Shows current range: "Showing X - Y of Z leads"

---

## API Reference

### Supabase Client Methods

#### Fetch Leads
```typescript
const { data, error } = await supabase
  .from('leads')
  .select(`
    *,
    project:projects (
      id,
      name,
      region
    ),
    owner:profiles!leads_owner_id_fkey (
      id,
      name
    ),
    assigned_to:profiles!leads_assigned_to_id_fkey (
      id,
      name
    ),
    feedback_history:feedback_history (
      id,
      feedback_text,
      created_at,
      user:profiles (
        name,
        email
      )
    )
  `)
  .or(`buyer_user_id.eq.${userId},assigned_to_id.eq.${userId},owner_id.eq.${userId}`)
  .order('created_at', { ascending: false });
```

#### Create Lead
```typescript
const { data, error } = await supabase
  .from('leads')
  .insert([{
    client_name: string,
    client_phone: string,
    client_email?: string,
    project_id: string,
    source: string,
    platform: platform_type,
    stage?: lead_stage,
    buyer_user_id: string,
    upload_user_id: string
  }])
  .select()
  .single();
```

#### Update Lead
```typescript
const { data, error } = await supabase
  .from('leads')
  .update({
    stage?: lead_stage,
    feedback?: string,
    budget?: number,
    // ... other fields
  })
  .eq('id', leadId)
  .select()
  .single();
```

#### Delete Lead
```typescript
const { error } = await supabase
  .from('leads')
  .delete()
  .eq('id', leadId);
```

#### Real-time Subscription
```typescript
const channel = supabase
  .channel('leads-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'leads',
      filter: `buyer_user_id=eq.${userId}`,
    },
    () => {
      fetchLeads(); // Refresh leads
    }
  )
  .subscribe();
```

---

## Components

### Main Components

#### `ModernCRM.tsx`
Main page component that orchestrates all CRM functionality.

**Props**: None (uses hooks and context)

**State**:
- `viewMode`: 'table' | 'kanban' | 'cards'
- `searchQuery`: string
- `selectedLeads`: Set<string>
- `currentPage`: number
- `showAddModal`: boolean
- `editingLead`: Lead | null
- `detailLead`: Lead | null

#### `AddLeadModal.tsx`
Modal for creating new leads.

**Props**:
```typescript
{
  open: boolean;
  onClose: () => void;
  onAdd: (leadData: CreateLeadInput) => Promise<void>;
}
```

#### `EditLeadDialog.tsx`
Modal for editing existing leads.

**Props**:
```typescript
{
  lead: Lead;
  onClose: () => void;
  onSave: (leadId: string, updates: UpdateLeadInput) => Promise<void>;
}
```

#### `LeadDetailModal.tsx`
Modal for viewing full lead details.

**Props**:
```typescript
{
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onUpdateStage: (leadId: string, stage: LeadStage) => Promise<void>;
}
```

### Supporting Components

- `StatsHeader.tsx`: Statistics cards display
- `FilterBar.tsx`: Search and filter controls
- `LeadTable.tsx`: Table view component
- `LeadCard.tsx`: Card view component
- `LeadActions.tsx`: Action buttons (Call, WhatsApp, etc.)

---

## Hooks

### `useLeads()`

Main hook for lead management operations.

**Location**: `src/hooks/crm/useLeads.ts`

**Returns**:
```typescript
{
  leads: Lead[];
  loading: boolean;
  error: string | null;
  fetchLeads: () => Promise<void>;
  createLead: (input: CreateLeadInput) => Promise<Lead>;
  updateLead: (id: string, updates: UpdateLeadInput) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
}
```

**Features**:
- Automatic fetching on mount
- Real-time subscriptions
- Optimistic updates
- Error handling

### `useLeadFilters(leads: Lead[])`

Hook for filtering leads.

**Location**: `src/hooks/crm/useLeadFilters.ts`

**Returns**:
```typescript
{
  filters: LeadFilters;
  filteredLeads: Lead[];
  updateFilter: <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}
```

**Filter Types**:
```typescript
interface LeadFilters {
  search: string;
  stage?: LeadStage | 'all';
  project?: string | 'all';
  platform?: string | 'all';
  dateRange?: 'week' | 'month' | 'quarter' | 'all';
}
```

### `useLeadStats(leads: Lead[])`

Hook for calculating lead statistics.

**Location**: `src/hooks/crm/useLeadStats.ts`

**Returns**:
```typescript
{
  totalLeads: number;
  hotCases: number;
  meetings: number;
  qualityRate: number;
  newLeads: number;
  potential: number;
  callBacks: number;
}
```

---

## Usage Examples

### Basic Lead Creation

```typescript
import { useLeads } from '../../hooks/crm/useLeads';

function MyComponent() {
  const { createLead } = useLeads();

  const handleCreate = async () => {
    try {
      await createLead({
        client_name: 'John Doe',
        client_phone: '+201234567890',
        client_email: 'john@example.com',
        project_id: 'project-uuid',
        source: 'facebook',
        stage: 'New Lead'
      });
    } catch (error) {
      console.error('Failed to create lead:', error);
    }
  };

  return <button onClick={handleCreate}>Add Lead</button>;
}
```

### Filtering Leads

```typescript
import { useLeads } from '../../hooks/crm/useLeads';
import { useLeadFilters } from '../../hooks/crm/useLeadFilters';

function MyComponent() {
  const { leads } = useLeads();
  const { filters, filteredLeads, updateFilter } = useLeadFilters(leads);

  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => updateFilter('search', e.target.value)}
        placeholder="Search leads..."
      />
      <select
        value={filters.stage}
        onChange={(e) => updateFilter('stage', e.target.value)}
      >
        <option value="all">All Stages</option>
        <option value="New Lead">New Lead</option>
        <option value="Hot Case">Hot Case</option>
      </select>
      <div>
        {filteredLeads.map(lead => (
          <div key={lead.id}>{lead.client_name}</div>
        ))}
      </div>
    </div>
  );
}
```

### Updating Lead Stage

```typescript
import { useLeads } from '../../hooks/crm/useLeads';

function MyComponent() {
  const { updateLead } = useLeads();

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      await updateLead(leadId, { stage: newStage });
    } catch (error) {
      console.error('Failed to update lead:', error);
    }
  };

  return (
    <select onChange={(e) => handleStageChange(leadId, e.target.value)}>
      {/* options */}
    </select>
  );
}
```

### Real-time Updates

The `useLeads` hook automatically sets up real-time subscriptions. When a lead is updated in the database, the UI will automatically refresh.

```typescript
// This happens automatically in useLeads hook
useEffect(() => {
  fetchLeads();

  const channel = supabase
    .channel('leads-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'leads',
      filter: `buyer_user_id=eq.${user?.id}`,
    }, () => {
      fetchLeads();
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [fetchLeads, user?.id]);
```

---

## Data Flow

### Lead Creation Flow

```
User clicks "Add Lead"
    ↓
AddLeadModal opens
    ↓
User fills form and submits
    ↓
createLead() called with input
    ↓
Optimistic update (temp lead added to UI)
    ↓
Supabase insert request
    ↓
Success: Replace temp lead with real lead
    ↓
Real-time subscription triggers
    ↓
UI updates automatically
```

### Lead Update Flow

```
User changes stage in dropdown
    ↓
updateLead() called
    ↓
Optimistic update (UI updates immediately)
    ↓
Supabase update request
    ↓
Success: Confirm update with server data
    ↓
Real-time subscription triggers
    ↓
All connected clients update
```

---

## Security

### Row Level Security (RLS) Policies

**View Policy**:
```sql
CREATE POLICY "Users can view their own leads"
ON public.leads
FOR SELECT
USING (
  buyer_user_id = auth.uid() OR
  assigned_to_id = auth.uid() OR
  owner_id = auth.uid()
);
```

**Insert Policy**:
```sql
CREATE POLICY "Users can create leads"
ON public.leads
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

**Update Policy**:
```sql
CREATE POLICY "Users can update their own leads"
ON public.leads
FOR UPDATE
USING (
  buyer_user_id = auth.uid() OR
  assigned_to_id = auth.uid() OR
  owner_id = auth.uid()
);
```

**Delete Policy**:
```sql
CREATE POLICY "Users can delete their own leads"
ON public.leads
FOR DELETE
USING (
  buyer_user_id = auth.uid() OR
  owner_id = auth.uid()
);
```

---

## Performance Optimizations

1. **Optimistic Updates**: Immediate UI feedback before server confirmation
2. **Memoization**: Filtered leads and stats are memoized
3. **Pagination**: Only 30 leads loaded per page
4. **Indexes**: Database indexes on frequently queried columns
5. **Selective Queries**: Only fetch required fields and relations

---

## Error Handling

The system includes comprehensive error handling:

1. **Network Errors**: Displayed to user with retry option
2. **Validation Errors**: Form validation before submission
3. **Permission Errors**: Handled by RLS policies
4. **Optimistic Update Rollback**: Failed operations revert UI changes

---

## Future Enhancements

1. **Bulk Operations**: Select multiple leads for batch updates
2. **Drag-and-Drop**: Kanban view with drag-and-drop stage changes
3. **Advanced Analytics**: Charts and graphs for lead performance
4. **Email Integration**: Send emails directly from CRM
5. **Notes System**: Rich text notes with attachments
6. **Activity Timeline**: Complete history of lead interactions
7. **Automation**: Automated stage transitions based on rules
8. **Export Formats**: Excel, PDF export options

---

## Troubleshooting

### Leads Not Appearing

1. Check RLS policies - ensure user has access
2. Verify `buyer_user_id`, `assigned_to_id`, or `owner_id` is set
3. Check real-time subscription is active
4. Verify user authentication

### Real-time Updates Not Working

1. Check Supabase real-time is enabled
2. Verify channel subscription is active
3. Check browser console for errors
4. Ensure RLS policies allow updates

### Performance Issues

1. Check database indexes are created
2. Reduce pagination size
3. Optimize filter queries
4. Check network connection

---

## Related Documentation

- [Lead Management Implementation Guide](./LEAD_MANAGEMENT_IMPLEMENTATION_GUIDE.md)
- [Database Schema Documentation](./database-schema.md)
- [Authentication System](./AUTH_SYSTEM_COMPLETE_NEXT_STEPS.md)

---

**Last Updated**: 2024
**Version**: 1.0.0


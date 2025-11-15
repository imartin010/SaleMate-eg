# Project Code for Facebook Campaign Integration

## Overview

The `project_code` column in the `projects` table is used for Facebook campaign integration. Each project has a unique code that identifies it in Facebook Ads Manager campaigns.

## How It Works

### 1. Project Codes
- Every project has a unique `project_code` (e.g., "001", "002", "003", "610")
- Codes are stored in `projects.project_code` column
- All 610 projects currently have codes assigned
- Codes range from "001" to "610"

### 2. Facebook Campaign Naming
Facebook campaigns should include the project code in their name:
- Format: `"PROJ001 - Campaign Name"` or `"001 - Campaign Name"`
- The code is extracted from the campaign name
- The service matches the code to `projects.project_code`

### 3. Lead Routing
When a lead comes from Facebook:
1. The campaign name is parsed to extract the project code
2. The service looks up the project by `project_code`
3. The lead is automatically assigned to that project
4. If no code is found, the lead is assigned to the "DEFAULT" project

## Database Schema

### Projects Table
```sql
CREATE TABLE projects (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    project_code text UNIQUE,  -- Facebook campaign code
    developer_id uuid,
    -- ... other columns
);
```

### Leads Table
```sql
CREATE TABLE leads (
    id uuid PRIMARY KEY,
    project_id uuid REFERENCES projects(id),  -- Linked via project_code lookup
    integration_id uuid,  -- Optional, for backward compatibility
    -- ... other columns
);
```

## Code Location

The integration logic is in:
- **Service**: `src/services/adsManagerService.ts`
- **Functions**:
  - `extractProjectCode()` - Extracts code from campaign name
  - `findProjectByCode()` - Looks up project by code
  - `createLeadFromFacebook()` - Creates lead and assigns to project

## Migration Notes

### Removed Tables
- ❌ `ad_integrations` - No longer needed
- ❌ `entities` with `entity_type = 'ad_integration'` - Removed

### Why This Approach?
1. **Simpler**: Project codes are directly in the projects table
2. **No extra joins**: Direct lookup by code
3. **Clear relationship**: One code per project
4. **Easy to manage**: Codes are visible in project management UI

## Usage Example

```typescript
// Campaign name: "PROJ001 - Summer Sale"
const projectCode = AdsManagerService.extractProjectCode("PROJ001 - Summer Sale");
// Returns: "PROJ001"

// Find project
const projectId = await AdsManagerService.findProjectByCode("PROJ001");
// Returns: project UUID

// Create lead
const result = await AdsManagerService.createLeadFromFacebook({
  client_name: "John Doe",
  client_phone: "+201234567890",
  project_code: "PROJ001",
  source: "Facebook Ads Manager"
});
```

## Verification

✅ All 610 projects have unique codes  
✅ Codes are indexed for fast lookup  
✅ Service extracts codes from campaign names  
✅ Leads are automatically routed to correct projects  

---

**Status**: ✅ Complete  
**Last Updated**: After ad_integration consolidation


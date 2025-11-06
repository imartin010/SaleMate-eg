# Inventory Page Documentation

## Overview

The Inventory page is a comprehensive property listing and management system for real estate properties. It provides advanced filtering, search, sorting, and detailed property views with support for thousands of properties.

---

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [Backend Architecture](#backend-architecture)
3. [Database Schema](#database-schema)
4. [Features](#features)
5. [API Reference](#api-reference)
6. [Components](#components)
7. [Data Types](#data-types)
8. [Usage Examples](#usage-examples)

---

## Frontend Architecture

### Main Page Component
**Location**: `src/pages/Inventory/Inventory.tsx`

The main Inventory page is a React component that provides:
- Property listing with table view
- Advanced filtering system
- Search functionality
- Pagination
- Property details modal
- Statistics dashboard

### Key Features
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Performance**: Optimized for large datasets (30,000+ properties)
- **Custom Sorting**: Priority sorting for specific compounds
- **Real-time Filtering**: Instant filter application
- **Detailed Property Views**: Comprehensive property information modal

---

## Backend Architecture

### Database Table: `salemate-inventory`

The Inventory system uses the `salemate-inventory` table in Supabase (PostgreSQL) as its primary data store.

### Row Level Security (RLS)

The system implements RLS policies:
- **View Access**: Anyone can view inventory (public read access)
- **Manage Access**: Only admins can insert, update, or delete properties

### Data Structure

Properties are stored with JSON fields for compound, area, developer, and property_type, allowing flexible data structures while maintaining query performance.

---

## Database Schema

### Table: `public.salemate-inventory`

```sql
CREATE TABLE public."salemate-inventory" (
  id bigserial PRIMARY KEY,
  
  -- Property Identification
  unit_id text,
  unit_number text,
  building_number text,
  original_unit_id text,
  
  -- Location Information (stored as JSON or text)
  compound text,           -- JSON: {name: "Compound Name", ...}
  developer text,          -- JSON: {name: "Developer Name", ...}
  area text,              -- JSON: {name: "Area Name", ...}
  phase text,             -- JSON: {name: "Phase Name", ...}
  
  -- Property Details
  property_type text,      -- JSON: {name: "Type Name", ...}
  number_of_bedrooms integer,
  number_of_bathrooms integer,
  unit_area numeric(10,2),
  garden_area numeric(10,2),
  roof_area numeric(10,2),
  floor_number integer,
  
  -- Pricing
  price_in_egp numeric(15,2),
  price_per_meter numeric(10,2),
  currency text DEFAULT 'EGP',
  
  -- Property Status
  finishing text,
  sale_type text,
  is_launch boolean DEFAULT false,
  ready_by text,          -- Date or year
  offers text,
  payment_plans text,     -- JSON array
  
  -- Media
  image text,             -- URL to property image
  
  -- Metadata
  last_inventory_update timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_salemate_inventory_compound ON public."salemate-inventory"(compound);
CREATE INDEX idx_salemate_inventory_developer ON public."salemate-inventory"(developer);
CREATE INDEX idx_salemate_inventory_area ON public."salemate-inventory"(area);
CREATE INDEX idx_salemate_inventory_property_type ON public."salemate-inventory"(property_type);
CREATE INDEX idx_salemate_inventory_price ON public."salemate-inventory"(price_in_egp);
CREATE INDEX idx_salemate_inventory_unit_id ON public."salemate-inventory"(unit_id);
```

### Row Level Security Policies

**View Policy** (Public Read):
```sql
CREATE POLICY "Anyone can view inventory"
ON public."salemate-inventory"
FOR SELECT
USING (true);
```

**Manage Policy** (Admin Only):
```sql
CREATE POLICY "Only admins can manage inventory"
ON public."salemate-inventory"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
```

---

## Features

### 1. Property Listing

#### Table View
- Comprehensive property information in tabular format
- Sortable columns
- Responsive design with horizontal scroll on mobile
- Property images with fallback icons
- Badge indicators for property status

#### Displayed Columns
1. **Compound**: Property compound name
2. **Developer**: Developer name
3. **Area**: Geographic area
4. **Unit**: Unit number and building
5. **Type**: Property type and finishing status
6. **Bed/Bath**: Number of bedrooms and bathrooms
7. **Size**: Unit area in square meters
8. **Floor**: Floor number
9. **Price**: Total price in EGP
10. **Price/m²**: Price per square meter
11. **Ready By**: Completion date
12. **Status**: Launch, offers, sale type badges
13. **Actions**: View details button

### 2. Search Functionality

#### Search Fields
Searches across multiple fields:
- Unit ID
- Unit number
- Building number
- Compound name
- Developer name
- Area name

#### Implementation
```typescript
query = query.or(`
  unit_id.ilike.%${search}%,
  unit_number.ilike.%${search}%,
  building_number.ilike.%${search}%,
  compound.ilike.%${search}%,
  developer.ilike.%${search}%,
  area.ilike.%${search}%
`);
```

### 3. Advanced Filtering

#### Location Filters
- **Compound**: Filter by compound name
- **Area**: Filter by area name
- **Developer**: Filter by developer name

#### Property Details Filters
- **Property Type**: Apartment, Villa, Townhouse, etc.
- **Finishing Status**: Finished, Semi-Finished, Not Finished, Furnished, Flexi Finished
- **Sale Type**: Primary, Secondary, etc.
- **Ready By**: Filter by completion year

#### Size & Specifications Filters
- **Bedrooms**: Min/Max range (0-10)
- **Bathrooms**: Min/Max range
- **Area**: Min/Max in square meters
- **Floor Number**: Specific floor

#### Price Filters
- **Min Price**: Minimum price in EGP
- **Max Price**: Maximum price in EGP
- **Min Price/m²**: Minimum price per square meter
- **Max Price/m²**: Maximum price per square meter

#### Additional Filters
- **Unit Number**: Exact or partial match
- **Building Number**: Exact or partial match
- **Launch Properties**: Toggle for launch properties only

### 4. Sorting

#### Available Sort Options
1. **Newest First**: `created_at DESC`
2. **Oldest First**: `created_at ASC`
3. **Price: High to Low**: `price_in_egp DESC`
4. **Price: Low to High**: `price_in_egp ASC`
5. **Area: Large to Small**: `unit_area DESC`
6. **Area: Small to Large**: `unit_area ASC`
7. **Price/m²: High to Low**: `price_per_meter DESC`
8. **Price/m²: Low to High**: `price_per_meter ASC`
9. **Most Bedrooms**: `number_of_bedrooms DESC`
10. **Least Bedrooms**: `number_of_bedrooms ASC`
11. **Highest Floor**: `floor_number DESC`
12. **Lowest Floor**: `floor_number ASC`
13. **Unit ID: A-Z**: `unit_id ASC`
14. **Unit ID: Z-A**: `unit_id DESC`

#### Custom Priority Sorting

The system implements custom sorting logic that prioritizes specific compounds:

```typescript
// Priority compounds appear first
const priorityCompounds = ['mountain view', 'palm hills'];

// Sorting logic:
// 1. Priority compounds first
// 2. Mountain View before Palm Hills
// 3. Then other compounds
```

### 5. Statistics Dashboard

Four key metrics displayed:
1. **Total Properties**: Total count of properties in inventory
2. **Compounds**: Unique compound count
3. **Areas**: Unique area count
4. **Developers**: Unique developer count

### 6. Property Details Modal

Comprehensive property information display including:

#### Basic Information
- Unit ID
- Unit Number
- Building Number
- Floor Number

#### Location
- Compound
- Area
- Phase
- Developer

#### Specifications
- Unit Area (m²)
- Garden Area (m²)
- Roof Area (m²)
- Bedrooms
- Bathrooms

#### Pricing
- Total Price
- Price per m²
- Property Type
- Currency

#### Timeline
- Ready By date
- Last Updated date

#### Payment Plans
- Multiple payment plan options
- Years, Down Payment, Installment details
- Scrollable list for many plans

#### Special Offers
- Display of special offers or promotions

### 7. Pagination

- **Items Per Page**: 20 properties
- **Page Navigation**: Previous/Next buttons
- **Page Numbers**: Direct page selection (shows up to 5 pages)
- **Results Summary**: "Showing X of Y properties"

### 8. URL-Based Filtering

The system supports URL parameters for deep linking:

```
/inventory?compound=Mountain%20View
```

This automatically applies the compound filter when the page loads.

---

## API Reference

### Supabase Client Methods

#### Fetch Properties
```typescript
let query = supabase
  .from('salemate-inventory')
  .select('*', { count: 'exact' });

// Apply filters
if (filters.compound) {
  query = query.filter('compound', 'ilike', `%${filters.compound}%`);
}

if (filters.min_price) {
  query = query.gte('price_in_egp', filters.min_price);
}

// Apply sorting
query = query.order(sort.field, { ascending: sort.direction === 'asc' });

// Execute query
const { data, error, count } = await query;
```

#### Get Total Count
```typescript
const { count, error } = await supabase
  .from('salemate-inventory')
  .select('*', { count: 'exact', head: true });
```

#### Get Filter Options
```typescript
const { data, error } = await supabase
  .from('salemate-inventory')
  .select('compound, area, developer, property_type, finishing, sale_type')
  .limit(1000);
```

### Filter Query Examples

#### Compound Filter
```typescript
query = query.filter('compound', 'ilike', `%${compoundName}%`);
```

#### Price Range Filter
```typescript
if (minPrice) {
  query = query.gte('price_in_egp', minPrice);
}
if (maxPrice) {
  query = query.lte('price_in_egp', maxPrice);
}
```

#### Bedroom Range Filter
```typescript
if (minBedrooms !== undefined) {
  query = query.gte('number_of_bedrooms', minBedrooms);
}
if (maxBedrooms !== undefined) {
  query = query.lte('number_of_bedrooms', maxBedrooms);
}
```

---

## Components

### Main Components

#### `Inventory.tsx`
Main page component that orchestrates all inventory functionality.

**Location**: `src/pages/Inventory/Inventory.tsx`

**State**:
```typescript
{
  properties: BRDataProperty[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  showFilters: boolean;
  filters: BRDataPropertyFilters;
  sort: BRDataPropertySort;
  selectedProperty: BRDataProperty | null;
  isModalOpen: boolean;
  filterOptions: {
    compounds: string[];
    areas: string[];
    developers: string[];
    propertyTypes: string[];
    finishings: string[];
    saleTypes: string[];
  };
  cardCounts: {
    compounds: number;
    areas: number;
    developers: number;
  };
}
```

#### `PropertyDetailsModal.tsx`
Modal component for displaying detailed property information.

**Location**: `src/components/inventory/PropertyDetailsModal.tsx`

**Props**:
```typescript
{
  property: BRDataProperty | null;
  isOpen: boolean;
  onClose: () => void;
}
```

**Features**:
- Parses JSON fields (compound, area, developer, etc.)
- Displays payment plans
- Shows special offers
- Responsive grid layout
- Scrollable content for long lists

### Supporting Components

- `PageTitle.tsx`: Page header component
- `Card.tsx`: Reusable card component
- `Badge.tsx`: Status badge component
- `Button.tsx`: Action button component
- `Input.tsx`: Search input component

---

## Data Types

### BRDataProperty

```typescript
interface BRDataProperty {
  id: number;
  unit_id?: string;
  unit_number?: string;
  building_number?: string;
  compound?: string | { name: string; [key: string]: unknown };
  developer?: string | { name: string; [key: string]: unknown };
  area?: string | { name: string; [key: string]: unknown };
  property_type?: string | { name: string; [key: string]: unknown };
  number_of_bedrooms?: number;
  number_of_bathrooms?: number;
  unit_area?: number;
  garden_area?: number;
  roof_area?: number;
  floor_number?: number;
  price_in_egp?: number;
  price_per_meter?: number;
  currency?: string;
  finishing?: string;
  sale_type?: string;
  is_launch?: boolean;
  ready_by?: string;
  offers?: string;
  payment_plans?: string;
  image?: string;
  phase?: string | { name: string; [key: string]: unknown };
  original_unit_id?: string;
  last_inventory_update?: string;
  created_at?: string;
  updated_at?: string;
}
```

### BRDataPropertyFilters

```typescript
interface BRDataPropertyFilters {
  search?: string;
  compound?: string;
  area?: string;
  developer?: string;
  property_type?: string;
  finishing?: string;
  sale_type?: string;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  min_price_per_meter?: number;
  max_price_per_meter?: number;
  floor_number?: number;
  unit_number?: string;
  building_number?: string;
  ready_by?: number;
  is_launch?: boolean;
}
```

### BRDataPropertySort

```typescript
interface BRDataPropertySort {
  field: 
    | 'created_at'
    | 'price_in_egp'
    | 'unit_area'
    | 'price_per_meter'
    | 'number_of_bedrooms'
    | 'floor_number'
    | 'unit_id';
  direction: 'asc' | 'desc';
}
```

---

## Usage Examples

### Basic Property Fetching

```typescript
import { supabase } from '../../lib/supabaseClient';

async function fetchProperties() {
  const { data, error } = await supabase
    .from('salemate-inventory')
    .select('*')
    .limit(20);

  if (error) {
    console.error('Error fetching properties:', error);
    return;
  }

  return data;
}
```

### Filtering Properties

```typescript
async function fetchFilteredProperties(filters: BRDataPropertyFilters) {
  let query = supabase
    .from('salemate-inventory')
    .select('*', { count: 'exact' });

  if (filters.compound) {
    query = query.filter('compound', 'ilike', `%${filters.compound}%`);
  }

  if (filters.min_price) {
    query = query.gte('price_in_egp', filters.min_price);
  }

  if (filters.max_price) {
    query = query.lte('price_in_egp', filters.max_price);
  }

  const { data, error, count } = await query;
  return { data, count };
}
```

### Getting Filter Options

```typescript
async function getFilterOptions() {
  const { data, error } = await supabase
    .from('salemate-inventory')
    .select('compound, area, developer, property_type, finishing, sale_type')
    .limit(1000);

  if (error) return { compounds: [], areas: [], developers: [] };

  const compounds = new Set<string>();
  const areas = new Set<string>();
  const developers = new Set<string>();

  data?.forEach((property) => {
    // Parse compound
    const compound = parseJsonField(property.compound);
    if (compound?.name) compounds.add(compound.name);

    // Parse area
    const area = parseJsonField(property.area);
    if (area?.name) areas.add(area.name);

    // Parse developer
    const developer = parseJsonField(property.developer);
    if (developer?.name) developers.add(developer.name);
  });

  return {
    compounds: Array.from(compounds).sort(),
    areas: Array.from(areas).sort(),
    developers: Array.from(developers).sort(),
  };
}
```

### Parsing JSON Fields

```typescript
function parseJsonField(field: unknown): { name: string } | null {
  if (typeof field === 'object' && field !== null) {
    return field as { name: string };
  }
  
  if (typeof field === 'string') {
    try {
      // Handle Python dict format: {'name': 'Value'}
      const cleaned = field.replace(/'/g, '"');
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
  
  return null;
}
```

---

## Data Flow

### Property Loading Flow

```
Component mounts
    ↓
loadProperties() called
    ↓
Build Supabase query with filters
    ↓
Apply sorting
    ↓
Execute query with pagination
    ↓
Custom sort (priority compounds)
    ↓
Update state with properties
    ↓
Render table
```

### Filter Application Flow

```
User changes filter
    ↓
Update filters state
    ↓
loadProperties() triggered (useEffect)
    ↓
Reset to page 1
    ↓
Build new query with filters
    ↓
Fetch filtered results
    ↓
Update UI
```

### URL Parameter Flow

```
Page loads with ?compound=...
    ↓
useEffect detects URL param
    ↓
Decode compound name
    ↓
Set filter state
    ↓
Show filters panel
    ↓
loadProperties() with filter
    ↓
Display filtered results
```

---

## Performance Optimizations

### 1. Pagination
- Only loads 20 properties per page
- Reduces initial load time
- Improves rendering performance

### 2. Indexed Queries
- Database indexes on frequently filtered columns
- Fast compound, developer, area lookups
- Optimized price range queries

### 3. Batch Filter Options Loading
- Loads filter options in batches of 1000
- Processes unique values client-side
- Caches filter options

### 4. Memoization
- Filtered results memoized
- Prevents unnecessary re-renders
- Optimizes filter application

### 5. Lazy Loading
- Property details modal loads on demand
- Images loaded as needed
- Payment plans parsed only when viewing details

---

## Error Handling

### Loading States
- Skeleton loaders during data fetch
- Loading indicators for async operations
- Graceful degradation on errors

### Error States
- User-friendly error messages
- Retry functionality
- Fallback to default values

### Data Validation
- Type checking for JSON fields
- Safe parsing with try-catch
- Default values for missing data

---

## Security

### Row Level Security

**Public Read Access**:
- Anyone can view inventory properties
- No authentication required for viewing
- Supports public property browsing

**Admin Write Access**:
- Only admins can modify inventory
- Prevents unauthorized data changes
- Maintains data integrity

### Data Sanitization

- Input validation on filters
- SQL injection prevention via Supabase client
- XSS protection in React rendering

---

## Troubleshooting

### Properties Not Loading

1. **Check Database Connection**
   - Verify Supabase connection
   - Check network connectivity
   - Review browser console for errors

2. **Check RLS Policies**
   - Ensure view policy is active
   - Verify user permissions

3. **Check Query Filters**
   - Verify filter syntax
   - Check for conflicting filters
   - Review filter values

### Filter Options Not Populating

1. **Check Data Format**
   - Verify JSON field structure
   - Check for parsing errors
   - Review console logs

2. **Check Query Limits**
   - Ensure sufficient data fetched
   - Check batch size limits
   - Verify data exists

### Performance Issues

1. **Reduce Pagination Size**
   - Lower items per page
   - Implement virtual scrolling

2. **Optimize Queries**
   - Add missing indexes
   - Reduce filter complexity
   - Use selective field queries

3. **Cache Filter Options**
   - Store filter options in state
   - Avoid repeated queries
   - Use React Query for caching

---

## Future Enhancements

1. **Map View**: Geographic visualization of properties
2. **Comparison Tool**: Compare multiple properties side-by-side
3. **Favorites**: Save favorite properties
4. **Export**: Export filtered results to CSV/Excel
5. **Advanced Analytics**: Property market analysis
6. **Image Gallery**: Multiple images per property
7. **Virtual Tours**: 360° property views
8. **Booking System**: Schedule property viewings
9. **Price Alerts**: Notifications for price changes
10. **Mobile App**: Native mobile application

---

## Related Documentation

- [Database Schema Documentation](./database-schema.md)
- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Component Library](./components.md)

---

## API Endpoints (Supabase)

### Base URL
```
https://[project-ref].supabase.co/rest/v1/salemate-inventory
```

### Headers
```
apikey: [your-anon-key]
Authorization: Bearer [your-jwt-token]
```

### Example Requests

**Get Properties**:
```
GET /salemate-inventory?select=*&limit=20&offset=0
```

**Filter by Compound**:
```
GET /salemate-inventory?compound=ilike.*Mountain%20View*&select=*
```

**Filter by Price Range**:
```
GET /salemate-inventory?price_in_egp=gte.1000000&price_in_egp=lte.5000000&select=*
```

---

**Last Updated**: 2024
**Version**: 1.0.0


# Edge Function Templates

This folder contains templates for creating new Edge Functions with consistent patterns.

## Available Templates

### 1. basic-function.ts
Use for simple functions that don't require authentication.

**Features**:
- CORS handling
- Request body parsing
- Field validation
- Error handling
- Success/error responses

**Example Use Cases**:
- Public webhooks
- Health checks
- Public API endpoints

### 2. authenticated-function.ts
Use for functions that require user authentication.

**Features**:
- All basic function features
- User authentication
- Authenticated Supabase client
- User context available

**Example Use Cases**:
- User-specific operations
- Protected API endpoints
- Personal data access

### 3. admin-function.ts
Use for functions that require admin role.

**Features**:
- All authenticated function features
- Role-based access control
- Admin-only operations

**Example Use Cases**:
- User management
- System configuration
- Administrative tasks

## Creating a New Function

### Step 1: Choose a Template

```bash
cp _templates/authenticated-function.ts your-function-name/index.ts
```

### Step 2: Update Types

```typescript
// Define your request body
interface RequestBody {
  userId: string;
  action: string;
}

// Define your response
interface ResponseData {
  success: boolean;
  result: string;
}
```

### Step 3: Implement Business Logic

```typescript
// Your business logic here
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('user_id', user.id);

if (error) throw error;

const result: ResponseData = {
  success: true,
  result: 'Operation completed',
};

return successResponse(result);
```

### Step 4: Deploy

```bash
supabase functions deploy your-function-name
```

## Core Utilities

All templates use utilities from `_core/`:

- **cors.ts** - CORS headers configuration
- **errors.ts** - Error handling and response helpers
- **auth.ts** - Authentication utilities
- **validation.ts** - Input validation helpers

## Best Practices

1. **Always validate input** - Use `validateRequired()` and specific validators
2. **Handle errors properly** - Use `try/catch` and `errorResponse()`
3. **Type everything** - Define interfaces for requests and responses
4. **Log appropriately** - Use `console.log()` for debugging, `console.error()` for errors
5. **Keep functions focused** - One function, one responsibility
6. **Document your function** - Add JSDoc comments for complex logic

## Example: Complete Function

```typescript
/**
 * Update User Profile
 * 
 * Allows authenticated users to update their own profile
 */

import { corsHeaders } from '../_core/cors.ts';
import { errorResponse, successResponse, ApiError, ErrorCodes } from '../_core/errors.ts';
import { getAuthenticatedUser } from '../_core/auth.ts';
import { parseRequestBody, validateRequired, validateEmail } from '../_core/validation.ts';

interface RequestBody {
  name?: string;
  email?: string;
  phone?: string;
}

interface ResponseData {
  profile: {
    id: string;
    name: string;
    email: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user, supabase } = await getAuthenticatedUser(req);
    const body = await parseRequestBody<RequestBody>(req);

    // Validate email if provided
    if (body.email && !validateEmail(body.email)) {
      throw new ApiError('Invalid email format', ErrorCodes.VALIDATION_ERROR, 400);
    }

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return successResponse({ profile: data });

  } catch (error) {
    return errorResponse(error);
  }
});
```

## Testing

Test your function locally:

```bash
supabase functions serve your-function-name
```

Then call it:

```bash
curl -X POST http://localhost:54321/functions/v1/your-function-name \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"exampleField": "test"}'
```

## Common Patterns

### Pattern 1: Database Operations

```typescript
// Read
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id);

// Insert
const { data, error } = await supabase
  .from('table_name')
  .insert({ field: value });

// Update
const { data, error } = await supabase
  .from('table_name')
  .update({ field: value })
  .eq('id', id);

// Delete
const { data, error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', id);
```

### Pattern 2: Calling RPCs

```typescript
const { data, error } = await supabase
  .rpc('function_name', {
    param1: value1,
    param2: value2,
  });
```

### Pattern 3: External API Calls

```typescript
const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  },
  body: JSON.stringify({ data: body.data }),
});

if (!response.ok) {
  throw new ApiError('External API call failed', ErrorCodes.INTERNAL_ERROR, 500);
}

const result = await response.json();
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure you handle OPTIONS requests
2. **Auth Errors**: Check that Authorization header is present and valid
3. **Type Errors**: Define proper TypeScript interfaces
4. **Timeout**: Keep functions under 60 seconds execution time

### Debugging

Add logging:

```typescript
console.log('Request received:', { body, userId: user.id });
console.error('Error occurred:', error);
```

Check logs:

```bash
supabase functions logs your-function-name
```

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- Project Architecture: `../../../ARCHITECTURE_OVERVIEW.md`


# Execute Migrations Via MCP

## Migration Files Ready

All 4 migration files are ready to execute:

1. `supabase/migrations/20250120000001_create_consolidated_schema.sql`
2. `supabase/migrations/20250120000002_create_consolidated_rls_policies.sql`
3. `supabase/migrations/20250120000003_migrate_data_to_consolidated_tables.sql`
4. `supabase/migrations/20250120000004_create_wallet_balance_function.sql`

## To Execute via MCP

Since MCP is available, please execute each migration file using your MCP database tool. The SQL content is ready in each file.

**Note**: If you can provide the exact MCP server name (e.g., "postgres", "supabase", "database"), I can execute them directly via the `call_mcp_tool` function.


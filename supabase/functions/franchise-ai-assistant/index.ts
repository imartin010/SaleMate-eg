import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.68.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface FranchiseAIAssistantRequest {
  question: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is CEO or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'ceo' && profile.role !== 'admin')) {
      return new Response(
        JSON.stringify({ error: 'Access denied. CEO or Admin role required.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const { question, conversationHistory = [] }: FranchiseAIAssistantRequest = await req.json();

    if (!question || !question.trim()) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all franchises with their analytics
    const { data: franchises, error: franchisesError } = await supabase
      .from('performance_franchises')
      .select('id, name, slug, headcount, is_active')
      .order('name');

    if (franchisesError) {
      console.error('Error fetching franchises:', franchisesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch franchises data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to parse JSON strings from inventory fields
    // Handles format like: "{'id': 15, 'name': 'Mountain View'}"
    const parseInventoryField = (field: string | null): string | null => {
      if (!field) return null;
      
      // Try to extract name using regex (most reliable for this format)
      // Updated regex to handle trailing spaces and be more flexible
      const nameMatch = field.match(/'name':\s*'([^']+)'/);
      if (nameMatch && nameMatch[1]) {
        return nameMatch[1].trim();
      }
      
      // Fallback: try JSON parsing
      try {
        // Replace single quotes with double quotes for valid JSON
        const jsonString = field.replace(/'/g, '"');
        const parsed = JSON.parse(jsonString);
        const name = parsed.name || field;
        return typeof name === 'string' ? name.trim() : name;
      } catch {
        // Last resort: return the original string trimmed
        return typeof field === 'string' ? field.trim() : field;
      }
    };

    // Helper function to normalize text for searching (case-insensitive, trimmed)
    const normalizeForSearch = (text: string | null): string | null => {
      if (!text) return null;
      return text.trim().toLowerCase();
    };

    // OPTIMIZATION: Fetch all data in parallel using Promise.all
    const franchiseIds = (franchises || []).map(f => f.id);
    
    // Parallel fetch: transactions, expenses, commission cuts for all franchises at once
    const [transactionsResult, expensesResult, commissionCutsResult] = await Promise.all([
      // Get aggregated transaction data with project info in one query
      supabase
        .from('performance_transactions')
        .select('franchise_id, transaction_amount, stage, commission_amount, project_id, tax_amount, withholding_tax, income_tax')
        .in('franchise_id', franchiseIds),
      
      // Get all expenses
      supabase
        .from('performance_expenses')
        .select('*')
        .in('franchise_id', franchiseIds),
      
      // Get all commission cuts
      supabase
        .from('performance_commission_cuts')
        .select('*')
        .in('franchise_id', franchiseIds),
    ]);

    const allTransactions = transactionsResult.data || [];
    const allExpenses = expensesResult.data || [];
    const allCommissionCuts = commissionCutsResult.data || [];

    // Get unique project IDs and fetch inventory in parallel
    const projectIds = [...new Set(allTransactions.map((t: any) => t.project_id).filter(Boolean))];
    let inventoryMap: Record<number, any> = {};
    
    if (projectIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: inventoryData } = await (supabase as any)
        .from('salemate-inventory')
        .select('id, compound, developer, area')
        .in('id', projectIds);
      
      if (inventoryData) {
        inventoryData.forEach((item: any) => {
          inventoryMap[item.id] = item;
        });
      }
    }

    // Group data by franchise and process in parallel
    const franchiseAnalytics: Array<{
      franchise: any;
      analytics: any;
      transactions: any[];
    }> = [];

    for (const franchise of franchises || []) {
      const franchiseTransactions = allTransactions.filter((t: any) => t.franchise_id === franchise.id);
      const franchiseExpenses = allExpenses.filter((e: any) => e.franchise_id === franchise.id);
      const franchiseCommissionCuts = allCommissionCuts.filter((c: any) => c.franchise_id === franchise.id);

      if (franchiseTransactions.length > 0) {
        // Process transactions to extract project details
        const processedTransactions = franchiseTransactions.map((t: any) => {
          const inventory = inventoryMap[t.project_id];
          const compound = parseInventoryField(inventory?.compound);
          const developer = parseInventoryField(inventory?.developer);
          const area = parseInventoryField(inventory?.area);
          
          return {
            transaction_amount: parseFloat(t.transaction_amount),
            commission_amount: t.commission_amount ? parseFloat(t.commission_amount) : 0,
            stage: t.stage,
            project_id: t.project_id,
            compound: compound,
            developer: developer,
            area: area,
            compound_normalized: normalizeForSearch(compound),
            developer_normalized: normalizeForSearch(developer),
            area_normalized: normalizeForSearch(area),
          };
        });

        // Calculate analytics - only use contracted transactions for revenue/profit calculations
        const contractedTransactions = franchiseTransactions.filter((t: any) => t.stage === 'contracted');
        const gross_revenue = contractedTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
        const total_sales_volume = contractedTransactions.reduce((sum, t) => sum + parseFloat(t.transaction_amount), 0);
        const total_expenses = franchiseExpenses.reduce((sum, e) => sum + e.amount, 0);
        const fixed_expenses = franchiseExpenses.filter(e => e.expense_type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
        const variable_expenses = franchiseExpenses.filter(e => e.expense_type === 'variable').reduce((sum, e) => sum + e.amount, 0);
        
        const millions = total_sales_volume / 1_000_000;
        const commission_cuts_total = franchiseCommissionCuts.reduce((sum, cut) => sum + (cut.cut_per_million * millions), 0);
        
        // Calculate taxes
        const totalTaxes = contractedTransactions.reduce((sum, t) => {
          const tax = (t.tax_amount || 0) + (t.withholding_tax || 0) + (t.income_tax || 0);
          return sum + tax;
        }, 0);

        const net_revenue = gross_revenue - total_expenses - commission_cuts_total;
        const net_profit = gross_revenue - total_expenses - commission_cuts_total - totalTaxes;

        franchiseAnalytics.push({
          franchise: {
            id: franchise.id,
            name: franchise.name,
            headcount: franchise.headcount,
            is_active: franchise.is_active,
          },
          analytics: {
            gross_revenue,
            net_revenue,
            net_profit,
            total_sales_volume,
            total_expenses,
            fixed_expenses,
            variable_expenses,
            commission_cuts_total,
            total_taxes: totalTaxes,
            contracted_deals_count: contractedTransactions.length,
            total_deals_count: franchiseTransactions.length,
            cost_per_agent: franchise.headcount > 0 ? total_expenses / franchise.headcount : 0,
            performance_per_agent: franchise.headcount > 0 ? total_sales_volume / franchise.headcount : 0,
          },
          transactions: processedTransactions,
        });
      }
    }

    // Build context for AI - optimize by aggregating transactions
    const franchiseDataContext = franchiseAnalytics.map(({ franchise, analytics, transactions }) => {
      // Aggregate transactions by project/developer/area to reduce token usage
      // Group by unique combination of compound+developer+area
      const transactionGroups: Record<string, {
        compound: string | null;
        developer: string | null;
        area: string | null;
        compound_normalized: string | null;
        developer_normalized: string | null;
        area_normalized: string | null;
        total_amount: number;
        count: number;
        contracted_amount: number;
        contracted_count: number;
      }> = {};

      transactions.forEach((t: any) => {
        // Create a unique key for grouping
        const key = `${t.compound_normalized || ''}|${t.developer_normalized || ''}|${t.area_normalized || ''}`;
        
        if (!transactionGroups[key]) {
          transactionGroups[key] = {
            compound: t.compound,
            developer: t.developer,
            area: t.area,
            compound_normalized: t.compound_normalized,
            developer_normalized: t.developer_normalized,
            area_normalized: t.area_normalized,
            total_amount: 0,
            count: 0,
            contracted_amount: 0,
            contracted_count: 0,
          };
        }
        
        transactionGroups[key].total_amount += t.transaction_amount;
        transactionGroups[key].count += 1;
        
        if (t.stage === 'contracted') {
          transactionGroups[key].contracted_amount += t.transaction_amount;
          transactionGroups[key].contracted_count += 1;
        }
      });

      // Convert to array and sort by total amount (descending) - keep top 20 to reduce tokens and speed up
      const topTransactions = Object.values(transactionGroups)
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 20);

      return {
        name: franchise.name,
        headcount: franchise.headcount,
        is_active: franchise.is_active,
        // Financial metrics - net_revenue is what appears on dashboard as "P&L Amount"
        gross_revenue: Math.round(analytics.gross_revenue),
        net_revenue: Math.round(analytics.net_revenue), // This matches the dashboard's "P&L Amount" exactly
        net_profit: Math.round(analytics.net_profit), // Net profit after taxes (for reference only)
        total_expenses: Math.round(analytics.total_expenses),
        commission_cuts_total: Math.round(analytics.commission_cuts_total),
        total_sales_volume: Math.round(analytics.total_sales_volume),
        contracted_deals: analytics.contracted_deals_count,
        total_deals: analytics.total_deals_count,
        performance_per_agent: Math.round(analytics.performance_per_agent),
        // Send aggregated transaction data instead of all individual transactions
        projects: topTransactions.map(t => ({
          compound: t.compound,
          developer: t.developer,
          area: t.area,
          compound_normalized: t.compound_normalized,
          developer_normalized: t.developer_normalized,
          area_normalized: t.area_normalized,
          total_sales: Math.round(t.total_amount),
          total_deals: t.count,
          contracted_sales: Math.round(t.contracted_amount),
          contracted_deals: t.contracted_count,
        })),
      };
    });

    // Build system prompt
    const systemPrompt = `You are an AI assistant for a CEO managing multiple real estate franchises. Your role is to answer questions about franchise performance, sales, profitability, and operations.

CRITICAL UNDERSTANDING:
- FRANCHISES are the business entities (e.g., "Advantage", "Core", "Elite", "Empire", "Experts")
- PROJECTS/COMPOUNDS are real estate developments (e.g., "Badya", "Central Park - Aliva", "Club Park - Aliva")
- DEVELOPERS are the companies that build projects (e.g., "Mountain View", "Palm Hills Developments")
- AREAS are locations (e.g., "Mostakbal City", "October Gardens", "New Cairo")

When someone asks "who is the most selling franchise in [PROJECT NAME]", they are asking:
"Which FRANCHISE has the most sales for transactions related to the PROJECT/COMPOUND called [PROJECT NAME]?"

You have access to data about all franchises including:
- Franchise names (e.g., "Advantage", "Core", "Elite")
- Sales volumes and revenue (based on contracted deals)
- Profitability (net profit)
- Number of agents (headcount)
- Expenses and costs
- Number of contracted deals (contracted_deals_count) and total deals (total_deals_count)
- Performance metrics per agent
- **Aggregated project data** grouped by compound/developer/area combinations:
  * Total sales volume per project (total_sales)
  * Total number of deals per project (total_deals)
  * Contracted sales volume per project (contracted_sales)
  * Number of contracted deals per project (contracted_deals)
  * Project/Compound names (e.g., "Badya", "Central Park - Aliva")
  * Developer names (e.g., "Mountain View", "Palm Hills Developments")
  * Area/Location names (e.g., "Mostakbal City", "October Gardens")
  * Normalized search fields (compound_normalized, developer_normalized, area_normalized) for case-insensitive matching

STEP-BY-STEP SEARCH PROCESS:
When answering questions like "who is the most selling franchise in [PROJECT/DEVELOPER/AREA]":
1. Understand that [PROJECT/DEVELOPER/AREA] is NOT a franchise name - it's a project, developer, or location
2. Normalize the search term: convert to lowercase and trim whitespace (e.g., "Central Park - Aliva" → "central park - aliva")
3. For EACH franchise in the data:
   a. Look through its "projects" array (this contains aggregated data grouped by compound/developer/area)
   b. Search for projects where ANY of these conditions match (use SUBSTRING/CONTAINS matching, not exact match):
      - compound_normalized includes/contains the normalized search term, OR
      - developer_normalized includes/contains the normalized search term, OR
      - area_normalized includes/contains the normalized search term
   c. Sum the total_sales for all matching projects
4. Compare the totals across all franchises
5. Identify which franchise has the highest total
6. Report: "[Franchise Name] is the most selling franchise in [PROJECT/DEVELOPER/AREA] with EGP [total amount] in sales"

MATCHING EXAMPLES:
- Search term "central park" should match "Central Park - Aliva" (partial match)
- Search term "aliva" should match "Central Park - Aliva" (partial match)
- Search term "badya" should match "Badya " (with trailing space)
- Search term "mountain view" should match "Mountain View" (case-insensitive)

EXAMPLE QUESTIONS AND ANSWERS:
Q: "who is the most selling franchise in Badya"
A: Search the "projects" array for each franchise, find projects where compound/developer/area matches "badya" (case-insensitive). Sum total_sales for matching projects per franchise. Report the franchise with highest total.

Q: "who is the most selling franchise in Central Park - Aliva"
A: Search the "projects" array for each franchise, find projects where compound matches "central park - aliva" (case-insensitive). Sum total_sales for matching projects per franchise. Report the franchise with highest total.

Q: "which franchise sells the most in Mountain View"
A: Search the "projects" array for each franchise, find projects where developer matches "mountain view" (case-insensitive). Sum total_sales for matching projects per franchise. Report the franchise with highest total.

When answering questions:
1. Be concise and data-driven
2. Reference specific franchise names and numbers
3. Use currency format: EGP (Egyptian Pounds)
4. If asked about "most selling" or "highest sales", use the total_sales field from the projects array
5. CRITICAL - P&L Amount / Profit & Loss Questions:
   - When asked about "P&L", "profit and loss", "operating at a loss", or "franchises losing money", you MUST use the net_revenue field DIRECTLY from the data
   - DO NOT calculate anything. DO NOT interpret. DO NOT modify the value.
   - net_revenue is the EXACT value shown on the dashboard as "P&L Amount" - it's already calculated correctly
   - Simply read the net_revenue value from the data and report it exactly as it appears
   - If net_revenue is POSITIVE (greater than 0): The franchise is PROFITABLE. Report the positive value (e.g., "EGP 3,150,876")
   - If net_revenue is NEGATIVE (less than 0): The franchise is operating at a LOSS. Report the negative value with a minus sign (e.g., "-EGP 386,500")
   - When listing "franchises operating at a loss", ONLY include franchises where net_revenue < 0 (negative numbers)
   - NEVER say a franchise is "operating at a loss" if net_revenue is positive
   - Example: If net_revenue = 3150876, the dashboard shows "EGP 3,150,876" in green = PROFITABLE. Report it as profitable.
   - Example: If net_revenue = -386500, the dashboard shows "-EGP 386,500" in red = LOSS. Report it as a loss.
6. If asked about "contracted deals" or "closed deals", use the contracted_sales field from the projects array
7. The "projects" array contains aggregated data - each entry represents all transactions for that compound/developer/area combination
8. If you don't find any matching projects:
   - DO NOT say "I don't have data on a franchise named [X]" - that's wrong!
   - Instead say: "I don't have any transaction data for the project/developer/area '[X]' in the current dataset. The franchises may not have any sales for this property yet."
9. NEVER confuse project/compound names with franchise names. If someone mentions "Central Park - Aliva", "Badya", or "Mountain View", these are PROJECTS/DEVELOPERS, NOT franchises.
10. If you're unsure whether a term is a franchise or project, check the franchise names list first. If it's not in the franchise list, it's likely a project/developer/area name.
11. DATA ACCURACY - READ DIRECTLY, DO NOT CALCULATE:
   - The net_revenue values in the data are ALREADY CALCULATED and match the dashboard's "P&L Amount" exactly
   - DO NOT recalculate. DO NOT interpret. DO NOT modify.
   - Simply read net_revenue from the data and report it:
     * If net_revenue = 3150876 → Dashboard shows "EGP 3,150,876" (green) → Report: "EGP 3,150,876" (profitable)
     * If net_revenue = -386500 → Dashboard shows "-EGP 386,500" (red) → Report: "-EGP 386,500" (loss)
   - The sign (positive/negative) tells you everything: positive = profit, negative = loss
   - When asked "which franchises are losing money", ONLY list franchises where net_revenue < 0 (negative numbers)

Current franchise data with transaction details:
${JSON.stringify(franchiseDataContext, null, 2)}

Answer the user's question based on this data.`;

    // Build messages for OpenAI
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({ role: msg.role, content: msg.content });
    });

    // Add current question
    messages.push({ role: 'user', content: question });

    // Call OpenAI - use gpt-4o-mini for faster responses (10x faster, 60x cheaper)
    console.log('📍 Calling OpenAI for franchise assistant');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper than gpt-4o
      messages: messages,
      temperature: 0.7,
      max_tokens: 500, // Reduced for faster response
    });

    const aiResponse = completion.choices[0].message.content || 'I apologize, but I could not generate a response.';

    return new Response(
      JSON.stringify({
        answer: aiResponse,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in franchise-ai-assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

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

    // Fetch analytics for all franchises
    const franchiseAnalytics: Array<{
      franchise: any;
      analytics: any;
      transactions: any[];
    }> = [];

    for (const franchise of franchises || []) {
      // Get ALL transactions (not just contracted) to have complete data
      // This allows the AI to answer questions about all sales stages
      const { data: transactions } = await supabase
        .from('performance_transactions')
        .select('id, transaction_amount, stage, commission_amount, project_id, tax_amount, withholding_tax, income_tax')
        .eq('franchise_id', franchise.id)
        .order('created_at', { ascending: false });

      // Get expenses
      const { data: expenses } = await supabase
        .from('performance_expenses')
        .select('*')
        .eq('franchise_id', franchise.id);

      // Get commission cuts
      const { data: commissionCuts } = await supabase
        .from('performance_commission_cuts')
        .select('*')
        .eq('franchise_id', franchise.id);

      if (transactions && expenses && commissionCuts) {
        // Fetch project details for all transactions
        const projectIds = transactions.map((t: any) => t.project_id).filter(Boolean);
        let inventoryMap: Record<number, any> = {};
        
        if (projectIds.length > 0) {
          // Fetch inventory data - use type cast for table name with hyphen
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

        // Process transactions to extract project details
        const processedTransactions = transactions.map((t: any) => {
          const inventory = inventoryMap[t.project_id];
          const compound = parseInventoryField(inventory?.compound);
          const developer = parseInventoryField(inventory?.developer);
          const area = parseInventoryField(inventory?.area);
          
          return {
            id: t.id,
            transaction_amount: parseFloat(t.transaction_amount),
            commission_amount: t.commission_amount ? parseFloat(t.commission_amount) : 0,
            stage: t.stage, // Include stage so AI knows transaction status
            project_id: t.project_id,
            compound: compound,
            developer: developer,
            area: area,
            // Add normalized fields for better search matching
            compound_normalized: normalizeForSearch(compound),
            developer_normalized: normalizeForSearch(developer),
            area_normalized: normalizeForSearch(area),
          };
        });

        // Calculate analytics - only use contracted transactions for revenue/profit calculations
        const contractedTransactions = transactions.filter((t: any) => t.stage === 'contracted');
        const gross_revenue = contractedTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
        const total_sales_volume = contractedTransactions.reduce((sum, t) => sum + parseFloat(t.transaction_amount), 0);
        const total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const fixed_expenses = expenses.filter(e => e.expense_type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
        const variable_expenses = expenses.filter(e => e.expense_type === 'variable').reduce((sum, e) => sum + e.amount, 0);
        
        const millions = total_sales_volume / 1_000_000;
        const commission_cuts_total = commissionCuts.reduce((sum, cut) => sum + (cut.cut_per_million * millions), 0);
        
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
            slug: franchise.slug,
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
            total_deals_count: transactions.length, // All stages
            cost_per_agent: franchise.headcount > 0 ? total_expenses / franchise.headcount : 0,
            performance_per_agent: franchise.headcount > 0 ? total_sales_volume / franchise.headcount : 0,
          },
          transactions: processedTransactions, // Includes ALL transaction stages
        });
      }
    }

    // Build context for AI
    const franchiseDataContext = franchiseAnalytics.map(({ franchise, analytics, transactions }) => {
      return {
        name: franchise.name,
        slug: franchise.slug,
        headcount: franchise.headcount,
        is_active: franchise.is_active,
        gross_revenue: analytics.gross_revenue,
        net_profit: analytics.net_profit,
        total_sales_volume: analytics.total_sales_volume,
        total_expenses: analytics.total_expenses,
        contracted_deals: analytics.contracted_deals_count,
        cost_per_agent: analytics.cost_per_agent,
        performance_per_agent: analytics.performance_per_agent,
        transactions: transactions.map((t: any) => ({
          transaction_amount: t.transaction_amount,
          stage: t.stage, // Include stage (eoi, reservation, contracted, cancelled)
          compound: t.compound,
          developer: t.developer,
          area: t.area,
          // Include normalized fields for better search
          compound_normalized: t.compound_normalized,
          developer_normalized: t.developer_normalized,
          area_normalized: t.area_normalized,
        })),
      };
    });

    // Build system prompt
    const systemPrompt = `You are an AI assistant for a CEO managing multiple real estate franchises. Your role is to answer questions about franchise performance, sales, profitability, and operations.

You have access to data about all franchises including:
- Franchise names and locations
- Sales volumes and revenue (based on contracted deals)
- Profitability (net profit)
- Number of agents (headcount)
- Expenses and costs
- Number of contracted deals (contracted_deals_count) and total deals (total_deals_count)
- Performance metrics per agent
- **Detailed transaction data** including ALL transaction stages (eoi, reservation, contracted, cancelled):
  * Transaction amounts for each deal
  * Transaction stage (eoi, reservation, contracted, cancelled)
  * Project/Compound names (e.g., "Badya", "Club Park - Aliva")
  * Developer names (e.g., "Mountain View", "Palm Hills Developments")
  * Area/Location names (e.g., "Mostakbal City", "October Gardens")
  * Normalized search fields (compound_normalized, developer_normalized, area_normalized) for case-insensitive matching

IMPORTANT SEARCH INSTRUCTIONS:
When answering questions about specific locations, projects, or developers (like "Badya", "Mountain View", "Mostakbal City"):
1. Use CASE-INSENSITIVE matching - search terms may have different capitalization
2. Check ALL THREE fields: "compound", "developer", and "area" for matches
3. Use the normalized fields (compound_normalized, developer_normalized, area_normalized) for reliable matching
4. For "most selling" questions, calculate total transaction_amount for ALL matching transactions (regardless of stage)
5. For "contracted" or "closed" deals, filter by stage === "contracted"
6. Group results by franchise and sum transaction amounts
7. Identify which franchise has the highest total sales volume for that location/project/developer

When answering questions:
1. Be concise and data-driven
2. Reference specific franchise names and numbers
3. Use currency format: EGP (Egyptian Pounds)
4. If asked about "most selling" or "highest sales", calculate from transaction amounts
5. If asked about "most profitable", refer to net_profit
6. If asked about "contracted deals" or "closed deals", only count transactions with stage === "contracted"
7. If you don't have enough information, say so clearly

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

    // Call OpenAI
    console.log('📍 Calling OpenAI for franchise assistant');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
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

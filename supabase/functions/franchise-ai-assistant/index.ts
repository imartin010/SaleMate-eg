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

    // Fetch analytics for all franchises
    const franchiseAnalytics: Array<{
      franchise: any;
      analytics: any;
    }> = [];

    for (const franchise of franchises || []) {
      // Get transactions
      const { data: transactions } = await supabase
        .from('performance_transactions')
        .select('*')
        .eq('franchise_id', franchise.id)
        .eq('stage', 'contracted');

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
        // Calculate analytics
        const gross_revenue = transactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
        const total_sales_volume = transactions.reduce((sum, t) => sum + t.transaction_amount, 0);
        const total_expenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const fixed_expenses = expenses.filter(e => e.expense_type === 'fixed').reduce((sum, e) => sum + e.amount, 0);
        const variable_expenses = expenses.filter(e => e.expense_type === 'variable').reduce((sum, e) => sum + e.amount, 0);
        
        const millions = total_sales_volume / 1_000_000;
        const commission_cuts_total = commissionCuts.reduce((sum, cut) => sum + (cut.cut_per_million * millions), 0);
        
        // Calculate taxes
        const totalTaxes = transactions.reduce((sum, t) => {
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
            contracted_deals_count: transactions.length,
            cost_per_agent: franchise.headcount > 0 ? total_expenses / franchise.headcount : 0,
            performance_per_agent: franchise.headcount > 0 ? total_sales_volume / franchise.headcount : 0,
          },
        });
      }
    }

    // Build context for AI
    const franchiseDataContext = franchiseAnalytics.map(({ franchise, analytics }) => {
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
      };
    });

    // Build system prompt
    const systemPrompt = `You are an AI assistant for a CEO managing multiple real estate franchises. Your role is to answer questions about franchise performance, sales, profitability, and operations.

You have access to data about all franchises including:
- Franchise names and locations
- Sales volumes and revenue
- Profitability (net profit)
- Number of agents (headcount)
- Expenses and costs
- Number of contracted deals
- Performance metrics per agent

When answering questions:
1. Be concise and data-driven
2. Reference specific franchise names and numbers
3. Use currency format: EGP (Egyptian Pounds)
4. If asked about "most selling" or "highest sales", refer to total_sales_volume
5. If asked about "most profitable", refer to net_profit
6. If asked about a specific location (like "mountain view"), try to match it to franchise names or slugs
7. If you don't have enough information, say so clearly

Current franchise data:
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

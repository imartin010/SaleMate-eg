import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InventoryMatcherPayload {
  leadId: string;
  userId: string;
  totalBudget?: number;
  downPayment?: number;
  monthlyInstallment?: number;
  area?: string;
  minBedrooms?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: InventoryMatcherPayload = await req.json();
    const { leadId, userId, totalBudget, downPayment, monthlyInstallment, area, minBedrooms } = payload;

    if (!leadId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: leadId, userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate maximum affordable price based on inputs
    let maxPrice: number | undefined = totalBudget;

    // If downPayment and monthly installment are provided, estimate max price
    // Assuming typical Egyptian market: 5-7 year payment plans
    if (!maxPrice && downPayment && monthlyInstallment) {
      // Estimate: down payment + (monthly * 60 months) as conservative estimate
      const estimatedTotal = downPayment + (monthlyInstallment * 60);
      maxPrice = estimatedTotal;
    }

    if (!maxPrice) {
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient budget information. Provide totalBudget or both downPayment and monthlyInstallment' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query for salemate-inventory
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('salemate-inventory')
      .select('id, unit_id, unit_number, compound, area, developer, property_type, number_of_bedrooms, unit_area, price_in_egp, currency')
      .lte('price_in_egp', maxPrice)
      .order('price_in_egp', { ascending: true })
      .limit(10);

    // Apply additional filters if provided
    if (area) {
      query = query.ilike('area', `%${area}%`);
    }

    if (minBedrooms && minBedrooms > 0) {
      query = query.gte('number_of_bedrooms', minBedrooms);
    }

    const { data: units, error: queryError } = await query;

    if (queryError) throw queryError;

    const resultCount = units?.length || 0;

    // Generate recommendation based on results
    let recommendation: string;
    if (resultCount === 0) {
      recommendation = 'No matches found. Budget may be too low for current market or filters too restrictive. Consider: 1) Increasing budget, 2) Exploring different areas, 3) Adjusting bedroom requirements.';
    } else if (resultCount < 3) {
      recommendation = 'Limited options available. Consider expanding search criteria or increasing budget slightly to access more properties.';
    } else {
      recommendation = `Good matches found! ${resultCount} properties within budget. Present options to client and schedule viewings.`;
    }

    // Prepare top units data
    const topUnits = units?.map((unit: Record<string, unknown>) => ({
      id: unit.id,
      unit_id: unit.unit_id,
      unit_number: unit.unit_number,
      compound: typeof unit.compound === 'string' ? unit.compound : JSON.stringify(unit.compound),
      area: typeof unit.area === 'string' ? unit.area : JSON.stringify(unit.area),
      developer: typeof unit.developer === 'string' ? unit.developer : JSON.stringify(unit.developer),
      property_type: typeof unit.property_type === 'string' ? unit.property_type : JSON.stringify(unit.property_type),
      bedrooms: unit.number_of_bedrooms,
      unit_area: unit.unit_area,
      price: unit.price_in_egp,
      currency: unit.currency || 'EGP',
    }));

    // Store match result in events table
    const { data: matchResult, error: matchError } = await supabase
      .from('events')
      .insert({
        lead_id: leadId,
        activity_type: 'recommendation',
        actor_profile_id: userId,
        filters: {
          totalBudget,
          downPayment,
          monthlyInstallment,
          maxPrice,
          area,
          minBedrooms,
        },
        result_count: resultCount,
        top_units: topUnits,
        recommendation,
      })
      .select()
      .single();

    if (matchError) throw matchError;

    // Notify user about matches
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        userId,
        title: resultCount > 0 ? '🏠 Inventory Matches Found!' : '⚠️ No Inventory Matches',
        body: resultCount > 0 
          ? `Found ${resultCount} properties matching the budget criteria`
          : 'No properties found within budget. Review recommendations.',
        url: `/crm/case/${leadId}`,
        channels: ['inapp'],
      }),
    });

    console.log(`✅ Inventory match complete for lead ${leadId}: ${resultCount} units found`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: {
          resultCount,
          topUnits,
          recommendation,
          matchId: matchResult.id,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Inventory matcher error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


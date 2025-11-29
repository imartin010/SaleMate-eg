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
  propertyType?: string;
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
    const { leadId, userId, totalBudget, downPayment, monthlyInstallment, area, minBedrooms, propertyType } = payload;

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
    // Find units where price_in_egp is within budget (less than or equal to maxPrice)
    // Query more units to ensure we get 10 unique developers after filtering
    // Prioritize units near the budget by ordering descending (highest prices first)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('salemate-inventory')
      .select('id, unit_id, unit_number, compound, area, developer, property_type, number_of_bedrooms, unit_area, price_in_egp, currency')
      .lte('price_in_egp', maxPrice) // Units with price_in_egp <= maxPrice (within budget)
      .gte('price_in_egp', 500000) // Exclude units with price less than 500,000 EGP
      .order('price_in_egp', { ascending: false }) // Order by price_in_egp descending (highest prices first - near budget)
      .limit(200); // Query more units to ensure we get units near the budget

    // Apply additional filters if provided
    if (area) {
      query = query.ilike('area', `%${area}%`);
    }

    if (minBedrooms && minBedrooms > 0) {
      query = query.gte('number_of_bedrooms', minBedrooms);
    }

    // Filter by property type if provided
    // property_type can be stored as JSON string like {"name": "Apartment"} or plain text
    if (propertyType) {
      // Use ilike to match property type in both JSON format and plain text
      query = query.ilike('property_type', `%${propertyType}%`);
    }

    const { data: units, error: queryError } = await query;

    if (queryError) throw queryError;

    // Prepare top units data - filter out units with price < 500,000 and ensure price_in_egp is used correctly
    const validUnits = (units || [])
      .filter((unit: Record<string, unknown>) => {
        // Exclude units with ID or name as "none", null, or undefined
        const unitId = String(unit.id || '').toLowerCase().trim();
        const compoundName = typeof unit.compound === 'string' 
          ? unit.compound.toLowerCase().trim()
          : (unit.compound ? JSON.stringify(unit.compound).toLowerCase().trim() : '');
        
        if (unitId === 'none' || !unitId || unitId === 'null' || unitId === 'undefined') {
          return false;
        }
        
        if (compoundName === 'none' || compoundName === 'null' || compoundName === 'undefined' || 
            compoundName === '""' || compoundName === "''") {
          return false;
        }
        
        // Ensure we're using price_in_egp column and it's >= 500,000
        const price = typeof unit.price_in_egp === 'number' 
          ? unit.price_in_egp 
          : parseFloat(String(unit.price_in_egp || '0'));
        return price >= 500000;
      })
      .map((unit: Record<string, unknown>) => {
        // Ensure price is a number
        const price = typeof unit.price_in_egp === 'number' 
          ? unit.price_in_egp 
          : parseFloat(String(unit.price_in_egp || '0'));
        
        return {
          id: unit.id,
          unit_id: unit.unit_id,
          unit_number: unit.unit_number,
          compound: typeof unit.compound === 'string' ? unit.compound : JSON.stringify(unit.compound),
          area: typeof unit.area === 'string' ? unit.area : JSON.stringify(unit.area),
          developer: typeof unit.developer === 'string' ? unit.developer : JSON.stringify(unit.developer),
          property_type: typeof unit.property_type === 'string' ? unit.property_type : JSON.stringify(unit.property_type),
          bedrooms: unit.number_of_bedrooms,
          unit_area: unit.unit_area,
          price: price, // Use the parsed price_in_egp value
          currency: unit.currency || 'EGP',
        };
      });

    // Units are already sorted by price descending from the query
    // No need to sort again, but ensure descending order
    validUnits.sort((a, b) => b.price - a.price);

    // Calculate budget threshold for "very near budget" 
    // Use 85%+ as threshold to ensure we get units very close to budget (e.g., 12M-13M for 14M budget)
    const veryNearBudgetThreshold = maxPrice * 0.85; // Units priced at 85%+ of budget (very near budget)

    // Filter to show only one unit per developer, but create three groups:
    // 1. Very near budget units (at least 25% - 3 units, prioritized by highest price)
    // 2. Other higher-priced units (remaining slots, still prioritizing higher prices)
    // 3. Lower price units (only if needed to fill slots)
    const developerMapVeryNear = new Map<string, any>();
    const developerMapHigh = new Map<string, any>();
    const developerMapLow = new Map<string, any>();
    const veryNearBudgetUnits: any[] = [];
    const highPriceUnits: any[] = [];
    const lowPriceUnits: any[] = [];
    
    // Target: At least 25% (3 units) very near budget (85%+ of budget)
    const veryNearTarget = 3; // At least 25% of 10 units
    
    // First pass: Collect units VERY near budget (85%+ of max budget, e.g., 12M-13M for 14M budget)
    // Since units are sorted by price descending, we iterate from start (highest prices)
    for (const unit of validUnits) {
      if (veryNearBudgetUnits.length >= veryNearTarget) break;
      
      // Only include units that are very close to budget (85%+ of maxPrice)
      // For 14M budget, this means units at 11.9M+ (ideally 12M-13M)
      if (unit.price < veryNearBudgetThreshold) continue;
      
      let developerName = '';
      if (typeof unit.developer === 'string') {
        try {
          const parsed = JSON.parse(unit.developer);
          developerName = parsed.name || parsed.id || unit.developer;
        } catch {
          developerName = unit.developer;
        }
      } else if (unit.developer && typeof unit.developer === 'object') {
        developerName = unit.developer.name || unit.developer.id || '';
      }
      
      if (developerName && !developerMapVeryNear.has(developerName)) {
        developerMapVeryNear.set(developerName, true);
        veryNearBudgetUnits.push(unit);
      }
    }
    
    // If we don't have enough units at 85%+, get the highest available prices
    // (prioritize highest prices regardless of threshold to ensure we show units near budget)
    if (veryNearBudgetUnits.length < veryNearTarget) {
      for (const unit of validUnits) {
        if (veryNearBudgetUnits.length >= veryNearTarget) break;
        
        // Skip if already selected
        if (veryNearBudgetUnits.some(u => u.id === unit.id)) continue;
        
        let developerName = '';
        if (typeof unit.developer === 'string') {
          try {
            const parsed = JSON.parse(unit.developer);
            developerName = parsed.name || parsed.id || unit.developer;
          } catch {
            developerName = unit.developer;
          }
        } else if (unit.developer && typeof unit.developer === 'object') {
          developerName = unit.developer.name || unit.developer.id || '';
        }
        
        if (developerName && !developerMapVeryNear.has(developerName)) {
          developerMapVeryNear.set(developerName, true);
          veryNearBudgetUnits.push(unit);
        }
      }
    }
    
    // Second pass: Fill remaining slots with other high-priced units (prioritizing higher prices)
    const remainingSlots = 10 - veryNearBudgetUnits.length;
    for (const unit of validUnits) {
      if (highPriceUnits.length >= remainingSlots) break;
      
      // Skip if already selected
      if (veryNearBudgetUnits.some(u => u.id === unit.id)) continue;
      
      let developerName = '';
      if (typeof unit.developer === 'string') {
        try {
          const parsed = JSON.parse(unit.developer);
          developerName = parsed.name || parsed.id || unit.developer;
        } catch {
          developerName = unit.developer;
        }
      } else if (unit.developer && typeof unit.developer === 'object') {
        developerName = unit.developer.name || unit.developer.id || '';
      }
      
      if (developerName && !developerMapHigh.has(developerName)) {
        developerMapHigh.set(developerName, true);
        highPriceUnits.push(unit);
      }
    }
    
    // Third pass: If we still need more units, fill with lower-priced units
    const finalRemainingSlots = 10 - veryNearBudgetUnits.length - highPriceUnits.length;
    if (finalRemainingSlots > 0) {
      // Sort remaining units by price ascending to get lowest prices
      const remainingUnits = validUnits.filter(u => 
        !veryNearBudgetUnits.some(v => v.id === u.id) && 
        !highPriceUnits.some(v => v.id === u.id)
      );
      remainingUnits.sort((a, b) => a.price - b.price);
      
      for (const unit of remainingUnits) {
        if (lowPriceUnits.length >= finalRemainingSlots) break;
        
        // Skip if already selected
        if (veryNearBudgetUnits.some(u => u.id === unit.id) || 
            highPriceUnits.some(u => u.id === unit.id)) continue;
        
        let developerName = '';
        if (typeof unit.developer === 'string') {
          try {
            const parsed = JSON.parse(unit.developer);
            developerName = parsed.name || parsed.id || unit.developer;
          } catch {
            developerName = unit.developer;
          }
        } else if (unit.developer && typeof unit.developer === 'object') {
          developerName = unit.developer.name || unit.developer.id || '';
        }
        
        if (developerName && !developerMapLow.has(developerName)) {
          developerMapLow.set(developerName, true);
          lowPriceUnits.push(unit);
        }
      }
    }
    
    // Combine: Very near budget first, then high prices, then low prices
    // All units are already sorted by price descending (highest first)
    const topUnits = [...veryNearBudgetUnits, ...highPriceUnits, ...lowPriceUnits].slice(0, 10);

    const resultCount = topUnits.length;

    // Generate recommendation based on results
    let recommendation: string;
    if (resultCount === 0) {
      recommendation = 'No matches found. Budget may be too low for current market or filters too restrictive. Consider: 1) Increasing budget, 2) Exploring different areas, 3) Adjusting bedroom requirements.';
    } else if (resultCount < 3) {
      recommendation = 'Limited options available. Consider expanding search criteria or increasing budget slightly to access more properties.';
    } else {
      recommendation = `Good matches found! ${resultCount} properties within budget. Present options to client and schedule viewings.`;
    }

    // Store match result in events table
    const { data: matchResult, error: matchError } = await supabase
      .from('events')
      .insert({
        lead_id: leadId,
        event_type: 'activity',
        activity_type: 'recommendation',
        actor_profile_id: userId,
        filters: {
          totalBudget,
          downPayment,
          monthlyInstallment,
          maxPrice,
          area,
          minBedrooms,
          propertyType,
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


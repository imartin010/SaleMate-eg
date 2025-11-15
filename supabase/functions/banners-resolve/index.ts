import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const { placement } = await req.json();

    const now = new Date().toISOString();

    // Get live banners from content table
    let query = supabaseClient
      .from('content')
      .select('*')
      .eq('content_type', 'banner')
      .eq('status', 'live')
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order('metadata->priority', { ascending: true, nullsLast: true })
      .order('start_at', { ascending: false, nullsFirst: true });

    if (placement) {
      query = query.eq('placement', placement);
    }

    const { data: banners, error } = await query;

    if (error) {
      throw error;
    }

    // Filter by audience (role) and transform to match old format
    const eligible = (banners || []).filter(banner => {
      const audience = banner.audience as any;
      if (audience && Array.isArray(audience) && audience.length > 0) {
        return audience.includes(profile?.role || 'user');
      }
      // Also check metadata.visibility_rules for backward compatibility
      const visibilityRules = (banner.metadata as any)?.visibility_rules;
      if (visibilityRules && Array.isArray(visibilityRules) && visibilityRules.length > 0) {
        return visibilityRules.includes(profile?.role || 'user');
      }
      return true; // Empty audience = show to all
    }).map(banner => ({
      ...banner,
      subtitle: banner.body,
      image_url: (banner.cta as any)?.image_url,
      cta_label: (banner.cta as any)?.cta_label,
      cta_url: (banner.cta as any)?.cta_url,
      priority: (banner.metadata as any)?.priority,
      visibility_rules: (banner.metadata as any)?.visibility_rules,
    }));

    return new Response(
      JSON.stringify({ banners: eligible }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Banners resolve error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


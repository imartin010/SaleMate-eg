// Supabase Edge Function: Config Update
// Guarded configuration updates with validation and audit logging

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { config_type, config_key, config_value, description } = await req.json();

    if (!config_type || !config_key) {
      return new Response(
        JSON.stringify({ error: 'Missing config_type or config_key' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate config type
    const validTypes = ['system_settings', 'feature_flags', 'payment_settings', 'branding'];
    if (!validTypes.includes(config_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid config_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get existing config
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .eq('config_type', config_type)
      .eq('config_key', config_key)
      .single();

    const oldValue = existing?.config_value;

    // Validate JSON if config_value is provided
    if (config_value !== undefined) {
      try {
        JSON.parse(JSON.stringify(config_value)); // Validate it's serializable
      } catch {
        return new Response(
          JSON.stringify({ error: 'Invalid config_value format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update or insert config
    const updateData: any = {
      config_type,
      config_key,
      updated_by: user.id,
      updated_at: new Date().toISOString()
    };

    if (config_value !== undefined) {
      updateData.config_value = config_value;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    let result;
    let error;

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('system_settings')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();
      result = updated;
      error = updateError;
    } else {
      // Insert new
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('system_settings')
        .insert({
          ...updateData,
          created_by: user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      result = inserted;
      error = insertError;
    }

    if (error) {
      throw error;
    }

    // Log audit
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'config_updated',
        user_id: user.id,
        resource_type: 'system_settings',
        resource_id: result.id,
        metadata: {
          config_type,
          config_key,
          old_value: oldValue,
          new_value: config_value
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        config: result,
        message: existing ? 'Config updated' : 'Config created'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Config update error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

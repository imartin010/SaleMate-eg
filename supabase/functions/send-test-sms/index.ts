// Supabase Edge Function: Send Test SMS
// Allows admins to send test SMS using templates

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

    const { template_id, recipient_phone, variables } = await req.json();

    if (!template_id || !recipient_phone) {
      return new Response(
        JSON.stringify({ error: 'Missing template_id or recipient_phone' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SMS template
    const { data: template, error: templateError } = await supabaseAdmin
      .from('sms_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: 'Template not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Replace variables in message
    let message = template.message || '';

    const vars = variables || {};
    Object.keys(vars).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, vars[key]);
    });

    // Log test SMS (in production, you'd send via Twilio)
    const { error: logError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        action: 'test_sms_sent',
        user_id: user.id,
        resource_type: 'sms_template',
        resource_id: template_id,
        metadata: {
          recipient: recipient_phone,
          template_name: template.name,
          message_length: message.length
        }
      });

    if (logError) {
      console.error('Failed to log test SMS:', logError);
    }

    // In production, integrate with Twilio here
    // For now, return success (you'll need to configure Twilio)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test SMS queued (configure Twilio for actual sending)',
        message_preview: message.substring(0, 50) + '...',
        message_length: message.length,
        character_count: message.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send test SMS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

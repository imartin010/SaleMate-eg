// Supabase Edge Function: CMS Preview
// Allows admins to preview draft CMS content before publishing

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

    const { content_id, content_type } = await req.json();

    if (!content_id || !content_type) {
      return new Response(
        JSON.stringify({ error: 'Missing content_id or content_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get draft content based on type
    let content;
    let error;

    switch (content_type) {
      case 'email_template':
        const { data: emailData, error: emailError } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .eq('id', content_id)
          .single();
        content = emailData;
        error = emailError;
        break;

      case 'sms_template':
        const { data: smsData, error: smsError } = await supabaseAdmin
          .from('sms_templates')
          .select('*')
          .eq('id', content_id)
          .single();
        content = smsData;
        error = smsError;
        break;

      case 'cms_page':
        const { data: cmsData, error: cmsError } = await supabaseAdmin
          .from('cms_pages')
          .select('*')
          .eq('id', content_id)
          .single();
        content = cmsData;
        error = cmsError;
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid content_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (error || !content) {
      return new Response(
        JSON.stringify({ error: 'Content not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('CMS preview error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

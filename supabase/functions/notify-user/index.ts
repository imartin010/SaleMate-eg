import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPayload {
  userId: string;
  title: string;
  body: string;
  url?: string;
  dueAt?: string;
  channels?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: NotifyPayload = await req.json();
    const { userId, title, body, url, channels = ['inapp'] } = payload;

    // Validate required fields
    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert notification
    const metadata = url ? { url } : {};

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        target_profile_id: userId,
        context: 'system',
        context_id: null,
        title,
        body,
        url,
        channels,
        metadata,
        status: channels.includes('inapp') ? 'sent' : 'pending',
        sent_at: channels.includes('inapp') ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If inapp notification, mark as sent immediately
    console.log(`✅ Notification created for user ${userId}: ${title}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


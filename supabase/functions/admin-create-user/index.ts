// Supabase Edge Function: Create User from Admin Panel
// This function creates a user in Supabase Auth and the profiles table

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is an admin
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { name, email, phone, password, role } = await req.json()

    // Validate required fields
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role
    const validRoles = ['user', 'manager', 'support', 'admin']
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Invalid role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        phone: phone || '',
        role: role,
      },
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user data returned' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Wait a moment for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check if profile was created by trigger
    const { data: profileData, error: profileCheckError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileCheckError || !profileData) {
      // Profile doesn't exist, create it manually
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: name,
          email: email,
          phone: phone || '',
          role: role,
          is_banned: false,
        })

      if (insertError) {
        // If profile creation fails, try to clean up auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return new Response(
          JSON.stringify({ error: `Failed to create profile: ${insertError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Profile exists, update role if needed
      if (profileData.role !== role) {
        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({ role: role })
          .eq('id', authData.user.id)

        if (updateError) {
          return new Response(
            JSON.stringify({ error: `Failed to update role: ${updateError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Log audit
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'create',
        entity: 'profiles',
        entity_id: authData.user.id,
        changes: {
          name: name,
          email: email,
          phone: phone || '',
          role: role,
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          phone: phone || '',
          role: role,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


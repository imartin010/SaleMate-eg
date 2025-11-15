import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
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

    // Get the authenticated user
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

    // Check if user is a manager or admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role, name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['manager', 'admin'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Only managers and admins can send team invitations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const { invitee_email } = await req.json();

    if (!invitee_email || typeof invitee_email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitee_email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if user is trying to invite themselves
    const { data: selfProfile } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (selfProfile?.email === invitee_email) {
      return new Response(
        JSON.stringify({ error: 'You cannot invite yourself' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if user is already in the team
    const { data: existingUser } = await supabaseClient
      .from('profiles')
      .select('id, name, manager_id')
      .eq('email', invitee_email)
      .maybeSingle();

    if (existingUser?.manager_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'This user is already in your team' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate a unique token
    const token = crypto.randomUUID();

    // Check if invitation already exists in team_members
    const { data: existingInvitation } = await supabaseClient
      .from('team_members')
      .select('*')
      .eq('invited_by', user.id)
      .eq('invited_email', invitee_email.toLowerCase())
      .eq('status', 'invited')
      .maybeSingle();

    let invitation;
    let inviteError;

    if (existingInvitation) {
      // Update existing invitation with new token
      const { data, error } = await supabaseClient
        .from('team_members')
        .update({
          invitation_token: token,
          invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('team_id', existingInvitation.team_id)
        .eq('profile_id', existingInvitation.profile_id || '00000000-0000-0000-0000-000000000000')
        .select()
        .single();
      
      invitation = data;
      inviteError = error;
    } else {
      // Create new invitation in team_members
      // First, get or create a team for this manager
      const { data: teamData } = await supabaseClient
        .from('teams')
        .select('id')
        .eq('owner_profile_id', user.id)
        .maybeSingle();
      
      let teamId = teamData?.id;
      if (!teamId) {
        const { data: newTeam } = await supabaseClient
          .from('teams')
          .insert({
            name: `${user.user_metadata?.name || user.email}'s Team`,
            owner_profile_id: user.id,
            team_type: 'sales'
          })
          .select('id')
          .single();
        teamId = newTeam?.id;
      }
      
      if (!teamId) {
        return new Response(
          JSON.stringify({ error: 'Failed to create team' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { data, error } = await supabaseClient
        .from('team_members')
        .insert({
          team_id: teamId,
          profile_id: existingUser?.id || null,
          invited_by: user.id,
          invited_email: invitee_email.toLowerCase(),
          invitation_token: token,
          status: 'invited',
          invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          role: 'agent'
        })
        .select()
        .single();
      
      invitation = data;
      inviteError = error;
    }

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create invitation',
          details: inviteError.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Generate invitation URL
    const siteUrl = Deno.env.get('SITE_URL') || 'https://salemate-eg.com';
    const invitationUrl = existingUser
      ? `${siteUrl}/app/team/accept-invitation?token=${token}`
      : `${siteUrl}/auth/signup?invitation=${token}&email=${encodeURIComponent(invitee_email)}`;

    // Create email template
    const emailHtml = getInvitationEmailTemplate(
      profile.name,
      invitee_email,
      invitationUrl,
      !!existingUser
    );

    // Send email only for NEW users (those without an account)
    // Existing users will see the invitation in-app
    try {
      if (!existingUser) {
        // User doesn't have an account - send email to invite them to sign up
        const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
        
        if (sendGridApiKey) {
          // Production: Send actual email via SendGrid
          console.log('Sending signup invitation email to:', invitee_email);
          
          const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sendGridApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: invitee_email }] }],
              from: { email: 'noreply@salemate-eg.com', name: 'SaleMate' },
              subject: `${profile.name} invited you to join their team on SaleMate`,
              content: [{ type: 'text/html', value: emailHtml }],
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('SendGrid error:', errorText);
            throw new Error('Failed to send email via SendGrid');
          }
          
          console.log('Email sent successfully via SendGrid');
        } else {
          // Development: Log invitation URL to console
          console.log('===================================');
          console.log('📧 DEVELOPMENT MODE - EMAIL NOT SENT');
          console.log('===================================');
          console.log('To:', invitee_email);
          console.log('From:', profile.name);
          console.log('Invitation URL:', invitationUrl);
          console.log('===================================');
          console.log('To enable email sending, add SENDGRID_API_KEY to your Supabase function secrets');
          console.log('===================================');
        }
      } else {
        // User already has an account - they'll see the invitation in-app
        console.log('===================================');
        console.log('✅ IN-APP INVITATION CREATED');
        console.log('===================================');
        console.log('User:', existingUser.name);
        console.log('Email:', invitee_email);
        console.log('Manager:', profile.name);
        console.log('The user will see this invitation when they log in');
        console.log('===================================');
      }

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails - invitation is still created
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invitation_url: invitationUrl,
        has_account: !!existingUser,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function getInvitationEmailTemplate(
  managerName: string,
  inviteeEmail: string,
  invitationUrl: string,
  hasAccount: boolean
): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation - SaleMate</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            line-height: 1.6; 
            color: #1a1a1a; 
            margin: 0; 
            padding: 0; 
            background-color: #f8fafc;
        }
        .container { 
            max-width: 640px; 
            margin: 0 auto; 
            background: #fff; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-radius: 16px;
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%); 
            color: white; 
            padding: 48px 32px; 
            text-align: center; 
            position: relative;
        }
        .content { 
            padding: 48px 32px; 
            background: #fff; 
        }
        .button { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            display: inline-block; 
            margin: 32px 0; 
            font-weight: 600; 
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.39);
        }
        .footer { 
            text-align: center; 
            padding: 32px; 
            background: #f8fafc; 
            color: #64748b; 
            font-size: 14px; 
            border-top: 1px solid #e2e8f0;
        }
        .logo { 
            font-size: 36px; 
            font-weight: 700; 
            margin-bottom: 12px;
        }
        .info-box { 
            background: #f1f5f9; 
            padding: 20px; 
            border-radius: 12px; 
            margin: 24px 0;
            border-left: 4px solid #3b82f6;
        }
        .link-box { 
            background: #f1f5f9; 
            padding: 16px; 
            border-radius: 12px; 
            margin: 24px 0; 
            word-break: break-all; 
            font-size: 14px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SaleMate</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 300;">Team Invitation</h1>
        </div>
        
        <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">You're Invited to Join a Team!</h2>
            
            <p style="font-size: 16px; color: #475569; line-height: 1.7;">
                <strong>${managerName}</strong> has invited you to join their team on <strong>SaleMate</strong>, 
                Egypt's premier real estate platform.
            </p>

            <div class="info-box">
                <p style="margin: 0; font-size: 14px; color: #475569;">
                    <strong>What this means:</strong><br>
                    • You'll be part of ${managerName}'s team<br>
                    • Access to shared leads and resources<br>
                    • Collaborative real estate management<br>
                    • Enhanced productivity tools
                </p>
            </div>

            ${hasAccount ? `
                <p style="font-size: 16px; color: #475569; line-height: 1.7;">
                    We noticed you already have a SaleMate account. Click the button below to accept this invitation:
                </p>
            ` : `
                <p style="font-size: 16px; color: #475569; line-height: 1.7;">
                    To accept this invitation, you'll need to create a SaleMate account. 
                    Once you sign up, you'll automatically be added to ${managerName}'s team.
                </p>
            `}
            
            <div style="text-align: center;">
                <a href="${invitationUrl}" class="button">
                    ${hasAccount ? 'Accept Invitation' : 'Create Account & Join Team'}
                </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div class="link-box">${invitationUrl}</div>

            <p style="font-size: 14px; color: #64748b; margin-top: 32px;">
                This invitation will expire in 7 days.
            </p>
            
            <p style="font-size: 16px; color: #475569; margin-top: 32px;">
                Best regards,<br>
                <strong style="color: #1e293b;">The SaleMate Team</strong>
            </p>
        </div>
        
        <div class="footer">
            <p style="margin: 0; font-weight: 600; color: #1e293b;">© 2024 SaleMate. All rights reserved.</p>
            <p style="color: #64748b; margin: 8px 0;">Egypt's Premier Real Estate Platform</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
                If you didn't expect this invitation, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}


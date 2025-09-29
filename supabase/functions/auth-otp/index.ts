import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestOTPBody {
  phone: string;
  isSignup?: boolean;
  signupData?: {
    name: string;
    email: string | null;
    role: string;
    password: string;
  };
}

interface VerifyOTPBody {
  phone: string;
  code: string;
}

// Helper function to format phone numbers
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Egyptian phone numbers
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Convert 01070020058 to +201070020058
    return '+20' + cleaned.substring(1);
  }
  
  // Handle US phone numbers
  if (cleaned.startsWith('1') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  
  // Handle 10-digit US numbers
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  }
  
  // If it already has a +, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Default: add + if no country code
  return '+' + cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { pathname } = new URL(req.url)
    console.log('🔍 Request path:', pathname)
    
    if (pathname.endsWith('/auth/request-otp') && req.method === 'POST') {
      return await handleRequestOTP(req, supabase)
    } else if (pathname.endsWith('/auth/verify-otp') && req.method === 'POST') {
      return await handleVerifyOTP(req, supabase)
    } else {
      console.log('❌ No matching route found for:', pathname)
      return new Response(
        JSON.stringify({ error: 'Not found', path: pathname }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error: unknown) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Internal server error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleRequestOTP(req: Request, supabase: any) {
  try {
    console.log('📱 Handling OTP request...')
    const body: RequestOTPBody = await req.json()
    const { phone, isSignup = false, signupData } = body

    console.log('📱 Request body:', { phone, isSignup, signupData })

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format the phone number properly
    const formattedPhone = formatPhoneNumber(phone);
    console.log('📱 Formatted phone:', formattedPhone);

    // Check if this is development mode
    const isDevelopment = Deno.env.get('NODE_ENV') === 'development' || 
                         !Deno.env.get('TWILIO_ACCOUNT_SID')

    if (isDevelopment) {
      // Development mode: use database OTP system
      console.log('🔧 Development mode: Using database OTP system')
      
      const { data: otpData, error: otpError } = await supabase.rpc('create_otp', {
        phone_number: formattedPhone,
        is_signup: isSignup,
        signup_data: signupData || null
      })

      if (otpError) {
        console.error('Database OTP creation error:', otpError)
        return new Response(
          JSON.stringify({ error: 'Failed to create OTP', details: otpError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!otpData.success) {
        return new Response(
          JSON.stringify({ error: otpData.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully (Development mode)',
          otp: otpData.otp_code, // Return the actual OTP for development
          expiresIn: otpData.expires_in
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Production mode: Use Twilio Verify
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioVerifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      throw new Error('Twilio configuration missing')
    }

    console.log('🚀 Production mode: Using Twilio Verify for phone:', formattedPhone)

    // Send verification via Twilio Verify
    const verifyUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/Verifications`
    const verifyBody = new URLSearchParams({
      'To': formattedPhone,
      'Channel': 'sms'
    })

    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: verifyBody
    })

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.text()
      console.error('Twilio Verify error:', verifyError)
      throw new Error('Failed to send verification SMS')
    }

    const verifyResult = await verifyResponse.json()
    console.log('✅ Twilio Verify success:', verifyResult)

    // Store OTP data in database for verification
    const { error: dbError } = await supabase.rpc('create_otp', {
      phone_number: formattedPhone,
      is_signup: isSignup,
      signup_data: signupData || null
    })

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to store OTP data', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification SMS sent successfully via Twilio',
        expiresIn: '10 minutes'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Request OTP error:', error)
    const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Failed to request OTP';
    return new Response(
      JSON.stringify({ error: 'Failed to request OTP', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleVerifyOTP(req: Request, supabase: any) {
  try {
    console.log('🔐 Handling OTP verification...')
    const body: VerifyOTPBody = await req.json()
    const { phone, code } = body

    console.log('🔐 Verification body:', { phone, code })

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone number and OTP code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format the phone number properly
    const formattedPhone = formatPhoneNumber(phone);
    console.log('🔐 Formatted phone for verification:', formattedPhone);

    // Check if this is development mode
    const isDevelopment = Deno.env.get('NODE_ENV') === 'development' || 
                         !Deno.env.get('TWILIO_ACCOUNT_SID')

    if (isDevelopment) {
      // Development mode: use database verification
      console.log('🔧 Development mode: Using database verification')
      
      const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_otp', {
        phone_number: formattedPhone,
        input_code: code
      })

      if (verifyError) {
        console.error('Database verification error:', verifyError)
        return new Response(
          JSON.stringify({ error: 'Failed to verify OTP', details: verifyError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!verifyResult.success) {
        return new Response(
          JSON.stringify({ error: verifyResult.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Handle successful verification
      return await handleVerificationSuccess(verifyResult, supabase)
    }

    // Production mode: Verify with Twilio Verify
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioVerifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID')

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      throw new Error('Twilio configuration missing')
    }

    console.log('🚀 Production mode: Verifying with Twilio for phone:', formattedPhone)

    // Verify the code with Twilio
    const verifyCheckUrl = `https://verify.twilio.com/v2/Services/${twilioVerifyServiceSid}/VerificationCheck`
    const verifyCheckBody = new URLSearchParams({
      'To': formattedPhone,
      'Code': code
    })

    const verifyCheckResponse = await fetch(verifyCheckUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: verifyCheckBody
    })

    if (!verifyCheckResponse.ok) {
      const verifyCheckError = await verifyCheckResponse.text()
      console.error('Twilio Verify Check error:', verifyCheckError)
      throw new Error('Failed to verify code with Twilio')
    }

    const verifyCheckResult = await verifyCheckResponse.json()
    console.log('✅ Twilio Verify Check result:', verifyCheckResult)

    if (verifyCheckResult.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Invalid verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the OTP record from database to check if it's signup or signin
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: 'No pending verification found for this phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otpRecord.id)

    if (otpRecord.is_signup) {
      return await handleVerificationSuccess(otpRecord, supabase)
    } else {
      // This is a signin - find existing user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', formattedPhone)
        .single()

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'No account found with this phone number' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Signin successful',
          user: profile
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: unknown) {
    console.error('Verify OTP error:', error)
    const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Failed to verify OTP';
    return new Response(
      JSON.stringify({ error: 'Failed to verify OTP', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleVerificationSuccess(verifyResult: any, supabase: any) {
  try {
    if (verifyResult.is_signup) {
      // This is a new user signup
      const { name, email, role, password } = verifyResult.signup_data

      // Validate role restrictions for OTP signup
      if (role === 'support' || role === 'admin') {
        return new Response(
          JSON.stringify({ error: 'Support and admin roles cannot be created via OTP signup' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email || `phone_${Date.now()}@salemate.local`, // Generate temporary email if none provided
        password: password,
        email_confirm: true,
        user_metadata: {
          name: name,
          role: role,
          phone: verifyResult.phone
        }
      })

      if (authError) {
        console.error('User creation error:', authError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: authError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create profile (should be handled by trigger, but let's be explicit)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: name,
          email: email || `phone_${Date.now()}@salemate.local`, // Use temporary email if none provided
          phone: verifyResult.phone,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // User was created but profile failed - this is a problem
        return new Response(
          JSON.stringify({ error: 'User created but profile setup failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Account created successfully',
          user: {
            id: authData.user.id,
            name: name,
            email: email,
            phone: verifyResult.phone,
            role: role
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      // This is an existing user signin
      // Find user by phone number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', verifyResult.phone)
        .single()

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: 'No account found with this phone number' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Signin successful',
          user: profile
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error: unknown) {
    console.error('Verification success handling error:', error)
    const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : 'Failed to process verification';
    return new Response(
      JSON.stringify({ error: 'Failed to process verification', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

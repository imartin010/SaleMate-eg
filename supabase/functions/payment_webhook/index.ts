import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentWebhookPayload {
  order_id: string
  payment_reference: string
  signature: string
  amount?: number
  status?: 'success' | 'failed'
  payment_method?: string
}

interface WebhookResponse {
  success: boolean
  message: string
  order_id?: string
  leads_assigned?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Method not allowed. Only POST requests are accepted.' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET') || 'fake-secret-for-development'

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Server configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    let payload: PaymentWebhookPayload
    try {
      payload = await req.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON payload' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate required fields
    if (!payload.order_id || !payload.payment_reference) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required fields: order_id and payment_reference are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate signature (in production, implement proper signature validation)
    if (payload.signature !== webhookSecret) {
      console.warn('Invalid webhook signature:', payload.signature)
      // For development, we'll allow fake signatures
      if (webhookSecret !== 'fake-secret-for-development') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid webhook signature' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Check if order exists and is in pending status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', payload.order_id)
      .eq('status', 'pending')
      .single()

    if (orderError || !order) {
      console.error('Order not found or not in pending status:', orderError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Order not found or not in pending status' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate payment amount if provided
    if (payload.amount && payload.amount !== order.total_amount) {
      console.warn('Payment amount mismatch:', { expected: order.total_amount, received: payload.amount })
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Payment amount mismatch' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call the RPC function to confirm the order
    const { data: confirmResult, error: confirmError } = await supabase
      .rpc('rpc_confirm_order', {
        order_id: payload.order_id,
        payment_reference: payload.payment_reference
      })

    if (confirmError) {
      console.error('Failed to confirm order:', confirmError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Failed to confirm order: ' + confirmError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log successful payment confirmation
    console.log('Payment confirmed successfully:', {
      order_id: payload.order_id,
      payment_reference: payload.payment_reference,
      amount: order.total_amount,
      payment_method: order.payment_method
    })

    // Return success response
    const response: WebhookResponse = {
      success: true,
      message: 'Payment confirmed successfully',
      order_id: payload.order_id,
      leads_assigned: confirmResult.leads_assigned
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in payment webhook:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error: ' + error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Example usage:
// curl -X POST "http://localhost:5433/functions/v1/payment_webhook" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "order_id": "order-uuid-here",
//     "payment_reference": "PAY-123456",
//     "signature": "fake-signature",
//     "amount": 1250.00,
//     "status": "success",
//     "payment_method": "Instapay"
//   }'

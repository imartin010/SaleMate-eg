import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { email, type, confirmationUrl } = await req.json()

    // Create SaleMate branded email templates
    const getEmailTemplate = (type: string, confirmationUrl: string) => {
      const baseTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SaleMate</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; background: #fff; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { padding: 40px 30px; background: #f8f9fa; }
                .button { background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 25px 0; font-weight: bold; }
                .footer { text-align: center; padding: 30px; background: #fff; color: #666; font-size: 14px; }
                .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 25px 0; }
                .link-box { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🏠 SaleMate</div>
                    <h1>Egypt's Premier Real Estate Platform</h1>
                </div>
                <div class="content">
                    ${type === 'signup' ? `
                        <h2>Welcome to SaleMate!</h2>
                        <p>Hello!</p>
                        <p>Thank you for joining SaleMate - Egypt's leading real estate platform. To complete your registration and start exploring premium properties, please confirm your email address.</p>
                        
                        <div style="text-align: center;">
                            <a href="${confirmationUrl}" class="button">Confirm My Account</a>
                        </div>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <div class="link-box">${confirmationUrl}</div>
                        
                        <p>Once confirmed, you'll have access to:</p>
                        <ul>
                            <li>🏢 Premium property listings</li>
                            <li>📊 Market insights and analytics</li>
                            <li>🤝 Expert broker network</li>
                            <li>💼 Investment opportunities</li>
                        </ul>
                    ` : `
                        <h2>Reset Your Password</h2>
                        <p>Hello!</p>
                        <p>We received a request to reset your SaleMate account password. Click the button below to create a new password.</p>
                        
                        <div style="text-align: center;">
                            <a href="${confirmationUrl}" class="button">Reset My Password</a>
                        </div>
                        
                        <div class="warning">
                            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account remains secure.
                        </div>
                        
                        <p>If the button doesn't work, copy and paste this link into your browser:</p>
                        <div class="link-box">${confirmationUrl}</div>
                    `}
                    
                    <p>Best regards,<br><strong>The SaleMate Team</strong></p>
                </div>
                <div class="footer">
                    <p><strong>© 2024 SaleMate. All rights reserved.</strong></p>
                    <p>Egypt's Premier Real Estate Platform</p>
                    <p><a href="https://salemate-eg.com" style="color: #667eea;">Visit SaleMate</a> | 
                       <a href="https://salemate-eg.com/contact" style="color: #667eea;">Contact Support</a></p>
                </div>
            </div>
        </body>
        </html>
      `
      return baseTemplate
    }

    // Here you would integrate with your email service (SendGrid, Mailgun, etc.)
    // For now, we'll just return the template
    const template = getEmailTemplate(type, confirmationUrl)

    return new Response(
      JSON.stringify({
        success: true,
        template: template,
        message: 'Custom email template generated'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

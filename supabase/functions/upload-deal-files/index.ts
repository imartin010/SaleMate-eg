import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const formData = await req.formData()
      const dealId = formData.get('dealId') as string
      const files = formData.getAll('files') as File[]

      if (!dealId || !files.length) {
        return new Response(
          JSON.stringify({ error: 'Missing dealId or files' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Verify deal belongs to user
      const { data: deal, error: dealError } = await supabaseClient
        .from('deals')
        .select('id')
        .eq('id', dealId)
        .eq('user_id', user.id)
        .single()

      if (dealError || !deal) {
        return new Response(
          JSON.stringify({ error: 'Deal not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const uploadedFiles = []

      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          continue // Skip files that are too large
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]

        if (!allowedTypes.includes(file.type)) {
          continue // Skip unsupported file types
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `deal-attachments/${dealId}/${fileName}`

        // Upload file to storage
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('deal-attachments')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
          .from('deal-attachments')
          .getPublicUrl(filePath)

        // Save file metadata to database
        const { data: attachment, error: dbError } = await supabaseClient
          .from('deal_attachments')
          .insert([{
            deal_id: dealId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
          }])
          .select()
          .single()

        if (dbError) {
          console.error('Database error:', dbError)
          continue
        }

        uploadedFiles.push({
          ...attachment,
          public_url: publicUrl
        })
      }

      return new Response(
        JSON.stringify({ 
          message: `${uploadedFiles.length} files uploaded successfully`,
          files: uploadedFiles 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

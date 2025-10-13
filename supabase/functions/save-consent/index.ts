import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header for user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user with regular anon key
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const formData = await req.formData();
    const signatureFile = formData.get('signature') as File;
    const method = formData.get('method') as string;
    const ip = formData.get('ip') as string;
    const userAgent = formData.get('userAgent') as string;
    const textVersion = formData.get('textVersion') as string || 'v1';

    if (!signatureFile) {
      throw new Error('No signature file provided');
    }

    // Upload signature to storage
    const timestamp = new Date().getTime();
    const filePath = `${user.id}/signature-${timestamp}.png`;
    
    const fileBuffer = await signatureFile.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('consents')
      .upload(filePath, fileBuffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload signature: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('consents')
      .getPublicUrl(filePath);

    // Update profile with consent information
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        consent_signed: true,
        consent_signed_at: new Date().toISOString(),
        consent_signature_url: publicUrl,
        consent_method: method,
        consent_signed_ip: ip,
        consent_user_agent: userAgent,
        consent_text_version: textVersion
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        signatureUrl: publicUrl,
        message: 'Consentimiento guardado exitosamente'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in save-consent:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

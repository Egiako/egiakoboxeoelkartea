import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONSENT_TEXT = `EGIAK.O. BOXEO ELKARTEA

1. ACEPTACIÓN DE RIESGOS
El/la abajo firmante declara que participa voluntariamente en las actividades, entrenamientos y
competiciones organizadas por EgiaK.O. Boxeo Elkartea, siendo plenamente consciente de
que el boxeo y la actividad física implican riesgos inherentes como lesiones musculares,
contusiones, fracturas u otros daños físicos.

El/la participante asume dichos riesgos bajo su propia responsabilidad, eximiendo
expresamente a EgiaK.O. Boxeo Elkartea, a sus monitores, entrenadores, directivos y
colaboradores de cualquier tipo de responsabilidad civil, penal o económica derivada de
accidentes o lesiones que pudieran producirse durante la práctica o participación en las
actividades de la asociación, salvo en casos de negligencia demostrable.

2. ESTADO DE SALUD
El/la participante declara que se encuentra en buen estado de salud física y mental para la
práctica del boxeo, y que no padece enfermedades o limitaciones que puedan poner en riesgo
su integridad o la de otros participantes. Asimismo, se compromete a informar a la asociación
de cualquier cambio relevante en su estado de salud.

3. MENORES DE EDAD
En caso de que el/la participante sea menor de 18 años, el/la padre/madre/tutor/a legal deberá
firmar este documento, manifestando su consentimiento expreso para la participación del
menor en las actividades de la asociación y aceptando las condiciones aquí descritas.

4. USO DE IMAGEN
Autorizo a EgiaK.O. Boxeo Elkartea a tomar y utilizar imágenes o vídeos en los que pueda
aparecer durante entrenamientos, competiciones o eventos, con fines promocionales,
informativos o de difusión en redes sociales, web o material divulgativo de la asociación, sin
derecho a contraprestación económica alguna. El/la participante podrá revocar esta autorización
por escrito en cualquier momento.

5. PROTECCIÓN DE DATOS
Los datos personales recogidos serán tratados conforme a la legislación vigente en materia de
protección de datos personales (Reglamento (UE) 2016/679 y LOPDGDD), siendo el
responsable del tratamiento EgiaK.O. Boxeo Elkartea. Los datos se utilizarán únicamente para
la gestión administrativa y deportiva de la asociación.

6. DECLARACIÓN FINAL
He leído y comprendido todo lo anterior. Firmo este documento de manera libre y voluntaria,
manifestando que acepto todas las condiciones descritas y libero de responsabilidad a
EgiaK.O. Boxeo Elkartea en los términos expuestos.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify admin role
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

    // Check if user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    const { userId } = await req.json();

    // Get user profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Generate simple HTML for PDF (we'll use a simple text-based approach)
    // In production, you might want to use a proper PDF library
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    h1 { color: #333; text-align: center; }
    .info { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .signature { margin-top: 40px; page-break-inside: avoid; }
    .signature-box { 
      display: inline-block;
      border: 2px solid #333; 
      padding: 20px; 
      margin: 20px 0;
      background: white;
      min-height: 150px;
      min-width: 400px;
    }
    .signature-box img { 
      max-width: 100%; 
      max-height: 120px;
      display: block;
      margin: 0 auto;
    }
    .signature-info { 
      margin-top: 15px; 
      text-align: center;
      font-size: 14px;
      line-height: 1.6;
    }
    .no-signature { 
      color: #999; 
      font-style: italic; 
      text-align: center;
      padding: 20px;
    }
    .footer { margin-top: 40px; font-size: 12px; color: #666; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>CONSENTIMIENTO INFORMADO - EGIAK.O. BOXEO</h1>
  
  <div class="info">
    <strong>Datos del Participante:</strong><br>
    Nombre: ${profile.first_name} ${profile.last_name}<br>
    Email: ${profile.email}<br>
    Teléfono: ${profile.phone}<br>
    ${profile.dni ? `DNI: ${profile.dni}<br>` : ''}
    ${profile.birth_date ? `Fecha de Nacimiento: ${new Date(profile.birth_date).toLocaleDateString('es-ES')}<br>` : ''}
    ${profile.objective ? `Objetivo: ${profile.objective}<br>` : ''}
  </div>

  <pre>${CONSENT_TEXT}</pre>

  <div class="signature">
    <p><strong>Firma del participante:</strong></p>
    ${profile.consent_signature_url ? `
      <div class="signature-box">
        <img src="${profile.consent_signature_url}" alt="Firma del participante" />
      </div>
      <p class="signature-info">
        <strong>${profile.first_name} ${profile.last_name}</strong><br>
        Firmado el: ${profile.consent_signed_at ? new Date(profile.consent_signed_at).toLocaleString('es-ES', { 
          dateStyle: 'long', 
          timeStyle: 'short' 
        }) : 'N/A'}
      </p>
    ` : '<p class="no-signature">Sin firma</p>'}
  </div>

  <div class="footer">
    <strong>Información técnica de la firma:</strong><br>
    Método: ${profile.consent_method || 'N/A'}<br>
    Fecha y Hora: ${profile.consent_signed_at ? new Date(profile.consent_signed_at).toLocaleString('es-ES') : 'N/A'}<br>
    IP: ${profile.consent_signed_ip || 'N/A'}<br>
    Versión del Documento: ${profile.consent_text_version || 'v1'}<br>
    User Agent: ${profile.consent_user_agent || 'N/A'}
  </div>
</body>
</html>`;

    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="consentimiento-${profile.first_name}-${profile.last_name}.html"`
      }
    });

  } catch (error) {
    console.error('Error in generate-consent-pdf:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

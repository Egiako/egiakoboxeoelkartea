import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONSENT_TEXT = `EGIAK.O. BOXEO ELKARTEA

1. ACEPTACIÓN DE RIESGOS
El/la abajo firmante declara que participa voluntariamente en las actividades, entrenamientos y competiciones organizadas por EgiaK.O. Boxeo Elkartea, siendo plenamente consciente de que el boxeo y la actividad física implican riesgos inherentes como lesiones musculares, contusiones, fracturas u otros daños físicos.

El/la participante asume dichos riesgos bajo su propia responsabilidad, eximiendo expresamente a EgiaK.O. Boxeo Elkartea, a sus monitores, entrenadores, directivos y colaboradores de cualquier tipo de responsabilidad civil, penal o económica derivada de accidentes o lesiones que pudieran producirse durante la práctica o participación en las actividades de la asociación, salvo en casos de negligencia demostrable.

2. ESTADO DE SALUD
El/la participante declara que se encuentra en buen estado de salud física y mental para la práctica del boxeo, y que no padece enfermedades o limitaciones que puedan poner en riesgo su integridad o la de otros participantes. Asimismo, se compromete a informar a la asociación de cualquier cambio relevante en su estado de salud.

3. MENORES DE EDAD
En caso de que el/la participante sea menor de 18 años, el/la padre/madre/tutor/a legal deberá firmar este documento, manifestando su consentimiento expreso para la participación del menor en las actividades de la asociación y aceptando las condiciones aquí descritas.

4. USO DE IMAGEN
Autorizo a EgiaK.O. Boxeo Elkartea a tomar y utilizar imágenes o vídeos en los que pueda aparecer durante entrenamientos, competiciones o eventos, con fines promocionales, informativos o de difusión en redes sociales, web o material divulgativo de la asociación, sin derecho a contraprestación económica alguna. El/la participante podrá revocar esta autorización por escrito en cualquier momento.

5. PROTECCIÓN DE DATOS
Los datos personales recogidos serán tratados conforme a la legislación vigente en materia de protección de datos personales (Reglamento (UE) 2016/679 y LOPDGDD), siendo el responsable del tratamiento EgiaK.O. Boxeo Elkartea. Los datos se utilizarán únicamente para la gestión administrativa y deportiva de la asociación.

6. COMPROMISO CON LAS NORMAS
Me comprometo a seguir todas las normas de seguridad establecidas por la asociación, usar el equipo de protección requerido, y seguir las instrucciones de los entrenadores en todo momento.

7. DECLARACIÓN FINAL
He leído y comprendido todo lo anterior. Firmo este documento de manera libre y voluntaria, manifestando que acepto todas las condiciones descritas y libero de responsabilidad a EgiaK.O. Boxeo Elkartea en los términos expuestos.`;

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

    // Generate a proper PDF with embedded signature using pdf-lib
    const pdfDoc = await PDFDocument.create();

    // A4 size in points
    const pageWidth = 595;
    const pageHeight = 842;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    const { width, height } = page.getSize();
    const margin = 50;
    let cursorY = height - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const drawTitle = (text: string) => {
      const size = 16;
      const textWidth = fontBold.widthOfTextAtSize(text, size);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: cursorY,
        size,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      cursorY -= 28;
    };

    const ensureSpace = (needed: number) => {
      if (cursorY - needed < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        cursorY = page.getSize().height - margin;
      }
    };

    const drawWrappedText = (text: string, size = 11, lineHeight = 16) => {
      const maxWidth = width - margin * 2;
      const words = text.split(/\s+/);
      let line = '';
      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const w = font.widthOfTextAtSize(testLine, size);
        if (w > maxWidth) {
          ensureSpace(lineHeight);
          page.drawText(line, { x: margin, y: cursorY, size, font, color: rgb(0, 0, 0) });
          cursorY -= lineHeight;
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ensureSpace(lineHeight);
        page.drawText(line, { x: margin, y: cursorY, size, font, color: rgb(0, 0, 0) });
        cursorY -= lineHeight;
      }
    };

    // Title
    drawTitle('CONSENTIMIENTO INFORMADO - EGIAK.O. BOXEO');

    // Participant info box
    const infoLines: string[] = [
      `Nombre: ${profile.first_name} ${profile.last_name}`,
      profile.email ? `Email: ${profile.email}` : '',
      profile.phone ? `Teléfono: ${profile.phone}` : '',
      profile.dni ? `DNI: ${profile.dni}` : '',
      profile.birth_date ? `Fecha de Nacimiento: ${new Date(profile.birth_date).toLocaleDateString('es-ES')}` : '',
      profile.objective ? `Objetivo: ${profile.objective}` : '',
    ].filter(Boolean);

    // Draw shaded box background
    const boxTop = cursorY + 8;
    const boxHeight = infoLines.length * 16 + 20;
    ensureSpace(boxHeight + 10);
    page.drawRectangle({ x: margin - 6, y: cursorY - boxHeight + 6, width: width - margin * 2 + 12, height: boxHeight, color: rgb(0.96, 0.96, 0.96) });
    page.drawText('Datos del Participante:', { x: margin, y: cursorY - 14, size: 12, font: fontBold });
    cursorY -= 26;
    for (const line of infoLines) {
      drawWrappedText(line, 11, 16);
    }
    cursorY -= 10;

    // Consent text paragraphs
    const paragraphs = (CONSENT_TEXT as string).split('\n');
    for (const p of paragraphs) {
      if (p.trim() === '') { cursorY -= 6; continue; }
      drawWrappedText(p, 11, 16);
    }

    // Signature page
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    const sigWidthMax = 240;
    const title2 = 'Firma del participante';
    let y2 = page.getSize().height - margin;
    const t2w = fontBold.widthOfTextAtSize(title2, 14);
    page.drawText(title2, { x: (page.getSize().width - t2w) / 2, y: y2, size: 14, font: fontBold });
    y2 -= 30;

    if (profile.consent_signature_url) {
      try {
        let imageBytes: Uint8Array | null = null;
        const sigUrl: string = profile.consent_signature_url as string;

        if (sigUrl.startsWith('data:')) {
          // Data URL (base64)
          const base64 = sigUrl.split(',')[1] ?? '';
          const bin = atob(base64);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          imageBytes = bytes;
        } else {
          // Try direct fetch first (works for public URLs and valid signed URLs)
          try {
            const res = await fetch(sigUrl);
            if (res.ok) {
              const ab = await res.arrayBuffer();
              imageBytes = new Uint8Array(ab);
            }
          } catch (_) {
            // ignore and try storage fallback
          }

          // Fallback: derive bucket/path from Supabase Storage URL and download with admin client
          if (!imageBytes) {
            try {
              const url = new URL(sigUrl);
              // Matches /storage/v1/object/(public|sign)/:bucket/:path?...
              const match = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/(.+)$/);
              if (match) {
                const bucket = match[1];
                const pathWithQuery = match[2];
                const path = decodeURIComponent(pathWithQuery.split('?')[0]);
                const { data: blob, error: dlError } = await supabaseAdmin.storage.from(bucket).download(path);
                if (dlError) {
                  console.error('Storage download error:', dlError);
                } else if (blob) {
                  const ab = await blob.arrayBuffer();
                  imageBytes = new Uint8Array(ab);
                }
              }
            } catch (e) {
              console.error('Error parsing storage URL for signature:', e);
            }
          }
        }

        if (!imageBytes) {
          throw new Error('No image bytes for signature');
        }

        let image: any;
        try {
          image = await pdfDoc.embedPng(imageBytes);
        } catch {
          image = await pdfDoc.embedJpg(imageBytes);
        }

        const scale = sigWidthMax / image.width;
        const drawW = image.width * scale;
        const drawH = image.height * scale;
        const x = (page.getSize().width - drawW) / 2;
        const y = y2 - drawH;
        page.drawImage(image, { x, y, width: drawW, height: drawH });
        y2 = y - 14;

        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        const signedAt = profile.consent_signed_at
          ? new Date(profile.consent_signed_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
          : 'N/A';
        const info1 = `Firmado digitalmente por ${fullName}`;
        const info2 = `Fecha: ${signedAt}`;
        const info3 = `DNI: ${profile.dni || 'N/A'}`;
        page.drawText(info1, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(info2, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(info3, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
      } catch (e) {
        console.error('Error embedding signature image:', e);
        page.drawText('Firma no disponible (error al cargar la imagen).', { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        const signedAt = profile.consent_signed_at
          ? new Date(profile.consent_signed_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
          : 'N/A';
        page.drawText(`Firmado por: ${fullName}`, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(`Fecha: ${signedAt}`, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(`DNI: ${profile.dni || 'N/A'}`, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
      }
      } else {
        const fullName = `${profile.first_name} ${profile.last_name}`.trim();
        const signedAt = profile.consent_signed_at
          ? new Date(profile.consent_signed_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })
          : 'N/A';
        page.drawText('Firma no disponible (se registró aceptación sin imagen).', { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(`Firmado por: ${fullName}`, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(`Fecha: ${signedAt}`, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
        page.drawText(`DNI: ${profile.dni || 'N/A'}`, { x: margin, y: y2, size: 12, font });
        y2 -= 18;
      }

    // Technical info footer
    y2 -= 20;
    const techTitle = 'Información técnica de la firma:';
    page.drawText(techTitle, { x: margin, y: y2, size: 12, font: fontBold });
    y2 -= 16;
    const techLines: string[] = [
      `Método: ${profile.consent_method || 'N/A'}`,
      `Fecha y Hora: ${profile.consent_signed_at ? new Date(profile.consent_signed_at).toLocaleString('es-ES') : 'N/A'}`,
      `IP: ${profile.consent_signed_ip || 'N/A'}`,
      `Versión del Documento: ${profile.consent_text_version || 'v1'}`,
      `User Agent: ${profile.consent_user_agent || 'N/A'}`,
    ];
    for (const line of techLines) {
      page.drawText(line, { x: margin, y: y2, size: 10, font });
      y2 -= 14;
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="consentimiento-${profile.first_name}-${profile.last_name}.pdf"`
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  status: 'approved' | 'rejected';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, status }: EmailRequest = await req.json();

    const isApproved = status === 'approved';
    const subject = isApproved 
      ? "¡Tu cuenta ha sido aprobada! - EgiaK.O. Boxeo Elkartea"
      : "Información sobre tu solicitud - EgiaK.O. Boxeo Elkartea";

    const emailContent = isApproved ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #D7263D, #0D0D0D); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            EgiaK.O. Boxeo Elkartea
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #D7263D;">
          <h2 style="color: #D7263D; margin-top: 0;">¡Felicidades ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Tu solicitud de registro ha sido <strong>aprobada</strong>. Ya puedes acceder a todas las funcionalidades de socio:
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8; color: #333; padding-left: 20px;">
            <li>✅ Reservar clases de boxeo</li>
            <li>✅ Consultar horarios disponibles</li>
            <li>✅ Gestionar tus reservas</li>
            <li>✅ Acceso al área de socios</li>
          </ul>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #D7263D;">
            <p style="margin: 0; font-weight: bold; color: #D7263D;">
              🥊 ¡Comienza tu entrenamiento ahora!
            </p>
            <p style="margin: 10px 0 0 0; color: #666;">
              Inicia sesión en nuestra web y reserva tu primera clase.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Si tienes alguna pregunta, no dudes en contactarnos.
            <br>
            ¡Nos vemos en el ring!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #333; border-radius: 10px;">
          <p style="color: white; margin: 0; font-size: 14px;">
            <strong>EgiaK.O. Boxeo Elkartea</strong><br>
            Tu club de boxeo en el corazón de Donostia
          </p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #666, #333); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
            EgiaK.O. Boxeo Elkartea
          </h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 5px solid #666;">
          <h2 style="color: #666; margin-top: 0;">Hola ${name},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Gracias por tu interés en formar parte de EgiaK.O. Boxeo Elkartea.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Lamentablemente, en este momento no podemos aprobar tu solicitud de registro.
            Esto puede deberse a que hemos alcanzado el límite de capacidad o por otros motivos administrativos.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #666;">
            <p style="margin: 0; font-weight: bold; color: #666;">
              📞 ¿Tienes preguntas?
            </p>
            <p style="margin: 10px 0 0 0; color: #666;">
              No dudes en contactarnos para más información sobre futuras oportunidades.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Gracias por tu comprensión.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background: #333; border-radius: 10px;">
          <p style="color: white; margin: 0; font-size: 14px;">
            <strong>EgiaK.O. Boxeo Elkartea</strong><br>
            Tu club de boxeo en el corazón de Donostia
          </p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "EgiaK.O. Boxeo <noreply@resend.dev>",
      to: [email],
      subject: subject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending approval email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
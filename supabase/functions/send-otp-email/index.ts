
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OTPEmailRequest {
  email: string;
  otp: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, name }: OTPEmailRequest = await req.json();

    console.log(`Sending OTP email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Studizen <onboarding@resend.dev>",
      to: [email],
      subject: "Kode Verifikasi Studizen",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Studizen</h1>
            <p style="color: #6b7280; margin: 5px 0;">Platform Manajemen Akademik</p>
          </div>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Verifikasi Akun Anda</h2>
            <p style="color: #4b5563; margin-bottom: 30px;">
              ${name ? `Halo ${name}, g` : 'G'}unakan kode verifikasi berikut untuk menyelesaikan pendaftaran akun Anda:
            </p>
            
            <div style="background-color: #2563eb; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Kode ini akan kedaluwarsa dalam 10 menit.<br>
              Jangan bagikan kode ini kepada siapa pun.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 12px;">
              Jika Anda tidak mendaftar di Studizen, abaikan email ini.
            </p>
          </div>
        </div>
      `,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
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

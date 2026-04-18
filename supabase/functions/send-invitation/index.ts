import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Email HTML Template ─────────────────────────────────────────────────────

function buildEmailHtml(params: {
  to_email: string
  invite_link: string
  from_name: string
  workspace_name: string
}): string {
  const { invite_link, from_name, workspace_name } = params

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation à rejoindre ${workspace_name}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="
                  width:40px;height:40px;border-radius:10px;
                  background:linear-gradient(135deg,#e85534,#f97316);
                  display:inline-block;vertical-align:middle;
                "></div>
                <span style="color:#f8fafc;font-size:22px;font-weight:700;vertical-align:middle;margin-left:10px;">
                  YounesCRM
                </span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="
              background-color:#1e293b;
              border-radius:16px;
              border:1px solid #334155;
              padding:48px 40px;
            ">

              <!-- Titre -->
              <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;text-transform:uppercase;letter-spacing:0.08em;">
                Vous avez reçu une invitation
              </p>
              <h1 style="margin:0 0 24px;color:#f8fafc;font-size:28px;font-weight:700;line-height:1.3;">
                Rejoignez l'espace<br/>
                <span style="color:#e85534;">${workspace_name}</span>
              </h1>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #334155;margin:0 0 28px;" />

              <!-- Message -->
              <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.6;">
                Bonjour,
              </p>
              <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.6;">
                <strong style="color:#f8fafc;">${from_name}</strong> vous invite à rejoindre
                son espace de travail <strong style="color:#f8fafc;">${workspace_name}</strong>
                sur YounesCRM — le CRM conçu pour les freelances et agences web.
              </p>
              <p style="margin:0 0 32px;color:#cbd5e1;font-size:16px;line-height:1.6;">
                Cliquez sur le bouton ci-dessous pour accepter l'invitation et accéder à l'espace.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="
                    background:linear-gradient(135deg,#e85534,#f97316);
                    border-radius:10px;
                    padding:1px;
                  ">
                    <a href="${invite_link}" style="
                      display:inline-block;
                      background:linear-gradient(135deg,#e85534,#f97316);
                      color:#ffffff;
                      font-size:16px;
                      font-weight:600;
                      text-decoration:none;
                      padding:14px 32px;
                      border-radius:10px;
                      letter-spacing:0.02em;
                    ">
                      Accepter l'invitation →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${invite_link}" style="color:#e85534;font-size:13px;text-decoration:none;">
                  ${invite_link}
                </a>
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;" />

              <!-- Security notice -->
              <p style="margin:0;color:#475569;font-size:13px;line-height:1.5;">
                Ce lien est valable <strong style="color:#64748b;">7 jours</strong>.
                Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email en toute sécurité.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0;color:#334155;font-size:12px;">
                © ${new Date().getFullYear()} YounesCRM · Tous droits réservés
              </p>
              <p style="margin:6px 0 0;color:#334155;font-size:12px;">
                Cet email a été envoyé par YounesCRM suite à une invitation.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  try {
    // Parse body
    const body = await req.json() as {
      to_email: string
      invite_link: string
      from_name: string
      workspace_name: string
    }

    const { to_email, invite_link, from_name, workspace_name } = body

    // Validate required fields
    if (!to_email || !invite_link || !from_name || !workspace_name) {
      return new Response(
        JSON.stringify({ error: 'Champs manquants : to_email, invite_link, from_name, workspace_name sont requis.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Get Resend API key from env
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY non configurée.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Build email payload
    const emailPayload = {
      from: 'YounesCRM <onboarding@resend.dev>',
      to: [to_email],
      subject: `${from_name} vous invite à rejoindre ${workspace_name}`,
      html: buildEmailHtml({ to_email, invite_link, from_name, workspace_name }),
    }

    // Send via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('[send-invitation] Resend error:', resendData)
      return new Response(
        JSON.stringify({ error: 'Échec envoi email', details: resendData }),
        { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    console.log('[send-invitation] Email envoyé à', to_email, '| id:', resendData.id)

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )

  } catch (err) {
    console.error('[send-invitation] Erreur inattendue:', err)
    return new Response(
      JSON.stringify({ error: 'Erreur interne du serveur', details: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

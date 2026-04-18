import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

const CLIENT_ID     = Deno.env.get('GMAIL_CLIENT_ID')     ?? ''
const CLIENT_SECRET = Deno.env.get('GMAIL_CLIENT_SECRET') ?? ''
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')        ?? ''
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// ─── Refresh access token ────────────────────────────────────────────────────

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description ?? 'Token refresh failed')
  return data.access_token
}

// ─── Exchange auth code for tokens ──────────────────────────────────────────

async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description ?? 'Code exchange failed')
  return data // { access_token, refresh_token, expires_in, ... }
}

// ─── Build RFC 2822 email → base64url ────────────────────────────────────────

function buildRawEmail(opts: {
  from: string; to: string; subject: string; body: string
}): string {
  const msg = [
    `From: ${opts.from}`,
    `To: ${opts.to}`,
    `Subject: ${opts.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    opts.body.replace(/\n/g, '<br/>'),
  ].join('\r\n')

  return btoa(unescape(encodeURIComponent(msg)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ─── Send email via Gmail API ─────────────────────────────────────────────────

async function sendGmail(accessToken: string, opts: {
  from: string; to: string; subject: string; body: string
}) {
  const raw = buildRawEmail(opts)
  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Gmail send failed')
  return data
}

// ─── List inbox messages ──────────────────────────────────────────────────────

async function listMessages(accessToken: string, maxResults = 50) {
  // Exclude promotions, social, forums — keep personal + transactional
  const q = encodeURIComponent('-category:promotions -category:social -category:forums')
  const res = await fetch(
    `${GMAIL_API}/messages?maxResults=${maxResults}&labelIds=INBOX&q=${q}`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Gmail list failed')
  return data.messages ?? []
}

// ─── Get single message details ───────────────────────────────────────────────

async function getMessage(accessToken: string, msgId: string) {
  const res = await fetch(
    `${GMAIL_API}/messages/${msgId}?format=full`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message ?? 'Gmail get message failed')
  return data
}

function getHeader(headers: { name: string; value: string }[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? ''
}

function b64Decode(data: string): string {
  const bin = atob(data.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

function decodeBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) return b64Decode(payload.body.data)
  if (payload.parts) {
    // Cherche d'abord les parties imbriquées (multipart/alternative)
    const allParts: any[] = []
    const flatten = (parts: any[]) => {
      for (const p of parts) {
        allParts.push(p)
        if (p.parts) flatten(p.parts)
      }
    }
    flatten(payload.parts)
    const html = allParts.find(p => p.mimeType === 'text/html' && p.body?.data)
    if (html) return b64Decode(html.body.data)
    const txt = allParts.find(p => p.mimeType === 'text/plain' && p.body?.data)
    if (txt) return b64Decode(txt.body.data)
  }
  return ''
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { action } = body

    // ── exchange: code → tokens ──────────────────────────────────────────────
    if (action === 'exchange') {
      const { code, redirectUri } = body
      const tokens = await exchangeCode(code, redirectUri)
      return new Response(JSON.stringify(tokens), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── All other actions need a refreshToken from the user profile ───────────
    const { refreshToken } = body
    if (!refreshToken) throw new Error('refreshToken required')

    const accessToken = await refreshAccessToken(refreshToken)

    // ── send ─────────────────────────────────────────────────────────────────
    if (action === 'send') {
      const { from, to, subject, html } = body
      const result = await sendGmail(accessToken, { from, to, subject, body: html })

      // Persist to Supabase if userId provided
      if (body.userId && body.dbPayload) {
        const admin = createClient(SUPABASE_URL, SERVICE_KEY)
        await admin.from('email_messages').insert({
          ...body.dbPayload,
          user_id: body.userId,
          gmail_id: result.id,
          direction: 'sent',
          read: true,
        })
      }

      return new Response(JSON.stringify({ id: result.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ── list: fetch recent inbox messages ────────────────────────────────────
    if (action === 'list') {
      const refs = await listMessages(accessToken, 30)
      const messages = await Promise.all(
        refs.slice(0, 30).map(async (ref: { id: string }) => {
          const msg = await getMessage(accessToken, ref.id)
          const headers = msg.payload?.headers ?? []
          return {
            id:      msg.id,
            from:    getHeader(headers, 'From'),
            to:      getHeader(headers, 'To'),
            subject: getHeader(headers, 'Subject'),
            date:    getHeader(headers, 'Date'),
            body:    decodeBody(msg.payload),
            read:    !msg.labelIds?.includes('UNREAD'),
          }
        })
      )
      return new Response(JSON.stringify({ messages }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error(`Unknown action: ${action}`)
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { EmailMessage } from '@/types'

const GMAIL_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail`

async function callGmail(payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(GMAIL_FN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token ?? ''}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json
}

interface SendParams {
  to: string
  toName: string
  clientId: string | null
  subject: string
  body: string
  refreshToken: string
  fromEmail: string
  fromName: string
}

interface EmailState {
  messages: EmailMessage[]
  loading: boolean
  sending: boolean

  fetchMessages: () => Promise<void>
  fetchGmailInbox: (refreshToken: string) => Promise<void>
  sendEmail: (params: SendParams) => Promise<{ error: string | null }>
  markAsRead: (id: string) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
  subscribeRealtime: () => () => void
}

export const useEmailStore = create<EmailState>((set, get) => ({
  messages: [],
  loading: false,
  sending: false,

  fetchMessages: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('email_messages')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error && data) set({ messages: data as EmailMessage[] })
    } finally {
      set({ loading: false })
    }
  },

  fetchGmailInbox: async (refreshToken: string) => {
    set({ loading: true })
    try {
      const { messages: gmailMsgs } = await callGmail({ action: 'list', refreshToken })

      // Filtre client-side : exclut les expéditeurs auto/promo
      const PROMO_PATTERNS = [
        /noreply/i, /no-reply/i, /newsletter/i, /notification/i,
        /aliexpress/i, /amazon/i, /ebay/i, /linkedin/i, /facebook/i,
        /twitter/i, /instagram/i, /tiktok/i, /youtube/i,
        /donotreply/i, /do-not-reply/i, /mailer/i, /bounce/i,
      ]
      const isPromo = (from: string) => PROMO_PATTERNS.some(p => p.test(from))

      const received: EmailMessage[] = gmailMsgs
        .filter((m: any) => !isPromo(m.from ?? ''))
        .map((m: any) => {
        const fromRaw: string = m.from ?? ''
        const nameMatch = fromRaw.match(/^(.+?)\s*</)
        const emailMatch = fromRaw.match(/<(.+?)>/)
        const clientName  = nameMatch?.[1]?.replace(/^"|"$/g, '').trim() ?? fromRaw
        const clientEmail = emailMatch?.[1]?.trim() ?? fromRaw

        return {
          id:           `gmail-${m.id}`,
          user_id:      '',
          client_id:    null,
          client_email: clientEmail,
          client_name:  clientName,
          direction:    'received' as const,
          subject:      m.subject ?? '(sans objet)',
          body:         m.body ?? '',
          gmail_id:     m.id,
          read:         m.read,
          created_at:   m.date ? new Date(m.date).toISOString() : new Date().toISOString(),
        }
      })

      // Keep locally-sent messages + replace received with fresh Gmail data
      set(s => ({
        messages: [
          ...s.messages.filter(m => m.direction === 'sent'),
          ...received,
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      }))
    } finally {
      set({ loading: false })
    }
  },

  sendEmail: async ({ to, toName, clientId, subject, body, refreshToken, fromEmail, fromName }) => {
    set({ sending: true })
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const dbPayload = {
        client_id:    clientId,
        client_email: to,
        client_name:  toName,
        subject,
        body,
        gmail_id:     null,
      }

      const result = await callGmail({
        action: 'send',
        refreshToken,
        from:   fromName ? `${fromName} <${fromEmail}>` : fromEmail,
        to,
        subject,
        html:   body,
        userId: user?.id,
        dbPayload,
      })

      // Optimistic update
      const optimistic: EmailMessage = {
        id:           `sent-${Date.now()}`,
        user_id:      user?.id ?? '',
        client_id:    clientId,
        client_email: to,
        client_name:  toName,
        direction:    'sent',
        subject,
        body,
        gmail_id:     result.id ?? null,
        read:         true,
        created_at:   new Date().toISOString(),
      }
      set(s => ({ messages: [optimistic, ...s.messages] }))

      return { error: null }
    } catch (e: any) {
      return { error: e?.message ?? 'Erreur réseau' }
    } finally {
      set({ sending: false })
    }
  },

  markAsRead: async (id) => {
    if (!id.startsWith('gmail-')) {
      await supabase.from('email_messages').update({ read: true }).eq('id', id)
    }
    set(s => ({ messages: s.messages.map(m => m.id === id ? { ...m, read: true } : m) }))
  },

  deleteMessage: async (id) => {
    if (!id.startsWith('gmail-')) {
      await supabase.from('email_messages').delete().eq('id', id)
    }
    set(s => ({ messages: s.messages.filter(m => m.id !== id) }))
  },

  subscribeRealtime: () => {
    const channel = supabase
      .channel('email_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'email_messages',
      }, (payload) => {
        const msg = payload.new as EmailMessage
        set(s => ({ messages: [msg, ...s.messages] }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },
}))

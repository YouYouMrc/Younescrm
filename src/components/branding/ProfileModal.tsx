import { useState, useRef } from 'react'
import { X, Camera, Loader2, Check, Mail, LogOut as Disconnect } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getAvatarUrl } from '@/utils/avatar'

interface Props {
  onClose: () => void
}

// ─── 24 presets notionists avec couleurs variées ──────────────────────────────

const BG_COLORS = [
  'b6d9f7', 'c9b8f0', 'f7c5d0', 'fdd9b5',
  'b5ead7', 'f9f0a8', 'c8f0c8', 'f0c8f0',
  'd0eaff', 'ffe4b5', 'ffc8d4', 'c8f0e8',
]

const SEEDS = [
  'alex', 'sarah', 'marcus', 'elena', 'jason', 'david',
  'maya', 'theo', 'nina', 'carlos', 'zoe', 'felix',
  'luna', 'max', 'aria', 'ryan', 'sofia', 'leo',
  'emma', 'kai', 'diana', 'omar', 'yuki', 'ben',
]

const PRESETS = SEEDS.map((seed, i) => {
  const bg = BG_COLORS[i % BG_COLORS.length]
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=${bg}&radius=50`
})

export default function ProfileModal({ onClose }: Props) {
  const { profile, updateProfile } = useAuthStore()

  const [nom,    setNom]    = useState(profile?.nom ?? '')
  const [role,   setRole]   = useState(profile?.role ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar ?? '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const gmailEmail = profile?.branding?.gmailEmail
  const gmailName  = profile?.branding?.gmailName

  const connectGmail = () => {
    const clientId    = import.meta.env.VITE_GMAIL_CLIENT_ID
    const redirectUri = `${window.location.origin}/auth/gmail/callback`
    const scope = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ')

    const url = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope,
      access_type:   'offline',
      prompt:        'consent',
    })
    window.location.href = url
  }

  const disconnectGmail = async () => {
    const branding = { ...(profile?.branding ?? {}), gmailRefreshToken: '', gmailEmail: '', gmailName: '' }
    await updateProfile({ branding })
  }

  // Avatar affiché : priorité photo uploadée, sinon notionists du nom
  const displayAvatar = avatar || getAvatarUrl(nom || profile?.nom || 'user')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Image trop lourde (max 2 Mo)'); return }
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await updateProfile({ nom, role, avatar })
      if (error) setError(error)
      else { setSuccess(true); setTimeout(onClose, 800) }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = '1' }}
      onMouseUp={e => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}
    >
      <div className="modal-content" style={{ maxWidth: 460 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-syne font-bold text-base text-text1">Mon profil</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Avatar courant */}
          <div className="flex flex-col items-center gap-2 pb-4" style={{ borderBottom: '1px solid var(--border1)' }}>
            <div className="relative">
              <img
                src={displayAvatar}
                alt="avatar"
                className="w-20 h-20 rounded-full object-cover"
                style={{ background: 'var(--surface2)' }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors"
                style={{ background: 'var(--surface2)', borderColor: 'var(--surface1)', color: 'var(--text2)' }}
                title="Importer une photo"
              >
                <Camera size={12} />
              </button>
            </div>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="text-xs"
                style={{ color: 'var(--text3)' }}
              >
                Retirer et utiliser l'avatar automatique
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Grille de presets notionists */}
          <div>
            <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              Choisir un avatar
            </p>
            <div className="grid grid-cols-6 gap-2">
              {PRESETS.map((src, i) => {
                const isSelected = avatar === src
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(isSelected ? '' : src)}
                    aria-pressed={isSelected}
                    aria-label={`Avatar ${i + 1}`}
                    className="relative transition-all hover:scale-110 focus:outline-none"
                    style={{
                      width: 48, height: 48,
                      borderRadius: '50%',
                      border: isSelected ? '2.5px solid var(--accent)' : '2.5px solid transparent',
                      padding: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <img src={src} alt="" style={{ width: 48, height: 48, display: 'block' }} />
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full"
                        style={{ background: 'rgba(59,130,246,0.25)' }}>
                        <Check size={16} style={{ color: 'var(--accent)' }} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Nom */}
          <div className="form-group">
            <label className="form-label">Prénom & Nom</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Jean Dupont" required />
          </div>

          {/* Rôle */}
          <div className="form-group">
            <label className="form-label">Agence / Rôle</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="Web designer freelance" />
          </div>

          {/* ── Gmail connect ── */}
          <div className="flex flex-col gap-3 pt-2" style={{ borderTop: '1px solid var(--border1)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
              Compte Gmail
            </p>
            {gmailEmail ? (
              <div className="flex items-center justify-between rounded-xl px-3 py-3"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border1)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#EA433520' }}>
                    <Mail size={14} style={{ color: '#EA4335' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text1)' }}>{gmailName || gmailEmail}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{gmailEmail}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={disconnectGmail}
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text3)' }}
                  title="Déconnecter Gmail"
                >
                  <Disconnect size={12} />
                  Déconnecter
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={connectGmail}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border1)',
                  color: 'var(--text1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border1)')}
              >
                <svg width="16" height="16" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Connecter mon compte Gmail
              </button>
            )}
          </div>

          {error && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: '#3D1A10', color: '#F87171' }}>{error}</div>
          )}
          {success && (
            <div className="text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--accent)' }}>Profil mis à jour ✓</div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center disabled:opacity-60">
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Sauvegarder'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X, Loader2, Mail, Copy, Check, UserPlus, Send } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'

interface Props {
  onClose: () => void
}

type Step = 'form' | 'confirm' | 'success'

export default function InviteModal({ onClose }: Props) {
  const { inviteMember } = useDataStore()

  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  async function handleConfirm() {
    setError(null)
    setEmailWarning(null)
    setLoading(true)
    const result = await inviteMember(email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      setStep('form')
      return
    }
    if (result.token) {
      setInviteLink(`${window.location.origin}/auth?invite=${result.token}`)
      if (result.emailError) setEmailWarning(result.emailError)
      setStep('success')
    }
  }

  async function handleCopy() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
    } catch {
      const el = document.createElement('textarea')
      el.value = inviteLink
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = '1' }}
      onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}
    >
      <div className="modal-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-syne font-bold text-base text-text1">Inviter un membre</h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Fermer"><X size={16} /></button>
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-lg px-3 py-2 mb-4 text-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        {/* ── ÉTAPE 1 : Formulaire email ── */}
        {step === 'form' && (
          <form onSubmit={(e) => { e.preventDefault(); setStep('confirm') }} className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              Entre l'adresse email du collaborateur à inviter.
            </p>
            <div className="form-group">
              <label className="form-label">Adresse e-mail *</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collaborateur@exemple.fr"
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" className="btn-secondary flex-1" onClick={onClose}>
                Annuler
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={!email.trim()}>
                Suivant →
              </button>
            </div>
          </form>
        )}

        {/* ── ÉTAPE 2 : Confirmation ── */}
        {step === 'confirm' && (
          <div className="flex flex-col gap-5">
            {/* Icône */}
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <UserPlus size={24} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="font-syne font-bold text-base text-text1">Confirmer l'invitation</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
                  Voulez-vous vraiment inviter
                </p>
                <p className="font-semibold text-sm mt-0.5" style={{ color: 'var(--accent)' }}>
                  {email}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                  dans votre équipe ?
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setStep('form')}
                disabled={loading}
              >
                ← Retour
              </button>
              <button
                type="button"
                className="btn-primary flex-1 justify-center"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                  : <><Send size={14} /> Oui, inviter</>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Succès ── */}
        {step === 'success' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(59,130,246,0.25)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <UserPlus size={15} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#3B82F6' }}>Lien d'invitation créé ✓</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                  {emailWarning ? 'Email non envoyé — partage le lien manuellement' : 'Email envoyé automatiquement'}
                </p>
              </div>
            </div>
            {emailWarning && (
              <div className="rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)' }}>
                ⚠️ {emailWarning}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text3)', fontSize: '11px' }}>Lien personnel d'invitation</label>
              <div className="flex gap-2">
                <div
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono truncate select-all cursor-text"
                  style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', color: 'var(--text2)' }}
                  title={inviteLink ?? ''}
                >
                  {inviteLink}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-primary flex-shrink-0 gap-1.5"
                  style={copied ? { background: '#323E83' } : {}}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            <button type="button" className="btn-secondary w-full justify-center" onClick={onClose}>
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

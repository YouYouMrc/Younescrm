import { useState } from 'react'
import { X, Loader2, Phone, Mail, Building2, User, CalendarDays, MessageSquare, Globe, Copy, Check, PhoneCall, PartyPopper } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'
import { NICHES, SOURCES, STATUS_LEADS, ACTIONS_CONTACT } from '@/types'
import { DriveIcon, FigmaIcon } from '@/components/ui/ServiceIcons'

async function generateColdCallScript(params: {
  nom: string
  entreprise: string
  niche: string
  besoin: string
  site: string
}): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-cold-call', { body: params })
  if (error) throw new Error('Erreur API Claude')
  return data.text
}

interface Props {
  lead?: Lead
  onClose: () => void
}

const STATUS_COLORS: Record<string, string> = {
  'À contacter': '#3B82F6',
  'Contacté': '#3B82F6',
  'En discussion': '#3B82F6',
  'Devis envoyé': '#3B82F6',
  'RDV fixé': '#3B82F6',
  'Négociation': '#2563EB',
  'Gagné': '#3B82F6',
  'Perdu': '#8A9BD4',
}

export default function LeadModal({ lead, onClose }: Props) {
  const { createLead, updateLead, leads } = useDataStore()

  const [nom, setNom] = useState(lead?.nom === 'Sans nom' ? '' : (lead?.nom ?? ''))
  const [entreprise, setEntreprise] = useState(lead?.entreprise ?? '')
  const [email, setEmail] = useState(lead?.email ?? '')
  const [telephone, setTelephone] = useState(lead?.telephone ?? '')
  const [emailChanged, setEmailChanged] = useState(false)
  const [telChanged, setTelChanged] = useState(false)
  const [budget, setBudget] = useState(lead?.budget ?? 0)
  const [proba, setProba] = useState(lead?.proba ?? 50)
  const [niche, setNiche] = useState(lead?.niche ?? NICHES[0])
  const [source, setSource] = useState(lead?.source ?? SOURCES[0])
  const [score, setScore] = useState(lead?.score ?? 5)
  const [statut, setStatut] = useState(lead?.statut ?? 'À contacter')
  const [besoin, setBesoin] = useState(lead?.besoin ?? '')
  const [prochainContact, setProchainContact] = useState(lead?.prochain_contact ?? '')
  const [typeAction, setTypeAction] = useState(lead?.type_action ?? 'Appel')
  const [notes, setNotes] = useState(lead?.notes ?? '')
  const [site, setSite] = useState(lead?.site ?? '')
  const [drive, setDrive] = useState(lead?.drive ?? '')
  const [figma, setFigma] = useState(lead?.figma ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coldCall, setColdCall] = useState<string | null>(null)
  const [coldCallLoading, setColdCallLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dupWarning, setDupWarning] = useState<string | null>(null)
  const [showGagnePrompt, setShowGagnePrompt] = useState(false)

  const isEdit = !!lead

  function validate(): string | null {
    // En mode création uniquement : exiger au moins un identifiant
    if (!isEdit && !nom.trim() && !entreprise.trim()) return 'Renseigne au moins un nom ou une entreprise.'
    // Valider email/tel seulement en création ou si l'utilisateur les a modifiés
    if (email && (!isEdit || emailChanged) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide.'
    if (telephone && (!isEdit || telChanged) && !/^[\d\s\+\-\.\(\)]{7,}$/.test(telephone)) return 'Téléphone invalide.'
    return null
  }

  function checkDuplicate(): string | null {
    if (!isEdit && email) {
      const dup = leads.find((l) => l.email && l.email.toLowerCase() === email.toLowerCase())
      if (dup) return `Un lead avec cet email existe déjà : ${dup.nom || dup.entreprise}`
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validErr = validate()
    if (validErr) { setError(validErr); return }
    const dupErr = checkDuplicate()
    if (dupErr && !dupWarning) { setDupWarning(dupErr); return }
    setError(null)
    setDupWarning(null)
    setLoading(true)

    const payload = {
      nom, entreprise, email, telephone,
      niche, source, score, budget, proba,
      statut, besoin,
      prochain_contact: prochainContact || null,
      type_action: typeAction,
      notes, site, drive, figma,
    }

    const result = isEdit
      ? await updateLead(lead.id, payload)
      : await createLead(payload)

    setLoading(false)
    if (result.error) { setError(result.error); return }

    // Si le statut est "Gagné" en mode édition → proposer de créer le client
    if (isEdit && statut === 'Gagné' && lead.statut !== 'Gagné') {
      setLoading(false)
      setShowGagnePrompt(true)
      return
    }

    if (!isEdit) {
      setColdCallLoading(true)
      try {
        const script = await generateColdCallScript({ nom, entreprise, niche, besoin, site })
        setColdCall(script)
      } catch {
        onClose()
      } finally {
        setColdCallLoading(false)
      }
    } else {
      onClose()
    }
  }

  function handleCopy() {
    if (!coldCall) return
    navigator.clipboard.writeText(coldCall)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Écran "Gagné" → proposition créer client ──
  if (showGagnePrompt) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: 460 }}>
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <PartyPopper size={28} style={{ color: '#3B82F6' }} />
            </div>
            <h2 className="font-syne font-bold text-lg text-text1 mb-2">Deal gagné ! 🎉</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text3)' }}>
              Veux-tu créer une fiche client pour <strong style={{ color: 'var(--text1)' }}>{entreprise || nom}</strong> ?
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={onClose}>Non, fermer</button>
              <button
                className="btn-primary flex-1 justify-center"
                onClick={() => {
                  onClose()
                  // Ouvrir le ClientModal pré-rempli via un event custom
                  window.dispatchEvent(new CustomEvent('crm:create-client', {
                    detail: { nom: entreprise || nom, niche, site }
                  }))
                }}
              >
                Oui, créer le client
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Écran de génération / résultat cold call ──
  if (coldCallLoading || coldCall) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <PhoneCall size={16} style={{ color: 'var(--accent)' }} />
              <h2 className="font-syne font-bold text-base text-text1">Script Cold Call</h2>
            </div>
            <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
          </div>

          {coldCallLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
              <p className="text-sm" style={{ color: 'var(--text3)' }}>Génération du script en cours…</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: 'var(--surface2)', color: 'var(--text1)', border: '1px solid var(--border1)', fontFamily: 'inherit' }}>
                {coldCall}
              </div>
              <div className="flex gap-3 mt-5">
                <button className="btn-secondary flex-1" onClick={onClose}>Fermer</button>
                <button className="btn-primary flex-1 justify-center gap-2" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copié !' : 'Copier le script'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = "1" }} onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === "1") { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}>
      <div className="modal-content" style={{ maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-syne font-bold text-base text-text1">
            {isEdit ? 'Modifier le lead' : 'Nouveau lead'}
          </h2>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 mb-4 text-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        {dupWarning && (
          <div className="rounded-lg px-3 py-2 mb-4 text-sm flex items-start gap-2" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            <span className="shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-medium mb-1">{dupWarning}</p>
              <p className="text-xs opacity-80">Clique sur "Créer quand même" pour ignorer ce doublon.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {/* ── Section Contact ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Contact
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <User size={11} style={{ color: 'var(--text3)' }} /> Nom *
                </label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                  placeholder="Jean Dupont" />
              </div>
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Building2 size={11} style={{ color: 'var(--text3)' }} /> Entreprise
                </label>
                <input type="text" value={entreprise} onChange={(e) => setEntreprise(e.target.value)}
                  placeholder="Acme SARL" />
              </div>
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Mail size={11} style={{ color: 'var(--text3)' }} /> Email
                </label>
                <input type="text" value={email} onChange={(e) => { setEmail(e.target.value); setEmailChanged(true) }}
                  placeholder="jean@exemple.fr" />
              </div>
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <Phone size={11} style={{ color: 'var(--text3)' }} /> Téléphone
                </label>
                <input type="text" value={telephone} onChange={(e) => { setTelephone(e.target.value); setTelChanged(true) }}
                  placeholder="06 00 00 00 00" />
              </div>
              {/* Site web dans la section contact */}
              <div className="form-group col-span-2">
                <label className="form-label flex items-center gap-1.5">
                  <Globe size={11} style={{ color: 'var(--text3)' }} /> Site web
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="https://exemple.fr"
                    className="flex-1"
                  />
                  {site && (
                    <a
                      href={site.startsWith('http') ? site : `https://${site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium shrink-0 transition-all"
                      style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)' }}
                    >
                      <Globe size={12} /> Ouvrir
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Section Catégorie ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Catégorie
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label">Niche</label>
                <select value={niche} onChange={(e) => setNiche(e.target.value)}>
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Source</label>
                <select value={source} onChange={(e) => setSource(e.target.value)}>
                  {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {/* Score */}
            <div className="mt-3">
              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span>Score</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--surface3)', color: 'var(--accent)' }}>
                    {score}/10
                  </span>
                </label>
                <input type="range" min={0} max={10} step={1} value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-2"
                  style={{ accentColor: 'var(--accent)', padding: 0, background: 'var(--surface3)' }} />
              </div>
            </div>
          </div>

          {/* ── Section Pipeline ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Pipeline commercial
            </p>
            {/* Statut */}
            <div className="form-group mb-3">
              <label className="form-label">Étape</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {STATUS_LEADS.map((s) => (
                  <button key={s} type="button" onClick={() => setStatut(s)}
                    className="text-xs px-2.5 py-1 rounded-md font-medium transition-all border"
                    style={{
                      background: statut === s ? `${STATUS_COLORS[s]}22` : 'var(--surface2)',
                      color: statut === s ? STATUS_COLORS[s] : 'var(--text3)',
                      borderColor: statut === s ? `${STATUS_COLORS[s]}55` : 'var(--border1)',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="form-group">
                <label className="form-label">Montant payé (€)</label>
                <input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} placeholder="0" />
              </div>
            </div>
            <div className="form-group mt-3">
              <label className="form-label">Besoin / Description</label>
              <textarea rows={2} value={besoin} onChange={(e) => setBesoin(e.target.value)}
                placeholder="Refonte site, SEO, e-commerce…" style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* ── Section Prochaine action ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Prochaine action
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <CalendarDays size={11} style={{ color: 'var(--text3)' }} /> Date
                </label>
                <input type="date" value={prochainContact}
                  onChange={(e) => setProchainContact(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label flex items-center gap-1.5">
                  <MessageSquare size={11} style={{ color: 'var(--text3)' }} /> Type
                </label>
                <select value={typeAction} onChange={(e) => setTypeAction(e.target.value)}>
                  {ACTIONS_CONTACT.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Liens outils ── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Liens outils
            </p>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <span className="flex items-center"><DriveIcon size={12} /></span> Drive
                  </label>
                  <input type="text" value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="https://drive.google.com/…" />
                </div>
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <span className="flex items-center"><FigmaIcon size={12} /></span> Figma
                  </label>
                  <input type="text" value={figma} onChange={(e) => setFigma(e.target.value)} placeholder="https://figma.com/file/…" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques, contexte…" style={{ resize: 'vertical' }} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Enregistrement…' : dupWarning ? 'Créer quand même' : isEdit ? 'Mettre à jour' : 'Créer le lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


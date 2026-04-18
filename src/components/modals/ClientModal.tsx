import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Client } from '@/types'
import { NICHES, STATUS_CLIENTS } from '@/types'
import { DriveIcon, FigmaIcon } from '@/components/ui/ServiceIcons'

interface Prefill { nom?: string; niche?: string; site?: string }

interface Props {
  client?: Client
  prefill?: Prefill
  onClose: () => void
}

export default function ClientModal({ client, prefill, onClose }: Props) {
  const { createClient, updateClient } = useDataStore()

  const [nom, setNom] = useState(client?.nom ?? prefill?.nom ?? '')
  const [site, setSite] = useState(client?.site ?? prefill?.site ?? '')
  const [niche, setNiche] = useState<string>(client?.niche ?? prefill?.niche ?? NICHES[0])
  const [secteur, setSecteur] = useState(client?.secteur ?? '')
  const [ca, setCa] = useState<number>(client?.ca ?? 0)
  const [statut, setStatut] = useState<string>(client?.statut ?? STATUS_CLIENTS[0])
  const [drive, setDrive] = useState(client?.drive ?? '')
  const [figma, setFigma] = useState(client?.figma ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!client

  function validate(): string | null {
    if (!nom.trim()) return 'Le nom du client est obligatoire.'
    if (site && !/^https?:\/\//i.test(site) && !site.includes('.')) return 'URL du site invalide.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)

    const payload = { nom, site, niche, secteur, ca, statut, drive, figma }

    const result = isEdit
      ? await updateClient(client.id, payload)
      : await createClient(payload)

    setLoading(false)
    if (result.error) setError(result.error)
    else onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = "1" }} onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === "1") { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}>
      <div className="modal-content">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-syne font-bold text-base text-text1">
            {isEdit ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 mb-4 text-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nom + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Jean Dupont" required />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value)}>
                {STATUS_CLIENTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Niche + Secteur */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Niche</label>
              <select value={niche} onChange={(e) => setNiche(e.target.value)}>
                {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Secteur</label>
              <input type="text" value={secteur} onChange={(e) => setSecteur(e.target.value)} placeholder="PME, startup…" />
            </div>
          </div>

          {/* Site */}
          <div className="form-group">
            <label className="form-label">Site web</label>
            <input type="text" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://exemple.fr" />
          </div>

          {/* Montant payé */}
          <div className="form-group">
            <label className="form-label">Montant payé (€)</label>
            <div className="relative">
              <input type="number" min={0} step={100} value={ca} onChange={(e) => setCa(Number(e.target.value))} placeholder="0" className="pr-8" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--text3)' }}>€</span>
            </div>
          </div>

          {/* Liens Drive + Figma */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
              Liens outils
            </p>
            <div className="flex flex-col gap-3">
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <span className="flex items-center"><DriveIcon size={14} /></span>
                  Google Drive
                </label>
                <input type="text" value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="https://drive.google.com/…" />
              </div>
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  <span className="flex items-center"><FigmaIcon size={14} /></span>
                  Figma
                </label>
                <input type="text" value={figma} onChange={(e) => setFigma(e.target.value)} placeholder="https://figma.com/file/…" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

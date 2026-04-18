import { useState } from 'react'
import { X, Loader2, ChevronDown, ChevronUp, Link } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Projet } from '@/types'
import { STAGES } from '@/types'

interface Props {
  projet?: Projet
  onClose: () => void
}

export default function ProjetModal({ projet, onClose }: Props) {
  const { createProjet, updateProjet } = useDataStore()

  const [nom, setNom] = useState(projet?.nom ?? '')
  const [client, setClient] = useState(projet?.client ?? '')
  const [stage, setStage] = useState<string>(projet?.stage ?? STAGES[0])
  const [av, setAv] = useState<number>(projet?.av ?? 0)
  const [statut, setStatut] = useState(projet?.statut ?? '')
  const [ech, setEch] = useState(projet?.ech ?? '')
  const [drive, setDrive] = useState(projet?.drive ?? '')
  const [figma, setFigma] = useState(projet?.figma ?? '')
  const [github, setGithub] = useState(projet?.github ?? '')
  const [notion, setNotion] = useState(projet?.notion ?? '')
  const [site, setSite] = useState(projet?.site ?? '')

  const [liensOpen, setLiensOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!projet

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = { nom, client, stage: stage as Projet['stage'], av, statut, ech, drive, figma, github, notion, site }

    const result = isEdit
      ? await updateProjet(projet.id, payload)
      : await createProjet(payload)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = "1" }} onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === "1") { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}>
      <div className="modal-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-syne font-bold text-base text-text1">
            {isEdit ? 'Modifier le projet' : 'Nouveau projet'}
          </h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-lg px-3 py-2 mb-4 text-sm"
            style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Row 1: nom + client */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Nom du projet *</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Refonte site Acme"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Client</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Acme SARL"
              />
            </div>
          </div>

          {/* Row 2: stage + échéance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)}>
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Échéance</label>
              <input
                type="date"
                value={ech}
                onChange={(e) => setEch(e.target.value)}
              />
            </div>
          </div>

          {/* Statut */}
          <div className="form-group">
            <label className="form-label">Statut</label>
            <input
              type="text"
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              placeholder="Ex : En attente de validation…"
            />
          </div>

          {/* Avancement */}
          <div className="form-group">
            <label className="form-label flex items-center justify-between">
              <span>Avancement</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: 'var(--surface3)', color: 'var(--accent)' }}
              >
                {av} %
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={av}
              onChange={(e) => setAv(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent)', padding: 0, background: 'var(--surface3)' }}
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text3)' }}>
              <span>0 %</span>
              <span>100 %</span>
            </div>
          </div>

          {/* Section Liens (collapsible) */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border1)' }}
          >
            <button
              type="button"
              onClick={() => setLiensOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors"
              style={{ background: 'var(--surface2)' }}
            >
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text2)' }}>
                <Link size={14} />
                Liens du projet
              </div>
              {liensOpen
                ? <ChevronUp size={14} style={{ color: 'var(--text3)' }} />
                : <ChevronDown size={14} style={{ color: 'var(--text3)' }} />
              }
            </button>

            {liensOpen && (
              <div className="p-4 flex flex-col gap-3" style={{ background: 'var(--surface1)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Google Drive</label>
                    <input
                      type="text"
                      value={drive}
                      onChange={(e) => setDrive(e.target.value)}
                      placeholder="https://drive.google.com/…"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Figma</label>
                    <input
                      type="text"
                      value={figma}
                      onChange={(e) => setFigma(e.target.value)}
                      placeholder="https://figma.com/…"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">GitHub</label>
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="https://github.com/…"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notion</label>
                    <input
                      type="text"
                      value={notion}
                      onChange={(e) => setNotion(e.target.value)}
                      placeholder="https://notion.so/…"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Site web</label>
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="https://exemple.fr"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

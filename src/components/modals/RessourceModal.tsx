import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Ressource } from '@/types'
import { SERVICE_CONFIG } from '@/components/ui/ServiceIcons'

interface Props {
  ressource?: Ressource
  onClose: () => void
}

const TYPES_RESSOURCE = ['Drive', 'Figma', 'Notion', 'GitHub', 'Autre'] as const
type TypeRessource = typeof TYPES_RESSOURCE[number]

export default function RessourceModal({ ressource, onClose }: Props) {
  const { createRessource, updateRessource } = useDataStore()

  const [nom, setNom] = useState(ressource?.nom ?? '')
  const [type, setType] = useState<TypeRessource>((ressource?.type as TypeRessource) ?? 'Figma')
  const [client, setClient] = useState(ressource?.client ?? '')
  const [url, setUrl] = useState(ressource?.url ?? '')
  const [tags, setTags] = useState(ressource?.tags ?? '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!ressource
  const config = SERVICE_CONFIG[type] ?? SERVICE_CONFIG['Autre']
  const Icon = config.icon

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = { nom, type, client, url, tags }

    const result = isEdit
      ? await updateRessource(ressource.id, payload)
      : await createRessource(payload)

    setLoading(false)
    if (result.error) setError(result.error)
    else onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = "1" }} onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === "1") { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}>
      <div className="modal-content">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-syne font-bold text-base text-text1">
            {isEdit ? 'Modifier la ressource' : 'Nouvelle ressource'}
          </h2>
          <button className="btn-ghost" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="rounded-lg px-3 py-2 mb-4 text-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Type selector avec icône preview */}
          <div className="form-group">
            <label className="form-label">Outil</label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {TYPES_RESSOURCE.map((t) => {
                const cfg = SERVICE_CONFIG[t] ?? SERVICE_CONFIG['Autre']
                const TIcon = cfg.icon
                const isSelected = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border transition-all"
                    style={{
                      background: isSelected ? cfg.bg : 'var(--surface2)',
                      borderColor: isSelected ? 'var(--accent)' : 'var(--border1)',
                      minWidth: 64,
                    }}
                  >
                    <TIcon size={24} />
                    <span className="text-xs font-medium" style={{ color: isSelected ? 'var(--text1)' : 'var(--text3)' }}>
                      {t}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview icône sélectionnée */}
          <div className="flex items-center gap-4 p-3 rounded-xl" style={{ background: config.bg }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <Icon size={36} />
            </div>
            <div>
              <p className="font-syne font-bold text-sm text-text1">{nom || 'Nom de la ressource'}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{type}</p>
            </div>
          </div>

          {/* Nom */}
          <div className="form-group">
            <label className="form-label">Nom *</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Maquette homepage"
              required
            />
          </div>

          {/* Client */}
          <div className="form-group">
            <label className="form-label">Client associé</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Acme SARL"
            />
          </div>

          {/* URL */}
          <div className="form-group">
            <label className="form-label">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://figma.com/file/…"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">
              Tags
              <span className="ml-1 font-normal" style={{ color: 'var(--text3)' }}>(séparés par des virgules)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="design, maquette, v2…"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer la ressource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

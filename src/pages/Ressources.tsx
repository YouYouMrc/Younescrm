import { useState } from 'react'
import { Plus, Pencil, Trash2, ExternalLink, X } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Ressource } from '@/types'
import RessourceModal from '@/components/modals/RessourceModal'
import { SERVICE_CONFIG, DriveIcon, FigmaIcon } from '@/components/ui/ServiceIcons'

const TYPES = ['Tout', 'Drive', 'Figma', 'Notion', 'GitHub', 'Autre']

export default function Ressources() {
  const { ressources, deleteRessource, clients, leads } = useDataStore()

  type AutoLink = { nom: string; source: string; type: 'Drive' | 'Figma'; url: string }
  const autoLinks: AutoLink[] = []
  for (const c of clients) {
    if (c.drive) autoLinks.push({ nom: c.nom, source: 'Client', type: 'Drive', url: c.drive })
    if (c.figma) autoLinks.push({ nom: c.nom, source: 'Client', type: 'Figma', url: c.figma })
  }
  for (const l of leads) {
    if (l.drive) autoLinks.push({ nom: l.nom, source: l.entreprise || 'Lead', type: 'Drive', url: l.drive })
    if (l.figma) autoLinks.push({ nom: l.nom, source: l.entreprise || 'Lead', type: 'Figma', url: l.figma })
  }

  const [editing, setEditing] = useState<Ressource | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filterType, setFilterType] = useState('Tout')
  const [selected, setSelected] = useState<Ressource | null>(null)

  const filtered = filterType === 'Tout' ? ressources : ressources.filter((r) => r.type === filterType)

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette ressource ?')) return
    await deleteRessource(id)
    setSelected(null)
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface2)' }}>
          {TYPES.map((t) => {
            const config = SERVICE_CONFIG[t]
            return (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: filterType === t ? 'var(--surface3)' : 'transparent',
                  color: filterType === t ? 'var(--text1)' : 'var(--text3)',
                }}
              >
                {config && t !== 'Tout' && <span className="flex items-center"><config.icon size={12} /></span>}
                {t}
              </button>
            )
          })}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={14} />
          Nouvelle ressource
        </button>
      </div>

      {/* Grid de petites cartes */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Aucune ressource pour l'instant</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
          {filtered.map((r) => {
            const config = SERVICE_CONFIG[r.type] ?? SERVICE_CONFIG['Autre']
            const Icon = config.icon
            const isSelected = selected?.id === r.id

            return (
              <div
                key={r.id}
                onClick={() => setSelected(isSelected ? null : r)}
                className="cursor-pointer transition-all duration-150"
                style={{
                  background: isSelected ? 'var(--surface3)' : 'var(--surface1)',
                  border: `1px solid ${isSelected ? 'var(--border2)' : 'var(--border1)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                {/* Zone icône */}
                <div
                  className="flex items-center justify-center"
                  style={{ background: config.bg, height: 90 }}
                >
                  <Icon size={36} />
                </div>
                {/* Nom */}
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold text-text1 truncate">{r.nom}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{r.type}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Panel détail */}
      {selected && (
        <div className="card flex flex-col gap-4 animate-fade-in" style={{ borderColor: 'var(--border2)' }}>
          {/* Header panel */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => {
                const config = SERVICE_CONFIG[selected.type] ?? SERVICE_CONFIG['Autre']
                const Icon = config.icon
                return (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: config.bg }}>
                    <Icon size={22} />
                  </div>
                )
              })()}
              <div>
                <h3 className="font-syne font-bold text-sm text-text1">{selected.nom}</h3>
                <span className="text-xs" style={{ color: 'var(--text3)' }}>{selected.type}</span>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="btn-ghost p-1.5"><X size={14} /></button>
          </div>

          {/* Données */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {selected.client && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>Client</p>
                <p className="text-sm text-text1">{selected.client}</p>
              </div>
            )}
            {selected.url && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>URL</p>
                <a
                  href={selected.url.startsWith('http') ? selected.url : `https://${selected.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs hover:underline truncate"
                  style={{ color: 'var(--accent)' }}
                >
                  <ExternalLink size={11} />
                  <span className="truncate">{selected.url.replace(/^https?:\/\//, '')}</span>
                </a>
              </div>
            )}
            {selected.tags && (
              <div className="col-span-2">
                <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>Tags</p>
                <div className="flex flex-wrap gap-1">
                  {selected.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="badge badge-grey text-xs">#{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border1)' }}>
            <button onClick={() => { setEditing(selected); setSelected(null) }} className="btn-ghost flex-1 justify-center py-1.5 text-xs">
              <Pencil size={12} />
              Éditer
            </button>
            <button onClick={() => handleDelete(selected.id)} className="btn-ghost px-4 py-1.5 text-xs hover:text-red-400">
              <Trash2 size={12} />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* ── Liens automatiques depuis Clients & Leads ── */}
      {autoLinks.length > 0 && (
        <div>
          <h3 className="font-syne font-bold text-sm text-text1 mb-3">Liens depuis Clients & Leads</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
            {autoLinks.map((link, i) => {
              const Icon = link.type === 'Drive' ? DriveIcon : FigmaIcon
              const cfg = SERVICE_CONFIG[link.type]
              return (
                <a
                  key={i}
                  href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-all no-underline"
                  style={{ background: 'var(--surface1)', border: '1px solid var(--border1)', borderRadius: 14, overflow: 'hidden' }}
                >
                  <div className="flex items-center justify-center" style={{ background: cfg.bg, height: 90 }}>
                    <Icon size={36} />
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-semibold text-text1 truncate">{link.nom}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{link.source} · {link.type}</p>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {showCreate && <RessourceModal onClose={() => setShowCreate(false)} />}
      {editing && <RessourceModal ressource={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

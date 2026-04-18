import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Plus, Pencil, Trash2, ExternalLink, Search, X as XIcon, Download } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Client } from '@/types'
import ClientModal from '@/components/modals/ClientModal'
import { DriveIcon, FigmaIcon } from '@/components/ui/ServiceIcons'
import { exportToCsv } from '@/utils/exportCsv'
import { getAvatarUrl } from '@/utils/avatar'

const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  'Actif':    { background: 'rgba(90,196,122,0.14)',  color: '#5AC47A' },
  'En pause': { background: 'rgba(59,130,246,0.14)',  color: '#3B82F6' },
  'Livré':    { background: 'rgba(90,196,184,0.14)',  color: '#5AC4B8' },
  'Archivé':  { background: 'rgba(154,149,144,0.14)', color: '#9A9590' },
}

const STATUS_CLASSES_CLIENT: Record<string, string> = {
  'Actif':    'badge sb-green',
  'En pause': 'badge sb-yellow',
  'Livré':    'badge sb-teal',
  'Archivé':  'badge sb-gray',
}

interface CreateClientEvent { nom: string; niche: string; site: string }

export default function Clients() {
  const { clients, deleteClient } = useDataStore()
  const [editing, setEditing] = useState<Client | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [prefill, setPrefill] = useState<CreateClientEvent | null>(null)

  useEffect(() => {
    function handleEvent(e: Event) {
      const detail = (e as CustomEvent<CreateClientEvent>).detail
      setPrefill(detail)
      setShowCreate(true)
    }
    window.addEventListener('crm:create-client', handleEvent)
    return () => window.removeEventListener('crm:create-client', handleEvent)
  }, [])
  const [filterStatut, setFilterStatut] = useState('Tous')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const statuts = ['Tous', 'Actif', 'En pause', 'Livré', 'Archivé']
  const filtered = clients.filter((c) => {
    if (filterStatut !== 'Tous' && c.statut !== filterStatut) return false
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      return (
        c.nom?.toLowerCase().includes(q) ||
        c.niche?.toLowerCase().includes(q) ||
        c.secteur?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    await deleteClient(id)
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface2)' }}>
            {statuts.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatut(s)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: filterStatut === s ? 'var(--surface3)' : 'transparent',
                  color: filterStatut === s ? 'var(--text1)' : 'var(--text3)',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un client…"
              className="pl-8 pr-7 py-1.5 text-xs rounded-lg"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border1)', color: 'var(--text1)', width: '200px', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }}>
                <XIcon size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportToCsv('clients.csv', filtered.map((c) => ({
              Nom: c.nom, Niche: c.niche, Secteur: c.secteur,
              'Montant payé (€)': c.ca, Statut: c.statut, Site: c.site,
            })))}
            className="btn-secondary"
            aria-label="Exporter les clients en CSV"
          >
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border1)', background: 'var(--surface2)' }}>
                {['Client', 'Niche', 'Secteur', 'Montant payé', 'Site', 'Outils', 'Statut', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text3)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text3)' }}>
                    Aucun client pour l'instant
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="table-row-hover"
                    style={{ borderBottom: '1px solid var(--border1)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={getAvatarUrl(c.nom || '?')}
                          alt={c.nom}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                          style={{ background: 'var(--surface2)' }}
                        />
                        <span className="font-medium text-text1">{c.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.niche ? (
                        <span className="badge badge-grey text-xs">{c.niche}</span>
                      ) : <span className="text-text3">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-text2">{c.secteur || '—'}</td>
                    <td className="px-4 py-3 font-medium text-text1">
                      {c.ca > 0 ? `${c.ca.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {c.site ? (
                        <a
                          href={c.site.startsWith('http') ? c.site : `https://${c.site}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs hover:underline"
                          style={{ color: 'var(--accent)' }}
                        >
                          <ExternalLink size={11} />
                          {c.site.replace(/^https?:\/\//, '')}
                        </a>
                      ) : <span className="text-text3">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.drive && (
                          <a href={c.drive.startsWith('http') ? c.drive : `https://${c.drive}`} target="_blank" rel="noopener noreferrer"
                            title="Google Drive" className="hover:opacity-80 transition-opacity">
                            <DriveIcon size={18} />
                          </a>
                        )}
                        {c.figma && (
                          <a href={c.figma.startsWith('http') ? c.figma : `https://${c.figma}`} target="_blank" rel="noopener noreferrer"
                            title="Figma" className="hover:opacity-80 transition-opacity">
                            <FigmaIcon size={18} />
                          </a>
                        )}
                        {!c.drive && !c.figma && <span className="text-text3 text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs ${STATUS_CLASSES_CLIENT[c.statut] ?? 'badge sb-gray'}`}
                      >
                        {c.statut || 'Actif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(c)} className="btn-ghost p-1.5" title="Éditer">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="btn-ghost p-1.5 hover:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <ClientModal prefill={prefill ?? undefined} onClose={() => { setShowCreate(false); setPrefill(null) }} />}
      {editing && <ClientModal client={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

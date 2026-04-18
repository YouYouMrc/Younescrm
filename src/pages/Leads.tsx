import { useState, Fragment, useRef, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { Plus, Pencil, Trash2, CalendarDays, Phone, PhoneCall, Mail, MessageSquare, LayoutList, Calendar, Upload, Search, X as XIcon, Globe, AlertTriangle, ChevronLeft, ChevronRight, Download, Send, FileText, CalendarRange, List, CheckCircle2, XCircle, MessageCircle, Video, Copy, Check } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Lead } from '@/types'
import { STATUS_LEADS } from '@/types'
import LeadModal from '@/components/modals/LeadModal'
import ImportLeadsModal from '@/components/modals/ImportLeadsModal'
import LeadFinderModal from '@/components/modals/LeadFinderModal'
import { DriveIcon, FigmaIcon } from '@/components/ui/ServiceIcons'
import { exportToCsv } from '@/utils/exportCsv'
import { getAvatarUrl } from '@/utils/avatar'

const STATUS_COLORS: Record<string, { background: string; color: string }> = {
  'À contacter':   { background: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
  'Contacté':      { background: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
  'En discussion': { background: 'rgba(59,130,246,0.14)',  color: '#3B82F6' },
  'Devis envoyé':  { background: 'rgba(59,130,246,0.14)',  color: '#3B82F6' },
  'RDV fixé':      { background: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
  'Négociation':   { background: 'rgba(234,88,12,0.14)',   color: '#EA580C' },
  'Gagné':         { background: 'rgba(90,196,122,0.14)',  color: '#5AC47A' },
  'Perdu':         { background: 'rgba(154,149,144,0.14)', color: '#9A9590' },
}

const STATUS_CLASSES: Record<string, string> = {
  'À contacter':   'badge sb-blue',
  'Contacté':      'badge sb-purple',
  'En discussion': 'badge sb-yellow',
  'Devis envoyé':  'badge sb-orange',
  'RDV fixé':      'badge sb-purple',
  'Négociation':   'badge sb-ember',
  'Gagné':         'badge sb-green',
  'Perdu':         'badge sb-red',
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  'Appel':     Phone,
  'Email':     Mail,
  'RDV':       CalendarDays,
  'WhatsApp':  MessageSquare,
  'Message':   MessageSquare,
}

const STATUS_BULK_ICONS: Record<string, React.ElementType> = {
  'À contacter':  Phone,
  'Contacté':     PhoneCall,
  'En discussion': MessageSquare,
  'Devis envoyé': Send,
  'RDV fixé':     CalendarDays,
  'Négociation':  FileText,
  'Gagné':        Mail,
  'Perdu':        XIcon,
}

// Helpers pour nettoyer les données mal importées
function isUrl(s: string) {
  return /^https?:\/\//i.test(s) || /^www\./i.test(s)
}
function isValidEmail(s: string) {
  return s.includes('@') && s.includes('.')
}
function isValidPhone(s: string) {
  return /[\d]{4,}/.test(s) && !/^https?/.test(s)
}
function cleanDomain(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function scoreColor(score: number) {
  if (score >= 8) return '#5AC47A'
  if (score >= 5) return '#3B82F6'
  return '#3B82F6'
}

function probaColor(p: number) {
  if (p >= 70) return '#5AC47A'
  if (p >= 40) return '#3B82F6'
  return '#3B82F6'
}

function groupByDate(leads: Lead[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)

  const groups: { label: string; color: string; items: Lead[] }[] = [
    { label: 'En retard', color: '#EF4444', items: [] },
    { label: "Aujourd'hui", color: '#5AC47A', items: [] },
    { label: 'Cette semaine', color: '#3B82F6', items: [] },
    { label: 'Prochainement', color: '#3B82F6', items: [] },
    { label: 'Sans date', color: '#9A9590', items: [] },
  ]

  for (const lead of leads) {
    if (!lead.prochain_contact) {
      groups[4].items.push(lead)
      continue
    }
    const d = new Date(lead.prochain_contact)
    d.setHours(0, 0, 0, 0)
    if (d < today) groups[0].items.push(lead)
    else if (d.getTime() === today.getTime()) groups[1].items.push(lead)
    else if (d < nextWeek) groups[2].items.push(lead)
    else groups[3].items.push(lead)
  }

  return groups.filter((g) => g.items.length > 0)
}

export default function Leads() {
  const { leads, deleteLead, updateLead, createClient, clients, createProjet } = useDataStore()
  const [view, setView] = useState<'liste' | 'agenda'>('liste')
  const [filterStatut, setFilterStatut] = useState<string>('Tous')
  const [agendaMode, setAgendaMode] = useState<'calendrier' | 'liste'>('calendrier')
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const [calSelectedDay, setCalSelectedDay] = useState<string | null>(null)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showFinder, setShowFinder] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [rappelOpen, setRappelOpen] = useState<string | null>(null)
  const [rappelDate, setRappelDate] = useState('')
  const [rappelType, setRappelType] = useState('Appel')
  const [meetCopied, setMeetCopied] = useState<string | null>(null)

  // ── Migrer les leads "À définir" → "À contacter" au montage ──
  useEffect(() => {
    leads.forEach(l => {
      if (l.statut === 'À définir' || l.statut === 'À qualifier' || !l.statut) {
        updateLead(l.id, { statut: 'À contacter' })
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Changement de statut + création client si Gagné ──
  const handleStatusChange = async (lead: Lead, newStatut: string) => {
    await updateLead(lead.id, { statut: newStatut })
    if (newStatut === 'Gagné') {
      const alreadyClient = clients.some(c =>
        c.nom.toLowerCase() === (lead.entreprise || lead.nom).toLowerCase()
      )
      if (!alreadyClient) {
        const clientNom = lead.entreprise || lead.nom
        await createClient({
          nom: clientNom,
          site: lead.site || '',
          niche: lead.niche || '',
          secteur: '',
          ca: lead.budget || 0,
          statut: 'Actif',
          drive: lead.drive || '',
          figma: lead.figma || '',
        })
        await createProjet({
          nom: `Site web — ${clientNom}`,
          client: clientNom,
          av: 0,
          stage: 'Analyse & Benchmark',
          statut: 'En cours',
          ech: '',
          drive: lead.drive || '',
          figma: lead.figma || '',
          github: '',
          notion: '',
          site: lead.site || '',
        })
      }
    }
  }

  const filtered = leads.filter((l) => {
    if (filterStatut !== 'Tous' && l.statut !== filterStatut) return false
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      return (
        l.nom?.toLowerCase().includes(q) ||
        l.entreprise?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.niche?.toLowerCase().includes(q) ||
        l.telephone?.includes(q)
      )
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const prochains = leads.filter((l) => {
    if (!l.prochain_contact) return false
    const d = new Date(l.prochain_contact); d.setHours(0, 0, 0, 0)
    return d <= new Date(today.getTime() + 7 * 86400000)
  }).length

  const handleDelete = async (lead: Lead) => {
    setConfirmDelete(lead)
  }

  const confirmAndDelete = async () => {
    if (!confirmDelete) return
    await deleteLead(confirmDelete.id)
    setConfirmDelete(null)
  }

  const agendaGroups = groupByDate(filtered.filter((l) => !['Gagné', 'Perdu'].includes(l.statut)))

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface2)' }}>
            <button onClick={() => setView('liste')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: view === 'liste' ? 'var(--surface3)' : 'transparent', color: view === 'liste' ? 'var(--text1)' : 'var(--text3)' }}>
              <LayoutList size={13} /> Liste
            </button>
            <button onClick={() => setView('agenda')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{ background: view === 'agenda' ? 'var(--surface3)' : 'transparent', color: view === 'agenda' ? 'var(--text1)' : 'var(--text3)' }}>
              <Calendar size={13} /> Agenda
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un lead…"
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
          <button onClick={() => setShowFinder(true)} className="btn-secondary" title="Trouver des leads automatiquement">
            <Search size={14} /> Trouver des leads
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary">
            <Upload size={14} /> Importer
          </button>
          <button
            onClick={() => exportToCsv('leads.csv', filtered.map((l) => ({
              Nom: l.nom, Entreprise: l.entreprise, Email: l.email, Téléphone: l.telephone,
              Niche: l.niche, Statut: l.statut, Score: l.score, Source: l.source,
              'Prochain contact': l.prochain_contact ?? '', Notes: l.notes, Site: l.site,
            })))}
            className="btn-secondary"
            aria-label="Exporter les leads en CSV"
          >
            <Download size={14} /> Export
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={14} /> Nouveau lead
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total leads', value: leads.length, color: '#3B82F6' },
          { label: 'Actions < 7j', value: prochains, color: '#3B82F6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card py-3 px-4">
            <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>{label}</p>
            <p className="font-syne font-bold text-lg" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters (liste only) */}
      {view === 'liste' && (
        <div className="w-full">
          <div className="flex p-1 rounded-xl w-full" style={{ background: 'var(--surface2)' }}>
            {(['Tous', ...STATUS_LEADS] as string[]).map((s) => {
              const isActive = filterStatut === s
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatut(s)}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer"
                  style={{
                    background: isActive ? 'var(--accent)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text3)',
                    outline: 'none',
                  }}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── LISTE VIEW ── */}
      {view === 'liste' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            {/* Barre d'actions en masse */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'var(--border1)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{selected.size} sélectionné{selected.size > 1 ? 's' : ''}</span>
                <div className="flex gap-1.5 ml-2">
                  {STATUS_LEADS.slice(0, 4).map((s) => {
                    const c = STATUS_COLORS[s]
                    return (
                      <button
                        key={s}
                        disabled={bulkLoading}
                        onClick={async () => {
                          setBulkLoading(true)
                          await Promise.all([...selected].map((id) => updateLead(id, { statut: s })))
                          setSelected(new Set())
                          setBulkLoading(false)
                        }}
                        className="text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 cursor-pointer disabled:opacity-50"
                        style={{ background: c?.background ?? 'var(--surface3)', color: c?.color ?? 'var(--text2)', border: `1px solid ${c?.color ?? 'var(--border2)'}22` }}
                        onMouseEnter={(e) => { if (!bulkLoading) e.currentTarget.style.filter = 'brightness(1.25)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
                      >
                        <span className="flex items-center gap-1.5">
                          {(() => { const Icon = STATUS_BULK_ICONS[s]; return Icon ? <Icon size={12} strokeWidth={2} /> : null })()}
                          {s}
                        </span>
                      </button>
                    )
                  })}
                  <button
                    disabled={bulkLoading}
                    onClick={async () => {
                      if (!confirm(`Supprimer ${selected.size} lead(s) ?`)) return
                      setBulkLoading(true)
                      await Promise.all([...selected].map((id) => deleteLead(id)))
                      setSelected(new Set())
                      setBulkLoading(false)
                    }}
                    className="text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-150 cursor-pointer disabled:opacity-50"
                    style={{ background: 'rgba(59,130,246,0.12)', color: '#C2410C', border: '1px solid rgba(59,130,246,0.25)' }}
                    onMouseEnter={(e) => { if (!bulkLoading) e.currentTarget.style.filter = 'brightness(1.25)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
                  >
                    {bulkLoading ? '…' : 'Supprimer'}
                  </button>
                </div>
                <button
                  onClick={() => setSelected(new Set())}
                  className="ml-auto text-xs px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer"
                  style={{ color: 'var(--text3)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text1)'; e.currentTarget.style.background = 'var(--surface3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'transparent' }}
                >
                  Désélectionner
                </button>
              </div>
            )}

            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border1)', background: 'var(--surface2)' }}>
                  <th className="px-4 py-3 w-8">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={paginated.length > 0 && paginated.every((l) => selected.has(l.id))}
                      aria-label="Sélectionner tous les leads de cette page"
                      onClick={() => {
                        const allChecked = paginated.length > 0 && paginated.every((l) => selected.has(l.id))
                        if (allChecked) setSelected(new Set([...selected].filter((id) => !paginated.some((l) => l.id === id))))
                        else setSelected(new Set([...selected, ...paginated.map((l) => l.id)]))
                      }}
                      className="flex items-center justify-center rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                      style={{
                        width: 18, height: 18, flexShrink: 0,
                        border: '2px solid',
                        borderColor: paginated.length > 0 && paginated.every((l) => selected.has(l.id)) ? 'var(--accent)' : 'var(--border2)',
                        borderRadius: 5,
                        background: paginated.length > 0 && paginated.every((l) => selected.has(l.id)) ? 'var(--accent)' : 'transparent',
                        transition: 'background 0.15s, border-color 0.15s',
                        cursor: 'pointer',
                      }}
                    >
                      {paginated.length > 0 && paginated.every((l) => selected.has(l.id)) && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                      {paginated.some((l) => selected.has(l.id)) && !paginated.every((l) => selected.has(l.id)) && (
                        <svg width="8" height="2" viewBox="0 0 8 2" fill="none"><path d="M1 1H7" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      )}
                    </button>
                  </th>
                  {['Contact', 'Niche / Source', 'Étape', 'Prochaine action', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--text3)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text3)' }}>
                      {search || filterStatut !== 'Tous'
                        ? 'Aucun lead ne correspond à ta recherche'
                        : 'Aucun lead pour l\'instant'}
                    </td>
                  </tr>
                ) : (
                  paginated.map((lead) => {
                    const ActionIcon = ACTION_ICONS[lead.type_action] ?? CalendarDays
                    const isExpanded = expanded === lead.id
                    // Nom affiché : si vide ou "Sans nom" → fallback sur entreprise ou email
                    const displayNom = (lead.nom && lead.nom !== 'Sans nom')
                      ? lead.nom
                      : lead.entreprise || lead.email || 'Sans nom'
                    return (
                      <Fragment key={lead.id}>
                      <tr
                        className="table-row-hover cursor-pointer"
                        style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--border1)' }}
                        onClick={() => setExpanded(isExpanded ? null : lead.id)}
                      >
                        <td className="px-4 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={selected.has(lead.id)}
                            aria-label={`Sélectionner ${lead.nom}`}
                            onClick={() => {
                              const next = new Set(selected)
                              selected.has(lead.id) ? next.delete(lead.id) : next.add(lead.id)
                              setSelected(next)
                            }}
                            className="flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                            style={{
                              width: 18, height: 18, flexShrink: 0,
                              border: '2px solid',
                              borderColor: selected.has(lead.id) ? 'var(--accent)' : 'var(--border2)',
                              borderRadius: 5,
                              background: selected.has(lead.id) ? 'var(--accent)' : 'transparent',
                              transition: 'background 0.15s, border-color 0.15s',
                              cursor: 'pointer',
                            }}
                          >
                            {selected.has(lead.id) && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 max-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getAvatarUrl(displayNom)}
                              alt={displayNom}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                              style={{ background: 'var(--surface2)' }}
                            />
                            <p className="font-medium text-text1 truncate">{displayNom}</p>
                          </div>
                          {lead.entreprise && lead.entreprise !== displayNom && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{lead.entreprise}</p>
                          )}
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {lead.email && isValidEmail(lead.email) && (
                              <span className="text-xs truncate" style={{ color: 'var(--text3)' }}>{lead.email}</span>
                            )}
                            {lead.telephone && isValidPhone(lead.telephone) && (
                              <span className="text-xs" style={{ color: 'var(--text3)' }}>{lead.telephone}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          {lead.niche && !isUrl(lead.niche) && (
                            <span className="badge badge-grey text-xs inline-block mb-1 max-w-[160px] truncate" title={lead.niche}>
                              {lead.niche}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.statut ? (
                            <span className={`text-xs ${STATUS_CLASSES[lead.statut] ?? 'badge sb-gray'}`}>
                              {lead.statut}
                            </span>
                          ) : <span className="text-text3">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.prochain_contact ? (
                            <div className="flex items-center gap-1.5">
                              <ActionIcon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                              <div>
                                <p className="text-xs font-medium text-text1">{lead.type_action}</p>
                                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                                  {new Date(lead.prochain_contact).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                          ) : <span className="text-text3 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 justify-end">
                            {(() => {
                              const siteUrl = lead.site || (lead.source && isUrl(lead.source) ? lead.source : '') || (lead.email && isUrl(lead.email) ? lead.email : '')
                              if (!siteUrl) return null
                              const href = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
                              return <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-ghost p-1.5" style={{ color: 'var(--accent)' }}><Globe size={14} /></a>
                            })()}
                            {lead.drive && <a href={lead.drive} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-ghost p-1.5"><DriveIcon size={14} /></a>}
                            {lead.figma && <a href={lead.figma} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-ghost p-1.5"><FigmaIcon size={14} /></a>}
                            <button onClick={(e) => { e.stopPropagation(); setEditing(lead) }} className="btn-ghost p-1.5" title="Éditer"><Pencil size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(lead) }} className="btn-ghost p-1.5 hover:text-red-400" title="Supprimer"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                      {/* ── Panneau détail expandable ── */}
                      {isExpanded && (() => {
                        const ActionIcon = ACTION_ICONS[lead.type_action] ?? CalendarDays
                        const sc = STATUS_COLORS[lead.statut]
                        const score = lead.score ?? 0
                        const siteUrl = lead.site || (lead.source && isUrl(lead.source) ? lead.source : '')
                        return (
                          <tr key={`${lead.id}-detail`} style={{ borderBottom: '1px solid var(--border1)', background: 'var(--surface2)' }}>
                            <td colSpan={6} className="px-5 pb-4 pt-0">
                              <div className="flex flex-col gap-0">

                                {/* ── Zone statut — pleine largeur, bien visible ── */}
                                <div className="py-3" style={{ borderBottom: '1px solid var(--border1)' }}>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-medium mr-1" style={{ color: 'var(--text3)' }}>Statut</span>
                                    {[
                                      { s: 'À contacter',   bg: 'rgba(59,130,246,0.10)', color: '#3B82F6', hov: 'rgba(59,130,246,0.22)' },
                                      { s: 'En discussion', bg: 'rgba(59,130,246,0.10)',  color: '#3B82F6', hov: 'rgba(59,130,246,0.22)' },
                                      { s: 'Gagné',         bg: 'rgba(90,196,122,0.10)',  color: '#5AC47A', hov: 'rgba(90,196,122,0.22)' },
                                      { s: 'Perdu',         bg: 'rgba(154,149,144,0.10)', color: '#9A9590', hov: 'rgba(154,149,144,0.22)' },
                                    ].map(({ s, bg, color, hov }) => {
                                      const active = lead.statut === s
                                      return (
                                        <button key={s}
                                          disabled={active}
                                          onClick={(e) => { e.stopPropagation(); handleStatusChange(lead, s) }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                          style={{
                                            background: active ? color + '28' : bg,
                                            color,
                                            border: `1px solid ${active ? color + '55' : color + '28'}`,
                                            cursor: active ? 'default' : 'pointer',
                                          }}
                                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = hov }}
                                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = bg }}
                                        >
                                          {active && <CheckCircle2 size={11} />}
                                          {s}
                                        </button>
                                      )
                                    })}

                                    {/* Séparateur vertical */}
                                    <div className="w-px h-5 mx-1" style={{ background: 'var(--border2)' }} />

                                    {/* Prochain point date */}
                                    <div className="flex items-center gap-1.5">
                                      <CalendarDays size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                                      <span className="text-xs" style={{ color: 'var(--text3)' }}>Prochain point</span>
                                      <input type="date"
                                        value={lead.prochain_contact?.split('T')[0] ?? ''}
                                        onChange={async e => { e.stopPropagation(); await updateLead(lead.id, { prochain_contact: e.target.value }) }}
                                        onClick={e => e.stopPropagation()}
                                        className="text-xs rounded-md px-2 py-1"
                                        style={{ background: 'var(--surface3)', border: '1px solid var(--border2)', color: 'var(--text1)', outline: 'none', width: 'auto' }} />
                                    </div>

                                    {/* Visio — générer lien Jitsi instantané + copier */}
                                    {lead.meet ? (
                                        /* Lien sauvegardé → afficher + copier + supprimer */
                                        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs"
                                          style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.22)' }}>
                                          <Video size={12} style={{ color: '#3B82F6', flexShrink: 0 }} />
                                          <a href={lead.meet} target="_blank" rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="text-xs truncate max-w-[150px] hover:underline"
                                            style={{ color: '#3B82F6' }}>
                                            {lead.meet.replace('https://meet.jit.si/', 'jitsi/')}
                                          </a>
                                          <button
                                            onClick={e => {
                                              e.stopPropagation()
                                              navigator.clipboard.writeText(lead.meet ?? '')
                                              setMeetCopied(lead.id)
                                              setTimeout(() => setMeetCopied(null), 2000)
                                            }}
                                            className="ml-0.5 p-0.5 rounded transition-all"
                                            style={{ color: meetCopied === lead.id ? '#5AC47A' : '#3B82F6' }}
                                            title="Copier le lien">
                                            {meetCopied === lead.id ? <Check size={11} /> : <Copy size={11} />}
                                          </button>
                                          <button
                                            onClick={e => { e.stopPropagation(); updateLead(lead.id, { meet: '' }) }}
                                            className="ml-0.5 p-0.5 rounded transition-all"
                                            style={{ color: 'var(--text3)' }}
                                            title="Supprimer">
                                            <XIcon size={10} />
                                          </button>
                                        </div>
                                      ) : (
                                        /* Bouton — génère un lien Jitsi unique instantanément */
                                        <button
                                          onClick={async e => {
                                            e.stopPropagation()
                                            const rand = () => Math.random().toString(36).slice(2, 6)
                                            const room = `${rand()}-${rand()}-${rand()}`
                                            const link = `https://meet.jit.si/${room}`
                                            await updateLead(lead.id, { meet: link })
                                            navigator.clipboard.writeText(link)
                                            setMeetCopied(lead.id)
                                            setTimeout(() => setMeetCopied(null), 2000)
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                          style={{ background: 'rgba(59,130,246,0.10)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.25)' }}
                                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.22)')}
                                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.10)')}>
                                          <Video size={12} /> Générer un lien visio
                                        </button>
                                      )}

                                    {/* Spacer + actions secondaires à droite */}
                                    <div className="flex-1" />
                                    <button onClick={(e) => { e.stopPropagation(); setEditing(lead) }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                                      style={{ background: 'var(--surface3)', color: 'var(--text2)', border: '1px solid var(--border2)' }}
                                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--text1)' }}
                                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text2)' }}>
                                      <Pencil size={11} /> Modifier
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(lead) }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                                      style={{ background: 'rgba(154,149,144,0.08)', color: '#9A9590', border: '1px solid rgba(154,149,144,0.18)' }}
                                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.16)' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)' }}>
                                      <Trash2 size={11} /> Supprimer
                                    </button>
                                  </div>
                                </div>

                                {/* ── Infos secondaires — Contact / Pipeline / Notes ── */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">

                                  {/* Contact */}
                                  <div className="flex flex-col gap-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text3)' }}>Contact</p>
                                    {lead.email && isValidEmail(lead.email) && (
                                      <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-xs group" style={{ color: 'var(--text2)' }}>
                                        <Mail size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <span className="truncate group-hover:underline">{lead.email}</span>
                                      </a>
                                    )}
                                    {lead.telephone && isValidPhone(lead.telephone) && (
                                      <a href={`tel:${lead.telephone}`} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text2)' }}>
                                        <Phone size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <span>{lead.telephone}</span>
                                      </a>
                                    )}
                                    {siteUrl && (
                                      <a href={siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs group" style={{ color: 'var(--text2)' }}>
                                        <Globe size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <span className="truncate group-hover:underline">{cleanDomain(siteUrl)}</span>
                                      </a>
                                    )}
                                    {!lead.email && !lead.telephone && !siteUrl && (
                                      <p className="text-xs" style={{ color: 'var(--text3)' }}>Aucune info de contact</p>
                                    )}
                                    {(lead.drive || lead.figma) && (
                                      <div className="flex gap-2 mt-0.5">
                                        {lead.drive && (
                                          <a href={lead.drive} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                                            style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                                            <DriveIcon size={11} /> Drive
                                          </a>
                                        )}
                                        {lead.figma && (
                                          <a href={lead.figma} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
                                            style={{ background: 'var(--surface3)', color: 'var(--text2)' }}>
                                            <FigmaIcon size={11} /> Figma
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Pipeline */}
                                  <div className="flex flex-col gap-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text3)' }}>Pipeline</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs" style={{ color: 'var(--text3)' }}>Score</span>
                                      <div className="flex gap-0.5">
                                        {Array.from({ length: 10 }, (_, i) => (
                                          <div key={i} className="rounded-sm" style={{ width: 10, height: 6, background: i < score ? scoreColor(score) : 'var(--surface3)' }} />
                                        ))}
                                      </div>
                                      <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>{score}/10</span>
                                    </div>
                                    {lead.niche && !isUrl(lead.niche) && (
                                      <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text3)' }}>
                                        <span>Niche :</span>
                                        <span className="badge badge-grey text-xs">{lead.niche}</span>
                                      </div>
                                    )}
                                    {lead.source && !isUrl(lead.source) && (
                                      <p className="text-xs" style={{ color: 'var(--text3)' }}>Source : <span style={{ color: 'var(--text2)' }}>{lead.source}</span></p>
                                    )}
                                    {lead.prochain_contact && (
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <ActionIcon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                        <p className="text-xs" style={{ color: 'var(--text3)' }}>
                                          {new Date(lead.prochain_contact).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' })}
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Notes */}
                                  <div className="flex flex-col gap-1.5">
                                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--text3)' }}>Notes</p>
                                    {(lead.notes || lead.besoin) ? (
                                      <p className="text-xs leading-relaxed line-clamp-4" style={{ color: 'var(--text2)' }}>
                                        {lead.notes || lead.besoin}
                                      </p>
                                    ) : (
                                      <p className="text-xs" style={{ color: 'var(--text3)' }}>Aucune note</p>
                                    )}
                                  </div>

                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      })()}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border1)' }}>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} sur {filtered.length} leads
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost p-1.5 disabled:opacity-30"
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '...')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-xs" style={{ color: 'var(--text3)' }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className="w-7 h-7 rounded-md text-xs font-medium transition-all"
                        style={{
                          background: safePage === p ? 'var(--accent)' : 'var(--surface2)',
                          color: safePage === p ? '#fff' : 'var(--text2)',
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-ghost p-1.5 disabled:opacity-30"
                  aria-label="Page suivante"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGENDA VIEW ── */}
      {view === 'agenda' && (
        <div className="flex gap-2 mb-1">
          {(['calendrier', 'liste'] as const).map((m) => (
            <button key={m} onClick={() => setAgendaMode(m)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
              style={{ background: agendaMode === m ? 'var(--surface3)' : 'var(--surface2)', color: agendaMode === m ? 'var(--text1)' : 'var(--text3)' }}>
              <span className="flex items-center gap-1.5">
                {m === 'calendrier' ? <CalendarRange size={12} /> : <List size={12} />}
                {m === 'calendrier' ? 'Calendrier' : 'Liste'}
              </span>
            </button>
          ))}
        </div>
      )}

      {view === 'agenda' && agendaMode === 'liste' && (
        <div className="flex flex-col gap-6">
          {agendaGroups.length === 0 ? (
            <div className="card py-10 text-center text-sm" style={{ color: 'var(--text3)' }}>
              Aucune action planifiée. Modifie un lead pour ajouter une prochaine action.
            </div>
          ) : (
            agendaGroups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                  <h3 className="font-syne font-bold text-sm" style={{ color: group.color }}>{group.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${group.color}22`, color: group.color }}>
                    {group.items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {group.items
                    .sort((a, b) => (a.prochain_contact ?? '').localeCompare(b.prochain_contact ?? ''))
                    .map((lead) => {
                      const ActionIcon = ACTION_ICONS[lead.type_action] ?? CalendarDays
                      return (
                        <div key={lead.id} className="card py-3 px-4 flex items-center gap-4"
                          style={{ borderLeft: `3px solid ${group.color}` }}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${group.color}22` }}>
                            <ActionIcon size={15} style={{ color: group.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-text1 text-sm">{lead.nom || lead.entreprise}</p>
                              {lead.entreprise && lead.nom && (
                                <span className="text-xs" style={{ color: 'var(--text3)' }}>· {lead.entreprise}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                              <span className="text-xs font-medium" style={{ color: group.color }}>
                                {lead.type_action}
                                {lead.prochain_contact && ` · ${new Date(lead.prochain_contact).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}`}
                              </span>
                              {lead.statut && (
                                <span className={`text-xs ${STATUS_CLASSES[lead.statut] ?? 'badge sb-gray'}`}>
                                  {lead.statut}
                                </span>
                              )}
                              {lead.telephone && (
                                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                                  <Phone size={10} /> {lead.telephone}
                                </span>
                              )}
                            </div>
                            {lead.besoin && (
                              <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--text3)' }}>{lead.besoin}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setEditing(lead)} className="btn-ghost p-1.5" title="Éditer">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => handleDelete(lead)} className="btn-ghost p-1.5 hover:text-red-400" title="Supprimer">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'agenda' && agendaMode === 'calendrier' && (() => {
        const todayStr = new Date().toISOString().split('T')[0]
        const year = calMonth.getFullYear()
        const month = calMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        // Monday-first offset
        const startOffset = (firstDay.getDay() + 6) % 7
        const totalCells = startOffset + lastDay.getDate()
        const weeks = Math.ceil(totalCells / 7)

        // Map dateStr -> leads
        const leadsForDay: Record<string, Lead[]> = {}
        leads.filter(l => l.prochain_contact).forEach(l => {
          const d = l.prochain_contact!.slice(0, 10)
          if (!leadsForDay[d]) leadsForDay[d] = []
          leadsForDay[d].push(l)
        })

        const selectedLeads = calSelectedDay ? (leadsForDay[calSelectedDay] ?? []) : []

        const monthLabel = calMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

        return (
          <div className="flex flex-col gap-0 overflow-hidden rounded-xl" style={{ border: '1px solid var(--border1)', background: 'var(--surface1)' }}>

            {/* Nav mois */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border1)' }}>
              <button className="btn-ghost p-1.5" onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth()-1); setCalMonth(d); setCalSelectedDay(null) }}>
                <ChevronLeft size={16} />
              </button>
              <span className="font-syne font-bold text-sm capitalize text-text1">{monthLabel}</span>
              <button className="btn-ghost p-1.5" onClick={() => { const d = new Date(calMonth); d.setMonth(d.getMonth()+1); setCalMonth(d); setCalSelectedDay(null) }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* En-têtes jours */}
            <div className="grid grid-cols-7" style={{ borderBottom: '1px solid var(--border1)' }}>
              {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => (
                <div key={d} className="text-center text-xs py-2 font-semibold" style={{ color: 'var(--text3)' }}>{d}</div>
              ))}
            </div>

            {/* Grille calendrier */}
            <div className="grid grid-cols-7" style={{ flex: 1 }}>
              {Array.from({ length: weeks * 7 }).map((_, i) => {
                const dayNum = i - startOffset + 1
                const isEmpty = dayNum < 1 || dayNum > lastDay.getDate()
                const dateStr = isEmpty ? '' : `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`
                const dayLeads = isEmpty ? [] : (leadsForDay[dateStr] ?? [])
                const isToday = !isEmpty && dateStr === todayStr
                const isSelected = !isEmpty && dateStr === calSelectedDay
                const isPast = !isEmpty && dateStr < todayStr
                const col = i % 7
                const row = Math.floor(i / 7)
                const isLastRow = row === weeks - 1
                const isLastCol = col === 6

                const cellBorder = [
                  !isLastRow ? `border-bottom: 1px solid var(--border1)` : '',
                  !isLastCol ? `border-right: 1px solid var(--border1)` : '',
                ].filter(Boolean).join('; ')

                return (
                  <div
                    key={i}
                    onClick={() => !isEmpty && setCalSelectedDay(isSelected ? null : dateStr)}
                    className={`flex flex-col p-2 transition-all ${!isEmpty ? 'cursor-pointer' : ''}`}
                    style={{
                      minHeight: '110px',
                      borderRight: !isLastCol ? '1px solid var(--border1)' : 'none',
                      borderBottom: !isLastRow ? '1px solid var(--border1)' : 'none',
                      background: isSelected
                        ? 'rgba(16,185,129,0.12)'
                        : isToday
                        ? 'rgba(16,185,129,0.06)'
                        : isEmpty ? 'var(--surface2)' : 'var(--surface1)',
                    }}
                  >
                    {!isEmpty && (
                      <>
                        {/* Numéro du jour */}
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full"
                            style={{
                              background: isToday ? 'var(--accent)' : isSelected ? 'rgba(16,185,129,0.2)' : 'transparent',
                              color: isToday ? '#fff' : isSelected ? 'var(--accent)' : isPast ? 'var(--text3)' : 'var(--text1)',
                            }}
                          >
                            {dayNum}
                          </span>
                          {dayLeads.length > 2 && (
                            <span className="text-xs" style={{ color: 'var(--text3)' }}>+{dayLeads.length - 2}</span>
                          )}
                        </div>

                        {/* Leads du jour */}
                        <div className="flex flex-col gap-0.5">
                          {dayLeads.slice(0, 2).map((l) => {
                            const sc = STATUS_COLORS[l.statut]
                            return (
                              <div
                                key={l.id}
                                className="text-xs px-1.5 py-0.5 rounded truncate"
                                title={`${l.nom || l.entreprise} — ${l.type_action}`}
                                style={{
                                  background: sc ? `${sc.background}` : 'var(--surface3)',
                                  color: sc ? sc.color : 'var(--text2)',
                                  fontSize: '10px',
                                  lineHeight: '1.4',
                                }}
                              >
                                {l.nom || l.entreprise || l.email}
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Détail jour sélectionné */}
            {calSelectedDay && (
              <div style={{ borderTop: '1px solid var(--border1)' }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: selectedLeads.length > 0 ? '1px solid var(--border1)' : 'none' }}>
                  <span className="font-syne font-bold text-sm text-text1 capitalize">
                    {new Date(calSelectedDay + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  {selectedLeads.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)' }}>
                      {selectedLeads.length} action{selectedLeads.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {selectedLeads.length === 0 ? (
                  <div className="px-4 py-5 text-center text-sm" style={{ color: 'var(--text3)' }}>Aucune action ce jour</div>
                ) : (
                  <div className="flex flex-col">
                    {selectedLeads.map((lead, idx) => {
                      const ActionIcon = ACTION_ICONS[lead.type_action] ?? CalendarDays
                      const statusColor = STATUS_COLORS[lead.statut]?.color ?? 'var(--accent)'
                      return (
                        <div key={lead.id} className="flex items-center gap-3 px-4 py-3"
                          style={{ borderTop: idx > 0 ? '1px solid var(--border1)' : 'none' }}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: `${statusColor}22` }}>
                            <ActionIcon size={13} style={{ color: statusColor }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-text1 text-sm">{lead.nom || lead.entreprise}</p>
                              {lead.entreprise && lead.nom && <span className="text-xs" style={{ color: 'var(--text3)' }}>· {lead.entreprise}</span>}
                              {lead.statut && <span className={`text-xs ${STATUS_CLASSES[lead.statut] ?? 'badge sb-gray'}`}>{lead.statut}</span>}
                            </div>
                            <span className="text-xs font-medium" style={{ color: statusColor }}>{lead.type_action}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setEditing(lead)} className="btn-ghost p-1.5"><Pencil size={12} /></button>
                            <button onClick={() => handleDelete(lead)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {showCreate && <LeadModal onClose={() => setShowCreate(false)} />}
      {editing && <LeadModal lead={editing} onClose={() => setEditing(null)} />}
      {showImport && <ImportLeadsModal onClose={() => setShowImport(false)} />}
      {showFinder && <LeadFinderModal onClose={() => setShowFinder(false)} />}

      {/* ── Popup confirmation suppression ── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
                <AlertTriangle size={22} style={{ color: '#9A9590' }} />
              </div>
              <div>
                <p className="font-syne font-bold text-base text-text1">Supprimer ce lead ?</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                  <span style={{ color: 'var(--text1)', fontWeight: 600 }}>
                    {confirmDelete.nom || confirmDelete.entreprise || confirmDelete.email}
                  </span>{' '}
                  sera définitivement supprimé. Cette action est irréversible.
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <button className="btn-secondary flex-1" onClick={() => setConfirmDelete(null)}>
                  Annuler
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(59,130,246,0.12)', color: '#B91C1C', border: '1px solid rgba(59,130,246,0.25)' }}
                  onClick={confirmAndDelete}
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

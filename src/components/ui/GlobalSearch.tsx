import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Users, Briefcase, FolderKanban, ArrowRight } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import { useDebounce } from '@/hooks/useDebounce'

interface Result {
  id: string
  type: 'lead' | 'client' | 'projet'
  label: string
  sub?: string
  path: string
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 150)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { leads, clients, projets } = useDataStore()

  // Ouvrir avec ⌘K / Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setQuery('')
  }, [open])

  const q = debouncedQuery.toLowerCase().trim()

  const results: Result[] = q.length < 2 ? [] : [
    ...leads
      .filter((l) => l.nom?.toLowerCase().includes(q) || l.entreprise?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q))
      .slice(0, 4)
      .map((l) => ({ id: l.id, type: 'lead' as const, label: l.nom || l.entreprise, sub: l.entreprise !== l.nom ? l.entreprise : l.email, path: '/leads' })),
    ...clients
      .filter((c) => c.nom?.toLowerCase().includes(q) || c.niche?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({ id: c.id, type: 'client' as const, label: c.nom, sub: c.niche, path: '/clients' })),
    ...projets
      .filter((p) => p.nom?.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q))
      .slice(0, 3)
      .map((p) => ({ id: p.id, type: 'projet' as const, label: p.nom, sub: p.client, path: '/projets' })),
  ]

  const typeIcon = (t: Result['type']) => {
    if (t === 'lead') return <Users size={13} style={{ color: '#3B82F6' }} />
    if (t === 'client') return <Briefcase size={13} style={{ color: '#3B82F6' }} />
    return <FolderKanban size={13} style={{ color: '#3B82F6' }} />
  }

  const typeLabel = (t: Result['type']) => {
    if (t === 'lead') return 'Lead'
    if (t === 'client') return 'Client'
    return 'Projet'
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all"
      style={{ background: 'var(--surface2)', color: 'var(--text3)', border: '1px solid var(--border1)' }}
      aria-label="Recherche globale (⌘K)"
    >
      <Search size={12} />
      <span>Rechercher…</span>
      <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--surface3)', fontSize: 10 }}>⌘K</span>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--surface1)', border: '1px solid var(--border2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border1)' }}>
          <Search size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Leads, clients, projets…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text1)' }}
          />
          <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Fermer la recherche">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {q.length < 2 ? (
            <p className="text-center text-xs py-6" style={{ color: 'var(--text3)' }}>Tape au moins 2 caractères…</p>
          ) : results.length === 0 ? (
            <p className="text-center text-xs py-6" style={{ color: 'var(--text3)' }}>Aucun résultat pour "{query}"</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => { navigate(r.path); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface2"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface2)' }}>
                  {typeIcon(r.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text1 truncate">{r.label}</p>
                  {r.sub && <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{r.sub}</p>}
                </div>
                <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: 'var(--surface3)', color: 'var(--text3)' }}>
                  {typeLabel(r.type)}
                </span>
                <ArrowRight size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

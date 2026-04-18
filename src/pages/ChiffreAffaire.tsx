import { useEffect, useState } from 'react'
import {
  Euro, TrendingUp, CheckCircle2, AlertCircle, Clock,
  Plus, Pencil, Trash2, X, Save, ChevronDown, ArrowUpRight,
  Repeat2,
} from 'lucide-react'
import { useCAStore } from '@/stores/caStore'
import { useDataStore } from '@/stores/dataStore'
import { getAvatarUrl } from '@/utils/avatar'
import type { CALigne, NewCALigne, Client } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<CALigne['type'], string> = {
  maintenance: '#2563EB',
  hebergement: '#3B82F6',
  plugin:      '#3B82F6',
  devis:       '#323E83',
  prestation:  '#3B82F6',
  autre:       '#6B7280',
}
const TYPE_LABELS: Record<CALigne['type'], string> = {
  maintenance: 'Maintenance',
  hebergement: 'Hébergement',
  plugin:      'Plugin',
  devis:       'Devis',
  prestation:  'Prestation',
  autre:       'Autre',
}

// ← Statuts avec des couleurs distinctes et lisibles
const STATUT_CONFIG: Record<CALigne['statut'], { color: string; bg: string; label: string }> = {
  'payé':       { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Payé'       },
  'en attente': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: 'En attente' },
  'impayé':     { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Impayé'     },
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
function montantAnnuel(l: CALigne) {
  return l.periodicite === 'mensuel' ? l.montant * 12 : l.montant
}
function montantMensuel(l: CALigne) {
  return l.periodicite === 'mensuel' ? l.montant : l.periodicite === 'annuel' ? l.montant / 12 : 0
}
function emptyForm(clientId = ''): NewCALigne {
  return { client_id: clientId, label: '', type: 'maintenance', montant: 0, periodicite: 'mensuel', statut: 'en attente', date_echeance: null, notes: '' }
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ slices, centerLabel, centerValue }: {
  slices: { label: string; value: number; color: string }[]
  centerLabel?: string
  centerValue?: string
}) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const cx = 56, cy = 56, r = 42, sw = 13, circ = 2 * Math.PI * r
  let cum = 0
  return (
    <div className="flex items-center gap-5">
      <svg width={112} height={112} viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface3)" strokeWidth={sw} />
        {slices.filter(d => d.value > 0).map((d, i) => {
          const pct  = d.value / total
          const dash = pct * circ
          const off  = circ / 4 - cum * circ
          cum += pct
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color}
              strokeWidth={sw} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={off}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.6s ease' }} />
          )
        })}
        {centerLabel && <text x={cx} y={cy - 6} textAnchor="middle" fontSize={8.5} fill="var(--text3)" fontFamily="Nunito">{centerLabel}</text>}
        {centerValue && <text x={cx} y={cy + 9} textAnchor="middle" fontSize={11} fontWeight="800" fill="var(--text1)" fontFamily="Nunito">{centerValue}</text>}
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.filter(d => d.value > 0).map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <span style={{ width: 8, height: 8, borderRadius: 3, background: d.color, flexShrink: 0, display: 'inline-block' }} />
            <span className="text-xs flex-1 truncate" style={{ color: 'var(--text2)' }}>{d.label}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: d.color }}>{Math.round(d.value / total * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bar Chart (amélioré) ─────────────────────────────────────────────────────

function BarChart({ bars }: { bars: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...bars.map(d => d.value), 1)

  if (bars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2" style={{ color: 'var(--text3)' }}>
        <Euro size={24} style={{ opacity: 0.3 }} />
        <p className="text-sm">Aucune donnée client</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {bars.map((d, i) => {
        const pct = Math.round((d.value / max) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs font-medium w-20 truncate text-right flex-shrink-0" style={{ color: 'var(--text2)' }}>{d.label}</span>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: 'var(--surface3)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, #323E83, #3B82F6)` }} />
            </div>
            <span className="text-xs font-bold tabular-nums w-20 flex-shrink-0" style={{ color: 'var(--accent)' }}>{fmt(d.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function LigneModal({ clients, initial, editId, onClose, onSave }: {
  clients: Client[]; initial: NewCALigne; editId?: string | null
  onClose: () => void; onSave: (data: NewCALigne, editId?: string | null) => Promise<void>
}) {
  const [form, setForm]   = useState<NewCALigne>(initial)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof NewCALigne>(k: K, v: NewCALigne[K]) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl" style={{ background: 'var(--surface1)', border: '1px solid var(--border1)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border1)' }}>
          <h2 className="font-syne font-bold text-base text-text1">{editId ? 'Modifier la ligne' : 'Nouvelle ligne CA'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>
        <form onSubmit={async e => { e.preventDefault(); setSaving(true); await onSave(form, editId); setSaving(false) }}
          className="px-6 py-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 form-group">
              <label className="form-label">Client</label>
              <select className="input w-full" value={form.client_id} onChange={e => set('client_id', e.target.value)} required>
                <option value="">— Choisir —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="col-span-2 form-group">
              <label className="form-label">Libellé</label>
              <input className="input w-full" placeholder="ex: Maintenance, Hébergement…" value={form.label} onChange={e => set('label', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="input w-full" value={form.type} onChange={e => set('type', e.target.value as CALigne['type'])}>
                {(Object.keys(TYPE_LABELS) as CALigne['type'][]).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Périodicité</label>
              <select className="input w-full" value={form.periodicite} onChange={e => set('periodicite', e.target.value as CALigne['periodicite'])}>
                <option value="mensuel">Mensuel</option>
                <option value="annuel">Annuel</option>
                <option value="unique">Unique</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Montant (€)</label>
              <input type="number" min="0" step="0.01" className="input w-full" value={form.montant}
                onChange={e => set('montant', parseFloat(e.target.value) || 0)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="input w-full" value={form.statut} onChange={e => set('statut', e.target.value as CALigne['statut'])}>
                <option value="payé">Payé</option>
                <option value="en attente">En attente</option>
                <option value="impayé">Impayé</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Échéance (optionnel)</label>
              <input type="date" className="input w-full" value={form.date_echeance ?? ''} onChange={e => set('date_echeance', e.target.value || null)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="input w-full" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Annuler</button>
            <button type="submit" disabled={saving} className="btn-primary gap-2">
              <Save size={14} />{saving ? 'Enregistrement…' : editId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ChiffreAffaire() {
  const { lignes, loading, fetchCALignes, createCALigne, updateCALigne, deleteCALigne } = useCAStore()
  const { clients, fetchClients } = useDataStore()
  const [showModal, setShowModal]         = useState(false)
  const [modalInitial, setModalInitial]   = useState<NewCALigne>(emptyForm())
  const [editId, setEditId]               = useState<string | null>(null)
  const [expandedClient, setExpandedClient] = useState<string | null>(null)

  useEffect(() => { fetchCALignes(); fetchClients() }, [])

  // ── KPIs
  const caRecurrent    = lignes.reduce((s, l) => s + montantMensuel(l), 0)
  const caAnnuel       = lignes.reduce((s, l) => s + montantAnnuel(l), 0)
  const montantPaye    = lignes.filter(l => l.statut === 'payé').reduce((s, l) => s + l.montant, 0)
  const montantImpaie  = lignes.filter(l => l.statut === 'impayé').reduce((s, l) => s + l.montant, 0)
  const montantAttente = lignes.filter(l => l.statut === 'en attente').reduce((s, l) => s + l.montant, 0)
  const tauxRecouvrement = caAnnuel > 0 ? Math.round((montantPaye / caAnnuel) * 100) : 0

  const openAdd  = (clientId = '') => { setModalInitial(emptyForm(clientId)); setEditId(null); setShowModal(true) }
  const openEdit = (l: CALigne) => {
    setModalInitial({ client_id: l.client_id, label: l.label, type: l.type, montant: l.montant, periodicite: l.periodicite, statut: l.statut, date_echeance: l.date_echeance, notes: l.notes })
    setEditId(l.id); setShowModal(true)
  }
  const handleSave = async (data: NewCALigne, id?: string | null) => {
    if (id) await updateCALigne(id, data); else await createCALigne(data)
    setShowModal(false)
  }

  // ── Graphiques
  const clientBars = clients
    .map(c => ({
      label: c.nom.split(' ')[0],
      value: lignes.filter(l => l.client_id === c.id).reduce((s, l) => s + montantAnnuel(l), 0),
      color: 'var(--accent)',
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  const typeSlices = (Object.keys(TYPE_LABELS) as CALigne['type'][]).map(type => ({
    label: TYPE_LABELS[type],
    value: lignes.filter(l => l.type === type).reduce((s, l) => s + montantAnnuel(l), 0),
    color: TYPE_COLORS[type],
  }))

  const statutSlices = [
    { label: 'Payé',       value: montantPaye,    color: '#10B981' },
    { label: 'En attente', value: montantAttente,  color: '#F59E0B' },
    { label: 'Impayé',     value: montantImpaie,   color: '#EF4444' },
  ]

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-bold text-xl text-text1">Chiffre d'affaire</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>Revenus, encaissements et récurrences</p>
        </div>
        <button onClick={() => openAdd()} className="btn-primary gap-2">
          <Plus size={14} /> Nouvelle ligne
        </button>
      </div>

      {/* ── KPI Cards — 4 colonnes ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <TrendingUp size={16} />,
            label: 'CA annuel',
            value: fmt(caAnnuel),
            sub: `${lignes.length} ligne${lignes.length !== 1 ? 's' : ''}`,
            color: '#2563EB',
            pct: null,
            hero: true,
          },
          {
            icon: <CheckCircle2 size={16} />,
            label: 'Encaissé',
            value: fmt(montantPaye),
            sub: `${lignes.filter(l => l.statut === 'payé').length} payé${lignes.filter(l => l.statut === 'payé').length !== 1 ? 's' : ''}`,
            color: '#10B981',
            pct: caAnnuel > 0 ? montantPaye / caAnnuel : 0,
            hero: false,
          },
          {
            icon: <Clock size={16} />,
            label: 'En attente',
            value: fmt(montantAttente),
            sub: `${lignes.filter(l => l.statut === 'en attente').length} ligne${lignes.filter(l => l.statut === 'en attente').length !== 1 ? 's' : ''}`,
            color: '#F59E0B',
            pct: caAnnuel > 0 ? montantAttente / caAnnuel : 0,
            hero: false,
          },
          {
            icon: <AlertCircle size={16} />,
            label: 'Impayé',
            value: fmt(montantImpaie),
            sub: `${lignes.filter(l => l.statut === 'impayé').length} ligne${lignes.filter(l => l.statut === 'impayé').length !== 1 ? 's' : ''}`,
            color: '#EF4444',
            pct: caAnnuel > 0 ? montantImpaie / caAnnuel : 0,
            hero: false,
          },
        ].map((kpi, i) => (
          <div key={i} className="card p-4 flex flex-col gap-3" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 70, height: 70, background: `${kpi.color}12`, borderRadius: '0 14px 0 70px' }} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>{kpi.label}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
              </div>
            </div>
            <div>
              <p className="font-syne font-bold text-2xl text-text1">{kpi.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>{kpi.sub}</p>
            </div>
            {kpi.pct !== null && (
              <div>
                <div style={{ height: 5, background: 'var(--surface3)', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${Math.round(kpi.pct * 100)}%`, background: kpi.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                </div>
                <p className="text-xs mt-1 font-semibold" style={{ color: kpi.color }}>{Math.round(kpi.pct * 100)}% du CA</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── MRR hero + Recouvrement ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        {/* MRR Card — mise en valeur */}
        <div className="relative rounded-2xl overflow-hidden p-5 flex items-center gap-5"
          style={{ background: 'linear-gradient(135deg, #323E83 0%, #323E83 60%, #3B82F6 100%)', minHeight: 100 }}>
          {/* Décoration */}
          <svg className="absolute right-4 top-3 opacity-10 pointer-events-none" width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M40 0 L42 35 L80 40 L42 45 L40 80 L38 45 L0 40 L38 35 Z" fill="white" />
          </svg>
          <svg className="absolute right-20 bottom-2 opacity-[0.07] pointer-events-none" width="36" height="36" viewBox="0 0 40 40" fill="none">
            <path d="M20 0 L21 17 L40 20 L21 23 L20 40 L19 23 L0 20 L19 17 Z" fill="white" />
          </svg>

          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
            <Repeat2 size={22} style={{ color: 'white' }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest">Revenu récurrent mensuel</p>
            <p className="font-syne font-bold text-3xl text-white leading-tight mt-0.5">
              {caRecurrent > 0 ? fmt(caRecurrent) : '—'}
              {caRecurrent > 0 && <span className="text-sm font-normal text-white/60 ml-1">/mois</span>}
            </p>
            {caRecurrent > 0 && (
              <p className="text-white/60 text-xs mt-1">ARR · <span className="font-bold text-white/80">{fmt(caRecurrent * 12)}</span></p>
            )}
            {caRecurrent === 0 && <p className="text-white/60 text-xs mt-1">Aucune ligne récurrente</p>}
          </div>
        </div>

        {/* Taux de recouvrement */}
        <div className="card flex items-center gap-5 p-5">
          <div className="relative flex-shrink-0">
            <svg width={80} height={80} viewBox="0 0 80 80">
              <circle cx={40} cy={40} r={32} fill="none" stroke="var(--surface3)" strokeWidth={9} />
              <circle cx={40} cy={40} r={32} fill="none" stroke="#10B981"
                strokeWidth={9}
                strokeDasharray={`${(tauxRecouvrement / 100) * 2 * Math.PI * 32} ${2 * Math.PI * 32}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 0.7s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-syne font-bold text-lg text-text1">{tauxRecouvrement}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-syne font-bold text-sm text-text1">Taux de recouvrement</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Part du CA annuel déjà encaissée</p>
            <div className="flex flex-col gap-1 mt-3">
              {statutSlices.filter(s => s.value > 0).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-xs flex-1" style={{ color: 'var(--text2)' }}>{s.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: s.color }}>{fmt(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Bar chart clients — 2 cols */}
        <div className="card flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-syne font-bold text-sm text-text1">CA annuel par client</p>
            {clientBars.length > 0 && <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{fmt(caAnnuel)} total</span>}
          </div>
          <BarChart bars={clientBars} />
        </div>

        {/* Donut par type */}
        <div className="card flex flex-col gap-3">
          <p className="font-syne font-bold text-sm text-text1">Répartition par type</p>
          {typeSlices.some(s => s.value > 0)
            ? <DonutChart slices={typeSlices} centerLabel="Total" centerValue={fmt(caAnnuel)} />
            : <p className="text-xs py-6 text-center" style={{ color: 'var(--text3)' }}>Aucune donnée</p>
          }
        </div>
      </div>

      {/* ── Par client ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-syne font-bold text-sm text-text1">Détail par client</p>
          <span className="text-xs" style={{ color: 'var(--text3)' }}>{clients.length} client{clients.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
          </div>
        ) : clients.length === 0 ? (
          <div className="card text-center py-10">
            <Euro size={28} style={{ color: 'var(--text3)', margin: '0 auto 8px', opacity: 0.4 }} />
            <p className="text-sm text-text1">Aucun client</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Créez des clients d'abord</p>
          </div>
        ) : (
          clients.map(client => {
            const clientLignes = lignes.filter(l => l.client_id === client.id)
            const isOpen       = expandedClient === client.id
            const totalLignes  = clientLignes.reduce((s, l) => s + montantAnnuel(l), 0)
            const total        = totalLignes > 0 ? totalLignes : (client.ca ?? 0)
            const mrr          = clientLignes.reduce((s, l) => s + montantMensuel(l), 0)
            const hasImpayes   = clientLignes.some(l => l.statut === 'impayé')
            const allPaye      = clientLignes.length > 0 && clientLignes.every(l => l.statut === 'payé')
            const statusKey: CALigne['statut'] = hasImpayes ? 'impayé' : allPaye ? 'payé' : 'en attente'
            const statusCfg = STATUT_CONFIG[statusKey]

            return (
              <div key={client.id} style={{ border: '1px solid var(--border1)', borderRadius: 16, overflow: 'hidden', background: 'var(--surface1)' }}>

                {/* ── Row header ── */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:bg-surface2"
                  onClick={() => setExpandedClient(isOpen ? null : client.id)}
                >
                  {/* DiceBear avatar */}
                  <img
                    src={getAvatarUrl(client.nom)}
                    alt={client.nom}
                    className="w-9 h-9 rounded-full flex-shrink-0"
                    style={{ background: 'var(--surface2)' }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-syne font-bold text-sm text-text1 truncate">{client.nom}</span>
                      {clientLignes.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {mrr > 0 && <span className="text-xs" style={{ color: 'var(--text3)' }}>{fmt(mrr)}/mois</span>}
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>{clientLignes.length} ligne{clientLignes.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-syne font-bold text-sm" style={{ color: total > 0 ? 'var(--accent)' : 'var(--text3)' }}>
                        {total > 0 ? fmt(total) : '—'}
                      </p>
                      {total > 0 && clientLignes.length > 0 && (
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>/an</p>
                      )}
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--text3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </div>
                </button>

                {/* ── Détail lignes ── */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border1)' }}>
                    {clientLignes.length > 0 ? (
                      <div className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                        {clientLignes.map(l => {
                          const sc = STATUT_CONFIG[l.statut]
                          return (
                            <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition-all group">
                              {/* Indicateur type */}
                              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: TYPE_COLORS[l.type] }} />

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text1 truncate">{l.label}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                                    style={{ background: `${TYPE_COLORS[l.type]}18`, color: TYPE_COLORS[l.type] }}>
                                    {TYPE_LABELS[l.type]}
                                  </span>
                                  <span className="text-xs" style={{ color: 'var(--text3)' }}>
                                    {l.periodicite === 'mensuel' ? '/mois' : l.periodicite === 'annuel' ? '/an' : 'unique'}
                                  </span>
                                  {l.date_echeance && (
                                    <span className="text-xs" style={{ color: 'var(--text3)' }}>
                                      échéance {new Date(l.date_echeance).toLocaleDateString('fr-FR')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-sm tabular-nums text-text1">{fmt(l.montant)}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                  style={{ background: sc.bg, color: sc.color }}>
                                  {sc.label}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <button onClick={() => openEdit(l)} className="btn-ghost p-1.5"><Pencil size={12} /></button>
                                <button onClick={() => deleteCALigne(l.id)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="px-4 py-5 text-center">
                        <p className="text-xs" style={{ color: 'var(--text3)' }}>Aucune ligne pour ce client</p>
                      </div>
                    )}

                    <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border1)' }}>
                      <button onClick={() => openAdd(client.id)} className="btn-ghost text-xs gap-1.5">
                        <Plus size={13} /> Ajouter une ligne
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showModal && (
        <LigneModal clients={clients} initial={modalInitial} editId={editId}
          onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  )
}

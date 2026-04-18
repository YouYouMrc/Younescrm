import { useDataStore } from '@/stores/dataStore'
import { TrendingUp, Users, Briefcase, Target, Award, AlertCircle } from 'lucide-react'

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: 'var(--surface3)', height: 6 }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function Rapports() {
  const { leads, clients, projets } = useDataStore()

  // ── Taux de conversion ──
  const total = leads.length
  const gagnes = leads.filter((l) => l.statut === 'Gagné').length
  const perdus = leads.filter((l) => l.statut === 'Perdu').length
  const enCours = leads.filter((l) => ['En discussion', 'Devis envoyé', 'RDV fixé', 'Négociation'].includes(l.statut)).length
  const txConversion = total > 0 ? Math.round((gagnes / total) * 100) : 0
  const txPerte = total > 0 ? Math.round((perdus / total) * 100) : 0

  // ── CA ──
  const caPipeline = leads.filter((l) => !['Perdu'].includes(l.statut)).reduce((s, l) => s + (l.budget ?? 0), 0)
  const caClients = clients.reduce((s, c) => s + (c.ca ?? 0), 0)

  // ── Par source ──
  const bySource: Record<string, number> = {}
  leads.forEach((l) => { if (l.source) bySource[l.source] = (bySource[l.source] ?? 0) + 1 })
  const topSources = Object.entries(bySource).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const maxSource = Math.max(...topSources.map(([, v]) => v), 1)

  // ── Par niche ──
  const byNiche: Record<string, number> = {}
  leads.forEach((l) => { if (l.niche) byNiche[l.niche] = (byNiche[l.niche] ?? 0) + 1 })
  const topNiches = Object.entries(byNiche).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxNiche = Math.max(...topNiches.map(([, v]) => v), 1)

  // ── Par statut ──
  const statuts = ['À contacter', 'Contacté', 'En discussion', 'Devis envoyé', 'RDV fixé', 'Négociation', 'Gagné', 'Perdu']
  const statusColors: Record<string, string> = {
    'À contacter': '#3B82F6', 'Contacté': '#3B82F6', 'En discussion': '#3B82F6',
    'Devis envoyé': '#3B82F6', 'RDV fixé': '#3B82F6', 'Négociation': '#EA580C',
    'Gagné': '#5AC47A', 'Perdu': '#9A9590',
  }
  const byStatut = statuts.map((s) => ({ statut: s, count: leads.filter((l) => l.statut === s).length, color: statusColors[s] }))
  const maxStatut = Math.max(...byStatut.map((s) => s.count), 1)

  // ── Score moyen ──
  const avgScore = total > 0 ? (leads.reduce((s, l) => s + (l.score ?? 0), 0) / total).toFixed(1) : '—'

  // ── Projets ──
  const projetsActifs = projets.filter((p) => p.stage !== 'Livré').length
  const projetsLivres = projets.filter((p) => p.stage === 'Livré').length

  const kpis = [
    { label: 'Taux de conversion', value: `${txConversion}%`, sub: `${gagnes} leads gagnés`, color: '#5AC47A', icon: Target },
    { label: 'Leads en négociation', value: enCours, sub: 'opportunités actives', color: '#3B82F6', icon: TrendingUp },
    { label: 'Montant payé clients', value: caClients > 0 ? `${caClients.toLocaleString('fr-FR')} €` : '—', sub: 'revenus encaissés', color: '#3B82F6', icon: Briefcase },
    { label: 'Montant payé', value: caPipeline > 0 ? `${caPipeline.toLocaleString('fr-FR')} €` : '—', sub: 'leads non perdus', color: '#3B82F6', icon: Award },
    { label: 'Score moyen leads', value: avgScore, sub: 'sur 10', color: '#3B82F6', icon: Users },
    { label: 'Taux de perte', value: `${txPerte}%`, sub: `${perdus} perdus`, color: '#9A9590', icon: AlertCircle },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="card flex flex-col gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="font-syne font-bold text-2xl text-text1">{value}</p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{label}</p>
              {sub && <p className="text-xs font-medium mt-0.5" style={{ color }}>{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entonnoir par statut */}
        <div className="card">
          <h2 className="font-syne font-bold text-sm text-text1 mb-4">Entonnoir commercial</h2>
          <div className="flex flex-col gap-3">
            {byStatut.filter((s) => s.count > 0).map(({ statut, count, color }) => (
              <div key={statut} className="flex items-center gap-3">
                <div className="w-24 text-xs shrink-0" style={{ color: 'var(--text2)' }}>{statut}</div>
                <div className="flex-1">
                  <Bar value={count} max={maxStatut} color={color} />
                </div>
                <div className="w-8 text-xs text-right font-semibold shrink-0" style={{ color }}>{count}</div>
              </div>
            ))}
            {byStatut.every((s) => s.count === 0) && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text3)' }}>Aucun lead pour l'instant</p>
            )}
          </div>
        </div>

        {/* Par source */}
        <div className="card">
          <h2 className="font-syne font-bold text-sm text-text1 mb-4">Leads par source</h2>
          <div className="flex flex-col gap-3">
            {topSources.length > 0 ? topSources.map(([source, count]) => (
              <div key={source} className="flex items-center gap-3">
                <div className="w-24 text-xs truncate shrink-0" style={{ color: 'var(--text2)' }}>{source}</div>
                <div className="flex-1">
                  <Bar value={count} max={maxSource} color="#3B82F6" />
                </div>
                <div className="w-8 text-xs text-right font-semibold shrink-0" style={{ color: '#3B82F6' }}>{count}</div>
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text3)' }}>Aucune source renseignée</p>
            )}
          </div>
        </div>

        {/* Par niche */}
        <div className="card">
          <h2 className="font-syne font-bold text-sm text-text1 mb-4">Top niches</h2>
          <div className="flex flex-col gap-3">
            {topNiches.length > 0 ? topNiches.map(([niche, count]) => (
              <div key={niche} className="flex items-center gap-3">
                <div className="w-36 text-xs truncate shrink-0" style={{ color: 'var(--text2)' }}>{niche}</div>
                <div className="flex-1">
                  <Bar value={count} max={maxNiche} color="#3B82F6" />
                </div>
                <div className="w-8 text-xs text-right font-semibold shrink-0" style={{ color: '#3B82F6' }}>{count}</div>
              </div>
            )) : (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text3)' }}>Aucune niche renseignée</p>
            )}
          </div>
        </div>

        {/* Projets */}
        <div className="card">
          <h2 className="font-syne font-bold text-sm text-text1 mb-4">Projets</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <span className="text-sm" style={{ color: 'var(--text2)' }}>En cours</span>
              <span className="font-syne font-bold text-lg" style={{ color: '#3B82F6' }}>{projetsActifs}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <span className="text-sm" style={{ color: 'var(--text2)' }}>Livrés</span>
              <span className="font-syne font-bold text-lg" style={{ color: '#5AC47A' }}>{projetsLivres}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <span className="text-sm" style={{ color: 'var(--text2)' }}>Total</span>
              <span className="font-syne font-bold text-lg text-text1">{projets.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <span className="text-sm" style={{ color: 'var(--text2)' }}>Clients actifs</span>
              <span className="font-syne font-bold text-lg" style={{ color: '#3B82F6' }}>{clients.filter((c) => c.statut === 'Actif').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

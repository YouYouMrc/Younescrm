import { useState, useRef } from 'react'
import {
  X, Search, Loader2, MapPin, Phone, Globe,
  CheckSquare, Square, Download, Key, ExternalLink,
  AlertTriangle, ChevronRight, WifiOff, Zap, Star
} from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import { NICHES } from '@/types'

// ── Types ────────────────────────────────────────────────────────────────────

type SiteQuality = 'checking' | 'no-site' | 'bad' | 'skip'

interface LeadResult {
  title: string
  address?: string
  phoneNumber?: string
  website?: string
  rating?: number
  ratingCount?: number
  category?: string
  selected: boolean
  quality: SiteQuality
  score?: number
}

const SERPER_KEY_STORAGE = 'serper_api_key'

// ── Détection e-commerce ─────────────────────────────────────────────────────

const ECOM_URL_PATTERNS = [
  'shopify', 'myshopify', 'woocommerce', 'prestashop', 'magento',
  'bigcommerce', 'wix.com', 'squarespace', 'ecwid', 'sellsy',
  'store.', '/shop/', '/boutique/', '/catalog/', 'eshop',
]

const ECOM_CATEGORIES = [
  'e-commerce', 'boutique en ligne', 'magasin en ligne', 'vente en ligne',
  'online store', 'marketplace', 'dropshipping',
]

function isEcommerce(place: { website?: string; category?: string; title?: string }): boolean {
  const url   = (place.website  ?? '').toLowerCase()
  const cat   = (place.category ?? '').toLowerCase()
  const title = (place.title    ?? '').toLowerCase()

  if (ECOM_URL_PATTERNS.some((p) => url.includes(p)))   return true
  if (ECOM_CATEGORIES.some((c) => cat.includes(c)))     return true
  if (title.includes('shop') && title.includes('en ligne')) return true
  return false
}

// ── Détection niche ──────────────────────────────────────────────────────────

function detectNiche(category?: string): string {
  if (!category) return NICHES[0]
  const cat = category.toLowerCase()
  if (cat.includes('restaurant') || cat.includes('food') || cat.includes('café') || cat.includes('boulangerie')) return 'Food & Restauration'
  if (cat.includes('beauté') || cat.includes('coiffure') || cat.includes('spa') || cat.includes('esthét')) return 'Beauté & Bien-être'
  if (cat.includes('btp') || cat.includes('construc') || cat.includes('immobilier') || cat.includes('plombier') || cat.includes('électricien') || cat.includes('maçon')) return 'BTP & Immobilier'
  if (cat.includes('sport') || cat.includes('fitness') || cat.includes('gym')) return 'Sport & Outdoor'
  if (cat.includes('hôtel') || cat.includes('gîte') || cat.includes('tourisme')) return 'Hôtellerie & Tourisme'
  if (cat.includes('médecin') || cat.includes('médical') || cat.includes('santé') || cat.includes('kiné') || cat.includes('dentiste')) return 'Santé & Médical'
  if (cat.includes('avocat') || cat.includes('notaire') || cat.includes('juridique')) return 'Juridique & Notarial'
  if (cat.includes('auto') || cat.includes('voiture') || cat.includes('garage')) return 'Automobile'
  if (cat.includes('artisan') || cat.includes('menuisier') || cat.includes('serrurier')) return 'Artisanat'
  if (cat.includes('événement') || cat.includes('traiteur') || cat.includes('mariage')) return 'Événementiel'
  return 'Commerce de proximité'
}

// ── PageSpeed check ──────────────────────────────────────────────────────────

async function checkPageSpeed(url: string): Promise<{ quality: 'bad' | 'skip'; score: number }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 9000)
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return { quality: 'bad', score: 20 }
    const data = await res.json()
    const raw = data?.lighthouseResult?.categories?.performance?.score
    if (raw == null) return { quality: 'bad', score: 20 }
    const score = Math.round(raw * 100)
    // Seuil strict : < 50 = site nul = bon lead
    return score < 50 ? { quality: 'bad', score } : { quality: 'skip', score }
  } catch {
    // Timeout / inaccessible = vieux site ou pas de site → bon lead
    return { quality: 'bad', score: 15 }
  }
}

// ── Composant ────────────────────────────────────────────────────────────────

export default function LeadFinderModal({ onClose }: { onClose: () => void }) {
  const { bulkCreateLeads } = useDataStore()

  const [apiKey,      setApiKey]      = useState(() => import.meta.env.VITE_SERPER_API_KEY || localStorage.getItem(SERPER_KEY_STORAGE) || '')
  const [apiKeyInput, setApiKeyInput] = useState(apiKey)
  const [keyStep,     setKeyStep]     = useState(!apiKey)

  const [query,     setQuery]     = useState('')
  const [location,  setLocation]  = useState('France')
  const [nbResults, setNbResults] = useState(20)

  const [loading,   setLoading]   = useState(false)
  const [checking,  setChecking]  = useState(false)
  const [progress,  setProgress]  = useState(0)  // nb sites analysés
  const [total,     setTotal]     = useState(0)   // nb sites à analyser

  const [error,    setError]    = useState<string | null>(null)
  const [results,  setResults]  = useState<LeadResult[]>([])

  const [importing,    setImporting]    = useState(false)
  const [imported,     setImported]     = useState(false)
  const [importCount,  setImportCount]  = useState(0)

  const abortRef = useRef(false)

  function saveKey() {
    const k = apiKeyInput.trim()
    if (!k) return
    localStorage.setItem(SERPER_KEY_STORAGE, k)
    setApiKey(k)
    setKeyStep(false)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setError(null)
    setResults([])
    setImported(false)
    setLoading(true)
    setProgress(0)
    setTotal(0)
    abortRef.current = false

    try {
      const res = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: `${query.trim()} ${location.trim()}`, gl: 'fr', hl: 'fr', num: nbResults }),
      })

      if (!res.ok) {
        if (res.status === 401) { setError('Clé API invalide. Vérifie ta clé Serper.dev.'); setKeyStep(true) }
        else setError(`Erreur API Serper : ${res.status}`)
        return
      }

      const data = await res.json()
      const raw = (data.places ?? []) as Array<{
        title?: string; address?: string; phoneNumber?: string
        website?: string; rating?: number; ratingCount?: number; category?: string
      }>

      if (!raw.length) {
        setError(`Aucun résultat pour "${query} ${location}". Essaie : "Plombier Lyon", "Coiffeur Bordeaux", "Menuisier Nantes"…`)
        return
      }

      // Étape 1 — filtre e-commerce immédiatement
      const filtered = raw.filter((p) => !isEcommerce(p))

      // Étape 2 — sépare les sans-site (direct) des avec-site (à analyser)
      const noSite   = filtered.filter((p) => !p.website)
      const withSite = filtered.filter((p) => !!p.website)

      // Affiche les "sans site" immédiatement comme leads qualifiés
      const noSiteResults: LeadResult[] = noSite.map((p) => ({
        title: p.title ?? '', address: p.address, phoneNumber: p.phoneNumber,
        website: undefined, rating: p.rating, ratingCount: p.ratingCount,
        category: p.category, selected: true, quality: 'no-site',
      }))

      // Affiche les "avec site" en état "checking"
      const checkingResults: LeadResult[] = withSite.map((p) => ({
        title: p.title ?? '', address: p.address, phoneNumber: p.phoneNumber,
        website: p.website, rating: p.rating, ratingCount: p.ratingCount,
        category: p.category, selected: false, quality: 'checking',
      }))

      const combined = [...noSiteResults, ...checkingResults]
      setResults(combined)
      setLoading(false)

      if (withSite.length === 0) return // rien à analyser

      setChecking(true)
      setTotal(withSite.length)

      // Étape 3 — analyse PageSpeed par batch de 3
      const BATCH = 3
      let done = 0

      for (let i = 0; i < withSite.length; i += BATCH) {
        if (abortRef.current) break
        const batch = withSite.slice(i, i + BATCH)

        const batchResults = await Promise.all(
          batch.map((p) => checkPageSpeed(p.website!))
        )

        done += batch.length
        setProgress(done)

        setResults((prev) => {
          const updated = [...prev]
          batch.forEach((p, bi) => {
            const idx = updated.findIndex((r) => r.website === p.website && r.title === (p.title ?? ''))
            if (idx === -1) return
            const { quality, score } = batchResults[bi]
            if (quality === 'skip') {
              // Site correct → on retire du tableau (pas un lead)
              updated.splice(idx, 1)
            } else {
              // Site nul → on garde et on sélectionne
              updated[idx] = { ...updated[idx], quality: 'bad', score, selected: true }
            }
          })
          return updated
        })
      }

      setChecking(false)

    } catch (err) {
      setError('Erreur réseau. Vérifie ta connexion et ta clé API.')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  function toggleAll() {
    const allSelected = results.every((r) => r.selected)
    setResults((prev) => prev.map((r) => ({ ...r, selected: !allSelected })))
  }

  function toggleOne(idx: number) {
    setResults((prev) => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r))
  }

  async function handleImport() {
    const toImport = results.filter((r) => r.selected)
    if (!toImport.length) return
    setError(null)
    setImporting(true)

    const today = new Date().toISOString().slice(0, 10)

    const leads = toImport.map((place) => {
      const nom = (place.title ?? '').trim() || place.address || 'Sans nom'
      return {
        nom,
        entreprise:       nom,
        email:            '',
        telephone:        place.phoneNumber ?? '',
        niche:            detectNiche(place.category),
        source:           'Prospection' as const,
        score:            place.quality === 'no-site' ? 9 : 8,
        statut:           'À contacter',
        budget:           0,
        proba:            30,
        besoin:           [place.category, place.address].filter(Boolean).join(' — '),
        prochain_contact: null,
        type_action:      'Appel',
        notes:            place.quality === 'no-site'
                            ? '⚠️ Aucun site web — GMB sans site détecté'
                            : `Site actuel de mauvaise qualité (PageSpeed mobile : ${place.score ?? '?'}/100)`,
        site:             place.website ?? '',
        drive:            '',
        figma:            '',
        date:             today,
      }
    })

    const { error, count } = await bulkCreateLeads(leads)

    setImporting(false)
    if (count > 0) { setImported(true); setImportCount(count) }
    if (error) setError(`Erreur import : ${error}`)
  }

  const selectedCount = results.filter((r) => r.selected).length
  const noSiteCount   = results.filter((r) => r.quality === 'no-site').length
  const badCount      = results.filter((r) => r.quality === 'bad').length

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content flex flex-col gap-4" style={{ maxWidth: 680, maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
              <Search size={15} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="font-syne font-bold text-base text-text1">Trouver des leads</h2>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                GMB sans site · Sites PageSpeed &lt; 50 · Zéro e-commerce
              </p>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Clé API ── */}
        {keyStep && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-4 flex gap-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Key size={16} style={{ color: '#3B82F6', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#3B82F6' }}>Clé API Serper.dev requise</p>
                <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--text3)' }}>
                  Accès aux données Google Maps. Gratuit — 2 500 recherches/mois.
                </p>
                <a href="https://serper.dev" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                  Créer un compte gratuit <ExternalLink size={10} />
                </a>
              </div>
            </div>
            <ol className="text-xs flex flex-col gap-1" style={{ color: 'var(--text3)' }}>
              {['Va sur serper.dev → crée un compte', 'Dashboard → copie ta clé API', 'Colle-la ci-dessous'].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ChevronRight size={11} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} /> {s}
                </li>
              ))}
            </ol>
            <div className="flex gap-2">
              <input type="text" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="flex-1 font-mono text-xs" autoFocus />
              <button className="btn-primary shrink-0" onClick={saveKey} disabled={!apiKeyInput.trim()}>Enregistrer</button>
            </div>
          </div>
        )}

        {/* ── Recherche ── */}
        {!keyStep && (
          <>
            <form onSubmit={handleSearch} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Métier *</label>
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Plombier, Coiffeur, Restaurant…" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="Lyon, Paris 15, Bordeaux…" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span>Résultats à analyser</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--surface3)', color: 'var(--accent)' }}>{nbResults}</span>
                </label>
                <input type="range" min={5} max={50} step={5} value={nbResults}
                  onChange={(e) => setNbResults(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer mt-1"
                  style={{ accentColor: 'var(--accent)', background: 'var(--surface3)' }} />
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                  Chaque site avec une URL est analysé via PageSpeed — prévoir ~10–20 sec
                </p>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading || checking || !query.trim()}>
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Recherche…</>
                           : <><Search size={14} /> Lancer la recherche</>}
                </button>
                <button type="button" className="btn-ghost px-3" onClick={() => setKeyStep(true)} title="Changer la clé API">
                  <Key size={14} />
                </button>
              </div>
            </form>

            {/* Barre de progression analyse */}
            {checking && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text3)' }}>
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" style={{ color: 'var(--accent)' }} />
                    Analyse PageSpeed des sites…
                  </span>
                  <span style={{ color: 'var(--accent)' }}>{progress} / {total}</span>
                </div>
                <div className="progress-bar" style={{ height: '4px' }}>
                  <div className="progress-bar-fill transition-all duration-300" style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {/* Stats résultats */}
            {results.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171' }}>
                  <WifiOff size={11} /> {noSiteCount} sans site
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
                  <Zap size={11} /> {badCount} site nul
                </div>
                {checking && (
                  <span className="text-xs" style={{ color: 'var(--text3)' }}>
                    (analyse en cours…)
                  </span>
                )}
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
              </div>
            )}

            {/* Succès */}
            {imported && (
              <div className="rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)', border: '1px solid rgba(59,130,246,0.2)' }}>
                ✅ {importCount} lead{importCount > 1 ? 's' : ''} importé{importCount > 1 ? 's' : ''} dans le CRM
              </div>
            )}

            {/* Liste leads qualifiés */}
            {results.length > 0 && !imported && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-text1">
                    {results.length} lead{results.length > 1 ? 's' : ''} qualifié{results.length > 1 ? 's' : ''}
                    <span className="ml-1 font-normal" style={{ color: 'var(--text3)' }}>
                      (e-commerce et bons sites filtrés automatiquement)
                    </span>
                  </p>
                  <button className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text3)' }} onClick={toggleAll}>
                    {results.every((r) => r.selected) ? <CheckSquare size={13} style={{ color: 'var(--accent)' }} /> : <Square size={13} />}
                    {results.every((r) => r.selected) ? 'Désélectionner' : 'Tout sélect.'}
                  </button>
                </div>

                <div className="flex flex-col gap-2" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  {results.map((r, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleOne(idx)}
                      className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: r.selected ? 'rgba(59,130,246,0.06)' : 'var(--surface2)',
                        border: `1px solid ${r.selected ? 'rgba(59,130,246,0.25)' : 'var(--border1)'}`,
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {r.selected
                          ? <CheckSquare size={15} style={{ color: 'var(--accent)' }} />
                          : <Square size={15} style={{ color: 'var(--text3)' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-sm text-text1">{r.title || '—'}</p>
                          {r.quality === 'no-site' && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171' }}>
                              <WifiOff size={9} /> Sans site
                            </span>
                          )}
                          {r.quality === 'bad' && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}>
                              <Zap size={9} /> Site nul ({r.score}/100)
                            </span>
                          )}
                          {r.quality === 'checking' && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface3)', color: 'var(--text3)' }}>
                              <Loader2 size={9} className="animate-spin" /> Analyse…
                            </span>
                          )}
                          {r.rating && (
                            <span className="flex items-center gap-0.5 text-xs" style={{ color: '#3B82F6' }}>
                              <Star size={9} fill="#3B82F6" /> {r.rating}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                          {r.category && <span className="text-xs" style={{ color: 'var(--text3)' }}>{r.category}</span>}
                          {r.address && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text3)' }}>
                              <MapPin size={9} /> {r.address}
                            </span>
                          )}
                          {r.phoneNumber && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text3)' }}>
                              <Phone size={9} /> {r.phoneNumber}
                            </span>
                          )}
                          {r.website && (
                            <a href={r.website} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1 text-xs hover:underline" style={{ color: 'var(--text3)' }}>
                              <Globe size={9} /> {r.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                              <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="btn-primary justify-center"
                  onClick={handleImport}
                  disabled={importing || selectedCount === 0}
                >
                  {importing
                    ? <><Loader2 size={14} className="animate-spin" /> Import…</>
                    : <><Download size={14} /> Importer {selectedCount} lead{selectedCount > 1 ? 's' : ''}</>}
                </button>
              </div>
            )}

            {/* Aucun résultat qualifié */}
            {!loading && !checking && results.length === 0 && !error && (
              <div className="text-center py-6 text-sm" style={{ color: 'var(--text3)' }}>
                Lance une recherche ci-dessus
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, Check, AlertCircle, Loader2, ChevronDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useDataStore } from '@/stores/dataStore'

interface Props {
  onClose: () => void
}

interface ParsedLead {
  nom: string
  entreprise: string
  email: string
  telephone: string
  niche: string
  source: string
  budget: number
  notes: string
  statut: string
}

type LeadField = keyof ParsedLead | ''

const LEAD_FIELDS: { value: LeadField; label: string }[] = [
  { value: '', label: '— Ignorer —' },
  { value: 'nom', label: 'Nom / Prénom' },
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'email', label: 'Email' },
  { value: 'telephone', label: 'Téléphone' },
  { value: 'niche', label: 'Niche / Secteur' },
  { value: 'source', label: 'Source' },
  { value: 'budget', label: 'Montant payé (€)' },
  { value: 'notes', label: 'Notes' },
  { value: 'statut', label: 'Statut' },
]

// Auto-détection intelligente
const AUTO_MAP: Record<string, LeadField> = {
  // nom
  'nom': 'nom', 'name': 'nom', 'prénom': 'nom', 'prenom': 'nom',
  'contact': 'nom', 'full name': 'nom', 'fullname': 'nom',
  'nom complet': 'nom', 'prénom nom': 'nom', 'prenom nom': 'nom',
  'nom du contact': 'nom', 'interlocuteur': 'nom', 'prospect': 'nom',
  'first name': 'nom', 'last name': 'nom', 'firstname': 'nom', 'lastname': 'nom',
  'nom et prénom': 'nom', 'prénom et nom': 'nom',
  // entreprise
  'entreprise': 'entreprise', 'company': 'entreprise', 'société': 'entreprise',
  'societe': 'entreprise', 'organisation': 'entreprise', 'organization': 'entreprise',
  'raison sociale': 'entreprise', 'structure': 'entreprise', 'enseigne': 'entreprise',
  'nom entreprise': 'entreprise', 'nom société': 'entreprise', 'client': 'entreprise',
  'business': 'entreprise', 'corp': 'entreprise',
  // email
  'email': 'email', 'e-mail': 'email', 'mail': 'email', 'courriel': 'email',
  'adresse email': 'email', 'adresse mail': 'email', 'adresse e-mail': 'email',
  // telephone
  'téléphone': 'telephone', 'telephone': 'telephone', 'tel': 'telephone',
  'tél': 'telephone', 'phone': 'telephone', 'mobile': 'telephone',
  'portable': 'telephone', 'tel portable': 'telephone', 'num': 'telephone',
  'numéro': 'telephone', 'numero': 'telephone', 'numéro de téléphone': 'telephone',
  'téléphone portable': 'telephone', 'fixe': 'telephone', 'tél.': 'telephone',
  'tel.': 'telephone', 'cellulaire': 'telephone', 'gsm': 'telephone',
  // niche
  'niche': 'niche', 'secteur': 'niche', 'sector': 'niche', 'industrie': 'niche',
  'industry': 'niche', 'domaine': 'niche', "secteur d'activité": 'niche',
  'domaine d\'activité': 'niche', 'activité': 'niche', 'activite': 'niche',
  'métier': 'niche', 'metier': 'niche', 'catégorie': 'niche', 'categorie': 'niche',
  // source
  'source': 'source', 'provenance': 'source', 'origine': 'source', 'origin': 'source',
  'canal': 'source', 'acquisition': 'source', 'via': 'source',
  // budget
  'budget': 'budget', 'montant': 'budget', 'amount': 'budget', 'prix': 'budget',
  'valeur': 'budget', 'ca': 'budget', 'chiffre d\'affaires': 'budget', 'tarif': 'budget',
  // notes
  'notes': 'notes', 'note': 'notes', 'commentaire': 'notes', 'description': 'notes',
  'remarque': 'notes', 'comment': 'notes', 'commentaires': 'notes', 'observations': 'notes',
  'remarques': 'notes', 'infos': 'notes', 'info': 'notes', 'détails': 'notes',
  // statut
  'statut': 'statut', 'status': 'statut', 'état': 'statut', 'etat': 'statut',
  'étape': 'statut', 'etape': 'statut', 'phase': 'statut',
}

function autoDetect(col: string): LeadField {
  const key = col.toLowerCase().trim()
  if (AUTO_MAP[key]) return AUTO_MAP[key]
  // Recherche partielle
  for (const [pattern, field] of Object.entries(AUTO_MAP)) {
    if (key.includes(pattern) || pattern.includes(key)) return field
  }
  return ''
}

function applyMapping(
  rows: Record<string, unknown>[],
  mapping: Record<string, LeadField>
): ParsedLead[] {
  return rows.map((row) => {
    const lead: ParsedLead = {
      nom: '', entreprise: '', email: '', telephone: '',
      niche: '', source: '', budget: 0, notes: '', statut: 'À contacter',
    }
    for (const [col, field] of Object.entries(mapping)) {
      if (!field) continue
      const value = row[col]
      if (value === null || value === undefined) continue
      const str = String(value).trim()
      if (!str) continue

      if (field === 'budget') {
        lead.budget = parseFloat(str.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0
      } else {
        (lead as unknown as Record<string, unknown>)[field] = str
      }
    }
    return lead
  }).filter((l) => l.nom || l.email || l.entreprise)
}

export default function ImportLeadsModal({ onClose }: Props) {
  const { bulkCreateLeads } = useDataStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload')
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, LeadField>>({})
  const [leads, setLeads] = useState<ParsedLead[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [imported, setImported] = useState(0)
  const [dragging, setDragging] = useState(false)

  function handleFile(file: File) {
    setError(null)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      setError('Format non supporté. Utilise un fichier Excel (.xlsx, .xls) ou CSV (.csv)')
      return
    }
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]

        if (rows.length === 0) {
          setError('Le fichier est vide ou mal formaté.')
          return
        }

        // Extraire toutes les colonnes
        const cols = Object.keys(rows[0])
        const initialMapping: Record<string, LeadField> = {}
        for (const col of cols) {
          initialMapping[col] = autoDetect(col)
        }

        setRawRows(rows)
        setColumns(cols)
        setMapping(initialMapping)
        setStep('mapping')
      } catch {
        setError("Impossible de lire le fichier. Vérifie qu'il n'est pas corrompu.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function handleConfirmMapping() {
    const parsed = applyMapping(rawRows, mapping)
    if (parsed.length === 0) {
      setError("Aucun lead valide trouvé. Assigne au moins la colonne Nom, Email ou Entreprise.")
      return
    }
    setLeads(parsed)
    setError(null)
    setStep('preview')
  }

  async function handleImport() {
    setStep('importing')
    setProgress(20)
    const today = new Date().toISOString().split('T')[0]
    const payload = leads.map((lead) => ({
      nom: lead.nom || lead.entreprise || lead.email || 'Sans nom',
      entreprise: lead.entreprise || '',
      email: lead.email || '',
      telephone: lead.telephone || '',
      niche: lead.niche || '',
      source: lead.source || '',
      score: 5,
      statut: lead.statut || 'À contacter',
      budget: lead.budget || 0,
      proba: 30,
      besoin: lead.notes || '',
      prochain_contact: null,
      type_action: 'Appel',
      notes: lead.notes || '',
      date: today,
      site: '', drive: '', figma: '',
    }))
    setProgress(50)
    const { error, count } = await bulkCreateLeads(payload)
    setProgress(100)
    if (error) {
      setStep('preview')
      setError(`Erreur lors de l'import : ${error}`)
      return
    }
    setImported(count)
    setStep('done')
  }

  // Compter les colonnes bien mappées
  const mappedCount = Object.values(mapping).filter(v => v !== '').length
  const unmappedCols = columns.filter(c => mapping[c] === '')

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = '1' }}
      onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === '1') { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}
    >
      <div className="modal-content" style={{ maxWidth: '580px', width: '100%' }}>
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="font-syne font-bold text-base text-text1">Importer des leads</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
              {step === 'upload' && 'Excel (.xlsx, .xls) ou CSV'}
              {step === 'mapping' && `${columns.length} colonnes détectées · ${mappedCount} reconnues`}
              {step === 'preview' && `${leads.length} leads prêts à importer`}
              {step === 'importing' && 'Import en cours…'}
              {step === 'done' && 'Import terminé'}
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── ÉTAPE 1 : Upload ── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 px-6 text-center cursor-pointer transition-all"
              style={{
                borderColor: dragging ? 'var(--accent)' : 'var(--border2)',
                background: dragging ? 'rgba(6,95,70,0.05)' : 'var(--surface2)',
              }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
                <FileSpreadsheet size={22} style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-sm font-medium text-text1">Glisse ton fichier ici</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>ou clique pour choisir un fichier</p>
              </div>
              <div className="flex gap-2">
                {['.xlsx', '.xls', '.csv'].map((ext) => (
                  <span key={ext} className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: 'var(--surface3)', color: 'var(--text3)' }}>
                    {ext}
                  </span>
                ))}
              </div>
            </div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
            {error && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(59,130,246,0.12)', color: '#C2410C' }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : Mapping des colonnes ── */}
        {step === 'mapping' && (
          <div className="flex flex-col gap-4">
            {/* Info */}
            {unmappedCols.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(59,130,246,0.12)', color: '#92400E' }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span><strong>{unmappedCols.length} colonne{unmappedCols.length > 1 ? 's' : ''}</strong> non reconnue{unmappedCols.length > 1 ? 's' : ''} — assigne-les manuellement ci-dessous.</span>
              </div>
            )}

            {/* Tableau de mapping */}
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border1)' }}>
              <div className="px-3 py-2 border-b text-xs font-semibold flex gap-2" style={{ background: 'var(--surface2)', borderColor: 'var(--border1)', color: 'var(--text3)' }}>
                <span className="flex-1">Colonne dans ton fichier</span>
                <span className="w-44">Champ CRM</span>
              </div>
              <div className="divide-y overflow-y-auto" style={{ borderColor: 'var(--border1)', maxHeight: '300px' }}>
                {columns.map((col) => {
                  const isMapped = mapping[col] !== ''
                  // Aperçu de la première valeur
                  const preview = rawRows[0]?.[col]
                  const previewStr = preview !== undefined && preview !== null ? String(preview).slice(0, 30) : ''
                  return (
                    <div key={col} className="flex items-center gap-3 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-text1 truncate">{col}</p>
                        {previewStr && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text3)' }}>ex: {previewStr}</p>
                        )}
                      </div>
                      <div className="relative w-44 shrink-0">
                        <select
                          value={mapping[col] ?? ''}
                          onChange={(e) => setMapping(prev => ({ ...prev, [col]: e.target.value as LeadField }))}
                          className="w-full text-xs py-1.5 pl-2 pr-7 rounded-lg appearance-none"
                          style={{
                            background: isMapped ? 'rgba(59,130,246,0.08)' : 'var(--surface2)',
                            border: `1px solid ${isMapped ? 'rgba(59,130,246,0.3)' : 'var(--border2)'}`,
                            color: isMapped ? 'var(--accent)' : 'var(--text3)',
                            outline: 'none',
                          }}
                        >
                          {LEAD_FIELDS.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(59,130,246,0.12)', color: '#C2410C' }}>
                <AlertCircle size={15} className="shrink-0 mt-0.5" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => { setStep('upload'); setColumns([]); setRawRows([]) }}>
                ← Changer le fichier
              </button>
              <button className="btn-primary flex-1 justify-center" onClick={handleConfirmMapping}>
                Aperçu →
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Prévisualisation ── */}
        {step === 'preview' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--surface2)' }}>
              <FileSpreadsheet size={15} style={{ color: 'var(--accent)' }} />
              <span className="text-sm text-text1 truncate">{fileName}</span>
              <span className="ml-auto text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                {leads.length} leads prêts
              </span>
            </div>

            <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border1)' }}>
              <div className="px-3 py-2 border-b text-xs font-semibold" style={{ background: 'var(--surface2)', borderColor: 'var(--border1)', color: 'var(--text3)' }}>
                Aperçu des {Math.min(5, leads.length)} premiers leads
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border1)' }}>
                {leads.slice(0, 5).map((lead, i) => (
                  <div key={i} className="px-3 py-2.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'var(--accent)' }}>
                      {(lead.nom || lead.entreprise || lead.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text1 truncate">{lead.nom || '—'}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>
                        {[lead.entreprise, lead.email, lead.telephone].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    {lead.budget > 0 && (
                      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--accent)' }}>
                        {lead.budget.toLocaleString('fr-FR')} €
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setStep('mapping')}>
                ← Modifier le mapping
              </button>
              <button className="btn-primary flex-1 justify-center" onClick={handleImport}>
                <Upload size={14} />
                Importer {leads.length} leads
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 : Import en cours ── */}
        {step === 'importing' && (
          <div className="flex flex-col items-center gap-5 py-6">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--accent)' }} />
            <div className="w-full">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text3)' }}>
                <span>Import en cours…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--surface3)' }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: 'var(--accent)' }} />
              </div>
            </div>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>Ne ferme pas cette fenêtre…</p>
          </div>
        )}

        {/* ── ÉTAPE 5 : Succès ── */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
              <Check size={26} style={{ color: '#3B82F6' }} />
            </div>
            <div className="text-center">
              <p className="font-syne font-bold text-lg text-text1">{imported} leads importés !</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                Ils sont maintenant disponibles dans ta liste de leads.
              </p>
            </div>
            <button className="btn-primary w-full justify-center" onClick={onClose}>
              Voir mes leads
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, ExternalLink, Folder, FolderOpen, ArrowLeft, Link2, Trash, X, Loader2 } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import type { Projet } from '@/types'
import { STAGES } from '@/types'
import ProjetModal from '@/components/modals/ProjetModal'
import { DriveIcon, FigmaIcon, GitHubIcon, NotionIcon, GoogleDocIcon, GoogleSheetIcon, ExcelIcon, PdfIcon, YoutubeIcon } from '@/components/ui/ServiceIcons'
import { useDriveStore, DOSSIERS_TEMPLATE } from '@/stores/driveStore'
import type { DocType } from '@/stores/driveStore'

const STAGE_COLORS = [
  { bg: 'rgba(59,130,246,0.14)', text: '#3B82F6' },
  { bg: 'rgba(59,130,246,0.14)', text: '#3B82F6' },
  { bg: 'rgba(59,130,246,0.14)', text: '#3B82F6' },
  { bg: 'rgba(59,130,246,0.14)', text: '#3B82F6' },
  { bg: '#1A2A3D', text: '#3B82F6' },
  { bg: 'rgba(59,130,246,0.14)', text: '#3B82F6' },
  { bg: 'rgba(90,196,122,0.14)', text: '#5AC47A' },
  { bg: '#1A3A2A', text: '#4AE89A' },
  { bg: '#2D1A3D', text: '#C47AF2' },
]

function stageColor(stage: string) {
  const idx = STAGES.indexOf(stage as typeof STAGES[number])
  return STAGE_COLORS[idx] ?? { bg: 'rgba(154,149,144,0.14)', text: '#9A9590' }
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  'google-doc':   { label: 'Google Doc',   color: '#4285F4', bg: 'rgba(59,130,246,0.14)', Icon: GoogleDocIcon },
  'google-sheet': { label: 'Google Sheet', color: '#0F9D58', bg: 'rgba(90,196,122,0.14)', Icon: GoogleSheetIcon },
  'figma':        { label: 'Figma',        color: '#3B82F6', bg: 'rgba(59,130,246,0.14)', Icon: FigmaIcon },
  'video':        { label: 'Vidéo',        color: '#FF0000', bg: '#2D0A0A', Icon: YoutubeIcon },
  'drive':        { label: 'Drive',        color: '#3B82F6', bg: 'rgba(59,130,246,0.14)', Icon: DriveIcon },
  'notion':       { label: 'Notion',       color: '#d4d4d4', bg: 'rgba(154,149,144,0.14)', Icon: NotionIcon },
  'excel':        { label: 'Excel',        color: '#169154', bg: 'rgba(90,196,122,0.14)', Icon: ExcelIcon },
  'pdf':          { label: 'PDF',          color: '#F40F02', bg: 'rgba(244,15,2,0.12)', Icon: PdfIcon },
  'lien':         { label: 'Lien',         color: '#3B82F6', bg: 'rgba(59,130,246,0.14)', Icon: Link2 },
}

function ServiceLinks({ projet }: { projet: Projet }) {
  const links = [
    { url: projet.drive,  label: 'Drive',  Icon: DriveIcon,  bg: '#1a2744' },
    { url: projet.figma,  label: 'Figma',  Icon: FigmaIcon,  bg: '#1a1025' },
    { url: projet.github, label: 'GitHub', Icon: GitHubIcon, bg: '#1a1a2e' },
    { url: projet.notion, label: 'Notion', Icon: NotionIcon, bg: '#1a1a1a' },
    { url: projet.site,   label: 'Site',   Icon: null,       bg: 'rgba(154,149,144,0.14)' },
  ].filter((l) => l.url)

  if (!links.length) return null
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {links.map(({ url, label, Icon, bg }) => (
        <a key={label}
          href={(url as string).startsWith('http') ? (url as string) : `https://${url}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all hover:brightness-125"
          style={{ background: bg, color: 'var(--text2)' }}
          onClick={(e) => e.stopPropagation()}
          title={label}
        >
          {Icon ? <Icon size={13} /> : <ExternalLink size={11} />}
          <span>{label}</span>
        </a>
      ))}
    </div>
  )
}

// ── Modal ajout de document ──────────────────────────────────────────────────
function AddDocModal({ projetId, dossier, onClose }: { projetId: string; dossier: string; onClose: () => void }) {
  const { addDoc } = useDriveStore()
  const [nom, setNom] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState<DocType>('lien')
  const [loading, setLoading] = useState(false)

  function detectType(u: string): DocType {
    if (u.includes('docs.google.com/document')) return 'google-doc'
    if (u.includes('docs.google.com/spreadsheets') || u.includes('sheets.google')) return 'google-sheet'
    if (u.includes('figma.com')) return 'figma'
    if (u.includes('drive.google.com')) return 'drive'
    if (u.includes('notion.so')) return 'notion'
    if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com')) return 'video'
    if (u.endsWith('.xlsx') || u.endsWith('.xls') || u.includes('excel')) return 'excel'
    if (u.endsWith('.pdf')) return 'pdf'
    return 'lien'
  }

  function handleUrlChange(v: string) {
    setUrl(v)
    setType(detectType(v))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    addDoc(projetId, dossier, {
      nom: nom.trim() || url,
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      type,
    })
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-syne font-bold text-sm text-text1">Ajouter dans {dossier}</h3>
          <button className="btn-ghost" onClick={onClose}><X size={15} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">URL *</label>
            <input type="text" value={url} onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://docs.google.com/…" required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Nom (optionnel)</label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
              placeholder="Ex : Brief client v2" />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {(Object.entries(DOC_TYPE_CONFIG) as [DocType, typeof DOC_TYPE_CONFIG[DocType]][]).map(([key, cfg]) => (
                <button key={key} type="button"
                  onClick={() => setType(key)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: type === key ? cfg.bg : 'var(--surface2)',
                    color: type === key ? cfg.color : 'var(--text3)',
                    borderColor: type === key ? `${cfg.color}44` : 'var(--border1)',
                  }}>
                  <cfg.Icon size={11} /> {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 size={13} className="animate-spin" />}
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Vue Drive d'un projet ────────────────────────────────────────────────────
function ProjetDrive({ projet, onBack, onEdit }: { projet: Projet; onBack: () => void; onEdit: () => void }) {
  const { data, removeDoc } = useDriveStore()
  const [openDossier, setOpenDossier] = useState<string | null>(null)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const sc = stageColor(projet.stage)

  const projData = data[projet.id] ?? {}

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button className="btn-ghost flex items-center gap-1.5 text-sm" onClick={onBack}>
            <ArrowLeft size={15} /> Projets
          </button>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span className="font-syne font-bold text-sm text-text1">{projet.nom}</span>
          <span className="badge text-xs" style={{ background: sc.bg, color: sc.text }}>{projet.stage}</span>
        </div>
        <button className="btn-ghost text-xs flex items-center gap-1.5" onClick={onEdit}>
          <Pencil size={12} /> Éditer le projet
        </button>
      </div>

      {/* Infos projet */}
      <div className="card py-3 px-4 flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-xs" style={{ color: 'var(--text3)' }}>Client</p>
          <p className="font-medium text-text1 text-sm">{projet.client || '—'}</p>
        </div>
        {projet.ech && (
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Échéance</p>
            <p className="font-medium text-text1 text-sm">{new Date(projet.ech).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs mb-1" style={{ color: 'var(--text3)' }}>Avancement</p>
          <div className="flex items-center gap-2">
            <div className="progress-bar flex-1" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${projet.av}%`, background: projet.av >= 80 ? '#5AC47A' : projet.av >= 40 ? '#3B82F6' : 'var(--accent)' }} />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{projet.av}%</span>
          </div>
        </div>
        <ServiceLinks projet={projet} />
      </div>

      {/* Dossiers */}
      <div className="flex flex-col gap-2">
        {DOSSIERS_TEMPLATE.map((dossier) => {
          const docs = projData[dossier] ?? []
          const isOpen = openDossier === dossier

          return (
            <div key={dossier} className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--border1)' }}>
              {/* En-tête dossier */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:brightness-110"
                style={{ background: isOpen ? 'var(--surface2)' : 'var(--surface1)' }}
                onClick={() => setOpenDossier(isOpen ? null : dossier)}
              >
                {isOpen
                  ? <FolderOpen size={18} style={{ color: '#3B82F6', flexShrink: 0 }} />
                  : <Folder size={18} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                }
                <span className="flex-1 font-medium text-sm" style={{ color: isOpen ? 'var(--text1)' : 'var(--text2)' }}>
                  {dossier}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: docs.length > 0 ? 'rgba(59,130,246,0.15)' : 'var(--surface3)', color: docs.length > 0 ? '#3B82F6' : 'var(--text3)' }}>
                  {docs.length} fichier{docs.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Contenu dossier */}
              {isOpen && (
                <div style={{ borderTop: '1px solid var(--border1)', background: 'var(--surface1)' }}>
                  {docs.length > 0 && (
                    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border1)' }}>
                      {docs.map((doc) => {
                        const cfg = DOC_TYPE_CONFIG[doc.type]
                        return (
                          <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5 group">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: cfg.bg }}>
                              <cfg.Icon size={13} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text1 truncate">{doc.nom}</p>
                              <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{doc.url}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="btn-ghost p-1.5" title="Ouvrir" style={{ color: cfg.color }}>
                                <ExternalLink size={13} />
                              </a>
                              <button className="btn-ghost p-1.5 hover:text-red-400"
                                onClick={() => removeDoc(projet.id, dossier, doc.id)}
                                title="Supprimer">
                                <Trash size={13} />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <div className="px-4 py-2.5">
                    <button
                      className="flex items-center gap-2 text-xs font-medium transition-all hover:opacity-80"
                      style={{ color: 'var(--accent)' }}
                      onClick={() => setAddingTo(dossier)}
                    >
                      <Plus size={13} /> Ajouter un fichier / lien
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {addingTo && (
        <AddDocModal
          projetId={projet.id}
          dossier={addingTo}
          onClose={() => setAddingTo(null)}
        />
      )}
    </div>
  )
}

// ── Folder card ─────────────────────────────────────────────────────────────
function FolderCard({ p, onOpen, onEdit, onDelete }: {
  p: Projet
  onOpen: (p: Projet) => void
  onEdit: (p: Projet) => void
  onDelete: (id: string) => void
}) {
  const { data } = useDriveStore()
  const projData = data[p.id] ?? {}
  const allDocs = Object.values(projData).flat()
  const previewDocs = allDocs.slice(0, 3)
  const sc = stageColor(p.stage)

  const DOC_ROTATIONS = [-14, 3, -7]
  const DOC_OFFSETS   = [-26, 0, 26]

  const daysAgo = Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000)
  const age = daysAgo < 1 ? "Aujourd'hui" : daysAgo === 1 ? 'Hier' : `${daysAgo}j`

  return (
    <div
      className="cursor-pointer transition-all duration-150 group"
      style={{ background: 'var(--surface1)', border: '1px solid var(--border1)', borderRadius: 16, overflow: 'hidden' }}
      onClick={() => onOpen(p)}
    >
      {/* ── Folder visual ── */}
      <div style={{ background: 'var(--surface2)', height: 155, position: 'relative', overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>

        {previewDocs.length > 0 ? (
          /* ── Dossier OUVERT — docs qui dépassent par le haut ── */
          <div style={{ position: 'absolute', inset: 0 }}>
            {/* Documents derrière le dossier (zIndex 1) — dépassent par le haut */}
            {previewDocs.map((doc, i) => {
              const cfg   = DOC_TYPE_CONFIG[doc.type]
              const rots  = [-11, -5, 8]
              const offXs = [-14, 0, 14]
              return (
                <div key={doc.id} style={{
                  position: 'absolute',
                  bottom: 55,
                  left: '50%',
                  width: 38,
                  height: 70,
                  background: '#f5f4f0',
                  borderRadius: 6,
                  overflow: 'hidden',
                  transform: `translateX(calc(-50% + ${offXs[i]}px)) rotate(${rots[i]}deg)`,
                  transformOrigin: 'bottom center',
                  zIndex: 1,
                }}>
                  <div style={{ background: cfg.bg, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <cfg.Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div style={{ padding: '5px 6px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {[75, 50, 85].map((w, j) => (
                      <div key={j} style={{ height: 2, background: '#c8c8c4', borderRadius: 1, width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Dossier en avant-plan (zIndex 2) */}
            <div style={{ position: 'absolute', bottom: 38, left: '50%', transform: 'translateX(-50%)', width: 96, zIndex: 2 }}>
              <svg viewBox="0 0 200 155" fill="none" width="100%" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id={`fo-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A5FBF"/>
                    <stop offset="100%" stopColor="#323E83"/>
                  </linearGradient>
                </defs>
                <path d="M0 40 Q0 24 16 24 L70 24 Q82 24 88 34 L102 40 Z" fill="#1E2659"/>
                <path d="M0 40 L184 40 Q200 40 200 56 L200 139 Q200 155 184 155 L16 155 Q0 155 0 139 L0 40 Z" fill={`url(#fo-${p.id})`}/>
                <rect x="0" y="40" width="200" height="2" rx="1" fill="rgba(255,255,255,0.07)"/>
              </svg>
            </div>
          </div>
        ) : (
          /* ── Dossier FERMÉ vide — forme macOS, centré ── */
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 96 }}>
              <svg viewBox="0 0 200 155" fill="none" width="100%" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id={`fv-${p.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4A5FBF"/>
                    <stop offset="100%" stopColor="#323E83"/>
                  </linearGradient>
                </defs>
                {/* Tab */}
                <path d="M0 40 Q0 24 16 24 L70 24 Q82 24 88 34 L102 40 Z" fill="#1E2659"/>
                {/* Corps — coin haut-gauche droit, autres arrondis */}
                <path d="M0 40 L184 40 Q200 40 200 56 L200 139 Q200 155 184 155 L16 155 Q0 155 0 139 L0 40 Z" fill={`url(#fv-${p.id})`}/>
                {/* Reflet haut */}
                <rect x="0" y="40" width="200" height="2" rx="1" fill="rgba(255,255,255,0.07)"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* ── Info bar ── */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-syne font-bold text-sm text-text1 truncate">{p.nom}</h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs" style={{ color: 'var(--text3)' }}>
              {allDocs.length} fichier{allDocs.length !== 1 ? 's' : ''}
            </span>
            {p.client && (
              <>
                <span style={{ color: 'var(--text3)', fontSize: 10 }}>·</span>
                <span className="text-xs truncate" style={{ color: 'var(--text3)' }}>{p.client}</span>
              </>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={() => onEdit(p)} className="btn-ghost p-1.5"><Pencil size={12} /></button>
          <button onClick={() => onDelete(p.id)} className="btn-ghost p-1.5 hover:text-red-400"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale Projets ──────────────────────────────────────────────────
export default function Projets() {
  const { projets, deleteProjet } = useDataStore()
  const [editing, setEditing] = useState<Projet | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filterStage, setFilterStage] = useState('Tous')
  const [openProjet, setOpenProjet] = useState<Projet | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  // Ouvre automatiquement le projet passé via ?open=id (depuis StagesProjets)
  useEffect(() => {
    const openId = searchParams.get('open')
    if (openId && projets.length > 0) {
      const p = projets.find((p) => p.id === openId)
      if (p) {
        setOpenProjet(p)
        setSearchParams({}, { replace: true })
      }
    }
  }, [searchParams, projets])

  const stageFilters = ['Tous', ...STAGES]
  const filtered = filterStage === 'Tous' ? projets : projets.filter((p) => p.stage === filterStage)

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return
    await deleteProjet(id)
  }

  // Si un projet est ouvert → vue drive
  if (openProjet) {
    const latestProjet = projets.find((p) => p.id === openProjet.id) ?? openProjet
    return (
      <>
        <ProjetDrive
          projet={latestProjet}
          onBack={() => setOpenProjet(null)}
          onEdit={() => setEditing(latestProjet)}
        />
        {editing && (
          <ProjetModal projet={editing} onClose={() => setEditing(null)} />
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {stageFilters.map((s) => {
            const sc = s === 'Tous' ? null : stageColor(s)
            const isActive = filterStage === s
            return (
              <button key={s} onClick={() => setFilterStage(s)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isActive ? (sc?.bg ?? 'var(--surface3)') : 'var(--surface2)',
                  color: isActive ? (sc?.text ?? 'var(--text1)') : 'var(--text3)',
                  border: `1px solid ${isActive ? 'transparent' : 'var(--border1)'}`,
                }}>
                {sc && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.text, display: 'inline-block', flexShrink: 0 }} />}
                {s}
              </button>
            )
          })}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={14} /> Nouveau projet
        </button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Aucun projet pour l'instant</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => (
            <FolderCard
              key={p.id}
              p={p}
              onOpen={setOpenProjet}
              onEdit={setEditing}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showCreate && <ProjetModal onClose={() => setShowCreate(false)} />}
      {editing && <ProjetModal projet={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

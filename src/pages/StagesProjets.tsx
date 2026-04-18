import { useState } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, Folder, Files } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '@/stores/dataStore'
import { useDriveStore } from '@/stores/driveStore'
import type { Projet } from '@/types'
import { STAGES } from '@/types'
import ProjetModal from '@/components/modals/ProjetModal'

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

function stageColor(idx: number) {
  return STAGE_COLORS[idx] ?? { bg: 'rgba(154,149,144,0.14)', text: '#9A9590' }
}

// Mini folder SVG réutilisable
function MiniFolder({ projetId, docCount }: { projetId: string; docCount: number }) {
  const hasDoc = docCount > 0
  return (
    <div style={{ width: 36, height: 30, position: 'relative', flexShrink: 0 }}>
      <svg viewBox="0 0 200 155" fill="none" width="36" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`sg-${projetId}`} x1="0" y1="0" x2="0.1" y2="1">
            <stop offset="0%" stopColor="#3B82F6"/>
            <stop offset="100%" stopColor="#6B5FD2"/>
          </linearGradient>
        </defs>
        <path d="M0 40 Q0 24 16 24 L70 24 Q82 24 88 34 L102 40 Z" fill="#7B6FE2"/>
        <path d="M0 40 L184 40 Q200 40 200 56 L200 139 Q200 155 184 155 L16 155 Q0 155 0 139 L0 40 Z" fill={`url(#sg-${projetId})`}/>
      </svg>
      {hasDoc && (
        <div style={{
          position: 'absolute', top: -2, right: -4,
          background: 'rgba(90,196,122,0.18)', color: '#5AC47A',
          borderRadius: 4, padding: '0 3px',
          fontSize: 7, fontWeight: 600, lineHeight: '12px',
        }}>{docCount}</div>
      )}
    </div>
  )
}

function ProjectCard({ projet, onClick, onViewFiles }: {
  projet: Projet
  onClick: () => void
  onViewFiles: () => void
}) {
  const { data } = useDriveStore()
  const docCount = Object.values(data[projet.id] ?? {}).flat().length

  return (
    <div
      className="cursor-pointer transition-all hover:brightness-110 group"
      style={{ background: 'var(--surface2)', border: '1px solid var(--border1)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
      onClick={onClick}
    >
      {/* Mini folder */}
      <div onClick={(e) => { e.stopPropagation(); onViewFiles() }} title="Voir les fichiers">
        <MiniFolder projetId={projet.id} docCount={docCount} />
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs text-text1 truncate mb-0.5">{projet.nom}</p>
        {projet.client && (
          <p className="text-xs truncate mb-2" style={{ color: 'var(--text3)' }}>{projet.client}</p>
        )}
        <div style={{ height: 3, background: 'var(--surface3)', borderRadius: 2 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${projet.av}%`,
            background: projet.av >= 80 ? '#5AC47A' : projet.av >= 40 ? '#3B82F6' : '#2563EB',
          }} />
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{projet.av}%</p>
      </div>

      {/* Bouton fichiers */}
      <button
        onClick={(e) => { e.stopPropagation(); onViewFiles() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity btn-ghost p-1.5"
        title="Voir les fichiers"
      >
        <Files size={13} />
      </button>
    </div>
  )
}

export default function StagesProjets() {
  const { projets } = useDataStore()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Projet | null>(null)

  const firstWithProjets = STAGES.findIndex((s) => projets.some((p) => p.stage === s))
  const [openStages, setOpenStages] = useState<Set<string>>(
    new Set(firstWithProjets >= 0 ? [STAGES[firstWithProjets]] : [])
  )

  function toggleStage(stage: string) {
    setOpenStages((prev) => {
      const next = new Set(prev)
      next.has(stage) ? next.delete(stage) : next.add(stage)
      return next
    })
  }

  function handleViewFiles(projetId: string) {
    // Navigue vers /projets et ouvre le dossier drive de ce projet
    navigate(`/projets?open=${projetId}`)
  }

  const total = projets.length

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Résumé badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map((stage, idx) => {
          const sc = stageColor(idx)
          const count = projets.filter((p) => p.stage === stage).length
          if (count === 0) return null
          return (
            <button
              key={stage}
              onClick={() => {
                setOpenStages(new Set([stage]))
                document.getElementById(`stage-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all hover:brightness-110"
              style={{ background: sc.bg, color: sc.text }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.text, display: 'inline-block' }} />
              <span className="font-medium">{stage}</span>
              <span className="font-bold">{count}</span>
            </button>
          )
        })}
        <span className="text-xs ml-auto" style={{ color: 'var(--text3)' }}>{total} projet{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Accordéon */}
      <div className="flex flex-col gap-2">
        {STAGES.map((stage, idx) => {
          const sc = stageColor(idx)
          const colProjets = projets.filter((p) => p.stage === stage)
          const isOpen = openStages.has(stage)

          return (
            <div key={stage} id={`stage-${idx}`} style={{ border: '1px solid var(--border1)', borderRadius: 14, overflow: 'hidden' }}>
              <button
                onClick={() => toggleStage(stage)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all"
                style={{ background: isOpen ? sc.bg : 'var(--surface1)' }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.text, display: 'inline-block', flexShrink: 0 }} />
                  <span className="font-syne font-bold text-sm" style={{ color: isOpen ? sc.text : 'var(--text2)' }}>
                    {stage}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{ background: isOpen ? `${sc.text}22` : 'var(--surface3)', color: isOpen ? sc.text : 'var(--text3)' }}>
                    {colProjets.length}
                  </span>
                </div>
                {isOpen
                  ? <ChevronDown size={15} style={{ color: sc.text }} />
                  : <ChevronRight size={15} style={{ color: 'var(--text3)' }} />}
              </button>

              {isOpen && (
                <div style={{ background: 'var(--surface1)', borderTop: '1px solid var(--border1)', padding: '12px 14px' }}>
                  {colProjets.length === 0 ? (
                    <div className="flex items-center justify-center py-6 gap-2" style={{ color: 'var(--text3)' }}>
                      <FolderOpen size={16} />
                      <span className="text-xs">Aucun projet à cette étape</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                      {colProjets.map((p) => (
                        <ProjectCard
                          key={p.id}
                          projet={p}
                          onClick={() => setEditing(p)}
                          onViewFiles={() => handleViewFiles(p.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing && <ProjetModal projet={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

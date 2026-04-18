import { useState } from 'react'
import { useDataStore } from '@/stores/dataStore'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'

interface KanbanItem {
  id: string
  type: 'lead' | 'client'
  nom: string
  sub?: string
  badge?: string
  badgeColor?: { background: string; color: string }
  initials: string
  accentColor: string
  colKey: string
}

const COLUMNS = [
  { key: 'lead',         label: 'Lead',         color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  { key: 'prospect',     label: 'Prospect',     color: '#3B82F6', bg: 'rgba(59,130,246,0.14)' },
  { key: 'client-actif', label: 'Client actif', color: '#5AC47A', bg: 'rgba(90,196,122,0.14)' },
  { key: 'livré',        label: 'Livré',        color: '#9A9590', bg: 'rgba(154,149,144,0.14)' },
]

// Mapping colKey → statut pour la mise à jour
const COL_TO_LEAD_UPDATE: Record<string, Partial<{ statut: string }>> = {
  'lead':      { statut: 'À contacter' },
  'prospect':  { statut: 'En discussion' },
}

function initials(nom: string) {
  return nom.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function DraggableCard({ item, colColor }: { item: KanbanItem; colColor: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="rounded-lg p-3 border transition-all hover:border-border2 cursor-grab active:cursor-grabbing"
      style={{ ...style, background: 'var(--surface2)', borderColor: 'var(--border1)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: item.accentColor }}
        >
          {item.initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text1 truncate">{item.nom}</p>
          {item.sub && (
            <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{item.sub}</p>
          )}
        </div>
      </div>
      {item.badge && (
        <span
          className="badge text-xs mt-2 block truncate"
          title={item.badge}
          style={{ ...(item.badgeColor ?? { background: 'rgba(154,149,144,0.14)', color: '#9A9590' }), maxWidth: '100%' } as React.CSSProperties}
        >
          {item.badge}
        </span>
      )}
    </div>
  )
}

function DroppableColumn({
  col, items,
}: {
  col: typeof COLUMNS[0]
  items: KanbanItem[]
}) {
  const { isOver, setNodeRef } = useDroppable({ id: col.key })

  return (
    <div
      ref={setNodeRef}
      className="kanban-col transition-all"
      style={isOver ? { outline: `2px solid ${col.color}44`, borderRadius: 12 } : undefined}
    >
      <div className="kanban-header" style={{ borderColor: `${col.color}33` }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
          <span className="text-xs font-medium font-syne whitespace-nowrap" style={{ color: col.color }}>
            {col.label}
          </span>
        </div>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: col.bg, color: col.color }}
        >
          {items.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} colColor={col.color} />
        ))}
        {items.length === 0 && (
          <div
            className="rounded-lg p-4 text-center border border-dashed"
            style={{ borderColor: isOver ? col.color : 'var(--border1)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text3)' }}>Dépose ici</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const { leads, clients, updateLead } = useDataStore()
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const allItems: KanbanItem[] = [
    ...leads.filter((l) => !['Gagné', 'Perdu', 'En discussion', 'Devis envoyé', 'RDV fixé', 'Négociation'].includes(l.statut)).map((l) => ({
      id: l.id, type: 'lead' as const, nom: l.nom, sub: l.entreprise || l.email,
      badge: l.niche, badgeColor: { background: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
      initials: initials(l.nom || 'L'), accentColor: '#1A3A5C', colKey: 'lead',
    })),
    ...leads.filter((l) => ['En discussion', 'Devis envoyé', 'RDV fixé', 'Négociation'].includes(l.statut)).map((l) => ({
      id: l.id, type: 'lead' as const, nom: l.nom, sub: l.entreprise,
      badge: l.statut, badgeColor: { background: 'rgba(59,130,246,0.14)', color: '#3B82F6' },
      initials: initials(l.nom || 'P'), accentColor: '#3B82F6', colKey: 'prospect',
    })),
    ...clients.filter((c) => c.statut === 'Actif').map((c) => ({
      id: c.id, type: 'client' as const, nom: c.nom, sub: c.niche,
      badge: c.statut, badgeColor: { background: 'rgba(90,196,122,0.14)', color: '#5AC47A' },
      initials: initials(c.nom || 'C'), accentColor: '#5AC47A', colKey: 'client-actif',
    })),
    ...clients.filter((c) => c.statut === 'Livré' || c.statut === 'Archivé').map((c) => ({
      id: c.id, type: 'client' as const, nom: c.nom, sub: c.niche,
      badge: c.statut, badgeColor: { background: 'rgba(154,149,144,0.14)', color: '#9A9590' },
      initials: initials(c.nom || 'C'), accentColor: '#5A5550', colKey: 'livré',
    })),
  ]

  const getColItems = (colKey: string) => allItems.filter((i) => i.colKey === colKey)

  function handleDragStart(e: DragStartEvent) {
    const item = allItems.find((i) => i.id === e.active.id)
    if (item) setActiveItem(item)
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveItem(null)
    const { active, over } = e
    if (!over || active.id === over.id) return
    const targetCol = over.id as string
    const item = allItems.find((i) => i.id === active.id)
    if (!item || item.colKey === targetCol) return

    // Seuls les leads peuvent être déplacés (clients gérés ailleurs)
    if (item.type === 'lead' && COL_TO_LEAD_UPDATE[targetCol]) {
      await updateLead(item.id as string, COL_TO_LEAD_UPDATE[targetCol])
    }
  }

  const total = leads.length + clients.length

  return (
    <div className="flex flex-col gap-5 h-full animate-fade-in">
      <div className="flex items-center gap-4">
        <p className="text-sm" style={{ color: 'var(--text3)' }}>
          {total} entrée{total !== 1 ? 's' : ''} dans le pipeline
        </p>
        <p className="text-xs ml-auto" style={{ color: 'var(--text3)' }}>Glisse-dépose pour déplacer les leads</p>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <DroppableColumn key={col.key} col={col} items={getColItems(col.key)} />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <div
              className="rounded-lg p-3 border shadow-2xl"
              style={{ background: 'var(--surface2)', borderColor: 'var(--border2)', width: 200, opacity: 0.95 }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: activeItem.accentColor }}
                >
                  {activeItem.initials}
                </div>
                <p className="text-xs font-medium text-text1 truncate">{activeItem.nom}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock,
  Loader2, CalendarDays, AlignLeft, Tag,
  UserPlus, Briefcase, Laptop2, Coffee,
} from 'lucide-react'
import { useCalendarStore, EVENT_TYPE_CONFIG, type CalendarEvent, type EventType } from '@/stores/calendarStore'
import { useDataStore } from '@/stores/dataStore'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const JOURS_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7h → 21h

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function parseISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}
function mondayOfWeek(d: Date) {
  const c = new Date(d)
  const day = c.getDay()
  c.setDate(c.getDate() - (day === 0 ? 6 : day - 1))
  c.setHours(0, 0, 0, 0)
  return c
}
function addDays(d: Date, n: number) {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}
function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = mondayOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}
function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function formatHour(h: number) {
  return `${String(h).padStart(2,'0')}:00`
}

// ─── Empty event template ─────────────────────────────────────────────────────

const EVENT_TYPE_ICON = {
  lead:    UserPlus,
  client:  Briefcase,
  travail: Laptop2,
  perso:   Coffee,
} as const

const emptyEvent = (date: string): Omit<CalendarEvent, 'id'> => ({
  titre: '', date, heureDebut: '09:00', heureFin: '10:00',
  type: 'travail', notes: '',
})

// ─── Event pill ──────────────────────────────────────────────────────────────

function EventPill({ ev, onClick }: { ev: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  const cfg = EVENT_TYPE_CONFIG[ev.type]
  return (
    <button
      onClick={onClick}
      className="w-full text-left truncate text-xs px-1.5 py-0.5 rounded-md font-medium"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {ev.heureDebut} {ev.titre}
    </button>
  )
}

// ─── Modal création / édition ─────────────────────────────────────────────────

interface ModalProps {
  initial: Omit<CalendarEvent, 'id'> & { id?: string }
  onClose: () => void
}

function EventModal({ initial, onClose }: ModalProps) {
  const { addEvent, updateEvent, deleteEvent } = useCalendarStore()
  const { leads, clients } = useDataStore()
  const isEdit = !!initial.id

  const [form, setForm] = useState({ ...initial })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.titre.trim()) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 180))
    if (isEdit) updateEvent(form as CalendarEvent)
    else addEvent(form)
    setLoading(false)
    onClose()
  }

  const handleDelete = () => {
    if (isEdit) deleteEvent(initial.id!)
    onClose()
  }

  const cfg = EVENT_TYPE_CONFIG[form.type]

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {(() => { const Icon = EVENT_TYPE_ICON[form.type]; return <Icon size={16} color="var(--accent)" strokeWidth={2.2} /> })()}
            <h2 className="font-syne font-bold text-base text-text1">
              {isEdit ? 'Modifier l\'événement' : 'Nouvel événement'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={15} /></button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Titre */}
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input
              autoFocus
              value={form.titre}
              onChange={e => set('titre', e.target.value)}
              placeholder="Ex: RDV démo, Design 3h, Appel client…"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">Type</label>
            <div className="flex gap-2">
              {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([k, v]) => {
                const Icon = EVENT_TYPE_ICON[k]
                const active = form.type === k
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set('type', k)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: active ? 'var(--accent)' : 'var(--surface2)',
                      color: active ? '#fff' : 'var(--text2)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border1)'}`,
                    }}
                  >
                    <Icon size={13} />
                    <span className="truncate">{v.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date + Heures */}
          <div className="flex flex-col gap-3">
            {/* Date */}
            <div className="form-group">
              <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: 'var(--text1)' }}>
                <CalendarDays size={13} strokeWidth={2.5} />Date
              </label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>

            {/* Horaire — bloc unifié */}
            <div className="form-group">
              <label className="flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: 'var(--text1)' }}>
                <Clock size={13} strokeWidth={2.5} />Horaire
              </label>
              <div className="flex items-center gap-0 rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--border2)', background: 'var(--surface2)' }}>
                <div className="flex items-center gap-2 flex-1 px-3 py-2">
                  <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text2)' }}>Début</span>
                  <input
                    type="time"
                    value={form.heureDebut}
                    onChange={e => set('heureDebut', e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: 0, colorScheme: 'dark', flex: 1, minWidth: 0 }}
                  />
                </div>
                <div className="shrink-0 flex items-center justify-center w-8"
                  style={{ borderLeft: '1px solid var(--border1)', borderRight: '1px solid var(--border1)', color: 'var(--text3)', fontSize: 16 }}>
                  →
                </div>
                <div className="flex items-center gap-2 flex-1 px-3 py-2">
                  <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text2)' }}>Fin</span>
                  <input
                    type="time"
                    value={form.heureFin}
                    onChange={e => set('heureFin', e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: 0, colorScheme: 'dark', flex: 1, minWidth: 0 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lier à un lead/client */}
          <div className="form-group">
            <label className="form-label flex items-center gap-1"><Tag size={11}/>Lier à (optionnel)</label>
            <select value={form.linkedId ?? ''} onChange={e => set('linkedId', e.target.value)}>
              <option value="">— Aucun —</option>
              {leads.length > 0 && (
                <optgroup label="Leads">
                  {leads.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
                </optgroup>
              )}
              {clients.length > 0 && (
                <optgroup label="Clients">
                  {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </optgroup>
              )}
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label flex items-center gap-1"><AlignLeft size={11}/>Notes</label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Détails, liens, infos utiles…"
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          {isEdit && (
            <button onClick={handleDelete} className="btn-secondary text-red-400 border-red-400/20 hover:bg-red-400/10">
              Supprimer
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Annuler</button>
          <button onClick={handleSave} disabled={!form.titre.trim() || loading} className="btn-primary flex-1 justify-center">
            {loading ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Calendrier() {
  const { events } = useCalendarStore()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [view, setView] = useState<'month' | 'week'>('month')
  const [weekStart, setWeekStart] = useState(mondayOfWeek(today))
  const [modal, setModal] = useState<null | (Omit<CalendarEvent, 'id'> & { id?: string })>(null)

  // ── Navigation ──────────────────────────────────────────────────────────────
  const goPrev = () => {
    if (view === 'month') setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))
    else setWeekStart(addDays(weekStart, -7))
  }
  const goNext = () => {
    if (view === 'month') setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))
    else setWeekStart(addDays(weekStart, 7))
  }
  const goToday = () => {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1))
    setWeekStart(mondayOfWeek(today))
  }

  // ── Month grid ──────────────────────────────────────────────────────────────
  const monthDays = useMemo(() => getMonthGrid(current.getFullYear(), current.getMonth()), [current])
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const eventsForDay = (d: Date) => events
    .filter(e => isSameDay(parseISO(e.date), d))
    .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut))

  // ── Header label ────────────────────────────────────────────────────────────
  const headerLabel = view === 'month'
    ? `${MOIS[current.getMonth()]} ${current.getFullYear()}`
    : `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MOIS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--border1)', background: 'var(--surface1)' }}>

        <div className="flex items-center gap-3">
          <button onClick={goPrev} className="btn-ghost p-1.5"><ChevronLeft size={16} /></button>
          <h2 className="font-syne font-bold text-lg w-56 text-center" style={{ color: 'var(--text1)' }}>
            {headerLabel}
          </h2>
          <button onClick={goNext} className="btn-ghost p-1.5"><ChevronRight size={16} /></button>
          <button onClick={goToday} className="btn-secondary text-xs px-3 py-1.5 ml-1">Aujourd'hui</button>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border2)' }}>
            {(['month', 'week'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: view === v ? 'var(--accent)' : 'var(--surface2)',
                  color: view === v ? '#fff' : 'var(--text2)',
                }}>
                {v === 'month' ? 'Mois' : 'Semaine'}
              </button>
            ))}
          </div>

          <button
            className="btn-primary gap-1.5"
            onClick={() => setModal(emptyEvent(toISO(today)))}
          >
            <Plus size={14} /> Événement
          </button>
        </div>
      </div>

      {/* ── Calendar body ── */}
      <div className="flex-1 overflow-auto">

        {/* ════ MONTH VIEW ════ */}
        {view === 'month' && (
          <div className="h-full flex flex-col">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b shrink-0"
              style={{ borderColor: 'var(--border1)', background: 'var(--surface1)' }}>
              {JOURS_COURTS.map(j => (
                <div key={j} className="py-2 text-center text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text3)' }}>{j}</div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, 1fr)' }}>
              {monthDays.map((day, i) => {
                const isToday    = isSameDay(day, today)
                const isCurMonth = day.getMonth() === current.getMonth()
                const dayEvents  = eventsForDay(day)

                return (
                  <div
                    key={i}
                    onClick={() => setModal(emptyEvent(toISO(day)))}
                    className="border-r border-b p-1.5 flex flex-col gap-1 cursor-pointer transition-colors group"
                    style={{
                      borderColor: 'var(--border1)',
                      background: 'var(--surface1)',
                      opacity: isCurMonth ? 1 : 0.38,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface1)')}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between">
                      <span
                        className="w-7 h-7 flex items-center justify-center text-sm font-semibold rounded-full"
                        style={{
                          background: isToday ? 'var(--accent)' : 'transparent',
                          color: isToday ? '#fff' : 'var(--text1)',
                        }}
                      >
                        {day.getDate()}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-xs mr-0.5" style={{ color: 'var(--text3)' }}>
                          {dayEvents.length > 2 ? `${dayEvents.length}` : ''}
                        </span>
                      )}
                    </div>

                    {/* Events (max 3) */}
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <EventPill key={ev.id} ev={ev} onClick={e => { e.stopPropagation(); setModal(ev) }} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs px-1.5" style={{ color: 'var(--text3)' }}>
                          +{dayEvents.length - 3} de plus
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ════ WEEK VIEW ════ */}
        {view === 'week' && (
          <div className="flex h-full" style={{ minHeight: 700 }}>
            {/* Time gutter */}
            <div className="shrink-0 w-14 border-r" style={{ borderColor: 'var(--border1)', background: 'var(--surface1)' }}>
              <div className="h-12 border-b" style={{ borderColor: 'var(--border1)' }} />
              {HOURS.map(h => (
                <div key={h} className="h-14 flex items-start pt-1 pr-2 justify-end text-xs"
                  style={{ color: 'var(--text3)' }}>
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((day, di) => {
                const isToday   = isSameDay(day, today)
                const dayEvents = eventsForDay(day)

                return (
                  <div key={di} className="border-r flex flex-col" style={{ borderColor: 'var(--border1)' }}>
                    {/* Day header */}
                    <div className="h-12 border-b flex flex-col items-center justify-center shrink-0 gap-0.5"
                      style={{ borderColor: 'var(--border1)', background: 'var(--surface1)' }}>
                      <span className="text-xs uppercase tracking-wider font-semibold"
                        style={{ color: 'var(--text3)' }}>{JOURS_COURTS[di]}</span>
                      <span
                        className="w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full"
                        style={{
                          background: isToday ? 'var(--accent)' : 'transparent',
                          color: isToday ? '#fff' : 'var(--text1)',
                        }}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Hour rows */}
                    <div className="relative flex-1">
                      {HOURS.map(h => (
                        <div
                          key={h}
                          className="h-14 border-b cursor-pointer transition-colors"
                          style={{ borderColor: 'var(--border1)' }}
                          onClick={() => setModal({ ...emptyEvent(toISO(day)), heureDebut: formatHour(h), heureFin: formatHour(h + 1) })}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        />
                      ))}

                      {/* Events overlay */}
                      {dayEvents.map(ev => {
                        const startMin = timeToMinutes(ev.heureDebut) - 7 * 60
                        const endMin   = timeToMinutes(ev.heureFin)   - 7 * 60
                        const top      = (startMin / 60) * 56
                        const height   = Math.max(((endMin - startMin) / 60) * 56, 24)
                        const cfg      = EVENT_TYPE_CONFIG[ev.type]
                        return (
                          <button
                            key={ev.id}
                            onClick={e => { e.stopPropagation(); setModal(ev) }}
                            className="absolute left-1 right-1 rounded-lg px-2 py-1 text-xs font-semibold text-left overflow-hidden transition-opacity hover:opacity-80"
                            style={{
                              top, height,
                              background: cfg.color,
                              color: '#fff',
                            }}
                          >
                            <div className="truncate">{ev.titre}</div>
                            <div className="opacity-80 text-[10px]">{ev.heureDebut} – {ev.heureFin}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {modal && <EventModal initial={modal} onClose={() => setModal(null)} />}
    </div>
  )
}

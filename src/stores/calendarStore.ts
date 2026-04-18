import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type EventType = 'lead' | 'client' | 'travail' | 'perso'

export interface CalendarEvent {
  id: string
  titre: string
  date: string       // YYYY-MM-DD
  heureDebut: string // HH:MM
  heureFin: string   // HH:MM
  type: EventType
  notes?: string
  linkedId?: string  // lead or client id
}

export const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string }> = {
  lead:    { label: 'RDV Lead',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  client:  { label: 'RDV Client',  color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  travail: { label: 'Travail',     color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  perso:   { label: 'Personnel',   color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
}

interface CalendarStore {
  events: CalendarEvent[]
  addEvent: (e: Omit<CalendarEvent, 'id'>) => void
  updateEvent: (e: CalendarEvent) => void
  deleteEvent: (id: string) => void
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (e) => set((s) => ({
        events: [...s.events, { ...e, id: crypto.randomUUID() }],
      })),
      updateEvent: (e) => set((s) => ({
        events: s.events.map((x) => (x.id === e.id ? e : x)),
      })),
      deleteEvent: (id) => set((s) => ({
        events: s.events.filter((x) => x.id !== id),
      })),
    }),
    { name: 'younes-crm-calendrier' }
  )
)

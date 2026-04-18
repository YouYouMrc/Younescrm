import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'
import type { CALigne, NewCALigne } from '@/types'

interface CAState {
  lignes: CALigne[]
  loading: boolean

  fetchCALignes: () => Promise<void>
  createCALigne: (data: NewCALigne) => Promise<{ error: string | null }>
  updateCALigne: (id: string, data: Partial<CALigne>) => Promise<{ error: string | null }>
  deleteCALigne: (id: string) => Promise<{ error: string | null }>
}

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export const useCAStore = create<CAState>()(
  persist(
    (set, get) => ({
      lignes: [],
      loading: false,

      fetchCALignes: async () => {
        set({ loading: true })
        try {
          const { data, error } = await supabase
            .from('ca_lignes')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) {
            // Table manquante ou autre erreur → array vide, pas de crash
            set({ lignes: [], loading: false })
            return
          }
          set({ lignes: (data as CALigne[]) ?? [], loading: false })
        } catch {
          set({ lignes: [], loading: false })
        }
      },

      createCALigne: async (data) => {
        const userId = await getUserId()
        if (!userId) return { error: 'Non authentifié' }
        try {
          const { error } = await supabase
            .from('ca_lignes')
            .insert({ ...data, user_id: userId })
          if (error) return { error: error.message }
          await get().fetchCALignes()
          return { error: null }
        } catch (e: unknown) {
          return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
        }
      },

      updateCALigne: async (id, data) => {
        try {
          const { error } = await supabase
            .from('ca_lignes')
            .update(data)
            .eq('id', id)
          if (error) return { error: error.message }
          set((s) => ({
            lignes: s.lignes.map((l) => l.id === id ? { ...l, ...data } : l),
          }))
          return { error: null }
        } catch (e: unknown) {
          return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
        }
      },

      deleteCALigne: async (id) => {
        try {
          const { error } = await supabase
            .from('ca_lignes')
            .delete()
            .eq('id', id)
          if (error) return { error: error.message }
          set((s) => ({ lignes: s.lignes.filter((l) => l.id !== id) }))
          return { error: null }
        } catch (e: unknown) {
          return { error: e instanceof Error ? e.message : 'Erreur inconnue' }
        }
      },
    }),
    {
      name: 'ca-store',
      partialize: (state) => ({ lignes: state.lignes }),
    }
  )
)

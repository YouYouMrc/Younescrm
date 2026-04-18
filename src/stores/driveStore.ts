import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type DocType = 'google-doc' | 'google-sheet' | 'figma' | 'video' | 'drive' | 'notion' | 'excel' | 'pdf' | 'lien'

export interface Doc {
  id: string
  nom: string
  url: string
  type: DocType
  created_at: string
}

interface DriveState {
  data: Record<string, Record<string, Doc[]>>
  addDoc: (projetId: string, dossier: string, doc: Omit<Doc, 'id' | 'created_at'>) => void
  removeDoc: (projetId: string, dossier: string, docId: string) => void
}

export const DOSSIERS_TEMPLATE = [
  '01_Brief',
  '02_Contenus',
  '03_Maquettes',
  '04_Intégrations',
  '05_Recette',
  '06_Livraison',
  '07_Maintenance',
]

export const useDriveStore = create<DriveState>()(
  persist(
    (set) => ({
      data: {},
      addDoc: (projetId, dossier, doc) =>
        set((s) => {
          const projData = s.data[projetId] ?? {}
          const folderDocs = projData[dossier] ?? []
          const newDoc: Doc = {
            ...doc,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
          }
          return {
            data: {
              ...s.data,
              [projetId]: { ...projData, [dossier]: [...folderDocs, newDoc] },
            },
          }
        }),
      removeDoc: (projetId, dossier, docId) =>
        set((s) => {
          const projData = s.data[projetId] ?? {}
          const folderDocs = (projData[dossier] ?? []).filter((d) => d.id !== docId)
          return {
            data: {
              ...s.data,
              [projetId]: { ...projData, [dossier]: folderDocs },
            },
          }
        }),
    }),
    { name: 'projet-drive' }
  )
)

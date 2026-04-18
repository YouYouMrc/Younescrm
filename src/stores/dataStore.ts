import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type {
  Lead, NewLead,
  Client, NewClient,
  Projet, NewProjet,
  Ressource, NewRessource,
  Activite,
  Invitation,
  WorkspaceMember,
} from '@/types'

interface DataState {
  leads: Lead[]
  clients: Client[]
  projets: Projet[]
  ressources: Ressource[]
  activites: Activite[]
  invitations: Invitation[]
  members: WorkspaceMember[]
  loading: boolean

  // Leads
  fetchLeads: () => Promise<void>
  createLead: (data: NewLead) => Promise<{ error: string | null }>
  bulkCreateLeads: (data: NewLead[]) => Promise<{ error: string | null; count: number }>
  updateLead: (id: string, data: Partial<Lead>) => Promise<{ error: string | null }>
  deleteLead: (id: string) => Promise<{ error: string | null }>

  // Clients
  fetchClients: () => Promise<void>
  createClient: (data: NewClient) => Promise<{ error: string | null }>
  updateClient: (id: string, data: Partial<Client>) => Promise<{ error: string | null }>
  deleteClient: (id: string) => Promise<{ error: string | null }>

  // Projets
  fetchProjets: () => Promise<void>
  createProjet: (data: NewProjet) => Promise<{ error: string | null }>
  updateProjet: (id: string, data: Partial<Projet>) => Promise<{ error: string | null }>
  deleteProjet: (id: string) => Promise<{ error: string | null }>

  // Ressources
  fetchRessources: () => Promise<void>
  createRessource: (data: NewRessource) => Promise<{ error: string | null }>
  updateRessource: (id: string, data: Partial<Ressource>) => Promise<{ error: string | null }>
  deleteRessource: (id: string) => Promise<{ error: string | null }>

  // Activités
  fetchActivites: () => Promise<void>
  addActivite: (texte: string, couleur?: string) => Promise<void>

  // Équipe
  fetchTeam: () => Promise<void>
  inviteMember: (email: string) => Promise<{ error: string | null; token?: string; emailError?: string | null }>
  removeMember: (memberId: string) => Promise<{ error: string | null }>
  cancelInvitation: (invitationId: string) => Promise<{ error: string | null }>

  // Chargement global
  fetchAll: () => Promise<void>
}

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export const useDataStore = create<DataState>()((set, get) => ({
  leads: [],
  clients: [],
  projets: [],
  ressources: [],
  activites: [],
  invitations: [],
  members: [],
  loading: false,

  // ── LEADS ──────────────────────────────────────────────────────────────────

  fetchLeads: async () => {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    set({ leads: (data as Lead[]) ?? [] })
  },

  createLead: async (data) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié' }
    const { error } = await supabase.from('leads').insert({ ...data, user_id: userId })
    if (error) return { error: error.message }
    await get().fetchLeads()
    await get().addActivite(`Nouveau lead : ${data.nom}`, '#3B82F6')
    return { error: null }
  },

  bulkCreateLeads: async (leads) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié', count: 0 }
    const rows = leads.map((l) => ({ ...l, user_id: userId }))
    // Insérer par batches de 50 pour éviter les limites Supabase
    const BATCH = 50
    let count = 0
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from('leads').insert(rows.slice(i, i + BATCH))
      if (error) return { error: error.message, count }
      count += Math.min(BATCH, rows.length - i)
    }
    await get().fetchLeads()
    await get().addActivite(`Import : ${count} leads ajoutés`, '#3B82F6')
    return { error: null, count }
  },

  updateLead: async (id, data) => {
    const { error } = await supabase.from('leads').update(data).eq('id', id)
    if (error) return { error: error.message }
    set((s) => ({ leads: s.leads.map((l) => l.id === id ? { ...l, ...data } : l) }))
    return { error: null }
  },

  deleteLead: async (id) => {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) return { error: error.message }
    set((s) => ({ leads: s.leads.filter((l) => l.id !== id) }))
    return { error: null }
  },

  // ── CLIENTS ────────────────────────────────────────────────────────────────

  fetchClients: async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    set({ clients: (data as Client[]) ?? [] })
  },

  createClient: async (data) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié' }
    const { error } = await supabase.from('clients').insert({ ...data, user_id: userId })
    if (error) return { error: error.message }
    await get().fetchClients()
    await get().addActivite(`Nouveau client : ${data.nom}`, '#3B82F6')
    return { error: null }
  },

  updateClient: async (id, data) => {
    const { error } = await supabase.from('clients').update(data).eq('id', id)
    if (error) return { error: error.message }
    set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...data } : c) }))
    return { error: null }
  },

  deleteClient: async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) return { error: error.message }
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }))
    return { error: null }
  },

  // ── PROJETS ────────────────────────────────────────────────────────────────

  fetchProjets: async () => {
    const { data } = await supabase.from('projets').select('*').order('created_at', { ascending: false })
    set({ projets: (data as Projet[]) ?? [] })
  },

  createProjet: async (data) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié' }
    const { error } = await supabase.from('projets').insert({ ...data, user_id: userId })
    if (error) return { error: error.message }
    await get().fetchProjets()
    await get().addActivite(`Nouveau projet : ${data.nom}`, '#3B82F6')
    return { error: null }
  },

  updateProjet: async (id, data) => {
    const { error } = await supabase.from('projets').update(data).eq('id', id)
    if (error) return { error: error.message }
    await get().fetchProjets()
    return { error: null }
  },

  deleteProjet: async (id) => {
    const { error } = await supabase.from('projets').delete().eq('id', id)
    if (error) return { error: error.message }
    set((s) => ({ projets: s.projets.filter((p) => p.id !== id) }))
    return { error: null }
  },

  // ── RESSOURCES ─────────────────────────────────────────────────────────────

  fetchRessources: async () => {
    const { data } = await supabase.from('ressources').select('*').order('created_at', { ascending: false })
    set({ ressources: (data as Ressource[]) ?? [] })
  },

  createRessource: async (data) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié' }
    const { error } = await supabase.from('ressources').insert({ ...data, user_id: userId })
    if (error) return { error: error.message }
    await get().fetchRessources()
    return { error: null }
  },

  updateRessource: async (id, data) => {
    const { error } = await supabase.from('ressources').update(data).eq('id', id)
    if (error) return { error: error.message }
    await get().fetchRessources()
    return { error: null }
  },

  deleteRessource: async (id) => {
    const { error } = await supabase.from('ressources').delete().eq('id', id)
    if (error) return { error: error.message }
    set((s) => ({ ressources: s.ressources.filter((r) => r.id !== id) }))
    return { error: null }
  },

  // ── ACTIVITÉS ──────────────────────────────────────────────────────────────

  fetchActivites: async () => {
    const { data } = await supabase
      .from('activites')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    set({ activites: (data as Activite[]) ?? [] })
  },

  addActivite: async (texte, couleur = '#2563EB') => {
    const userId = await getUserId()
    if (!userId) return
    await supabase.from('activites').insert({ texte, couleur, user_id: userId })
    await get().fetchActivites()
  },

  // ── ÉQUIPE ─────────────────────────────────────────────────────────────────

  fetchTeam: async () => {
    const userId = await getUserId()
    if (!userId) return

    // Membres que j'ai invités (je suis owner)
    const { data: asOwner } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('owner_id', userId)

    // Équipes que j'ai rejointes (je suis membre)
    const { data: asMember } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('member_id', userId)

    let membersWithProfiles: WorkspaceMember[] = []
    const allRelations = [...(asOwner ?? []), ...(asMember ?? [])]

    if (allRelations.length > 0) {
      // Collecter tous les IDs à afficher (l'autre personne dans chaque relation)
      const profileIds = new Set<string>()
      ;(asOwner ?? []).forEach((m: WorkspaceMember) => profileIds.add(m.member_id))
      ;(asMember ?? []).forEach((m: WorkspaceMember) => profileIds.add(m.owner_id))

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', [...profileIds])

      const profileMap: Record<string, unknown> = {}
      profilesData?.forEach((p) => { profileMap[p.id] = p })

      // Relations où je suis owner → afficher le profil du membre
      const fromOwner = (asOwner ?? []).map((m: WorkspaceMember) => ({
        ...m,
        profile: (profileMap[m.member_id] ?? null) as WorkspaceMember['profile'],
      }))

      // Relations où je suis membre → afficher le profil de l'owner
      const fromMember = (asMember ?? []).map((m: WorkspaceMember) => ({
        ...m,
        profile: (profileMap[m.owner_id] ?? null) as WorkspaceMember['profile'],
      }))

      membersWithProfiles = [...fromOwner, ...fromMember]
    }

    // Invitations envoyées
    const { data: invitesData } = await supabase
      .from('invitations')
      .select('*')
      .eq('from_user_id', userId)
      .order('created_at', { ascending: false })

    set({
      members: membersWithProfiles,
      invitations: (invitesData as Invitation[]) ?? [],
    })
  },

  inviteMember: async (email) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié' }

    // Récupérer le nom du workspace (profil de l'invitant)
    const { data: profile } = await supabase
      .from('profiles')
      .select('nom')
      .eq('id', userId)
      .single()

    const token = crypto.randomUUID()
    const workspaceName = profile?.nom ?? 'Mon espace de travail'

    const { error } = await supabase.from('invitations').insert({
      from_user_id: userId,
      to_email: email,
      token,
      status: 'pending',
      workspace_name: workspaceName,
    })

    if (error) return { error: error.message }

    // Appeler la Edge Function pour envoyer l'email d'invitation
    const inviteLink = `${window.location.origin}/auth?invite=${token}`
    let emailError: string | null = null
    try {
      const { error: fnError } = await supabase.functions.invoke('send-invitation', {
        body: {
          to_email: email,
          invite_link: inviteLink,
          from_name: workspaceName,
          workspace_name: workspaceName,
        },
      })
      if (fnError) {
        console.error('[send-invitation] Erreur:', fnError)
        emailError = fnError.message ?? 'Échec envoi email'
      }
    } catch (err) {
      console.error('[send-invitation] Exception:', err)
      emailError = 'Échec envoi email'
    }

    await get().fetchTeam()
    return { error: null, token, emailError }
  },

  removeMember: async (memberId) => {
    const userId = await getUserId()
    if (!userId) return { error: 'Non authentifié' }
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('owner_id', userId)
      .eq('member_id', memberId)
    if (error) return { error: error.message }
    await get().fetchTeam()
    return { error: null }
  },

  cancelInvitation: async (invitationId) => {
    const { error } = await supabase.from('invitations').delete().eq('id', invitationId)
    if (error) return { error: error.message }
    set((s) => ({ invitations: s.invitations.filter((i) => i.id !== invitationId) }))
    return { error: null }
  },

  // ── CHARGEMENT GLOBAL ──────────────────────────────────────────────────────

  fetchAll: async () => {
    set({ loading: true })
    await Promise.all([
      get().fetchLeads(),
      get().fetchClients(),
      get().fetchProjets(),
      get().fetchRessources(),
      get().fetchActivites(),
    ])
    set({ loading: false })
  },
}))

// ─── Constantes métier ──────────────────────────────────────────────────────

export const STAGES = [
  'Analyse & Benchmark',
  'Web design',
  'Intégration',
  'SEO',
  'Hébergement',
  'Mise en ligne',
  'Livré',
  'Maintenance',
  'Sécurité',
] as const

export const NICHES = [
  'Artisanat',
  'Architecture & Décoration',
  'Automobile',
  'Beauté & Bien-être',
  'BTP & Immobilier',
  'Coaches & Formateurs',
  'Commerce de proximité',
  'Créatifs & Artistes',
  'E-commerce',
  'Événementiel',
  'Food & Restauration',
  'Finance & Assurance',
  'Hôtellerie & Tourisme',
  'Informatique & Tech',
  'Juridique & Notarial',
  'Médias & Communication',
  'Mode & Luxe',
  'ONG & Associations',
  'Professions libérales',
  'Santé & Médical',
  'Services aux entreprises',
  'Sport & Outdoor',
] as const

export const SOURCES = [
  'Prospection',
  'Inbound',
  'LinkedIn',
  'Référence',
  'Réseaux sociaux',
  'Événement',
  'Cold email',
  'Partenaire',
] as const

export const STATUS_LEADS = [
  'À contacter',
  'Contacté',
  'En discussion',
  'Devis envoyé',
  'RDV fixé',
  'Négociation',
  'Gagné',
  'Perdu',
] as const

export const ACTIONS_CONTACT = [
  'Appel',
  'Email',
  'RDV',
  'WhatsApp',
  'Message',
] as const

export const STATUS_CLIENTS = [
  'Actif',
  'En pause',
  'Livré',
  'Archivé',
] as const

export type Stage = typeof STAGES[number]
export type Niche = typeof NICHES[number]
export type Source = typeof SOURCES[number]
export type StatusLead = typeof STATUS_LEADS[number]
export type StatusClient = typeof STATUS_CLIENTS[number]

// ─── Modèles de données ──────────────────────────────────────────────────────

export interface Lead {
  id: string
  user_id: string
  nom: string
  entreprise: string
  email: string
  telephone: string
  niche: string
  source: string
  score: number
  statut: string
  budget: number
  proba: number
  besoin: string
  prochain_contact: string | null
  type_action: string
  notes: string
  drive: string
  figma: string
  site: string
  meet?: string
  created_at: string
}

export interface Client {
  id: string
  user_id: string
  nom: string
  site: string
  niche: string
  secteur: string
  ca: number
  statut: string
  drive: string
  figma: string
  created_at: string
}

export interface Projet {
  id: string
  user_id: string
  nom: string
  client: string
  av: number
  stage: Stage
  statut: string
  ech: string
  drive: string
  figma: string
  github: string
  notion: string
  site: string
  created_at: string
}

export interface Ressource {
  id: string
  user_id: string
  nom: string
  type: string
  client: string
  url: string
  tags: string
  created_at: string
}

export interface Activite {
  id: string
  user_id: string
  texte: string
  couleur: string
  created_at: string
}

export interface Profile {
  id: string
  nom: string
  full_name?: string
  email?: string
  role: string
  avatar: string
  branding: BrandingConfig
}

export interface BrandingConfig {
  appName?: string
  appSubtitle?: string
  iconType?: string
  logoImage?: string
  logoBgColor?: string
  accentColor?: string
  theme?: string
  onboardingCompleted?: boolean
  siteObjectif?: string
  // Gmail OAuth2
  gmailRefreshToken?: string
  gmailEmail?: string
  gmailName?: string
}

export interface EmailMessage {
  id: string
  user_id: string
  client_id: string | null
  client_email: string
  client_name: string
  direction: 'sent' | 'received'
  subject: string
  body: string
  gmail_id: string | null
  read: boolean
  created_at: string
}

export type NewEmailMessage = Omit<EmailMessage, 'id' | 'user_id' | 'created_at'>

export interface Invitation {
  id: string
  from_user_id: string
  to_email: string
  token: string
  status: 'pending' | 'accepted' | 'declined'
  workspace_name: string
  created_at: string
}

export interface MemberPermissions {
  leads: boolean
  prospects: boolean
  clients: boolean
  projets: boolean
  ressources: boolean
}

export const DEFAULT_PERMISSIONS: MemberPermissions = {
  leads: true,
  prospects: true,
  clients: true,
  projets: true,
  ressources: true,
}

export interface WorkspaceMember {
  id: string
  owner_id: string
  member_id: string
  role: string
  created_at: string
  profile?: Profile
  permissions: MemberPermissions
}

export interface CALigne {
  id: string
  user_id: string
  client_id: string
  label: string
  type: 'maintenance' | 'hebergement' | 'plugin' | 'devis' | 'prestation' | 'autre'
  montant: number
  periodicite: 'mensuel' | 'annuel' | 'unique'
  statut: 'payé' | 'en attente' | 'impayé'
  date_echeance: string | null
  notes: string
  created_at: string
}

// ─── Helpers de types ────────────────────────────────────────────────────────

export type NewLead = Omit<Lead, 'id' | 'user_id' | 'created_at'>
export type NewClient = Omit<Client, 'id' | 'user_id' | 'created_at'>
export type NewProjet = Omit<Projet, 'id' | 'user_id' | 'created_at'>
export type NewRessource = Omit<Ressource, 'id' | 'user_id' | 'created_at'>
export type NewCALigne = Omit<CALigne, 'id' | 'user_id' | 'created_at'>

import { useLocation } from 'react-router-dom'
import { getAvatarUrl } from '@/utils/avatar'
import { Bell, Sun, Moon, PanelLeft, LayoutDashboard, Target, Crosshair, Briefcase, FolderKanban, Columns2, Link2, TrendingUp, DollarSign, Users, BarChart2, Settings, Mail } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { useTheme } from '@/hooks/useTheme'
import { useState, useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'
import GlobalSearch from '@/components/ui/GlobalSearch'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/leads':            'Leads',
  '/prospects':        'Prospects',
  '/clients':          'Clients',
  '/projets':          'Projets',
  '/stages':           'Étapes projets',
  '/ressources':       'Ressources',
  '/pipeline':         'Pipeline CRM',
  '/chiffre-affaire':  "Chiffre d'affaire",
  '/team':             'Mon équipe',
  '/rapports':         'Rapports',
  '/parametres':       'Paramètres',
  '/emails':           'Emails',
}

const PAGE_SUBTITLES: Record<string, string> = {
  '/dashboard':        "Vue d'ensemble de ton activité",
  '/leads':            'Gère tes contacts entrants',
  '/prospects':        'Suivi des opportunités',
  '/clients':          'Tes clients actifs et archivés',
  '/projets':          'Projets en production',
  '/stages':           'Kanban par étapes de production',
  '/ressources':       'Liens et fichiers importants',
  '/pipeline':         'Visualisation du tunnel de vente',
  '/chiffre-affaire':  'Vue complète des revenus, coûts et résultats',
  '/team':             'Membres et invitations',
  '/rapports':         'Analytics et statistiques',
  '/parametres':       'Préférences et configuration',
  '/emails':           'Envoie et reçois des emails clients',
}

const PAGE_ICONS: Record<string, LucideIcon> = {
  '/dashboard':        LayoutDashboard,
  '/leads':            Target,
  '/prospects':        Crosshair,
  '/clients':          Briefcase,
  '/projets':          FolderKanban,
  '/stages':           Columns2,
  '/ressources':       Link2,
  '/pipeline':         TrendingUp,
  '/chiffre-affaire':  DollarSign,
  '/team':             Users,
  '/rapports':         BarChart2,
  '/parametres':       Settings,
  '/emails':           Mail,
}

interface TopbarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { pathname } = useLocation()
  const { profile } = useAuthStore()
  const { leads, activites } = useDataStore()
  const { theme, toggleTheme } = useTheme()

  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const title    = PAGE_TITLES[pathname]    ?? 'CRM'
  const subtitle = PAGE_SUBTITLES[pathname] ?? ''
  const PageIcon = PAGE_ICONS[pathname]     ?? null

  const todayStr   = new Date().toISOString().split('T')[0]
  const todayLeads = leads.filter(l => l.prochain_contact?.startsWith(todayStr))
  const notifCount = todayLeads.length

  const firstName = profile?.nom?.split(' ')[0] ?? ''
  const initials  = profile?.nom?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? 'U'

  const today = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 58,
      background: 'var(--surface1)',
      borderBottom: '2px solid var(--accent)',
      flexShrink: 0, gap: 12,
      position: 'sticky', top: 0, zIndex: 40,
    }}>

      {/* ── LEFT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>

        {/* Toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          aria-label="Réduire le menu"
          style={{
            width: 32, height: 32, borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text1)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)' }}
        >
          <PanelLeft size={16} />
        </button>

        {/* Separateur vertical */}
        <div style={{ width: 1, height: 20, background: 'var(--border2)', flexShrink: 0 }} />

        {/* Page identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {PageIcon && (
            <PageIcon size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700, fontSize: 14,
              color: 'var(--text1)', margin: 0, lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{
                fontSize: 10.5, color: 'var(--text3)', margin: 0,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Date pill */}
        <div style={{
          display: 'none',
          alignItems: 'center', gap: 5,
          padding: '4px 10px', borderRadius: 999,
          background: 'var(--surface2)',
          border: '1px solid var(--border1)',
        }} className="md:flex">
          <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{today}</span>
        </div>

        {/* Search */}
        <GlobalSearch />

        {/* Theme */}
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid var(--border1)',
            background: 'var(--surface2)',
            color: 'var(--text2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Notifs */}
        <div style={{ position: 'relative', flexShrink: 0 }} ref={notifRef}>
          <button
            onClick={() => setShowNotifs(s => !s)}
            aria-label={`Notifications${notifCount > 0 ? ` — ${notifCount} aujourd'hui` : ''}`}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--border1)',
              background: showNotifs ? 'var(--surface3)' : 'var(--surface2)',
              color: 'var(--text2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', position: 'relative',
            }}
          >
            <Bell size={14} />
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -5,
                minWidth: 16, height: 16, borderRadius: 999,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                border: '1.5px solid var(--surface1)',
              }}>
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div style={{
              position: 'absolute', right: 0, top: 40,
              width: 296, borderRadius: 14,
              background: 'var(--surface1)',
              border: '1px solid var(--border2)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
              overflow: 'hidden', zIndex: 50,
            }}>
              <div style={{
                padding: '12px 14px 10px',
                borderBottom: '1px solid var(--border1)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text1)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  Notifications
                </span>
                {notifCount > 0 && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(59,130,246,0.12)', color: 'var(--accent)', fontWeight: 600,
                  }}>
                    {notifCount} ce jour
                  </span>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {todayLeads.length > 0 && (
                  <div>
                    <p style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', margin: 0 }}>
                      ACTIONS DU JOUR
                    </p>
                    {todayLeads.map(l => (
                      <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nom}</p>
                          <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>{l.type_action} · {l.entreprise}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activites.slice(0, 4).length > 0 && (
                  <div>
                    <p style={{ padding: '10px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', margin: 0 }}>
                      ACTIVITÉ RÉCENTE
                    </p>
                    {activites.slice(0, 4).map(a => (
                      <div key={a.id} style={{ display: 'flex', gap: 10, padding: '6px 14px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.couleur, flexShrink: 0, marginTop: 4 }} />
                        <p style={{ fontSize: 11, color: 'var(--text1)', margin: 0, lineHeight: 1.5 }}>{a.texte}</p>
                      </div>
                    ))}
                  </div>
                )}
                {todayLeads.length === 0 && activites.length === 0 && (
                  <div style={{ padding: '28px 14px', textAlign: 'center' }}>
                    <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0 }}>Aucune notification</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border2)', margin: '0 2px', flexShrink: 0 }} />

        {/* User chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '4px 10px 4px 4px',
          borderRadius: 999,
          border: '1px solid var(--border1)',
          background: 'var(--surface2)',
          cursor: 'default', flexShrink: 0,
        }}>
          <img
            src={profile?.avatar ?? getAvatarUrl(profile?.nom ?? profile?.full_name ?? 'user')}
            alt={profile?.nom ?? 'avatar'}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface2)' }}
          />
          {firstName && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)', whiteSpace: 'nowrap' }}>
              {firstName}
            </span>
          )}
        </div>

      </div>
    </header>
  )
}

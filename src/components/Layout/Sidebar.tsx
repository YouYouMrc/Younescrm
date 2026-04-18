import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Briefcase, FolderKanban,
  TrendingUp, BookMarked, Euro, LogOut, UserCircle,
  ChevronRight, BarChart2, Mail, CalendarDays,
} from 'lucide-react'
import { useEmailStore } from '@/stores/emailStore'
import { getAvatarUrl } from '@/utils/avatar'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import ProfileModal from '@/components/branding/ProfileModal'
import BrandingModal from '@/components/branding/BrandingModal'
import AppLogo from '@/components/ui/AppLogo'

const NAV_ITEMS = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads',           icon: Users,           label: 'Leads & Prospects' },
  { to: '/clients',         icon: Briefcase,       label: 'Clients' },
  { to: '/projets',         icon: FolderKanban,    label: 'Projets' },
  { to: '/pipeline',        icon: TrendingUp,      label: 'Pipeline CRM' },
  { to: '/emails',          icon: Mail,            label: 'Emails' },
  { to: '/calendrier',      icon: CalendarDays,    label: 'Calendrier' },
  { to: '/ressources',      icon: BookMarked,      label: 'Ressources' },
  { to: '/chiffre-affaire', icon: Euro,            label: "Chiffre d'affaire" },
  { to: '/team',            icon: Users,           label: 'Mon équipe' },
]

interface SidebarProps {
  collapsed: boolean
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const { profile, signOut } = useAuthStore()
  const { messages } = useEmailStore()
  const unreadEmails = messages.filter(m => !m.read && m.direction === 'received').length
  const navigate = useNavigate()
  const [showProfile, setShowProfile] = useState(false)
  const [showBranding, setShowBranding] = useState(false)

  const branding = profile?.branding ?? {}
  const appName = branding.appName ?? 'Younes'
  const accentColor = branding.accentColor ?? 'var(--accent)'
  const initials = profile?.nom
    ? profile.nom.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'YC'

  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    // Naviguer immédiatement sans attendre la réponse réseau
    navigate('/auth', { replace: true })
    // Déconnecter en arrière-plan
    signOut().finally(() => setSigningOut(false))
  }

  const w = collapsed ? 'w-14' : 'w-60'

  return (
    <>
      <aside
        className={`flex flex-col h-full ${w} shrink-0 border-r transition-all duration-200`}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-3 py-4 border-b cursor-pointer group overflow-hidden"
          style={{ borderColor: 'var(--sidebar-border)' }}
          onClick={() => setShowBranding(true)}
          title={collapsed ? appName : undefined}
        >
          <div className="flex items-center justify-center flex-shrink-0">
            {branding.logoImage ? (
              <img src={branding.logoImage} alt="logo" className="w-9 h-9 object-cover rounded-xl" />
            ) : (
              <AppLogo size={36} />
            )}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-syne font-bold text-sm truncate" style={{ color: 'var(--sidebar-text-active)' }}>{appName}</p>
              {branding.appSubtitle && (
                <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>{branding.appSubtitle}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            >
              {({ isActive }) => (
                <>
                  <div className="relative shrink-0">
                    <Icon size={16} className="sidebar-icon" />
                    {to === '/emails' && unreadEmails > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--accent)', fontSize: 8, color: '#fff', fontWeight: 700 }}>
                        {unreadEmails > 9 ? '9+' : unreadEmails}
                      </span>
                    )}
                  </div>
                  {!collapsed && <span className="truncate flex-1">{label}</span>}
                  {!collapsed && isActive && to !== '/emails' && <ChevronRight size={12} className="ml-auto shrink-0 opacity-40" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile + logout */}
        <div className="border-t px-2 py-3 flex flex-col gap-1" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button
            onClick={() => setShowProfile(true)}
            title={collapsed ? (profile?.nom ?? 'Profil') : undefined}
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg w-full text-left transition-colors group ${collapsed ? 'justify-center' : ''}`}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-active-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <img
                src={getAvatarUrl(profile?.nom ?? profile?.full_name ?? 'user')}
                alt="avatar"
                className="w-7 h-7 rounded-full flex-shrink-0"
                style={{ background: 'var(--surface2)' }}
              />
            )}
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--sidebar-text-active)' }}>{profile?.nom ?? 'Profil'}</p>
                  {profile?.role && <p className="text-xs truncate" style={{ color: 'var(--sidebar-text)' }}>{profile.role}</p>}
                </div>
                <UserCircle size={14} className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity text-text2" />
              </>
            )}
          </button>

          {!collapsed && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 px-2 py-2 rounded-lg text-sm w-full text-left transition-colors disabled:opacity-50"
              style={{ color: 'var(--sidebar-text)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-active-bg)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {signingOut
                ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <LogOut size={14} />
              }
              <span>{signingOut ? 'Déconnexion…' : 'Déconnexion'}</span>
            </button>
          )}
        </div>
      </aside>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showBranding && <BrandingModal onClose={() => setShowBranding(false)} />}
    </>
  )
}

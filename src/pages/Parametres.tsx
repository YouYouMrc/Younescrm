import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { Sun, Moon, LogOut, User, Palette, KeyRound, Trash2, Check } from 'lucide-react'
import ProfileModal from '@/components/branding/ProfileModal'
import BrandingModal from '@/components/branding/BrandingModal'

export default function Parametres() {
  const { profile, signOut } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const [showProfile, setShowProfile] = useState(false)
  const [showBranding, setShowBranding] = useState(false)
  const [serperKey, setSerperKey] = useState(() => localStorage.getItem('serper_api_key') ?? '')
  const [serperSaved, setSerperSaved] = useState(false)

  function saveSerperKey() {
    localStorage.setItem('serper_api_key', serperKey.trim())
    setSerperSaved(true)
    setTimeout(() => setSerperSaved(false), 2000)
  }

  function clearSerperKey() {
    localStorage.removeItem('serper_api_key')
    setSerperKey('')
  }

  const sections = [
    {
      title: 'Profil',
      items: [
        {
          icon: User,
          label: 'Modifier le profil',
          sub: profile?.nom ?? 'Non défini',
          action: () => setShowProfile(true),
          btn: 'Modifier',
        },
        {
          icon: Palette,
          label: 'Branding & Thème',
          sub: "Nom de l'app, couleur accent, logo",
          action: () => setShowBranding(true),
          btn: 'Personnaliser',
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl">
      {sections.map((section) => (
        <div key={section.title} className="card flex flex-col gap-4">
          <h2 className="font-syne font-bold text-sm text-text1">{section.title}</h2>
          {section.items.map(({ icon: Icon, label, sub, action, btn }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface2)' }}>
                  <Icon size={15} style={{ color: 'var(--text2)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text1">{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>{sub}</p>
                </div>
              </div>
              <button onClick={action} className="btn-secondary text-xs shrink-0">{btn}</button>
            </div>
          ))}
        </div>
      ))}

      {/* Apparence */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-syne font-bold text-sm text-text1">Apparence</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface2)' }}>
              {theme === 'dark' ? <Moon size={15} style={{ color: 'var(--text2)' }} /> : <Sun size={15} style={{ color: 'var(--text2)' }} />}
            </div>
            <div>
              <p className="text-sm font-medium text-text1">Thème</p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{theme === 'dark' ? 'Mode sombre actif' : 'Mode clair actif'}</p>
            </div>
          </div>
          <button onClick={toggleTheme} className="btn-secondary text-xs shrink-0">
            {theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
          </button>
        </div>
      </div>

      {/* Clés API */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-syne font-bold text-sm text-text1">Clés API</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--surface2)' }}>
              <KeyRound size={15} style={{ color: 'var(--text2)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text1 mb-1">Clé Serper (Lead Finder)</p>
              <input
                type="password"
                value={serperKey}
                onChange={(e) => setSerperKey(e.target.value)}
                placeholder="Colle ta clé Serper ici…"
                className="w-full"
                style={{ fontSize: 12 }}
              />
            </div>
          </div>
          <div className="flex gap-2 ml-10">
            <button onClick={saveSerperKey} className="btn-primary text-xs justify-center gap-1.5">
              {serperSaved ? <><Check size={12} /> Sauvegardé</> : 'Sauvegarder'}
            </button>
            {serperKey && (
              <button onClick={clearSerperKey} className="btn-secondary text-xs gap-1.5">
                <Trash2 size={12} /> Supprimer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compte */}
      <div className="card flex flex-col gap-4">
        <h2 className="font-syne font-bold text-sm text-text1">Compte</h2>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#3D1A10' }}>
              <LogOut size={15} style={{ color: '#3B82F6' }} />
            </div>
            <div>
              <p className="text-sm font-medium text-text1">Se déconnecter</p>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{profile?.nom ?? 'Mon compte'}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
            style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--accent)' }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showBranding && <BrandingModal onClose={() => setShowBranding(false)} />}
    </div>
  )
}

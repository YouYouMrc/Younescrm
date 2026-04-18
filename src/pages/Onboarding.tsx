import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import AppLogo from '@/components/ui/AppLogo'

const OBJECTIFS = [
  {
    id: 'leads',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Générer des leads',
    desc: 'Capturer des contacts qualifiés et alimenter votre pipeline commercial.',
  },
  {
    id: 'vente',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
    title: 'Vendre en ligne',
    desc: 'Présenter vos offres et convertir vos visiteurs en clients.',
  },
  {
    id: 'vitrine',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
      </svg>
    ),
    title: "Présenter une activité",
    desc: "Valoriser votre expertise et renforcer votre crédibilité en ligne.",
  },
  {
    id: 'autre',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
      </svg>
    ),
    title: 'Autre',
    desc: "Un projet spécifique ? On s'adapte à votre contexte.",
  },
]

const THEMES = [
  {
    id: 'light',
    label: 'Clair',
    desc: 'Épuré, aéré, professionnel',
    preview: { bg: '#FFFFFF', surface: '#F3F4F6', accent: '#323E83', text: '#111827' },
  },
  {
    id: 'dark',
    label: 'Sombre',
    desc: 'Moderne, contrasté, immersif',
    preview: { bg: '#1A1A2E', surface: '#252540', accent: '#3B82F6', text: '#F3F4F6' },
  },
  {
    id: 'noir',
    label: 'Noir',
    desc: 'Premium, élégant, exclusif',
    preview: { bg: '#0A0A0A', surface: '#141414', accent: '#8A9BD4', text: '#FFFFFF' },
  },
]

const COLORS = [
  { label: 'Violet',  value: '#323E83' },
  { label: 'Indigo',  value: '#323E83' },
  { label: 'Bleu',    value: '#2563EB' },
  { label: 'Cyan',    value: '#0891B2' },
  { label: 'Vert',    value: '#059669' },
  { label: 'Ambre',   value: '#D97706' },
  { label: 'Orange',  value: '#EA580C' },
  { label: 'Rose',    value: '#E11D48' },
]

const STEP_SLIDES = [
  {
    step: '01',
    title: 'Bienvenue dans votre espace.',
    sub: 'Tout commence ici.',
    color: 'from-[#1A2260] to-[#323E83]',
  },
  {
    step: '02',
    title: 'Définissez votre cap.',
    sub: "On s'adapte à votre vision.",
    color: 'from-[#1A2260] to-[#2A3880]',
  },
  {
    step: '03',
    title: 'Votre identité, votre espace.',
    sub: 'Personnalisez en un clic.',
    color: 'from-[#151C55] to-[#232F78]',
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { updateBranding, profile } = useAuthStore()

  const [step, setStep] = useState(0)
  const [animDir, setAnimDir] = useState<'in' | 'out'>('in')
  const [objectif, setObjectif] = useState('')
  const [theme, setTheme] = useState('dark')
  const [accentColor, setAccentColor] = useState(profile?.branding?.accentColor ?? '#323E83')
  const [loading, setLoading] = useState(false)

  const goTo = (next: number) => {
    setAnimDir('out')
    setTimeout(() => {
      setStep(next)
      setAnimDir('in')
    }, 200)
  }

  const handleColorPick = (color: string) => {
    setAccentColor(color)
    document.documentElement.style.setProperty('--accent', color)
  }

  const handleFinish = async () => {
    setLoading(true)
    const themeKey = theme === 'noir' ? 'dark' : theme
    localStorage.setItem('theme', themeKey)
    document.documentElement.setAttribute('data-theme', themeKey)
    await updateBranding({
      ...(profile?.branding ?? {}),
      accentColor,
      theme,
      siteObjectif: objectif,
      onboardingCompleted: true,
    })
    setLoading(false)
    navigate('/dashboard', { replace: true })
  }

  const slide = STEP_SLIDES[step]

  return (
    <div className="min-h-screen grid lg:grid-cols-[420px_1fr]" style={{ background: '#F8F7FF' }}>

      {/* ── LEFT PANEL ── */}
      <div
        className={`hidden lg:flex flex-col justify-between px-10 py-12 relative overflow-hidden bg-gradient-to-br ${slide.color}`}
        style={{ transition: 'background 0.5s ease' }}
      >
        {/* Grid subtle */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow */}
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <AppLogo size={18} color="white" />
          </div>
          <span className="font-syne font-bold text-sm text-white/80">Younes</span>
        </div>

        {/* Steps list */}
        <div className="relative flex flex-col gap-5">
          {STEP_SLIDES.map((s, i) => (
            <div key={i} className="flex items-start gap-4 transition-all duration-300"
              style={{ opacity: i === step ? 1 : 0.3 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-syne font-bold text-xs transition-all"
                style={{
                  background: i === step ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: `1.5px solid ${i === step ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  color: i === step ? 'white' : 'rgba(255,255,255,0.4)',
                }}>
                {i < step ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                ) : s.step}
              </div>
              <div>
                <p className="font-syne font-bold text-sm" style={{ color: i === step ? 'white' : 'rgba(255,255,255,0.4)' }}>{s.title}</p>
                <p className="text-xs mt-0.5" style={{ color: i === step ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="relative text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Configuration rapide · Moins de 2 minutes
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex flex-col justify-between px-8 py-10 bg-white">
        {/* Top mobile logo */}
        <div className="flex items-center justify-between mb-8 lg:mb-0">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#323E83' }}>
              <AppLogo size={16} color="white" />
            </div>
            <span className="font-syne font-bold text-sm" style={{ color: '#1A2260' }}>Younes</span>
          </div>
          {/* Mobile step indicator */}
          <div className="flex items-center gap-2 lg:hidden">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === step ? 24 : 8, background: i === step ? '#323E83' : '#E5E7EB' }} />
            ))}
          </div>
        </div>

        {/* Step content */}
        <div
          className="flex-1 flex flex-col justify-center w-full max-w-lg mx-auto"
          style={{
            opacity: animDir === 'in' ? 1 : 0,
            transform: animDir === 'in' ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}
        >
          {/* ── STEP 0 — Welcome ── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-medium"
                  style={{ background: '#EEF0FB', color: '#323E83', border: '1px solid #E8EBFA' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#323E83' }} />
                  Nouvelle session
                </div>
                <h1 className="font-syne font-bold mb-3" style={{ fontSize: 34, color: '#0C1929', lineHeight: 1.1 }}>
                  Bienvenue sur<br />
                  <span style={{ color: '#323E83' }}>Younes.</span>
                </h1>
                <p className="text-base leading-relaxed" style={{ color: '#6B7280', maxWidth: 400 }}>
                  Votre espace de travail vous attend. En quelques secondes, on configure tout selon vos besoins — rien à installer, rien à paramétrer manuellement.
                </p>
              </div>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2">
                {['CRM & Pipeline', 'Projets Kanban', 'Gestion d\'équipe', 'Rapports'].map(f => (
                  <span key={f} className="text-xs px-3 py-1.5 rounded-full font-medium"
                    style={{ background: '#EEF0FB', color: '#323E83', border: '1px solid #E8EBFA' }}>
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={() => goTo(1)}
                className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] w-full"
                style={{ background: '#323E83', boxShadow: '0 8px 24px rgba(50,62,131,0.3)' }}
              >
                Commencer la configuration
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {/* ── STEP 1 — Objectif ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#3B82F6' }}>Étape 1 sur 2</p>
                <h1 className="font-syne font-bold mb-2 whitespace-nowrap" style={{ fontSize: 20, color: '#0C1929' }}>
                  Quel est l'objectif principal de votre site&nbsp;?
                </h1>
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  On adapte votre espace de travail en fonction de ce que vous construisez.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {OBJECTIFS.map(opt => {
                  const selected = objectif === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setObjectif(opt.id)}
                      className="flex flex-col items-start gap-3 p-4 rounded-xl text-left transition-all duration-200 hover:scale-[1.01]"
                      style={{
                        background: selected ? '#EEF0FB' : '#FAFAFA',
                        border: `1.5px solid ${selected ? '#323E83' : '#E5E7EB'}`,
                        boxShadow: selected ? '0 0 0 4px rgba(59,130,246,0.08)' : 'none',
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: selected ? '#E8EBFA' : '#F3F4F6', color: selected ? '#323E83' : '#9CA3AF' }}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-1" style={{ color: selected ? '#323E83' : '#111827' }}>{opt.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{opt.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={() => goTo(0)}
                  className="py-3 px-5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50"
                  style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
                  Retour
                </button>
                <button
                  onClick={() => goTo(2)}
                  disabled={!objectif}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ background: '#323E83' }}
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2 — Style ── */}
          {step === 2 && (
            <div className="flex flex-col gap-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#3B82F6' }}>Étape 2 sur 2</p>
                <h1 className="font-syne font-bold mb-2 whitespace-nowrap" style={{ fontSize: 20, color: '#0C1929' }}>
                  Définissez l'identité visuelle de votre espace.
                </h1>
              </div>

              {/* Theme selection */}
              <div>
                <p className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>
                  Quel mode d'affichage correspond à votre univers ?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {THEMES.map(t => {
                    const selected = theme === t.id
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="flex flex-col gap-3 p-3.5 rounded-xl text-left transition-all duration-200"
                        style={{
                          border: `1.5px solid ${selected ? '#323E83' : '#E5E7EB'}`,
                          background: selected ? '#EEF0FB' : '#FAFAFA',
                          boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.1)' : 'none',
                        }}
                      >
                        {/* Mini preview */}
                        <div className="w-full h-14 rounded-lg overflow-hidden" style={{ background: t.preview.bg, border: '1px solid rgba(0,0,0,0.06)' }}>
                          <div className="h-3 w-full flex items-center px-2 gap-1" style={{ background: t.preview.surface }}>
                            {[0,1,2].map(d => <div key={d} className="w-1 h-1 rounded-full" style={{ background: t.preview.accent, opacity: 0.7 }} />)}
                          </div>
                          <div className="p-2 flex flex-col gap-1">
                            <div className="h-1.5 rounded-full w-3/4" style={{ background: t.preview.text, opacity: 0.15 }} />
                            <div className="h-1.5 rounded-full w-1/2" style={{ background: t.preview.text, opacity: 0.1 }} />
                            <div className="mt-1 h-2 w-8 rounded" style={{ background: t.preview.accent, opacity: 0.8 }} />
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold text-xs" style={{ color: selected ? '#323E83' : '#111827' }}>{t.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{t.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Color selection */}
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#374151' }}>
                  Quelle couleur incarne le mieux votre marque ?
                </p>
                <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>
                  Cette teinte sera appliquée à vos boutons, accents et éléments clés. Modifiable à tout moment depuis vos paramètres.
                </p>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {COLORS.map(c => {
                    const selected = accentColor === c.value
                    return (
                      <button
                        key={c.value}
                        title={c.label}
                        onClick={() => handleColorPick(c.value)}
                        className="w-9 h-9 rounded-full transition-all duration-200 hover:scale-110"
                        style={{
                          background: c.value,
                          boxShadow: selected
                            ? `0 0 0 3px white, 0 0 0 5px ${c.value}`
                            : '0 2px 6px rgba(0,0,0,0.15)',
                          transform: selected ? 'scale(1.15)' : 'scale(1)',
                        }}
                      >
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="mx-auto">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => goTo(1)}
                  className="py-3 px-5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50"
                  style={{ border: '1.5px solid #E5E7EB', color: '#6B7280' }}>
                  Retour
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ background: accentColor, boxShadow: `0 8px 24px ${accentColor}44` }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Configuration…
                    </>
                  ) : 'Accéder à mon espace →'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop step dots */}
        <div className="hidden lg:flex items-center justify-center gap-2 mt-6">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: i === step ? 28 : 8, background: i === step ? '#323E83' : '#E5E7EB' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

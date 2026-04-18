import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Briefcase, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import AppLogo from '@/components/ui/AppLogo'

type AuthMode = 'login' | 'register' | 'reset' | 'verify'

// ─── SVG logos des outils ───────────────────────────────────────────
function FigmaLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 38 57" fill="none">
      <path d="M19 28.5A9.5 9.5 0 1 1 28.5 19 9.5 9.5 0 0 1 19 28.5z" fill="#1ABCFE"/>
      <path d="M9.5 57A9.5 9.5 0 0 0 19 47.5V38H9.5a9.5 9.5 0 0 0 0 19z" fill="#0ACF83"/>
      <path d="M9.5 38H19V19H9.5a9.5 9.5 0 0 0 0 19z" fill="#A259FF"/>
      <path d="M9.5 19H19V0H9.5a9.5 9.5 0 0 0 0 19z" fill="#F24E1E"/>
      <path d="M19 0h9.5a9.5 9.5 0 0 1 0 19H19V0z" fill="#FF7262"/>
    </svg>
  )
}

function NotionLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="18" fill="white"/>
      <path d="M22 18.4c3.3 2.7 4.6 2.5 10.8 2.1l58.6-3.5c1.2 0 .2-1.2-.2-1.4l-9.8-7.1c-1.9-1.4-4.4-3.1-9.2-2.7L15.6 9.5c-2 .2-2.4 1.2-1.6 2z" fill="#fff"/>
      <path d="M25.3 27.7V85c0 3 1.5 4.1 4.9 3.9l64.2-3.7c3.4-.2 4.3-2.3 4.3-4.8V24.1c0-2.4-1-3.7-3.2-3.5l-67 3.9c-2.4.2-3.2 1.4-3.2 3.2z" fill="#fff"/>
      <path d="M64.5 26.5l-28.2 1.7c-1.9.1-2.4 1.2-2.4 2.6v45.8c0 1.6.6 2.4 2 2.3l30.4-1.8c1.6-.1 2.2-1 2.2-2.5V29c0-1.6-.8-2.6-4-2.5z" fill="#EDEAE9"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M36.3 35.5c-.5-.7-.3-1.6.4-2l9.6-1.4c1.3-.2 1.8.5 1.3 1.5L35.3 57.4c-.5 1-.1 1.8 1 1.7l20.2-1.2c.9-.1 1.4-1 1.4-2.1V35.6c0-.9-.6-1.5-1.4-1.5l-8.4.5c-.8 0-1.3.6-1.3 1.4v15.8l-10.5-16.3z" fill="#37352F"/>
    </svg>
  )
}

function GitHubLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

function GoogleDocsLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.727 0H3.273A1.636 1.636 0 0 0 1.636 1.636v20.728A1.636 1.636 0 0 0 3.273 24h17.454a1.636 1.636 0 0 0 1.637-1.636V7.636L14.727 0z" fill="#4285F4"/>
      <path d="M14.727 0v6H22.364L14.727 0z" fill="#85B4F7" fillOpacity=".6"/>
      <rect x="6" y="12" width="12" height="1.5" rx=".75" fill="white"/>
      <rect x="6" y="15" width="12" height="1.5" rx=".75" fill="white"/>
      <rect x="6" y="18" width="8" height="1.5" rx=".75" fill="white"/>
    </svg>
  )
}

function SlackLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
    </svg>
  )
}

function LinearLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <rect width="100" height="100" rx="20" fill="#5E6AD2"/>
      <path d="M16.08 57.72L42.29 83.93C27.63 80.56 16.44 69.36 16.08 57.72Z" fill="white"/>
      <path d="M15 48.77L51.24 85C49.07 85.18 46.86 85.18 44.64 84.94L15.06 55.36C14.82 53.16 14.82 50.96 15 48.77Z" fill="white"/>
      <path d="M17.16 39.62L60.4 82.88C58.57 83.54 56.67 84.05 54.73 84.42L15.58 45.28C15.95 43.33 16.46 41.43 17.16 39.62Z" fill="white"/>
      <path d="M21.07 32.13L67.86 78.93C66.3 79.97 64.65 80.87 62.93 81.62L18.38 37.07C19.13 35.35 20.03 33.69 21.07 32.13Z" fill="white"/>
      <path d="M27.19 25.5C41.71 11.51 63.91 10.82 79.23 23.65L23.65 79.24C10.81 63.91 11.5 41.7 27.19 25.5Z" fill="white"/>
    </svg>
  )
}

// ─── Slide 1 — Pipeline CRM ─────────────────────────────────────────
function Slide1() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
      {/* Revenue card */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', animation: 'float-up 0.5s ease both' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/50 font-medium">Pipeline Commercial</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}>+18% ce mois</span>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="font-bold text-3xl text-white font-syne">12 400 €</span>
        </div>
        {[
          { label: 'Leads chauds', val: 8, color: '#3B82F6', w: 75 },
          { label: 'Devis envoyés', val: 5, color: '#3B82F6', w: 55 },
          { label: 'Clients signés', val: 3, color: '#3B82F6', w: 35 },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-3 mb-2">
            <span className="text-xs w-24 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${r.w}%`, background: r.color }} />
            </div>
            <span className="text-xs font-semibold text-white/60 w-3">{r.val}</span>
          </div>
        ))}
      </div>

      {/* Actions card */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', animation: 'float-up 0.5s ease 0.1s both' }}>
        <p className="text-xs font-semibold text-white/70 mb-3">Prochaines actions · Aujourd'hui</p>
        {[
          { nom: 'Salon Élégance', action: 'Appel', heure: '10h00', color: '#3B82F6' },
          { nom: 'Tech Solutions', action: 'RDV demo', heure: '14h30', color: '#3B82F6' },
          { nom: 'BTP Renov', action: 'Devis', heure: '16h00', color: '#3B82F6' },
        ].map((a) => (
          <div key={a.nom} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }} />
              <span className="text-xs text-white/80">{a.nom}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: `${a.color}20`, color: a.color }}>{a.action}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{a.heure}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Slide 2 — Intégrations ─────────────────────────────────────────
function Slide2() {
  const tools = [
    { Logo: FigmaLogo,      name: 'Figma',        bg: '#1C1C1C', pos: { top: '8%',  left: '5%' },  delay: '0s' },
    { Logo: NotionLogo,     name: 'Notion',       bg: '#1C1C1C', pos: { top: '8%',  right: '5%' }, delay: '0.1s' },
    { Logo: GitHubLogo,     name: 'GitHub',       bg: '#24292E', pos: { top: '38%', left: '0%' },  delay: '0.2s' },
    { Logo: GoogleDocsLogo, name: 'Google Docs',  bg: '#1C1C1C', pos: { top: '38%', right: '0%' }, delay: '0.3s' },
    { Logo: SlackLogo,      name: 'Slack',        bg: '#1C1C1C', pos: { bottom: '8%', left: '5%' }, delay: '0.4s' },
    { Logo: LinearLogo,     name: 'Linear',       bg: '#1C1C1C', pos: { bottom: '8%', right: '5%' }, delay: '0.5s' },
  ]

  return (
    <div className="relative w-full max-w-sm mx-auto" style={{ height: 320 }}>
      {/* Connection lines SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.25 }}>
        {[
          { x1: '18%', y1: '18%', x2: '50%', y2: '50%' },
          { x1: '82%', y1: '18%', x2: '50%', y2: '50%' },
          { x1: '10%', y1: '50%', x2: '50%', y2: '50%' },
          { x1: '90%', y1: '50%', x2: '50%', y2: '50%' },
          { x1: '18%', y1: '82%', x2: '50%', y2: '50%' },
          { x1: '82%', y1: '82%', x2: '50%', y2: '50%' },
        ].map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="4 3"
            style={{ animation: `connect-line 0.6s ease ${i * 0.1}s both` }} />
        ))}
      </svg>

      {/* Tool logos */}
      {tools.map(({ Logo, name, bg, pos, delay }) => (
        <div
          key={name}
          className="absolute flex flex-col items-center gap-1"
          style={{ ...pos, animation: `float-up 0.5s ease ${delay} both` }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: bg, border: '1px solid rgba(255,255,255,0.1)' }}>
            <Logo size={26} />
          </div>
          <span className="text-xs text-white/40 font-medium">{name}</span>
        </div>
      ))}

      {/* Center — Younes hub */}
      <div
        className="absolute flex flex-col items-center gap-1.5"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', animation: 'float-up 0.4s ease both' }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl" style={{ background: 'rgba(59,130,246,0.15)', border: '2px solid rgba(59,130,246,0.4)' }}>
          <AppLogo size={36} color="#3B82F6" />
        </div>
        <span className="text-xs font-semibold" style={{ color: '#3B82F6' }}>Younes</span>
      </div>
    </div>
  )
}

// ─── Slide 3 — Gestion de projets ───────────────────────────────────
function Slide3() {
  const cols = [
    { label: 'Prospection', color: '#3B82F6', cards: ['Refonte site — Studio K', 'App mobile — Korvex'] },
    { label: 'En cours', color: '#3B82F6', cards: ['Identité visuelle — Lumin', 'SEO — BTP Renov'] },
    { label: 'Livré', color: '#3B82F6', cards: ['Dashboard — Mevo'] },
  ]
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2" style={{ animation: 'float-up 0.5s ease both' }}>
        {cols.map((col, ci) => (
          <div key={col.label} className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{col.label}</span>
            </div>
            {col.cards.map((card, i) => (
              <div
                key={card}
                className="rounded-xl p-2.5 text-xs text-white/80 font-medium leading-snug"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', animation: `float-up 0.4s ease ${(ci * 2 + i) * 0.07}s both` }}
              >
                {card}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mt-1" style={{ animation: 'float-up 0.5s ease 0.2s both' }}>
        {[
          { label: 'Leads actifs', val: '24', color: '#3B82F6' },
          { label: 'Clients', val: '11', color: '#3B82F6' },
          { label: 'CA estimé', val: '38k€', color: '#3B82F6' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="font-bold text-xl text-white font-syne">{s.val}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Slide 4 — Équipe ───────────────────────────────────────────────
function Slide4() {
  const members = [
    { name: 'Younes A.', role: 'CEO', avatar: 'YA', color: '#3B82F6', tasks: 4, online: true },
    { name: 'Sara M.', role: 'Designer', avatar: 'SM', color: '#3B82F6', tasks: 2, online: true },
    { name: 'Karim B.', role: 'Dev', avatar: 'KB', color: '#3B82F6', tasks: 6, online: false },
  ]
  const activity = [
    { who: 'Sara M.', action: 'a livré la maquette', item: 'App Korvex', time: '2h', color: '#3B82F6' },
    { who: 'Karim B.', action: 'a fermé le lead', item: 'Tech Solutions', time: '4h', color: '#3B82F6' },
    { who: 'Younes A.', action: 'a créé le projet', item: 'BTP Renov', time: '6h', color: '#3B82F6' },
  ]
  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-3">
      {/* Members */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', animation: 'float-up 0.5s ease both' }}>
        <p className="text-xs font-semibold text-white/50 mb-3">Membres actifs</p>
        <div className="flex flex-col gap-2.5">
          {members.map((m) => (
            <div key={m.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m.color }}>{m.avatar}</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: '#141414', background: m.online ? '#3B82F6' : '#4A4A4A' }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{m.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{m.role}</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>{m.tasks} tâches</span>
            </div>
          ))}
        </div>
      </div>
      {/* Activity */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', animation: 'float-up 0.5s ease 0.1s both' }}>
        <p className="text-xs font-semibold text-white/50 mb-3">Activité récente</p>
        {activity.map((a, i) => (
          <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: a.color }} />
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <span className="font-semibold text-white">{a.who}</span> {a.action} <span style={{ color: a.color }}>{a.item}</span>
            </p>
            <span className="text-xs ml-auto shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── IllustrationPanel — Sellora style ─────────────────────────────
function IllustrationPanel() {
  return (
    <div
      className="hidden lg:flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #4338CA 0%, #5B4FE8 40%, #2A3470 100%)' }}
    >
      {/* Subtle light rays */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
      }} />

      {/* Y watermark — large, bottom-right */}
      <div className="absolute pointer-events-none select-none" style={{ bottom: -100, right: -100, opacity: 0.09 }}>
        <svg width="500" height="500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 22 L14 22 L14 14 L22 2 L15 2 L12 14 L9 2 L2 2 L10 14 Z" fill="white"/>
        </svg>
      </div>
      {/* Y watermark — small, top-left */}
      <div className="absolute pointer-events-none select-none" style={{ top: -40, left: -40, opacity: 0.05 }}>
        <svg width="260" height="260" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 22 L14 22 L14 14 L22 2 L15 2 L12 14 L9 2 L2 2 L10 14 Z" fill="white"/>
        </svg>
      </div>

      {/* Content — vertically centered like Sellora */}
      <div className="relative flex-1 flex flex-col justify-center px-12 gap-8">

        {/* Text */}
        <div className="max-w-sm">
          <h2 className="font-syne font-bold text-white leading-tight mb-4" style={{ fontSize: 34 }}>
            Gérez votre agence<br />et vos opérations.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Connectez-vous pour accéder à votre dashboard CRM et gérer vos clients, projets et équipe.
          </p>
        </div>

      {/* Floating mockup cards */}
      <div className="relative" style={{ height: 340 }}>

        {/* Main big card — dashboard overview */}
        <div className="absolute rounded-2xl overflow-hidden"
          style={{
            top: 0, left: 0, right: 0,
            background: 'white',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            borderRadius: 16,
          }}>
          {/* Card header */}
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <span className="text-xs font-semibold" style={{ color: '#374151' }}>Vue d'ensemble</span>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#EEF0FB', color: '#4338CA' }}>Mensuel</span>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"/>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"/>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"/>
              </div>
            </div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
            {[
              { label: 'CA total', val: '38 400 €', sub: '+18% vs mois dernier', accent: '#4338CA' },
              { label: 'Leads actifs', val: '24', sub: '+12% cette semaine', accent: '#323E83' },
              { label: 'Projets', val: '7', sub: '3 en cours', accent: '#4338CA' },
            ].map((s, i) => (
              <div key={s.label} className="px-4 py-3" style={{ borderRight: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                <p style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 4 }}>{s.label}</p>
                <p className="font-syne font-bold" style={{ fontSize: 15, color: '#111827', lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 8, color: s.accent, marginTop: 3 }}>{s.sub}</p>
              </div>
            ))}
          </div>
          {/* Mini chart area */}
          <div className="p-4">
            <p style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 8 }}>Transactions récentes</p>
            {[
              { name: 'Salon Élégance', type: 'Maintenance', amount: '290 €', status: 'Payé', sc: '#DCFCE7', st: '#16A34A' },
              { name: 'Tech Solutions', type: 'Prestation', amount: '1 200 €', status: 'En attente', sc: '#FEF9C3', st: '#CA8A04' },
              { name: 'BTP Renov', type: 'Devis', amount: '3 400 €', status: 'Signé', sc: '#EEF0FB', st: '#4338CA' },
              { name: 'Korvex Studio', type: 'Hébergement', amount: '49 €', status: 'Payé', sc: '#DCFCE7', st: '#16A34A' },
            ].map(r => (
              <div key={r.name} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid #F9FAFB' }}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                    style={{ background: '#4338CA', fontSize: 7 }}>{r.name[0]}</div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 600, color: '#111827' }}>{r.name}</p>
                    <p style={{ fontSize: 8, color: '#9CA3AF' }}>{r.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#111827' }}>{r.amount}</p>
                  <span style={{ fontSize: 7, fontWeight: 600, padding: '2px 6px', borderRadius: 20, background: r.sc, color: r.st }}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating mini card — pipeline */}
        <div className="absolute rounded-xl overflow-hidden"
          style={{
            bottom: -20, right: -10, width: 180,
            background: 'white',
            boxShadow: '0 16px 40px rgba(0,0,0,0.2)',
          }}>
          <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#374151' }}>Pipeline</p>
          </div>
          <div className="p-3 flex flex-col gap-1.5">
            {[{ l: 'Leads', w: 75, v: '24' }, { l: 'Devis', w: 52, v: '12' }, { l: 'Signés', w: 33, v: '8' }].map(r => (
              <div key={r.l} className="flex items-center gap-1.5">
                <span style={{ fontSize: 8, color: '#9CA3AF', width: 30, flexShrink: 0 }}>{r.l}</span>
                <div className="flex-1 h-1 rounded-full" style={{ background: '#EEF0FB' }}>
                  <div className="h-full rounded-full" style={{ width: `${r.w}%`, background: '#4338CA' }} />
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#4338CA', width: 14, textAlign: 'right' }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      </div>
    </div>
  )
}

type AuthMode_ = AuthMode

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword, session, acceptInvitation, setOtpPending, setShowSplash } = useAuthStore()

  const inviteToken = searchParams.get('invite')

  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nom, setNom] = useState('')
  const [role, setRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<{ workspace_name: string; from_email: string } | null>(null)
  const [otp, setOtp] = useState('')
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyType, setVerifyType] = useState<'signup' | 'email'>('signup')
  const [awaitingOtp, setAwaitingOtp] = useState(false)
  const awaitingOtpRef = useRef(false)
  const pendingCredsRef = useRef<{ email: string; password: string } | null>(null)
  const [inviteConfirmed, setInviteConfirmed] = useState(false)

  useEffect(() => {
    // Ne rediriger que si on n'attend pas de vérification OTP
    if (session && !awaitingOtpRef.current) navigate('/dashboard', { replace: true })
  }, [session])

  useEffect(() => {
    if (!inviteToken) return
    setMode('register')
    supabase
      .from('invitations')
      .select('workspace_name, to_email, from_user_id')
      .eq('token', inviteToken)
      .eq('status', 'pending')
      .single()
      .then(async ({ data }) => {
        if (!data) return
        setEmail(data.to_email)
        const { data: profile } = await supabase.from('profiles').select('nom').eq('id', data.from_user_id).single()
        setInviteInfo({ workspace_name: data.workspace_name ?? 'un espace de travail', from_email: profile?.nom ?? 'un collaborateur' })
      })
  }, [inviteToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(email)
        if (error) setError(error)
        else setSuccess('Email de réinitialisation envoyé. Vérifie ta boîte mail.')
        return
      }
      if (mode === 'login') {
        // Bloquer ProtectedRoute avant même signIn
        setOtpPending(true)
        awaitingOtpRef.current = true
        // 1. Vérifier le mot de passe
        const { error } = await signIn(email, password)
        if (error) { setOtpPending(false); awaitingOtpRef.current = false; setError(error); return }
        // 2. Stocker les credentials pour re-signer après OTP
        pendingCredsRef.current = { email, password }
        // 3. Déconnecter (pas de session active avant validation OTP)
        await supabase.auth.signOut()
        // 4. Afficher l'écran OTP
        setVerifyEmail(email)
        setVerifyType('email')
        setMode('verify')
        // 5. Envoyer le code
        const { error: otpErr } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
        if (otpErr) {
          setError(otpErr.message?.includes('429') || otpErr.message?.toLowerCase().includes('rate')
            ? 'Trop de tentatives — attends quelques minutes puis clique sur "Renvoyer le code".'
            : otpErr.message)
        }
        return
      }
      if (mode === 'register') {
        if (!nom.trim()) { setError('Le prénom/nom est requis'); return }
        setAwaitingOtp(true)
        const { error } = await signUp(email, password, nom, role)
        if (error) { setAwaitingOtp(false); setError(error); return }
        setVerifyEmail(email)
        setVerifyType('signup')
        setMode('verify')
        return
      }
      if (mode === 'verify') {
        try {
          const result = await Promise.race([
            supabase.auth.verifyOtp({ email: verifyEmail, token: otp.trim(), type: verifyType }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Temps dépassé. Réessaie.')), 10000)
            ),
          ])
          if (result.error) { setError('Code invalide ou expiré. Réessaie.'); return }
          // OTP validé — re-signer avec le vrai mot de passe pour créer la session finale
          if (pendingCredsRef.current) {
            const { error: reSignErr } = await signIn(pendingCredsRef.current.email, pendingCredsRef.current.password)
            pendingCredsRef.current = null
            if (reSignErr) { setError(reSignErr); return }
          }
          setOtpPending(false)
          setShowSplash(true)
          awaitingOtpRef.current = false
          setAwaitingOtp(false)
          if (inviteToken) {
            localStorage.setItem('pending_invite_token', inviteToken)
            const { error: inviteErr } = await acceptInvitation(inviteToken)
            if (inviteErr) console.error('[acceptInvitation] erreur:', inviteErr)
          }
          navigate(verifyType === 'signup' ? '/onboarding' : '/dashboard')
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Code invalide ou expiré. Réessaie.')
        }
        return
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) setError(error)
  }

  const handleApple = async () => {
    const { error } = await signInWithApple()
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── LEFT PANEL (form) ── */}
      <div className="flex flex-col justify-between px-14 py-10 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#323E83' }}>
            <AppLogo size={18} color="white" />
          </div>
          <span className="font-syne font-bold text-sm" style={{ color: '#1A2260' }}>Younes</span>
        </div>

        {/* Form area */}
        <div className="w-full max-w-md mx-auto">

          {/* ── ÉCRAN DE CONFIRMATION D'INVITATION ── */}
          {inviteToken && inviteInfo && !inviteConfirmed ? (
            <div className="flex flex-col items-center text-center gap-5 py-4">
              {/* Icône */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: '#EEF0FB', border: '1px solid #B8C1E8' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#323E83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>

              {/* Texte */}
              <div>
                <h1 className="font-syne font-bold text-2xl mb-2" style={{ color: '#0C1929' }}>
                  Invitation reçue 🎉
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                  <strong style={{ color: '#0C1929' }}>{inviteInfo.from_email}</strong> t'invite à rejoindre l'équipe{' '}
                  <strong style={{ color: '#323E83' }}>{inviteInfo.workspace_name}</strong>.
                </p>
                <p className="text-sm mt-2" style={{ color: '#9CA3AF' }}>
                  Veux-tu vraiment rejoindre cette équipe ?
                </p>
              </div>

              {/* Boutons */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => { setInviteConfirmed(true); setMode('register') }}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: '#323E83' }}
                >
                  ✓ Créer un compte pour rejoindre
                </button>
                <button
                  onClick={() => { setInviteConfirmed(true); setMode('login') }}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'white', border: '1.5px solid #323E83', color: '#323E83' }}
                >
                  J'ai déjà un compte
                </button>
                <button
                  onClick={() => navigate('/auth', { replace: true })}
                  className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'white', border: '1.5px solid #E5E7EB', color: '#9CA3AF' }}
                >
                  Refuser
                </button>
              </div>
            </div>
          ) : (
          <>
          {/* Invite banner (une fois confirmée) */}
          {inviteInfo && inviteConfirmed && (
            <div className="rounded-xl px-4 py-3 mb-6 text-sm border" style={{ background: '#EEF0FB', borderColor: '#B8C1E8', color: '#323E83' }}>
              Tu rejoins <strong>{inviteInfo.workspace_name}</strong>.{' '}
              {mode === 'login' ? 'Connecte-toi pour continuer.' : 'Crée ton compte pour continuer.'}
            </div>
          )}

          {mode === 'verify' ? (
            <div className="text-center mb-6">
              <style>{`
                @keyframes env-rise   { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-14px)} }
                @keyframes env-shd    { 0%,100%{rx:68;opacity:.25}         50%{rx:44;opacity:.08} }
                @keyframes spark-1    { 0%,100%{transform:translate(0,0) scale(0);opacity:0} 45%{transform:translate(-18px,-22px) scale(1);opacity:1} 70%{opacity:0} }
                @keyframes spark-2    { 0%,100%{transform:translate(0,0) scale(0);opacity:0} 50%{transform:translate(20px,-28px) scale(1);opacity:1} 75%{opacity:0} }
                @keyframes spark-3    { 0%,100%{transform:translate(0,0) scale(0);opacity:0} 40%{transform:translate(10px,24px) scale(1);opacity:1}  65%{opacity:0} }
                @keyframes env-dot    { 0%,60%,100%{transform:translateY(0);opacity:.3} 30%{transform:translateY(-8px);opacity:1} }
                .env-rise  { animation: env-rise 2.8s ease-in-out infinite; }
                .env-shd   { animation: env-shd  2.8s ease-in-out infinite; }
                .sp1 { animation: spark-1 2.8s ease-in-out .2s infinite; }
                .sp2 { animation: spark-2 2.8s ease-in-out .5s infinite; }
                .sp3 { animation: spark-3 2.8s ease-in-out .1s infinite; }
                .ed1 { animation: env-dot 1.2s ease-in-out 0s   infinite; }
                .ed2 { animation: env-dot 1.2s ease-in-out .22s infinite; }
                .ed3 { animation: env-dot 1.2s ease-in-out .44s infinite; }
              `}</style>

              <div style={{ position:'relative', width:110, height:85, margin:'0 auto 18px' }}>
                <svg viewBox="0 0 260 200" width="110" height="85" fill="none" xmlns="http://www.w3.org/2000/svg">

                  {/* Ombre qui se rétracte */}
                  <ellipse className="env-shd" cx="130" cy="188" ry="7" fill="rgba(50,62,131,0.25)"/>

                  {/* Enveloppe flottante */}
                  <g className="env-rise">

                    {/* Corps */}
                    <rect x="14" y="30" width="232" height="144" rx="14" fill="#323E83"/>

                    {/* Plis bas-gauche et bas-droite */}
                    <line x1="14"  y1="174" x2="130" y2="100" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="246" y1="174" x2="130" y2="100" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round"/>

                    {/* Rabat scellé — V blanc net */}
                    <path d="M14 30 L130 104 L246 30" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>

                    {/* Reflet coin haut-gauche */}
                    <path d="M14 30 Q14 30 60 30 L14 62 Z" fill="rgba(255,255,255,0.10)"/>

                  </g>

                  {/* Étincelles */}
                  <g style={{ transformOrigin:'130px 104px' }}>
                    <circle className="sp1" cx="130" cy="104" r="5" fill="#8A9BD4"/>
                    <circle className="sp2" cx="130" cy="104" r="4" fill="#6B7EC4"/>
                    <circle className="sp3" cx="130" cy="104" r="3" fill="#A0AEDA"/>
                  </g>

                  {/* Points de chargement */}
                  <circle className="ed1" cx="115" cy="193" r="4.5" fill="#323E83"/>
                  <circle className="ed2" cx="130" cy="193" r="4.5" fill="#4A5BA8"/>
                  <circle className="ed3" cx="145" cy="193" r="4.5" fill="#6B7EC4"/>

                </svg>
              </div>

              <h1 className="font-syne font-bold text-2xl mb-2" style={{ color: '#0C1929' }}>Vérifie ta boîte mail</h1>
              <p className="text-sm" style={{ color: '#6B7280', lineHeight: 1.7 }}>
                On vient d'envoyer un code à 8 chiffres à<br/>
                <strong style={{ color: '#323E83' }}>{verifyEmail}</strong>
              </p>
            </div>
          ) : mode !== 'reset' ? (
            <div className="text-center mb-6">
              <h1 className="font-syne font-bold mb-2" style={{ color: '#0C1929', lineHeight: 1.15, fontSize: 30 }}>
                {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
              </h1>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>
                {mode === 'login'
                  ? 'Saisissez votre email et mot de passe pour accéder à votre compte.'
                  : 'Renseignez vos informations pour commencer.'}
              </p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <h1 className="font-syne font-bold text-3xl mb-1" style={{ color: '#0C1929' }}>Mot de passe oublié</h1>
              <p className="text-sm" style={{ color: '#9CA3AF' }}>On vous envoie un lien de réinitialisation.</p>
            </div>
          )}

          {/* Tabs */}
          {!inviteToken && mode !== 'reset' && mode !== 'verify' && (
            <div className="flex rounded-xl mb-6 p-1 gap-1" style={{ background: '#F3F4F6' }}>
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess('') }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: mode === m ? 'white' : 'transparent',
                    color: mode === m ? '#0C1929' : '#6B7280',
                    boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* ── MODE VÉRIFICATION OTP ── */}
            {mode === 'verify' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Code à 8 chiffres *</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="_ _ _ _ _ _ _ _"
                  required
                  autoFocus
                  inputMode="numeric"
                  maxLength={8}
                  className="w-full px-4 py-3 rounded-xl text-2xl font-bold tracking-[0.4em] text-center outline-none transition-all"
                  style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                  onFocus={(e) => e.target.style.borderColor = '#323E83'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                <button
                  type="button"
                  className="mt-2 text-xs hover:underline"
                  style={{ color: '#323E83' }}
                  onClick={async () => {
                    await supabase.auth.signInWithOtp({ email: verifyEmail, options: { shouldCreateUser: false } })
                    setSuccess('Nouveau code envoyé !')
                  }}
                >
                  Renvoyer le code
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Prénom & Nom *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                    placeholder="Jean Dupont" required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                    onFocus={(e) => e.target.style.borderColor = '#323E83'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Agence / Rôle</label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type="text" value={role} onChange={(e) => setRole(e.target.value)}
                    placeholder="Web designer freelance"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                    onFocus={(e) => e.target.style.borderColor = '#323E83'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>
            )}

            {mode !== 'verify' && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Email *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@agence.fr" required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                    onFocus={(e) => e.target.style.borderColor = '#323E83'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
              </div>
            )}

            {mode !== 'reset' && mode !== 'verify' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: '#374151' }}>Mot de passe *</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => { setMode('reset'); setError(''); setSuccess('') }}
                      className="text-xs hover:underline" style={{ color: '#323E83' }}>
                      Oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                    onFocus={(e) => e.target.style.borderColor = '#323E83'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm rounded-xl px-3 py-2.5" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm rounded-xl px-3 py-2.5" style={{ background: '#EEF0FB', color: '#323E83', border: '1px solid #B8C1E8' }}>
                {success}
              </div>
            )}

            <button
              type="submit" disabled={loading || (mode === 'verify' && otp.length < 8)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 mt-1"
              style={{ background: '#323E83' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Chargement…
                </span>
              ) : mode === 'login' ? 'Se connecter' : mode === 'register' ? 'Créer mon compte' : mode === 'verify' ? 'Vérifier le code' : 'Envoyer le lien'}
            </button>

            {mode === 'reset' && (
              <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                className="text-sm text-center hover:underline" style={{ color: '#6B7280' }}>
                ← Retour à la connexion
              </button>
            )}

            {mode === 'register' && (
              <p className="text-sm text-center" style={{ color: '#6B7280' }}>
                Déjà un compte ?{' '}
                <button type="button" onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="font-medium hover:underline" style={{ color: '#323E83' }}>
                  Se connecter
                </button>
              </p>
            )}

            {mode === 'login' && !inviteToken && (
              <p className="text-sm text-center" style={{ color: '#6B7280' }}>
                Pas encore de compte ?{' '}
                <button type="button" onClick={() => { setMode('register'); setError(''); setSuccess('') }}
                  className="font-medium hover:underline" style={{ color: '#323E83' }}>
                  Créer un compte
                </button>
              </p>
            )}
          </form>

          {mode !== 'reset' && mode !== 'verify' && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
                <span className="text-xs" style={{ color: '#9CA3AF' }}>Ou se connecter avec</span>
                <div className="flex-1 h-px" style={{ background: '#E5E7EB' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogle}
                  className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:bg-gray-50"
                  style={{ background: 'white', border: '1.5px solid #E5E7EB', color: '#374151' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button
                  onClick={handleApple}
                  className="py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: '#000', color: 'white' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.74 3.15.8 1.19-.24 2.33-.93 3.6-.84 1.54.12 2.69.72 3.44 1.84-3.17 1.9-2.42 5.78.48 6.95-.59 1.57-1.36 3.13-2.67 4.13zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Apple
                </button>
              </div>
            </>
          )}
          </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#9CA3AF' }}>© 2025 Younes. Tous droits réservés.</p>
          <a href="#" className="text-xs hover:underline" style={{ color: '#9CA3AF' }}>Politique de confidentialité</a>
        </div>
      </div>

      {/* ── RIGHT PANEL (illustration) ── */}
      <IllustrationPanel />

    </div>
  )
}

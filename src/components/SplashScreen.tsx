import { useEffect, useState } from 'react'

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const t = setTimeout(onDone, 2200)
    const d = setInterval(() => setDots(p => p.length >= 3 ? '' : p + '.'), 400)
    return () => { clearTimeout(t); clearInterval(d) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#FFFFFF',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
      animation: 'sp-fadeout 0.5s ease 1.7s both',
    }}>
      {/* Logo avec halo */}
      <div style={{
        position: 'relative',
        marginBottom: 28,
        animation: 'sp-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{
          position: 'absolute', inset: -12,
          borderRadius: 28,
          background: 'rgba(37,99,235,0.08)',
          animation: 'sp-pulse 1.8s ease-in-out infinite',
        }} />
        <img src="/logo.svg" style={{
          width: 80, height: 80,
          borderRadius: 18,
          position: 'relative',
          boxShadow: '0 8px 32px rgba(37,99,235,0.25)',
        }} />
      </div>

      {/* Nom de l'app */}
      <div style={{
        fontSize: 22, fontWeight: 700,
        color: '#323E83',
        letterSpacing: '-0.3px',
        marginBottom: 8,
        animation: 'sp-fadein 0.4s ease 0.2s both',
        fontFamily: 'Nunito, sans-serif',
      }}>
        Younes
      </div>

      {/* Texte chargement */}
      <div style={{
        fontSize: 13, color: '#94A3B8',
        fontFamily: 'Nunito, sans-serif',
        letterSpacing: '0.2px',
        marginBottom: 40,
        minWidth: 120, textAlign: 'center',
        animation: 'sp-fadein 0.4s ease 0.3s both',
      }}>
        Chargement{dots}
      </div>

      {/* Barre de progression */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 3,
        background: 'rgba(37,99,235,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #323E83, #3B82F6)',
          animation: 'sp-progress 1.8s cubic-bezier(0.4,0,0.2,1) 0.1s both',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      <style>{`
        @keyframes sp-fadeout  { to { opacity: 0; pointer-events: none; } }
        @keyframes sp-fadein   { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes sp-pop      { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes sp-pulse    { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.08); opacity: 1; } }
        @keyframes sp-progress { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </div>
  )
}

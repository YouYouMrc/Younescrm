import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg)' }}>
      <p className="font-syne font-bold text-6xl" style={{ color: 'var(--text3)' }}>404</p>
      <div className="text-center">
        <p className="font-syne font-bold text-xl text-text1 mb-2">Page introuvable</p>
        <p className="text-sm" style={{ color: 'var(--text3)' }}>Cette page n'existe pas ou a été déplacée.</p>
      </div>
      <Link to="/dashboard" className="btn-primary">Retour au dashboard</Link>
    </div>
  )
}

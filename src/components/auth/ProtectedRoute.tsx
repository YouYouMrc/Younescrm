import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const PUBLIC_ROUTES = ['/auth', '/reset-password']

function FullScreenLoader() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--surface1)' }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
      />
      <p className="text-xs font-medium" style={{ color: 'var(--text3)' }}>
        Chargement…
      </p>
    </div>
  )
}

interface Props {
  children: React.ReactNode
  skipOnboardingCheck?: boolean
}

export default function ProtectedRoute({ children, skipOnboardingCheck = false }: Props) {
  const { session, profile, initialized, initialize, otpPending } = useAuthStore()
  const location = useLocation()

  const isPublic = PUBLIC_ROUTES.some((r) => location.pathname.startsWith(r))

  useEffect(() => {
    if (!initialized) initialize()
  }, [initialized])

  if (!initialized) return <FullScreenLoader />

  // Route privée + pas de session → /auth
  if (!isPublic && !session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />
  }

  // Route publique + session → dashboard (sauf OTP en cours)
  if (isPublic && session && !otpPending) {
    const from = (location.state as { from?: string })?.from ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}

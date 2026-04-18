import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { useCAStore } from '@/stores/caStore'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppShell() {
  const { session, initialized } = useAuthStore()
  const { fetchAll } = useDataStore()
  const { fetchCALignes } = useCAStore()
  const location = useLocation()
  const isFullscreen = ['/calendrier', '/dashboard'].includes(location.pathname)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (session) {
      fetchAll()
      fetchCALignes()
    }
  }, [session])

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Chargement…</p>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarCollapsed(s => !s)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className={`flex-1 ${isFullscreen ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-6'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

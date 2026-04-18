import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SplashScreen from '@/components/SplashScreen'
import AppShell from '@/components/Layout/AppShell'
import Auth from '@/pages/Auth'
import ResetPassword from '@/pages/ResetPassword'
import Dashboard from '@/pages/Dashboard'
import Leads from '@/pages/Leads'
import Clients from '@/pages/Clients'
import Projets from '@/pages/Projets'
import StagesProjets from '@/pages/StagesProjets'
import Ressources from '@/pages/Ressources'
import Pipeline from '@/pages/Pipeline'
import ChiffreAffaire from '@/pages/ChiffreAffaire'
import Team from '@/pages/Team'
import Rapports from '@/pages/Rapports'
import Parametres from '@/pages/Parametres'
import Emails from '@/pages/Emails'
import Calendrier from '@/pages/Calendrier'
import GmailCallback from '@/pages/GmailCallback'
import Onboarding from '@/pages/Onboarding'
import NotFound from '@/pages/NotFound'

export default function App() {
  const { initialize, profile, showSplash, setShowSplash } = useAuthStore()
  useTheme()

  useEffect(() => {
    initialize()
  }, [])

  // Applique la couleur accent du branding — migration auto des anciens violets
  useEffect(() => {
    const OLD_VIOLETS = ['#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#9b4de8','#4c5fc4','#9b8ff2','#6366f1','#4f46e5','#3a4faf','#2563eb']
    const accent = profile?.branding?.accentColor
    if (accent) {
      const clean = OLD_VIOLETS.includes(accent.toLowerCase()) ? '#3B82F6' : accent
      document.documentElement.style.setProperty('--accent', clean)
      localStorage.setItem('accent', clean)
    }
  }, [profile?.branding?.accentColor])

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <BrowserRouter>
      <Routes>

        {/* ── Routes publiques (redirigent vers /dashboard si déjà connecté) ── */}
        <Route
          path="/auth"
          element={
            <ProtectedRoute>
              <Auth />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <ProtectedRoute>
              <ResetPassword />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/gmail/callback" element={<GmailCallback />} />

        {/* ── Onboarding (session requise, pas de check onboarding) ── */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute skipOnboardingCheck>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* ── Routes privées (redirigent vers /auth si non connecté) ── */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"  element={<Dashboard />} />
          <Route path="leads"      element={<Leads />} />
          <Route path="prospects"  element={<Leads />} />
          <Route path="clients"    element={<Clients />} />
          <Route path="projets"    element={<Projets />} />
          <Route path="stages"     element={<StagesProjets />} />
          <Route path="ressources" element={<Ressources />} />
          <Route path="pipeline"         element={<Pipeline />} />
          <Route path="chiffre-affaire" element={<ChiffreAffaire />} />
          <Route path="team"             element={<Team />} />
          <Route path="emails"      element={<Emails />} />
          <Route path="calendrier"  element={<Calendrier />} />
          <Route path="rapports"    element={<Rapports />} />
          <Route path="parametres"  element={<Parametres />} />
        </Route>

        {/* ── Fallback 404 ── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
      </BrowserRouter>
    </>
  )
}

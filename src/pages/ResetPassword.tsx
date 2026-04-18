import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AppLogo from '@/components/ui/AppLogo'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [ready, setReady]     = useState(false)
  const [expired, setExpired] = useState(false)
  const [done, setDone]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [password, setPassword]         = useState('')
  const [confirm, setConfirm]           = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Lien de reset valide → afficher le formulaire
      if (event === 'PASSWORD_RECOVERY' && session) {
        setReady(true)
      }
      // Supabase confirme que le mot de passe a bien été mis à jour
      if (event === 'USER_UPDATED') {
        setDone(true)
        setLoading(false)
      }
    })

    // Si après 8s l'événement PASSWORD_RECOVERY n'arrive pas → lien invalide/expiré
    const timeout = setTimeout(() => {
      setExpired(true)
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }

    setLoading(true)

    // On appelle updateUser — le succès sera détecté via l'événement USER_UPDATED ci-dessus
    // Les erreurs de type "lock/volé" sont des faux positifs Supabase qu'on ignore
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      const isLockBug = error.message.toLowerCase().includes('lock')
        || error.message.includes('volé')
        || error.message.includes('stolen')

      if (!isLockBug) {
        // Vraie erreur → l'afficher
        setError(error.message)
        setLoading(false)
      }
      // Si c'est le bug de lock → on laisse USER_UPDATED gérer le succès
    }
  }

  const handleBackToLogin = () => {
    supabase.auth.signOut() // fire & forget, on ne bloque pas la navigation
    navigate('/auth', { replace: true })
  }

  // ── Rendu ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F4F5F7' }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-sm" style={{ border: '1px solid #E5E7EB' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <AppLogo size={28} color="#065F46" />
          <span className="font-syne font-bold text-base" style={{ color: '#0A1A12' }}>Younes</span>
        </div>

        {/* ⏳ Vérification du lien */}
        {!ready && !done && !expired && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#065F46' }} />
            <p className="text-sm" style={{ color: '#6B7280' }}>Vérification du lien…</p>
          </div>
        )}

        {/* ❌ Lien expiré */}
        {expired && !ready && !done && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#FEF2F2' }}>
              <AlertCircle size={28} style={{ color: '#DC2626' }} />
            </div>
            <div>
              <h2 className="font-syne font-bold text-xl mb-2" style={{ color: '#0C1929' }}>Lien expiré</h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Ce lien est invalide ou a expiré. Redemande une réinitialisation.
              </p>
            </div>
            <button onClick={handleBackToLogin}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#065F46' }}>
              Retour à la connexion
            </button>
          </div>
        )}

        {/* ✅ Succès */}
        {done && (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#F0FDF4' }}>
              <CheckCircle2 size={32} style={{ color: '#16A34A' }} />
            </div>
            <div>
              <h2 className="font-syne font-bold text-xl mb-2" style={{ color: '#0C1929' }}>
                Mot de passe mis à jour !
              </h2>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                Ton mot de passe a bien été modifié. Tu peux maintenant te reconnecter.
              </p>
            </div>
            <button onClick={handleBackToLogin}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#065F46' }}>
              Se connecter
            </button>
          </div>
        )}

        {/* 📝 Formulaire */}
        {ready && !done && (
          <>
            <h1 className="font-syne font-bold text-2xl mb-1" style={{ color: '#0C1929' }}>
              Nouveau mot de passe 🔐
            </h1>
            <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
              Choisis un nouveau mot de passe pour ton compte.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Nouveau mot de passe */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                  Nouveau mot de passe *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required minLength={6} autoFocus
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                    onFocus={(e) => e.target.style.borderColor = '#065F46'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirmer */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required minLength={6}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#111827' }}
                    onFocus={(e) => e.target.style.borderColor = '#065F46'}
                    onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                  />
                </div>
                {confirm.length > 0 && (
                  <p className="text-xs mt-1.5" style={{ color: password === confirm ? '#16A34A' : '#DC2626' }}>
                    {password === confirm ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
                  </p>
                )}
              </div>

              {/* Erreur réelle */}
              {error && (
                <div className="text-sm rounded-xl px-3 py-2.5"
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 6}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 mt-1"
                style={{ background: '#065F46' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Mise à jour…
                  </span>
                ) : 'Mettre à jour le mot de passe'}
              </button>

              <button type="button" onClick={handleBackToLogin}
                className="text-sm text-center hover:underline" style={{ color: '#6B7280' }}>
                ← Retour à la connexion
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

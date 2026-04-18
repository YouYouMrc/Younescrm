import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, Clock, UserMinus, Users } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import InviteModal from '@/components/modals/InviteModal'

export default function Team() {
  const { members, invitations, fetchTeam, removeMember, cancelInvitation } = useDataStore()
  const { user, profile } = useAuthStore()
  const [showInvite, setShowInvite] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchTeam()
  }, [])

  const copyLink = (token: string, id: string) => {
    const url = `${window.location.origin}/auth?invite=${token}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRemoveMember = async (memberId: string, nom: string) => {
    if (!confirm(`Retirer ${nom} de l'équipe ?`)) return
    await removeMember(memberId)
  }

  const handleCancelInvitation = async (id: string, email: string) => {
    if (!confirm(`Annuler l'invitation pour ${email} ?`)) return
    await cancelInvitation(id)
  }

  const pendingInvitations = invitations.filter((i) => i.status === 'pending')

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.12)' }}>
            <Users size={15} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <p className="text-sm font-medium text-text1">
              {members.length + 1} membre{members.length + 1 !== 1 ? 's' : ''} dans l'équipe
            </p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {pendingInvitations.length > 0 ? `${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente` : 'Équipe active'}
            </p>
          </div>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary">
          <Plus size={14} />
          Inviter
        </button>
      </div>

      {/* Membres */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border1)' }}>
          <h3 className="font-syne font-bold text-sm text-text1">Membres actifs</h3>
        </div>

        {members.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--text3)' }}>Aucun membre encore</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>Invite des collaborateurs pour travailler ensemble</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border1)' }}>
            {/* Current user */}
            <div className="flex items-center gap-3 px-4 py-3">
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: 'var(--accent)', color: '#ffffff' }}
                >
                  {(profile?.nom ?? user?.email ?? 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-text1">{profile?.nom ?? 'Toi'}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'rgba(59,130,246,0.12)', color: 'var(--accent)' }}>Toi</span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{profile?.role || user?.email}</p>
              </div>
              <span className="badge badge-client text-xs">Propriétaire</span>
            </div>

            {members.map((m) => {
              const profile = m.profile
              const name = profile?.nom ?? m.member_id.slice(0, 8)
              const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: 'var(--surface3)' }}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text1">{name}</p>
                    {profile?.role && (
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>{profile.role}</p>
                    )}
                  </div>
                  <span className="badge badge-grey text-xs">{m.role}</span>
                  <button
                    onClick={() => handleRemoveMember(m.member_id, name)}
                    className="btn-ghost p-1.5 ml-1 hover:text-red-400"
                    title="Retirer"
                  >
                    <UserMinus size={13} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Invitations en attente */}
      {pendingInvitations.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border1)' }}>
            <h3 className="font-syne font-bold text-sm text-text1">
              Invitations en attente
              <span
                className="ml-2 badge text-xs"
                style={{ background: 'rgba(59,130,246,0.14)', color: '#3B82F6' }}
              >
                {pendingInvitations.length}
              </span>
            </h3>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border1)' }}>
            {pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--surface3)' }}
                >
                  <Clock size={14} style={{ color: '#3B82F6' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text1 truncate">{inv.to_email}</p>
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>
                    Envoyé le {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyLink(inv.token, inv.id)}
                    className="btn-ghost p-1.5 text-xs"
                    title="Copier le lien"
                  >
                    {copiedId === inv.id ? (
                      <Check size={13} style={{ color: '#3B82F6' }} />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                  <button
                    onClick={() => handleCancelInvitation(inv.id, inv.to_email)}
                    className="btn-ghost p-1.5 hover:text-red-400"
                    title="Annuler"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </div>
  )
}

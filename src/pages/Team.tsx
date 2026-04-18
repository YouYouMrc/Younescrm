import { useState, useEffect } from 'react'
import { Plus, Trash2, Copy, Check, Clock, UserMinus, Users, Shield } from 'lucide-react'
import { useDataStore } from '@/stores/dataStore'
import { useAuthStore } from '@/stores/authStore'
import InviteModal from '@/components/modals/InviteModal'
import type { MemberPermissions, WorkspaceMember } from '@/types'
import { DEFAULT_PERMISSIONS } from '@/types'

const PERMISSION_LABELS: { key: keyof MemberPermissions; label: string }[] = [
  { key: 'leads',      label: 'Leads' },
  { key: 'prospects',  label: 'Prospects' },
  { key: 'clients',    label: 'Clients' },
  { key: 'projets',    label: 'Projets' },
  { key: 'ressources', label: 'Ressources' },
]

function PermissionToggle({
  label,
  enabled,
  onChange,
  readonly,
}: {
  label: string
  enabled: boolean
  onChange?: (val: boolean) => void
  readonly?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        disabled={readonly}
        onClick={() => onChange?.(!enabled)}
        style={{
          width: 32, height: 18, borderRadius: 999,
          border: 'none', cursor: readonly ? 'default' : 'pointer',
          background: enabled ? 'var(--accent)' : 'var(--surface3)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          opacity: readonly ? 0.7 : 1,
        }}
        title={readonly ? undefined : enabled ? `Retirer accès ${label}` : `Donner accès ${label}`}
      >
        <span style={{
          position: 'absolute', top: 2,
          left: enabled ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
      <span style={{ fontSize: 11, color: enabled ? 'var(--text1)' : 'var(--text3)', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  )
}

function MemberRow({
  m,
  isOwner,
  onRemove,
  onPermissionChange,
}: {
  m: WorkspaceMember
  isOwner: boolean
  onRemove: () => void
  onPermissionChange: (key: keyof MemberPermissions, val: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const prof = m.profile
  const name = prof?.nom ?? m.member_id.slice(0, 8)
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const perms = m.permissions ?? DEFAULT_PERMISSIONS

  return (
    <div style={{ borderBottom: '1px solid var(--border1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        {prof?.avatar ? (
          <img src={prof.avatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
            background: 'var(--surface3)',
          }}>
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', margin: 0 }}>{name}</p>
          {prof?.role && (
            <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>{prof.role}</p>
          )}
        </div>

        <span className="badge badge-grey" style={{ fontSize: 11 }}>{m.role}</span>

        {isOwner && (
          <button
            onClick={() => setExpanded((v) => !v)}
            title="Gérer les permissions"
            style={{
              width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border1)',
              background: expanded ? 'rgba(59,130,246,0.1)' : 'var(--surface2)',
              color: expanded ? 'var(--accent)' : 'var(--text3)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s', flexShrink: 0,
            }}
          >
            <Shield size={13} />
          </button>
        )}

        {isOwner && (
          <button
            onClick={onRemove}
            className="btn-ghost"
            style={{ padding: '6px', flexShrink: 0 }}
            title="Retirer"
          >
            <UserMinus size={13} style={{ color: 'var(--text3)' }} />
          </button>
        )}
      </div>

      {/* Permissions panel */}
      {expanded && isOwner && (
        <div style={{
          padding: '10px 16px 14px 60px',
          background: 'var(--surface2)',
          borderTop: '1px solid var(--border1)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.07em', margin: '0 0 10px' }}>
            ACCÈS AUX DONNÉES
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
            {PERMISSION_LABELS.map(({ key, label }) => (
              <PermissionToggle
                key={key}
                label={label}
                enabled={perms[key]}
                onChange={(val) => onPermissionChange(key, val)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Vue membre (lecture seule) */}
      {!isOwner && (
        <div style={{ padding: '6px 16px 10px 60px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PERMISSION_LABELS.map(({ key, label }) => (
            <span
              key={key}
              style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 999,
                background: perms[key] ? 'rgba(59,130,246,0.1)' : 'var(--surface3)',
                color: perms[key] ? 'var(--accent)' : 'var(--text3)',
                fontWeight: 600,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Team() {
  const { members, invitations, fetchTeam, removeMember, cancelInvitation, updateMemberPermissions } = useDataStore()
  const { user, profile } = useAuthStore()
  const [showInvite, setShowInvite] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { fetchTeam() }, [])

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

  const handlePermissionChange = async (
    m: WorkspaceMember,
    key: keyof MemberPermissions,
    val: boolean
  ) => {
    const current = m.permissions ?? DEFAULT_PERMISSIONS
    await updateMemberPermissions(m.member_id, { ...current, [key]: val })
  }

  const pendingInvitations = invitations.filter((i) => i.status === 'pending')

  // Séparer les membres que je gère (je suis owner) des équipes que j'ai rejointes
  const myMembers = members.filter((m) => m.owner_id === user?.id)
  const joinedTeams = members.filter((m) => m.member_id === user?.id)

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
              {myMembers.length + 1} membre{myMembers.length + 1 !== 1 ? 's' : ''} dans mon équipe
            </p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {pendingInvitations.length > 0
                ? `${pendingInvitations.length} invitation${pendingInvitations.length > 1 ? 's' : ''} en attente`
                : 'Équipe active'}
            </p>
          </div>
        </div>
        <button onClick={() => setShowInvite(true)} className="btn-primary">
          <Plus size={14} />
          Inviter
        </button>
      </div>

      {/* Mon équipe (membres que j'ai invités) */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border1)' }}>
          <h3 className="font-syne font-bold text-sm text-text1">Mon équipe</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
            Clique sur <Shield size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> pour gérer les accès de chaque membre
          </p>
        </div>

        <div>
          {/* Moi */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border1)' }}>
            {profile?.avatar ? (
              <img src={profile.avatar} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', background: 'var(--accent)',
              }}>
                {(profile?.nom ?? user?.email ?? 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', margin: 0 }}>{profile?.nom ?? 'Toi'}</p>
                <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', color: 'var(--accent)', fontWeight: 600 }}>Toi</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>{profile?.role || user?.email}</p>
            </div>
            <span className="badge badge-client" style={{ fontSize: 11 }}>Propriétaire</span>
          </div>

          {myMembers.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>Aucun membre encore</p>
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Invite des collaborateurs pour travailler ensemble</p>
            </div>
          ) : (
            myMembers.map((m) => (
              <MemberRow
                key={m.id}
                m={m}
                isOwner={true}
                onRemove={() => handleRemoveMember(m.member_id, m.profile?.nom ?? m.member_id)}
                onPermissionChange={(key, val) => handlePermissionChange(m, key, val)}
              />
            ))
          )}
        </div>
      </div>

      {/* Équipes que j'ai rejointes */}
      {joinedTeams.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border1)' }}>
            <h3 className="font-syne font-bold text-sm text-text1">Équipes que j'ai rejointes</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Données auxquelles tu as accès</p>
          </div>
          {joinedTeams.map((m) => (
            <MemberRow
              key={m.id}
              m={m}
              isOwner={false}
              onRemove={() => {}}
              onPermissionChange={() => {}}
            />
          ))}
        </div>
      )}

      {/* Invitations en attente */}
      {pendingInvitations.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border1)' }}>
            <h3 className="font-syne font-bold text-sm text-text1">
              Invitations en attente
              <span className="ml-2 badge text-xs" style={{ background: 'rgba(59,130,246,0.14)', color: '#3B82F6' }}>
                {pendingInvitations.length}
              </span>
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border1)' }}>
            {pendingInvitations.map((inv) => (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={14} style={{ color: '#3B82F6' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: 'var(--text1)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.to_email}</p>
                  <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>
                    Envoyé le {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => copyLink(inv.token, inv.id)} className="btn-ghost" style={{ padding: 6 }} title="Copier le lien">
                    {copiedId === inv.id ? <Check size={13} style={{ color: '#3B82F6' }} /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => handleCancelInvitation(inv.id, inv.to_email)} className="btn-ghost" style={{ padding: 6 }} title="Annuler">
                    <Trash2 size={13} style={{ color: 'var(--text3)' }} />
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

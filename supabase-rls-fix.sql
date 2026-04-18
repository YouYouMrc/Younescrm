-- ══════════════════════════════════════════════════════════════════
-- FIX RLS — younes-crm
-- À coller dans : Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════

-- ── TABLE : invitations ──────────────────────────────────────────

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "invitations_select" ON public.invitations;
DROP POLICY IF EXISTS "invitations_insert" ON public.invitations;
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;
DROP POLICY IF EXISTS "invitations_delete" ON public.invitations;

-- Lecture : invitations en attente lisibles par token (lien d'invitation)
--           + l'expéditeur voit toutes ses invitations
--           + le destinataire voit ses invitations
CREATE POLICY "invitations_select" ON public.invitations
  FOR SELECT USING (
    status = 'pending'
    OR from_user_id = auth.uid()
    OR to_email = auth.email()
  );

-- Création : un utilisateur authentifié peut créer ses propres invitations
CREATE POLICY "invitations_insert" ON public.invitations
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Mise à jour : l'expéditeur ou le destinataire peut mettre à jour
CREATE POLICY "invitations_update" ON public.invitations
  FOR UPDATE USING (
    from_user_id = auth.uid() OR to_email = auth.email()
  );

-- Suppression : seul l'expéditeur peut annuler
CREATE POLICY "invitations_delete" ON public.invitations
  FOR DELETE USING (from_user_id = auth.uid());

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;


-- ── TABLE : workspace_members ────────────────────────────────────

DROP POLICY IF EXISTS "workspace_members_select" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON public.workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON public.workspace_members;

-- Lecture : le propriétaire du workspace OU le membre lui-même
CREATE POLICY "workspace_members_select" ON public.workspace_members
  FOR SELECT USING (
    owner_id = auth.uid() OR member_id = auth.uid()
  );

-- Insertion : un utilisateur peut s'ajouter lui-même comme membre
CREATE POLICY "workspace_members_insert" ON public.workspace_members
  FOR INSERT WITH CHECK (member_id = auth.uid());

-- Suppression : seul le propriétaire peut retirer un membre
CREATE POLICY "workspace_members_delete" ON public.workspace_members
  FOR DELETE USING (owner_id = auth.uid());

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;


-- ── TABLE : profiles ─────────────────────────────────────────────

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_upsert" ON public.profiles;

-- Lecture : tout utilisateur authentifié peut voir tous les profils
-- (nécessaire pour afficher les membres de l'équipe)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);

-- Création et mise à jour : uniquement son propre profil
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════
-- FIN DU SCRIPT
-- ══════════════════════════════════════════════════════════════════

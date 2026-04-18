-- ══════════════════════════════════════════════════════════════════
-- YOUNES CRM — SQL FINAL PROPRE
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Supprimer TOUTES les anciennes policies ────────────────────

DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
    WHERE tablename IN ('profiles','invitations','workspace_members','leads','prospects','clients','projets','ressources','activites')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Supprimer l'ancien trigger email (on utilise la Edge Function maintenant)
DROP TRIGGER IF EXISTS on_invitation_created ON invitations;
DROP FUNCTION IF EXISTS send_invitation_email();

-- ── 2. Activer RLS sur toutes les tables ─────────────────────────

ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads             ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ressources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE activites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- ── 3. PROFILES ───────────────────────────────────────────────────
-- Tout le monde peut lire les profils (nécessaire pour la page Équipe)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- Chacun gère uniquement son propre profil
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- ── 4. INVITATIONS ────────────────────────────────────────────────
-- Lecture : ses propres invitations + invitations en attente (pour les liens)
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT USING (
    from_user_id = auth.uid()
    OR status = 'pending'
    OR to_email = auth.email()
  );

-- Création : uniquement ses propres invitations
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Mise à jour : l'expéditeur ou le destinataire (pour accepter)
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE USING (
    from_user_id = auth.uid() OR to_email = auth.email()
  );

-- Suppression : uniquement l'expéditeur
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE USING (from_user_id = auth.uid());

-- ── 5. WORKSPACE MEMBERS ──────────────────────────────────────────
-- Lecture : le propriétaire ou le membre peut voir
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (owner_id = auth.uid() OR member_id = auth.uid());

-- Insertion : tout utilisateur authentifié (pour rejoindre une équipe)
CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Suppression : seul le propriétaire peut retirer un membre
CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE USING (owner_id = auth.uid());

-- ── 6. DONNÉES UTILISATEUR ────────────────────────────────────────
-- Chaque utilisateur voit et gère uniquement ses propres données

CREATE POLICY "leads_own" ON leads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prospects_own" ON prospects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_own" ON clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projets_own" ON projets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ressources_own" ON ressources
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activites_own" ON activites
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── 7. TRIGGER : créer profil automatiquement à l'inscription ─────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nom)
  VALUES (new.id, new.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 8. PARTAGE DE DONNÉES ENTRE MEMBRES D'UNE MÊME ÉQUIPE ───────

-- Fonction helper : vérifie si deux users sont dans la même équipe
CREATE OR REPLACE FUNCTION same_team(uid1 uuid, uid2 uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE (owner_id = uid1 AND member_id = uid2)
       OR (owner_id = uid2 AND member_id = uid1)
  );
$$;

-- Leads : l'owner OU un membre de l'équipe peut LIRE (pas modifier)
DROP POLICY IF EXISTS "leads_own" ON leads;
CREATE POLICY "leads_own" ON leads
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "leads_team_read" ON leads;
CREATE POLICY "leads_team_read" ON leads
  FOR SELECT USING (same_team(auth.uid(), user_id));

-- Clients : même logique
DROP POLICY IF EXISTS "clients_own" ON clients;
CREATE POLICY "clients_own" ON clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_team_read" ON clients;
CREATE POLICY "clients_team_read" ON clients
  FOR SELECT USING (same_team(auth.uid(), user_id));

-- Projets : même logique
DROP POLICY IF EXISTS "projets_own" ON projets;
CREATE POLICY "projets_own" ON projets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projets_team_read" ON projets;
CREATE POLICY "projets_team_read" ON projets
  FOR SELECT USING (same_team(auth.uid(), user_id));

-- ══════════════════════════════════════════════════════════════════
-- FIN — tout est propre ✓
-- ══════════════════════════════════════════════════════════════════

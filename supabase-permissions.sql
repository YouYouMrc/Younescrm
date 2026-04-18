-- ══════════════════════════════════════════════════════════════════
-- YOUNES CRM — Système de permissions par membre d'équipe
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Colonne permissions sur workspace_members ──────────────────
ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS permissions JSONB
  DEFAULT '{"leads": true, "prospects": true, "clients": true, "projets": true, "ressources": true}'::jsonb;

-- Mettre à jour les lignes existantes qui n'ont pas encore de permissions
UPDATE workspace_members
  SET permissions = '{"leads": true, "prospects": true, "clients": true, "projets": true, "ressources": true}'::jsonb
  WHERE permissions IS NULL;

-- ── 2. Policy UPDATE pour que le propriétaire puisse changer les permissions ──
DROP POLICY IF EXISTS "workspace_members_update" ON workspace_members;
CREATE POLICY "workspace_members_update" ON workspace_members
  FOR UPDATE USING (owner_id = auth.uid());

-- ── 3. Fonction de vérification de permission ─────────────────────
-- Retourne true si l'utilisateur connecté est membre du workspace
-- de owner_uid ET a la permission pour ce resource_name
CREATE OR REPLACE FUNCTION team_permission(resource_name text, owner_uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE owner_id = owner_uid
      AND member_id = auth.uid()
      AND COALESCE((permissions->>resource_name)::boolean, false) = true
  );
$$;

-- ── 4. Mettre à jour les policies RLS pour chaque table ──────────

-- LEADS
DROP POLICY IF EXISTS "leads_team_read" ON leads;
CREATE POLICY "leads_team_read" ON leads
  FOR SELECT USING (team_permission('leads', user_id));

-- PROSPECTS
DROP POLICY IF EXISTS "prospects_team_read" ON prospects;
CREATE POLICY "prospects_team_read" ON prospects
  FOR SELECT USING (team_permission('prospects', user_id));

-- CLIENTS
DROP POLICY IF EXISTS "clients_team_read" ON clients;
CREATE POLICY "clients_team_read" ON clients
  FOR SELECT USING (team_permission('clients', user_id));

-- PROJETS
DROP POLICY IF EXISTS "projets_team_read" ON projets;
CREATE POLICY "projets_team_read" ON projets
  FOR SELECT USING (team_permission('projets', user_id));

-- RESSOURCES
DROP POLICY IF EXISTS "ressources_team_read" ON ressources;
CREATE POLICY "ressources_team_read" ON ressources
  FOR SELECT USING (team_permission('ressources', user_id));

-- ══════════════════════════════════════════════════════════════════
-- FIN ✓
-- ══════════════════════════════════════════════════════════════════

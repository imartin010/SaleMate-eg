-- ============================================
-- PHASE 4: SYSTEM DATA CONSOLIDATION
-- Consolidate: entities + auth_sessions → system_data
-- ============================================
-- This creates a unified system_data table for reference data and auth

BEGIN;

-- ============================================
-- Step 1: Create the unified system_data table
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Data classification
  data_type TEXT NOT NULL CHECK (data_type IN (
    'entity',        -- Developer, partner, integration
    'auth_session',  -- OTP, session, token
    'config'         -- System configuration
  )),
  
  data_category TEXT, -- Subcategory based on data_type
  
  -- Entity-specific fields
  entity_type TEXT CHECK (entity_type IN ('developer', 'partner', 'ad_integration', 'organization')),
  entity_name TEXT,
  entity_status TEXT,
  description TEXT,
  logo_path TEXT,
  website TEXT,
  commission_rate NUMERIC(5,2),
  
  -- Auth session-specific fields
  session_type TEXT CHECK (session_type IN ('otp_challenge', 'otp_attempt', 'session', 'token')),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT,
  code_hash TEXT,
  channel TEXT CHECK (channel IN ('sms', 'email', 'whatsapp')),
  phone_number TEXT,
  email TEXT,
  attempt_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  
  -- API credentials (for integrations)
  api_credentials JSONB,
  
  -- Contact info (for entities)
  contact_info JSONB,
  
  -- Status
  status TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Flexible data storage
  metadata JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_data IS 'Unified system data - entities, auth sessions, and configuration';

-- ============================================
-- Step 2: Create indexes
-- ============================================

-- Primary access patterns
CREATE INDEX idx_system_data_type_category ON public.system_data(data_type, data_category);
CREATE INDEX idx_system_data_created ON public.system_data(created_at DESC);

-- Entity queries
CREATE INDEX idx_system_data_entity ON public.system_data(entity_type, entity_name) 
  WHERE data_type = 'entity';
CREATE INDEX idx_system_data_entity_status ON public.system_data(entity_type, entity_status) 
  WHERE data_type = 'entity';
CREATE INDEX idx_system_data_entity_active ON public.system_data(entity_type, is_active) 
  WHERE data_type = 'entity' AND is_active = true;

-- Auth session queries
CREATE INDEX idx_system_data_session ON public.system_data(profile_id, session_type, created_at DESC) 
  WHERE data_type = 'auth_session';
CREATE INDEX idx_system_data_token ON public.system_data(session_token) 
  WHERE data_type = 'auth_session' AND session_token IS NOT NULL;
CREATE INDEX idx_system_data_phone ON public.system_data(phone_number) 
  WHERE data_type = 'auth_session' AND phone_number IS NOT NULL;
CREATE INDEX idx_system_data_email_session ON public.system_data(email) 
  WHERE data_type = 'auth_session' AND email IS NOT NULL;
CREATE INDEX idx_system_data_expires ON public.system_data(expires_at) 
  WHERE data_type = 'auth_session' AND expires_at IS NOT NULL;

-- JSONB indexes
CREATE INDEX idx_system_data_metadata ON public.system_data USING GIN(metadata);
CREATE INDEX idx_system_data_credentials ON public.system_data USING GIN(api_credentials) 
  WHERE api_credentials IS NOT NULL;

-- ============================================
-- Step 3: Enable RLS
-- ============================================

ALTER TABLE public.system_data ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active entities
CREATE POLICY "Anyone can view active entities"
  ON public.system_data
  FOR SELECT
  USING (
    data_type = 'entity' AND is_active = true
  );

-- Policy: Users can view their own auth sessions
CREATE POLICY "Users can view their own auth sessions"
  ON public.system_data
  FOR SELECT
  USING (
    data_type = 'auth_session' AND profile_id = auth.uid()
  );

-- Policy: Admins can manage all system data
CREATE POLICY "Admins can manage all system data"
  ON public.system_data
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================
-- Step 4: Create updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_system_data_updated_at ON public.system_data;
CREATE TRIGGER update_system_data_updated_at
  BEFORE UPDATE ON public.system_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Step 5: Migrate entities table
-- ============================================

INSERT INTO public.system_data (
  id,
  data_type,
  data_category,
  entity_type,
  entity_name,
  entity_status,
  description,
  logo_path,
  website,
  commission_rate,
  contact_info,
  api_credentials,
  status,
  is_active,
  metadata,
  created_at,
  updated_at
)
SELECT 
  e.id,
  'entity' AS data_type,
  e.entity_type AS data_category,
  e.entity_type,
  e.name AS entity_name,
  e.status AS entity_status,
  e.description,
  e.logo_path,
  e.website,
  e.commission_rate,
  jsonb_build_object(
    'email', e.email,
    'phone', e.phone
  ) AS contact_info,
  e.api_credentials,
  e.status,
  (e.status = 'active') AS is_active,
  jsonb_build_object('source', 'entities') || COALESCE(e.metadata, '{}'::jsonb) AS metadata,
  e.created_at,
  e.updated_at
FROM public.entities e
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 6: Migrate auth_sessions table
-- ============================================

INSERT INTO public.system_data (
  id,
  data_type,
  data_category,
  session_type,
  profile_id,
  session_token,
  code_hash,
  channel,
  phone_number,
  email,
  attempt_count,
  verified,
  verified_at,
  expires_at,
  last_attempt_at,
  context,
  metadata,
  created_at,
  updated_at
)
SELECT 
  a.id,
  'auth_session' AS data_type,
  a.session_type AS data_category,
  a.session_type,
  a.profile_id,
  a.session_token,
  a.code_hash,
  a.channel,
  a.phone_number,
  a.email,
  COALESCE(a.attempt_count, 0) AS attempt_count,
  COALESCE(a.verified, FALSE) AS verified,
  a.verified_at,
  a.expires_at,
  a.last_attempt_at,
  COALESCE(a.context, '{}'::jsonb) AS context,
  jsonb_build_object('source', 'auth_sessions') || COALESCE(a.metadata, '{}'::jsonb) AS metadata,
  a.created_at,
  a.updated_at
FROM public.auth_sessions a
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 7: Create compatibility views
-- ============================================

-- Entities view
CREATE OR REPLACE VIEW public.entities AS
SELECT
  sd.id,
  sd.entity_type,
  sd.entity_name AS name,
  sd.entity_status AS status,
  sd.description,
  sd.logo_path,
  sd.website,
  sd.commission_rate,
  sd.contact_info->>'email' AS email,
  sd.contact_info->>'phone' AS phone,
  sd.api_credentials,
  sd.is_active,
  sd.metadata,
  sd.created_at,
  sd.updated_at
FROM public.system_data sd
WHERE sd.data_type = 'entity';

COMMENT ON VIEW public.entities IS 'Compatibility view - backed by system_data table';

-- Auth sessions view
CREATE OR REPLACE VIEW public.auth_sessions AS
SELECT
  sd.id,
  sd.session_type,
  sd.profile_id,
  sd.session_token,
  sd.code_hash,
  sd.channel,
  sd.phone_number,
  sd.email,
  sd.attempt_count,
  sd.verified,
  sd.verified_at,
  sd.expires_at,
  sd.last_attempt_at,
  sd.context,
  sd.metadata,
  sd.created_at,
  sd.updated_at
FROM public.system_data sd
WHERE sd.data_type = 'auth_session';

COMMENT ON VIEW public.auth_sessions IS 'Compatibility view - backed by system_data table';

-- ============================================
-- Step 8: Create triggers for compatibility views
-- ============================================

-- Entities view trigger
CREATE OR REPLACE FUNCTION public.sync_entities_to_system_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_data (
      data_type,
      data_category,
      entity_type,
      entity_name,
      entity_status,
      description,
      logo_path,
      website,
      commission_rate,
      contact_info,
      api_credentials,
      status,
      is_active,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      'entity',
      NEW.entity_type,
      NEW.entity_type,
      NEW.name,
      NEW.status,
      NEW.description,
      NEW.logo_path,
      NEW.website,
      NEW.commission_rate,
      jsonb_build_object('email', NEW.email, 'phone', NEW.phone),
      NEW.api_credentials,
      NEW.status,
      COALESCE(NEW.is_active, NEW.status = 'active'),
      COALESCE(NEW.metadata, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.system_data SET
      entity_name = NEW.name,
      entity_status = NEW.status,
      description = NEW.description,
      logo_path = NEW.logo_path,
      website = NEW.website,
      commission_rate = NEW.commission_rate,
      contact_info = jsonb_build_object('email', NEW.email, 'phone', NEW.phone),
      status = NEW.status,
      is_active = NEW.is_active,
      updated_at = now()
    WHERE id = NEW.id AND data_type = 'entity';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.system_data WHERE id = OLD.id AND data_type = 'entity';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_entities_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.entities
FOR EACH ROW EXECUTE FUNCTION public.sync_entities_to_system_data();

-- Auth sessions view trigger
CREATE OR REPLACE FUNCTION public.sync_auth_sessions_to_system_data()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_data (
      data_type,
      data_category,
      session_type,
      profile_id,
      session_token,
      code_hash,
      channel,
      phone_number,
      email,
      attempt_count,
      verified,
      verified_at,
      expires_at,
      context,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      'auth_session',
      NEW.session_type,
      NEW.session_type,
      NEW.profile_id,
      NEW.session_token,
      NEW.code_hash,
      NEW.channel,
      NEW.phone_number,
      NEW.email,
      COALESCE(NEW.attempt_count, 0),
      COALESCE(NEW.verified, FALSE),
      NEW.verified_at,
      NEW.expires_at,
      COALESCE(NEW.context, '{}'::jsonb),
      COALESCE(NEW.metadata, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.system_data SET
      attempt_count = NEW.attempt_count,
      verified = NEW.verified,
      verified_at = NEW.verified_at,
      last_attempt_at = NEW.last_attempt_at,
      context = NEW.context,
      updated_at = now()
    WHERE id = NEW.id AND data_type = 'auth_session';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.system_data WHERE id = OLD.id AND data_type = 'auth_session';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auth_sessions_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.auth_sessions
FOR EACH ROW EXECUTE FUNCTION public.sync_auth_sessions_to_system_data();

-- ============================================
-- Step 9: Drop old tables
-- ============================================

DO $$
BEGIN
  -- Drop entities table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'entities'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.entities CASCADE;
    RAISE NOTICE '✅ Dropped entities table';
  END IF;
  
  -- Drop auth_sessions table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'auth_sessions'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.auth_sessions CASCADE;
    RAISE NOTICE '✅ Dropped auth_sessions table';
  END IF;
END $$;

COMMIT;

-- ============================================
-- Verification and final summary
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_entities INTEGER;
  v_auth_sessions INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO v_entities
  FROM public.system_data WHERE data_type = 'entity';
  
  SELECT COUNT(*) INTO v_auth_sessions
  FROM public.system_data WHERE data_type = 'auth_session';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 4 COMPLETE: System data consolidation';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Consolidated: entities + auth_sessions → system_data';
  RAISE NOTICE 'Entities migrated: %', v_entities;
  RAISE NOTICE 'Auth sessions migrated: %', v_auth_sessions;
  RAISE NOTICE 'Views created: 2 (entities, auth_sessions)';
  RAISE NOTICE 'Current table count: %', v_table_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ALL CONSOLIDATION PHASES COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Starting tables: 15';
  RAISE NOTICE 'Final tables: %', v_table_count;
  RAISE NOTICE 'Reduction: % tables removed', 15 - v_table_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Final schema:';
  RAISE NOTICE '  1. profiles';
  RAISE NOTICE '  2. leads';
  RAISE NOTICE '  3. projects';
  RAISE NOTICE '  4. teams';
  RAISE NOTICE '  5. team_members';
  RAISE NOTICE '  6. events (was: activities + notifications + system_logs)';
  RAISE NOTICE '  7. transactions (was: commerce + payments + wallet_ledger)';
  RAISE NOTICE '  8. content (enhanced with metrics)';
  RAISE NOTICE '  9. system_data (was: entities + auth_sessions)';
  RAISE NOTICE '  10. salemate-inventory (unchanged)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Regenerate TypeScript types: bash regenerate_types.sh';
  RAISE NOTICE '2. Test all application features thoroughly';
  RAISE NOTICE '3. Verify data integrity';
  RAISE NOTICE '4. Update documentation';
  RAISE NOTICE '========================================';
END $$;


-- ============================================
-- CMS TABLES FOR SALEMATE ADMIN PANEL
-- ============================================
-- Creates tables for:
-- 1. CMS pages (marketing content)
-- 2. Media library
-- 3. Email templates
-- 4. SMS templates
-- 5. System settings
-- 6. Feature flags
-- 7. Dashboard banners
-- 8. Audit logs
-- 9. Banner metrics
-- ============================================

-- STEP 1: CMS Pages
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    content_json jsonb NOT NULL DEFAULT '{}',
    meta jsonb DEFAULT '{}',
    published_at timestamptz,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_pages_created_by ON public.cms_pages(created_by);

-- STEP 2: CMS Media Library
-- ============================================

CREATE TABLE IF NOT EXISTS public.cms_media (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket text NOT NULL,
    path text NOT NULL,
    alt text,
    width int,
    height int,
    size_bytes bigint,
    mime_type text,
    meta jsonb DEFAULT '{}',
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cms_media_bucket_path ON public.cms_media(bucket, path);
CREATE INDEX IF NOT EXISTS idx_cms_media_created_by ON public.cms_media(created_by);

-- STEP 3: Email Templates
-- ============================================

CREATE TABLE IF NOT EXISTS public.templates_email (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    name text NOT NULL,
    subject text NOT NULL,
    html text NOT NULL,
    variables text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_email_key ON public.templates_email(key);
CREATE INDEX IF NOT EXISTS idx_templates_email_status ON public.templates_email(status);

-- STEP 4: SMS Templates
-- ============================================

CREATE TABLE IF NOT EXISTS public.templates_sms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    name text NOT NULL,
    body text NOT NULL,
    variables text[] DEFAULT '{}',
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_sms_key ON public.templates_sms(key);
CREATE INDEX IF NOT EXISTS idx_templates_sms_status ON public.templates_sms(status);

-- STEP 5: System Settings
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_updated_by ON public.system_settings(updated_by);

-- STEP 6: Feature Flags
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_flags (
    key text PRIMARY KEY,
    description text,
    enabled boolean NOT NULL DEFAULT false,
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(enabled);

-- STEP 7: Dashboard Banners
-- ============================================

CREATE TABLE IF NOT EXISTS public.dashboard_banners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    subtitle text,
    cta_label text,
    cta_url text,
    image_url text,
    placement text NOT NULL,
    audience text[] DEFAULT '{}',
    visibility_rules jsonb DEFAULT '{}',
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'archived')),
    start_at timestamptz,
    end_at timestamptz,
    priority int NOT NULL DEFAULT 100,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_banners_status ON public.dashboard_banners(status);
CREATE INDEX IF NOT EXISTS idx_dashboard_banners_placement ON public.dashboard_banners(placement);
CREATE INDEX IF NOT EXISTS idx_dashboard_banners_start_at ON public.dashboard_banners(start_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_banners_end_at ON public.dashboard_banners(end_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_banners_priority ON public.dashboard_banners(priority);

-- STEP 8: Audit Logs
-- ============================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    changes jsonb,
    context jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- STEP 9: Banner Metrics (Optional Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS public.banner_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    banner_id uuid REFERENCES public.dashboard_banners(id) ON DELETE CASCADE,
    viewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    event text NOT NULL CHECK (event IN ('impression', 'click')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banner_metrics_banner_id ON public.banner_metrics(banner_id);
CREATE INDEX IF NOT EXISTS idx_banner_metrics_viewer_id ON public.banner_metrics(viewer_id);
CREATE INDEX IF NOT EXISTS idx_banner_metrics_event ON public.banner_metrics(event);

-- STEP 10: Helper function to check if user is admin
-- ============================================

-- Drop existing function if it exists (to avoid parameter name conflicts)
DROP FUNCTION IF EXISTS public.is_admin(uuid);

CREATE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN user_role = 'admin';
END;
$$;

-- STEP 11: RLS Policies for CMS Tables
-- ============================================

-- Enable RLS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banner_metrics ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins full access to cms_pages"
    ON public.cms_pages FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to cms_media"
    ON public.cms_media FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to templates_email"
    ON public.templates_email FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to templates_sms"
    ON public.templates_sms FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to system_settings"
    ON public.system_settings FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to feature_flags"
    ON public.feature_flags FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to dashboard_banners"
    ON public.dashboard_banners FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins full access to audit_logs"
    ON public.audit_logs FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Support can read templates (for reference)
CREATE POLICY "Support can read templates_email"
    ON public.templates_email FOR SELECT
    USING (public.is_user_role(auth.uid(), ARRAY['admin', 'support']));

CREATE POLICY "Support can read templates_sms"
    ON public.templates_sms FOR SELECT
    USING (public.is_user_role(auth.uid(), ARRAY['admin', 'support']));

-- Users can view live published content
CREATE POLICY "Users can view published cms_pages"
    ON public.cms_pages FOR SELECT
    USING (status = 'published' OR public.is_admin(auth.uid()));

-- Banner metrics: users can insert their own
CREATE POLICY "Users can track banner metrics"
    ON public.banner_metrics FOR INSERT
    WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Admins can view banner metrics"
    ON public.banner_metrics FOR SELECT
    USING (public.is_admin(auth.uid()));

-- STEP 12: Update triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cms_pages_updated_at BEFORE UPDATE ON public.cms_pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_email_updated_at BEFORE UPDATE ON public.templates_email
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_sms_updated_at BEFORE UPDATE ON public.templates_sms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_banners_updated_at BEFORE UPDATE ON public.dashboard_banners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

-- Check all tables were created
SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
    'cms_pages',
    'cms_media',
    'templates_email',
    'templates_sms',
    'system_settings',
    'feature_flags',
    'dashboard_banners',
    'audit_logs',
    'banner_metrics'
)
ORDER BY table_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ CMS tables created successfully!' as status;


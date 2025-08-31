-- SaleMate Database Initial Migration
-- This migration creates the complete database schema for the SaleMate platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types/enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'support', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE platform_type AS ENUM ('Facebook', 'Google', 'TikTok', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_stage AS ENUM (
        'New Lead', 'Potential', 'Hot Case', 'Meeting Done',
        'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('Instapay', 'VodafoneCash', 'BankTransfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE support_status AS ENUM ('open', 'in_progress', 'resolved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE partner_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    manager_id UUID REFERENCES profiles(id),
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    developer TEXT NOT NULL,
    region TEXT NOT NULL,
    available_leads INTEGER DEFAULT 0,
    price_per_lead NUMERIC(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    buyer_user_id UUID REFERENCES profiles(id),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    platform platform_type NOT NULL,
    stage lead_stage NOT NULL DEFAULT 'New Lead',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity >= 50),
    payment_method payment_method_type NOT NULL,
    status order_status NOT NULL DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create support_cases table
CREATE TABLE IF NOT EXISTS support_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status support_status NOT NULL DEFAULT 'open',
    priority priority_level DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    commission_rate NUMERIC(5,2) NOT NULL,
    logo_path TEXT,
    website TEXT,
    status partner_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table (community)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create recent_activity table for tracking
CREATE TABLE IF NOT EXISTS recent_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lead_analytics_mv materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS lead_analytics_mv AS
SELECT 
    p.id as user_id,
    p.name,
    p.role,
    p.manager_id,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.stage = 'New Lead' THEN 1 END) as new_leads,
    COUNT(CASE WHEN l.stage = 'Potential' THEN 1 END) as potential_leads,
    COUNT(CASE WHEN l.stage = 'Hot Case' THEN 1 END) as hot_leads,
    COUNT(CASE WHEN l.stage = 'Meeting Done' THEN 1 END) as meeting_done,
    COUNT(CASE WHEN l.stage = 'No Answer' THEN 1 END) as no_answer,
    COUNT(CASE WHEN l.stage = 'Call Back' THEN 1 END) as call_back,
    COUNT(CASE WHEN l.stage = 'Whatsapp' THEN 1 END) as whatsapp,
    COUNT(CASE WHEN l.stage = 'Wrong Number' THEN 1 END) as wrong_number,
    COUNT(CASE WHEN l.stage = 'Non Potential' THEN 1 END) as non_potential,
    CASE 
        WHEN COUNT(l.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN l.stage = 'Meeting Done' THEN 1 END)::NUMERIC / COUNT(l.id)::NUMERIC) * 100, 2)
        ELSE 0 
    END as conversion_rate,
    COUNT(o.id) as total_orders,
    COALESCE(SUM(CASE WHEN o.status = 'confirmed' THEN o.total_amount ELSE 0 END), 0) as total_spent,
    p.created_at as joined_at,
    NOW() as last_updated
FROM profiles p
LEFT JOIN leads l ON p.id = l.buyer_user_id
LEFT JOIN orders o ON p.id = o.user_id
GROUP BY p.id, p.name, p.role, p.manager_id, p.created_at;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);
CREATE INDEX IF NOT EXISTS idx_projects_available_leads ON projects(available_leads);

CREATE INDEX IF NOT EXISTS idx_leads_project_id ON leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_user_id ON leads(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_platform ON leads(platform);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_support_cases_created_by ON support_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_support_cases_assigned_to ON support_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

CREATE INDEX IF NOT EXISTS idx_recent_activity_user_id ON recent_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_recent_activity_created_at ON recent_activity(created_at);

-- Create unique constraint for phone per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_project_phone_unique 
ON leads(project_id, client_phone) 
WHERE buyer_user_id IS NULL;

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Managers can view team member profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role = 'manager' 
            AND p2.id = profiles.manager_id
        )
    );

CREATE POLICY "Support and Admin can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Only Admin can update role, manager_id, and is_banned" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p2 
            WHERE p2.id = auth.uid() 
            AND p2.role = 'admin'
        )
    );

CREATE POLICY "Users can update their own basic info" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "All authenticated users can view projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only Admin and Support can modify projects" ON projects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'support')
        )
    );

-- RLS Policies for leads table
CREATE POLICY "Users can view their own leads" ON leads
    FOR SELECT USING (buyer_user_id = auth.uid());

CREATE POLICY "Managers can view team member leads" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'manager' 
            AND buyer_user_id IN (
                SELECT id FROM profiles WHERE manager_id = p.id OR id = p.id
            )
        )
    );

CREATE POLICY "Support and Admin can view all leads" ON leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Only Admin and Support can insert leads" ON leads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'support')
        )
    );

CREATE POLICY "Lead owners can update stage and feedback" ON leads
    FOR UPDATE USING (buyer_user_id = auth.uid());

CREATE POLICY "Support and Admin can fully update leads" ON leads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Only Support and Admin can delete leads" ON leads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

-- RLS Policies for orders table
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view team member orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'manager' 
            AND user_id IN (
                SELECT id FROM profiles WHERE manager_id = p.id OR id = p.id
            )
        )
    );

CREATE POLICY "Support and Admin can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        AND quantity >= 50
    );

CREATE POLICY "Users can update payment_reference on their orders" ON orders
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Support and Admin can fully update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

-- RLS Policies for support_cases table
CREATE POLICY "Users can view their own support cases" ON support_cases
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can view assigned support cases" ON support_cases
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Support and Admin can view all support cases" ON support_cases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Authenticated users can create support cases" ON support_cases
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND created_by = auth.uid()
    );

CREATE POLICY "Assigned users can update support cases" ON support_cases
    FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Support and Admin can update all support cases" ON support_cases
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

-- RLS Policies for partners table
CREATE POLICY "All authenticated users can view partners" ON partners
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only Admin and Support can modify partners" ON partners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'support')
        )
    );

-- RLS Policies for posts table
CREATE POLICY "All authenticated users can view posts" ON posts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create posts" ON posts
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND author_id = auth.uid()
    );

CREATE POLICY "Post authors can update their posts" ON posts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Support and Admin can update all posts" ON posts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Post authors can delete their posts" ON posts
    FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Support and Admin can delete all posts" ON posts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

-- RLS Policies for comments table
CREATE POLICY "All authenticated users can view comments" ON comments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND author_id = auth.uid()
    );

CREATE POLICY "Comment authors can update their comments" ON comments
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Support and Admin can update all comments" ON comments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

CREATE POLICY "Comment authors can delete their comments" ON comments
    FOR DELETE USING (author_id = auth.uid());

CREATE POLICY "Support and Admin can delete all comments" ON comments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

-- RLS Policies for recent_activity table
CREATE POLICY "Users can view their own activity" ON recent_activity
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can view team member activity" ON recent_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'manager' 
            AND user_id IN (
                SELECT id FROM profiles WHERE manager_id = p.id OR id = p.id
            )
        )
    );

CREATE POLICY "Support and Admin can view all activity" ON recent_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('support', 'admin')
        )
    );

-- Create RPC Functions

-- Function to get team user IDs for a manager
CREATE OR REPLACE FUNCTION rpc_team_user_ids(manager_id UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT id FROM profiles 
        WHERE manager_id = rpc_team_user_ids.manager_id 
        OR id = rpc_team_user_ids.manager_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start an order
CREATE OR REPLACE FUNCTION rpc_start_order(
    user_id UUID,
    project_id UUID,
    quantity INTEGER,
    payment_method TEXT
)
RETURNS JSON AS $$
DECLARE
    order_id UUID;
    total_amount NUMERIC(10,2);
    available_leads_count INTEGER;
    price_per_lead NUMERIC(10,2);
BEGIN
    -- Validate minimum quantity
    IF quantity < 50 THEN
        RAISE EXCEPTION 'Minimum order quantity is 50 leads';
    END IF;

    -- Check if project exists and has enough leads
    SELECT available_leads, price_per_lead INTO available_leads_count, price_per_lead
    FROM projects WHERE id = project_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;
    
    IF available_leads_count < quantity THEN
        RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', available_leads_count, quantity;
    END IF;

    -- Calculate total amount
    total_amount := quantity * price_per_lead;
    
    -- Create order
    INSERT INTO orders (user_id, project_id, quantity, payment_method, total_amount)
    VALUES (user_id, project_id, quantity, payment_method, total_amount)
    RETURNING id INTO order_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (user_id, 'order_started', jsonb_build_object(
        'order_id', order_id,
        'project_id', project_id,
        'quantity', quantity,
        'total_amount', total_amount
    ));

    RETURN jsonb_build_object(
        'order_id', order_id,
        'total_amount', total_amount,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to confirm an order (only support/admin or Edge Function)
CREATE OR REPLACE FUNCTION rpc_confirm_order(
    order_id UUID,
    payment_reference TEXT
)
RETURNS JSON AS $$
DECLARE
    order_record RECORD;
    project_record RECORD;
    leads_to_assign INTEGER;
    assigned_leads INTEGER;
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF order_record.status != 'pending' THEN
        RAISE EXCEPTION 'Order is not in pending status';
    END IF;

    -- Get project details
    SELECT * INTO project_record FROM projects WHERE id = order_record.project_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Project not found';
    END IF;

    -- Check if enough leads are available
    IF project_record.available_leads < order_record.quantity THEN
        RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', 
                       project_record.available_leads, order_record.quantity;
    END IF;

    -- Start transaction
    BEGIN
        -- Update order status and payment reference
        UPDATE orders 
        SET status = 'confirmed', payment_reference = payment_reference
        WHERE id = order_id;

        -- Decrement available leads
        UPDATE projects 
        SET available_leads = available_leads - order_record.quantity
        WHERE id = order_record.project_id;

        -- Assign leads to the buyer (FIFO by created_at)
        WITH leads_to_assign AS (
            SELECT id FROM leads 
            WHERE project_id = order_record.project_id 
            AND buyer_user_id IS NULL
            ORDER BY created_at ASC
            LIMIT order_record.quantity
            FOR UPDATE SKIP LOCKED
        )
        UPDATE leads 
        SET buyer_user_id = order_record.user_id
        WHERE id IN (SELECT id FROM leads_to_assign);

        -- Get count of actually assigned leads
        GET DIAGNOSTICS assigned_leads = ROW_COUNT;

        -- Log activity
        INSERT INTO recent_activity (user_id, action, details)
        VALUES (order_record.user_id, 'order_confirmed', jsonb_build_object(
            'order_id', order_id,
            'project_id', order_record.project_id,
            'quantity', order_record.quantity,
            'assigned_leads', assigned_leads,
            'payment_reference', payment_reference
        ));

        -- Log project update
        INSERT INTO recent_activity (user_id, action, details)
        VALUES (order_record.user_id, 'leads_assigned', jsonb_build_object(
            'project_id', order_record.project_id,
            'leads_assigned', assigned_leads,
            'remaining_leads', project_record.available_leads - order_record.quantity
        ));

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to confirm order: %', SQLERRM;
    END;

    RETURN jsonb_build_object(
        'order_id', order_id,
        'status', 'confirmed',
        'leads_assigned', assigned_leads,
        'payment_reference', payment_reference
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fail an order
CREATE OR REPLACE FUNCTION rpc_fail_order(
    order_id UUID,
    reason TEXT
)
RETURNS JSON AS $$
DECLARE
    order_record RECORD;
BEGIN
    -- Get order details
    SELECT * INTO order_record FROM orders WHERE id = order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Update order status
    UPDATE orders SET status = 'failed' WHERE id = order_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (order_record.user_id, 'order_failed', jsonb_build_object(
        'order_id', order_id,
        'reason', reason
    ));

    RETURN jsonb_build_object(
        'order_id', order_id,
        'status', 'failed',
        'reason', reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reassign a lead (support/admin only)
CREATE OR REPLACE FUNCTION rpc_reassign_lead(
    lead_id UUID,
    to_user_id UUID
)
RETURNS JSON AS $$
DECLARE
    lead_record RECORD;
    user_record RECORD;
BEGIN
    -- Check if caller is support or admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('support', 'admin')
    ) THEN
        RAISE EXCEPTION 'Only support and admin users can reassign leads';
    END IF;

    -- Get lead details
    SELECT * INTO lead_record FROM leads WHERE id = lead_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead not found';
    END IF;

    -- Get user details
    SELECT * INTO user_record FROM profiles WHERE id = to_user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target user not found';
    END IF;

    -- Reassign lead
    UPDATE leads 
    SET buyer_user_id = to_user_id, updated_at = NOW()
    WHERE id = lead_id;

    -- Log activity
    INSERT INTO recent_activity (user_id, action, details)
    VALUES (to_user_id, 'lead_reassigned', jsonb_build_object(
        'lead_id', lead_id,
        'from_user_id', lead_record.buyer_user_id,
        'to_user_id', to_user_id,
        'reassigned_by', auth.uid()
    ));

    RETURN jsonb_build_object(
        'lead_id', lead_id,
        'new_owner_id', to_user_id,
        'status', 'reassigned'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lead statistics for a user
CREATE OR REPLACE FUNCTION rpc_leads_stats(for_user UUID)
RETURNS JSON AS $$
DECLARE
    stats RECORD;
BEGIN
    SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN stage = 'New Lead' THEN 1 END) as new_leads,
        COUNT(CASE WHEN stage = 'Potential' THEN 1 END) as potential_leads,
        COUNT(CASE WHEN stage = 'Hot Case' THEN 1 END) as hot_leads,
        COUNT(CASE WHEN stage = 'Meeting Done' THEN 1 END) as meeting_done,
        COUNT(CASE WHEN stage = 'No Answer' THEN 1 END) as no_answer,
        COUNT(CASE WHEN stage = 'Call Back' THEN 1 END) as call_back,
        COUNT(CASE WHEN stage = 'Whatsapp' THEN 1 END) as whatsapp,
        COUNT(CASE WHEN stage = 'Wrong Number' THEN 1 END) as wrong_number,
        COUNT(CASE WHEN stage = 'Non Potential' THEN 1 END) as non_potential,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(CASE WHEN stage = 'Meeting Done' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0 
        END as conversion_rate
    INTO stats
    FROM leads 
    WHERE buyer_user_id = for_user;

    RETURN jsonb_build_object(
        'total_leads', stats.total_leads,
        'new_leads', stats.new_leads,
        'potential_leads', stats.potential_leads,
        'hot_leads', stats.hot_leads,
        'meeting_done', stats.meeting_done,
        'no_answer', stats.no_answer,
        'call_back', stats.call_back,
        'whatsapp', stats.whatsapp,
        'wrong_number', stats.wrong_number,
        'non_potential', stats.non_potential,
        'conversion_rate', stats.conversion_rate
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers

-- Trigger to create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_cases_updated_at
    BEFORE UPDATE ON support_cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('partners-logos', 'partners-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for partner logos
CREATE POLICY "Anyone can view partner logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'partners-logos');

CREATE POLICY "Only admin and support can upload partner logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'partners-logos' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

CREATE POLICY "Only admin and support can update partner logos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'partners-logos' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

CREATE POLICY "Only admin and support can delete partner logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'partners-logos' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant storage permissions
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;

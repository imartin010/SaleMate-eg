-- Create wallet system and lead request functionality
-- This script creates all necessary tables and functions for the wallet and lead request system

-- 1. Create user_wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(3) DEFAULT 'EGP' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'payment', 'refund', 'lead_request')),
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    reference_id UUID, -- Reference to order, lead_request, etc.
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create lead_requests table
CREATE TABLE IF NOT EXISTS lead_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    price_per_lead DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    admin_notes TEXT,
    user_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_user_id ON lead_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_project_id ON lead_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON lead_requests(status);

-- 5. Create function to initialize wallet for new users
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'EGP');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create trigger to auto-create wallet for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_wallet();

-- 7. Create function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_transaction_type VARCHAR(20),
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
    v_transaction_id UUID;
    v_new_balance DECIMAL(10,2);
BEGIN
    -- Get or create wallet
    SELECT id INTO v_wallet_id FROM user_wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO user_wallets (user_id, balance) VALUES (p_user_id, 0.00) RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Calculate new balance
    IF p_transaction_type IN ('deposit', 'refund') THEN
        v_new_balance := (SELECT balance FROM user_wallets WHERE id = v_wallet_id) + p_amount;
    ELSIF p_transaction_type IN ('withdrawal', 'payment', 'lead_request') THEN
        v_new_balance := (SELECT balance FROM user_wallets WHERE id = v_wallet_id) - p_amount;
    END IF;
    
    -- Check if sufficient balance for withdrawal/payment
    IF p_transaction_type IN ('withdrawal', 'payment', 'lead_request') AND v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
    
    -- Update wallet balance
    UPDATE user_wallets 
    SET balance = v_new_balance, updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Create transaction record
    INSERT INTO wallet_transactions (
        wallet_id, user_id, type, amount, description, reference_id
    ) VALUES (
        v_wallet_id, p_user_id, p_transaction_type, p_amount, p_description, p_reference_id
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to create lead request
CREATE OR REPLACE FUNCTION create_lead_request(
    p_user_id UUID,
    p_project_id UUID,
    p_requested_quantity INTEGER,
    p_price_per_lead DECIMAL(10,2),
    p_user_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_total_amount DECIMAL(10,2);
    v_lead_request_id UUID;
    v_transaction_id UUID;
BEGIN
    -- Calculate total amount
    v_total_amount := p_requested_quantity * p_price_per_lead;
    
    -- Create lead request
    INSERT INTO lead_requests (
        user_id, project_id, requested_quantity, price_per_lead, 
        total_amount, user_notes
    ) VALUES (
        p_user_id, p_project_id, p_requested_quantity, p_price_per_lead,
        v_total_amount, p_user_notes
    ) RETURNING id INTO v_lead_request_id;
    
    -- Deduct amount from wallet
    v_transaction_id := update_wallet_balance(
        p_user_id,
        v_total_amount,
        'lead_request',
        'Lead request for project: ' || (SELECT name FROM projects WHERE id = p_project_id),
        v_lead_request_id
    );
    
    RETURN v_lead_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to get user wallet balance
CREATE OR REPLACE FUNCTION get_user_wallet_balance(p_user_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_balance DECIMAL(10,2);
BEGIN
    SELECT COALESCE(balance, 0.00) INTO v_balance 
    FROM user_wallets 
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(v_balance, 0.00);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to add money to wallet
CREATE OR REPLACE FUNCTION add_to_wallet(
    p_user_id UUID,
    p_amount DECIMAL(10,2),
    p_description TEXT DEFAULT 'Wallet deposit'
)
RETURNS UUID AS $$
BEGIN
    RETURN update_wallet_balance(p_user_id, p_amount, 'deposit', p_description);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create RLS policies
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_requests ENABLE ROW LEVEL SECURITY;

-- User wallets policies
CREATE POLICY "Users can view own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Wallet transactions policies
CREATE POLICY "Users can view own transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Lead requests policies
CREATE POLICY "Users can view own lead requests" ON lead_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create lead requests" ON lead_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead requests" ON lead_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies (for admin users - simplified without user_profiles dependency)
-- Note: You may need to adjust these policies based on your admin role system
CREATE POLICY "Admins can view all wallets" ON user_wallets
    FOR SELECT USING (
        -- For now, allow all authenticated users to view all wallets
        -- You can modify this based on your admin role system
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can view all transactions" ON wallet_transactions
    FOR SELECT USING (
        -- For now, allow all authenticated users to view all transactions
        -- You can modify this based on your admin role system
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can view all lead requests" ON lead_requests
    FOR SELECT USING (
        -- For now, allow all authenticated users to view all lead requests
        -- You can modify this based on your admin role system
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins can update lead requests" ON lead_requests
    FOR UPDATE USING (
        -- For now, allow all authenticated users to update lead requests
        -- You can modify this based on your admin role system
        auth.role() = 'authenticated'
    );

-- 12. Create view for user wallet summary
CREATE OR REPLACE VIEW user_wallet_summary AS
SELECT 
    uw.user_id,
    uw.balance,
    uw.currency,
    uw.created_at as wallet_created_at,
    uw.updated_at as last_updated,
    COUNT(wt.id) as total_transactions,
    COALESCE(SUM(CASE WHEN wt.type IN ('deposit', 'refund') THEN wt.amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN wt.type IN ('withdrawal', 'payment', 'lead_request') THEN wt.amount ELSE 0 END), 0) as total_spent
FROM user_wallets uw
LEFT JOIN wallet_transactions wt ON uw.id = wt.wallet_id
GROUP BY uw.user_id, uw.balance, uw.currency, uw.created_at, uw.updated_at;

-- 13. Create view for lead request details (simplified version)
CREATE OR REPLACE VIEW lead_request_details AS
SELECT 
    lr.id,
    lr.user_id,
    lr.project_id,
    p.name as project_name,
    'Unknown' as developer,  -- Will be updated based on actual projects table structure
    'Unknown' as region,     -- Will be updated based on actual projects table structure
    lr.requested_quantity,
    lr.price_per_lead,
    lr.total_amount,
    lr.status,
    lr.payment_status,
    lr.user_notes,
    lr.admin_notes,
    lr.created_at,
    lr.updated_at,
    lr.approved_at,
    lr.fulfilled_at,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name
FROM lead_requests lr
JOIN projects p ON lr.project_id = p.id
LEFT JOIN auth.users au ON lr.user_id = au.id;

-- 14. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_wallets TO authenticated;
GRANT ALL ON wallet_transactions TO authenticated;
GRANT ALL ON lead_requests TO authenticated;
GRANT SELECT ON user_wallet_summary TO authenticated;
GRANT SELECT ON lead_request_details TO authenticated;

-- 15. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_to_wallet(UUID, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_lead_request(UUID, UUID, INTEGER, DECIMAL, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_balance(UUID, DECIMAL, VARCHAR, TEXT, UUID) TO authenticated;

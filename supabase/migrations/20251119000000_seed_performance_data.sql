-- Seed Performance Data with Realistic Values
-- This migration creates realistic transactions and expenses for all franchises

-- First, let's add commission cuts for all franchises (per million in sales)
INSERT INTO performance_commission_cuts (franchise_id, role, cut_per_million)
SELECT 
  f.id,
  role_type,
  CASE role_type
    WHEN 'sales_agent' THEN 8000   -- 8K per million
    WHEN 'team_leader' THEN 2500   -- 2.5K per million
    WHEN 'sales_director' THEN 1500 -- 1.5K per million
    WHEN 'head_of_sales' THEN 750   -- 750 per million
    WHEN 'royalty' THEN 10000       -- 10K per million
  END as cut_amount
FROM performance_franchises f
CROSS JOIN (
  VALUES 
    ('sales_agent'::text),
    ('team_leader'::text),
    ('sales_director'::text),
    ('head_of_sales'::text),
    ('royalty'::text)
) AS roles(role_type)
ON CONFLICT (franchise_id, role) DO NOTHING;

-- Add fixed expenses for November 2024 (Rent based on headcount)
-- Rent = headcount * 5 meters * 750 EGP per meter
INSERT INTO performance_expenses (franchise_id, expense_type, category, description, amount, date)
SELECT 
  id as franchise_id,
  'fixed'::text as expense_type,
  'rent'::text as category,
  'Office rent for November 2024' as description,
  (headcount * 5 * 750) as amount,  -- Headcount * 5 meters * 750 EGP/meter
  '2024-11-01'::date as date
FROM performance_franchises
WHERE is_active = true;

-- Add variable expenses for November 2024

-- Phone bills (700 EGP per agent)
INSERT INTO performance_expenses (franchise_id, expense_type, category, description, amount, date)
SELECT 
  id as franchise_id,
  'variable'::text as expense_type,
  'phone_bills'::text as category,
  'Phone bills for November 2024' as description,
  (headcount * 700) as amount,  -- 700 EGP per agent
  '2024-11-15'::date as date
FROM performance_franchises
WHERE is_active = true;

-- Marketing expenses (varies per franchise)
INSERT INTO performance_expenses (franchise_id, expense_type, category, description, amount, date)
SELECT 
  id as franchise_id,
  'variable'::text as expense_type,
  'marketing'::text as category,
  'Marketing campaigns for November 2024' as description,
  CASE 
    WHEN headcount < 20 THEN 15000
    WHEN headcount < 35 THEN 25000
    WHEN headcount < 50 THEN 40000
    ELSE 60000
  END as amount,
  '2024-11-10'::date as date
FROM performance_franchises
WHERE is_active = true;

-- Other expenses (1000 EGP per agent - utilities, supplies, etc.)
INSERT INTO performance_expenses (franchise_id, expense_type, category, description, amount, date)
SELECT 
  id as franchise_id,
  'variable'::text as expense_type,
  'other'::text as category,
  'Utilities, supplies, and miscellaneous for November 2024' as description,
  (headcount * 1000) as amount,  -- 1000 EGP per agent
  '2024-11-20'::date as date
FROM performance_franchises
WHERE is_active = true;

-- Create transactions for November 2024
-- Average sales per agent per month: 3.5M EGP
-- We'll create multiple transactions per franchise with different developers and commission rates

-- Helper function to generate transactions
DO $$
DECLARE
  franchise_record RECORD;
  agent_count INTEGER;
  transactions_per_agent INTEGER := 2; -- Average 2 deals per agent
  total_transactions INTEGER;
  i INTEGER;
  random_project_id BIGINT;
  random_amount DECIMAL;
  random_stage TEXT;
  random_commission_rate DECIMAL;
  random_payout_months INTEGER;
  contracted_date TIMESTAMP;
  base_date DATE := '2024-11-01';
BEGIN
  -- Loop through each active franchise
  FOR franchise_record IN 
    SELECT id, headcount, name 
    FROM performance_franchises 
    WHERE is_active = true 
  LOOP
    agent_count := franchise_record.headcount;
    total_transactions := agent_count * transactions_per_agent;
    
    -- Create transactions for this franchise
    FOR i IN 1..total_transactions LOOP
      -- Random project ID from existing inventory (using valid IDs)
      random_project_id := (ARRAY[251, 258, 265, 293, 295, 296, 297, 298, 359, 503, 507, 519, 520, 521, 523])[1 + floor(random() * 15)];
      
      -- Random transaction amount around 3.5M / 2 = 1.75M average per deal
      -- Range from 800K to 3M
      random_amount := (800000 + (random() * 2200000))::DECIMAL;
      
      -- 70% contracted, 20% reservation, 5% eoi, 5% cancelled
      random_stage := CASE 
        WHEN random() < 0.70 THEN 'contracted'
        WHEN random() < 0.90 THEN 'reservation'
        WHEN random() < 0.95 THEN 'eoi'
        ELSE 'cancelled'
      END;
      
      -- Commission rate: 60% get 3.5%, 30% get 4%, 10% get 3%
      random_commission_rate := CASE 
        WHEN random() < 0.60 THEN 3.5
        WHEN random() < 0.90 THEN 4.0
        ELSE 3.0
      END;
      
      -- Payout months: 60% get 3 months, 40% get 6 months
      random_payout_months := CASE 
        WHEN random() < 0.60 THEN 3
        ELSE 6
      END;
      
      -- Random date within November 2024
      contracted_date := base_date + (floor(random() * 30)::INTEGER || ' days')::INTERVAL 
                         + (floor(random() * 24)::INTEGER || ' hours')::INTERVAL;
      
      -- Insert transaction
      INSERT INTO performance_transactions (
        franchise_id,
        project_id,
        transaction_amount,
        stage,
        stage_updated_at,
        contracted_at,
        notes,
        created_at,
        updated_at
      ) VALUES (
        franchise_record.id,
        random_project_id,
        random_amount,
        random_stage,
        contracted_date,
        CASE WHEN random_stage = 'contracted' THEN contracted_date ELSE NULL END,
        'Seeded transaction for November 2024',
        contracted_date,
        contracted_date
      );
      
      -- Update commission scheme for this project if not exists
      INSERT INTO performance_commission_schemes (
        franchise_id,
        project_id,
        commission_rate,
        developer_payout_months
      ) VALUES (
        franchise_record.id,
        random_project_id,
        random_commission_rate,
        random_payout_months
      )
      ON CONFLICT (franchise_id, project_id) 
      DO UPDATE SET 
        commission_rate = EXCLUDED.commission_rate,
        developer_payout_months = EXCLUDED.developer_payout_months;
      
    END LOOP;
    
    RAISE NOTICE 'Created transactions for franchise: %', franchise_record.name;
  END LOOP;
END $$;

-- Update all contracted transactions to calculate commission and payout dates
-- This triggers the calculate_transaction_commission function
UPDATE performance_transactions
SET stage = 'contracted'
WHERE stage = 'contracted' AND contracted_at IS NOT NULL;

-- Add some additional historical data (October 2024) for comparison
INSERT INTO performance_expenses (franchise_id, expense_type, category, description, amount, date)
SELECT 
  id as franchise_id,
  'fixed'::text as expense_type,
  'rent'::text as category,
  'Office rent for October 2024' as description,
  (headcount * 5 * 750) as amount,
  '2024-10-01'::date as date
FROM performance_franchises
WHERE is_active = true;

INSERT INTO performance_expenses (franchise_id, expense_type, category, description, amount, date)
SELECT 
  id as franchise_id,
  'variable'::text as expense_type,
  'phone_bills'::text as category,
  'Phone bills for October 2024' as description,
  (headcount * 700) as amount,
  '2024-10-15'::date as date
FROM performance_franchises
WHERE is_active = true;

-- October transactions (slightly less volume - 80% of November)
DO $$
DECLARE
  franchise_record RECORD;
  agent_count INTEGER;
  transactions_per_agent INTEGER := 2;
  total_transactions INTEGER;
  i INTEGER;
  random_project_id BIGINT;
  random_amount DECIMAL;
  random_stage TEXT;
  random_commission_rate DECIMAL;
  random_payout_months INTEGER;
  contracted_date TIMESTAMP;
  base_date DATE := '2024-10-01';
BEGIN
  FOR franchise_record IN 
    SELECT id, headcount, name 
    FROM performance_franchises 
    WHERE is_active = true 
  LOOP
    agent_count := franchise_record.headcount;
    total_transactions := floor(agent_count * transactions_per_agent * 0.8)::INTEGER; -- 80% of November
    
    FOR i IN 1..total_transactions LOOP
      random_project_id := (ARRAY[251, 258, 265, 293, 295, 296, 297, 298, 359, 503, 507, 519, 520, 521, 523])[1 + floor(random() * 15)];
      random_amount := (800000 + (random() * 2200000))::DECIMAL;
      
      random_stage := CASE 
        WHEN random() < 0.65 THEN 'contracted'  -- Slightly lower conversion in October
        WHEN random() < 0.88 THEN 'reservation'
        WHEN random() < 0.94 THEN 'eoi'
        ELSE 'cancelled'
      END;
      
      random_commission_rate := CASE 
        WHEN random() < 0.60 THEN 3.5
        WHEN random() < 0.90 THEN 4.0
        ELSE 3.0
      END;
      
      random_payout_months := CASE 
        WHEN random() < 0.60 THEN 3
        ELSE 6
      END;
      
      contracted_date := base_date + (floor(random() * 30)::INTEGER || ' days')::INTERVAL 
                         + (floor(random() * 24)::INTEGER || ' hours')::INTERVAL;
      
      INSERT INTO performance_transactions (
        franchise_id,
        project_id,
        transaction_amount,
        stage,
        stage_updated_at,
        contracted_at,
        notes,
        created_at,
        updated_at
      ) VALUES (
        franchise_record.id,
        random_project_id,
        random_amount,
        random_stage,
        contracted_date,
        CASE WHEN random_stage = 'contracted' THEN contracted_date ELSE NULL END,
        'Seeded transaction for October 2024',
        contracted_date,
        contracted_date
      );
      
      INSERT INTO performance_commission_schemes (
        franchise_id,
        project_id,
        commission_rate,
        developer_payout_months
      ) VALUES (
        franchise_record.id,
        random_project_id,
        random_commission_rate,
        random_payout_months
      )
      ON CONFLICT (franchise_id, project_id) 
      DO UPDATE SET 
        commission_rate = EXCLUDED.commission_rate,
        developer_payout_months = EXCLUDED.developer_payout_months;
      
    END LOOP;
  END LOOP;
END $$;

-- Update October contracted transactions
UPDATE performance_transactions
SET stage = 'contracted'
WHERE stage = 'contracted' 
  AND contracted_at IS NOT NULL 
  AND contracted_at >= '2024-10-01' 
  AND contracted_at < '2024-11-01';

-- Summary report
DO $$
DECLARE
  total_franchises INTEGER;
  total_transactions INTEGER;
  total_expenses INTEGER;
  total_commission_schemes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_franchises FROM performance_franchises WHERE is_active = true;
  SELECT COUNT(*) INTO total_transactions FROM performance_transactions;
  SELECT COUNT(*) INTO total_expenses FROM performance_expenses;
  SELECT COUNT(DISTINCT (franchise_id, project_id)) INTO total_commission_schemes FROM performance_commission_schemes;
  
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Performance Data Seeding Complete';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Active Franchises: %', total_franchises;
  RAISE NOTICE 'Total Transactions: %', total_transactions;
  RAISE NOTICE 'Total Expenses: %', total_expenses;
  RAISE NOTICE 'Commission Schemes: %', total_commission_schemes;
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Data includes:';
  RAISE NOTICE '- Realistic rent based on headcount (agents * 5m * 750 EGP/m)';
  RAISE NOTICE '- Phone bills (700 EGP per agent)';
  RAISE NOTICE '- Other expenses (1000 EGP per agent)';
  RAISE NOTICE '- Transactions averaging 3.5M per agent per month';
  RAISE NOTICE '- Commission rates: 3%, 3.5%, and 4%';
  RAISE NOTICE '- Payout periods: 3 and 6 months';
  RAISE NOTICE '- Data for October and November 2024';
  RAISE NOTICE '=================================';
END $$;


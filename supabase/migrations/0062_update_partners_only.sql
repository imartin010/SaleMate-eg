-- =====================================================
-- Migration: Update Partners Only
-- =====================================================

BEGIN;

-- Update the partner name from "Engel & Völkers" to "SaleMate"
UPDATE partners 
SET 
    name = 'SaleMate',
    description = 'Leading real estate platform connecting buyers with verified properties and trusted agents across Egypt',
    commission_rate = 5.0,
    logo_path = 'partners-logos/salemate.png',
    website = 'https://salemate.com',
    updated_at = NOW()
WHERE name = 'Engel & Völkers';

-- If no rows were updated (partner doesn't exist), insert SaleMate
INSERT INTO partners (name, description, commission_rate, logo_path, website, status)
SELECT 
    'SaleMate',
    'Leading real estate platform connecting buyers with verified properties and trusted agents across Egypt',
    5.0,
    'partners-logos/salemate.png',
    'https://salemate.com',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM partners WHERE name = 'SaleMate'
);

-- Rename "Coldwell Banker" to "CB Link by Coldwell Banker"
UPDATE partners 
SET 
    name = 'CB Link by Coldwell Banker',
    description = 'CB Link by Coldwell Banker - Global real estate franchise with local expertise in Egyptian market',
    logo_path = 'partners-logos/cb-link.png',
    website = 'https://cblink.com',
    updated_at = NOW()
WHERE name = 'Coldwell Banker';

COMMIT;

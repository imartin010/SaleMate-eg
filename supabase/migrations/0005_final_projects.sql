-- Final migration to add all remaining major developers and projects
-- This completes the project database with all major Egyptian real estate developers

INSERT INTO projects (name, developer, region, available_leads, price_per_lead, description) VALUES

-- The New Urban Communities Authority
('Marina 8', 'The New Urban Communities Authority', 'New Capital', 150, 35.00, 'Marina 8 government development.'),

-- Rayhana Developments  
('Ray West', 'Rayhana Developments', 'Sheikh Zayed', 100, 32.00, 'Ray West development.'),

-- Q Developments
('Q Hills', 'Q Developments', 'New Cairo', 120, 34.00, 'Q Hills residential development.'),
('Q North', 'Q Developments', 'New Cairo', 110, 35.00, 'Q North development.'),

-- Modon Egypt
('Boutique Village', 'Modon Egypt', 'New Cairo', 80, 33.00, 'Boutique village development.'),
('Lagoons Al Alamin', 'Modon Egypt', 'New Alamein', 140, 41.00, 'Lagoons development in Al Alamein.'),
('Villagio', 'Modon Egypt', 'New Cairo', 160, 32.00, 'Villagio residential development.'),
('The V Residence - Villagio', 'Modon Egypt', 'New Cairo', 90, 34.00, 'V Residence in Villagio.'),

-- Cred Developments
('Castle Landmark', 'Cred Developments', 'New Cairo', 85, 35.00, 'Castle landmark development.'),
('Ever New Cairo', 'Cred Developments', 'New Cairo', 120, 33.00, 'Ever development in New Cairo.'),
('Ever West', 'Cred Developments', 'Sheikh Zayed', 100, 32.00, 'Ever West development.'),

-- Akam Developments
('Scenario', 'Akam Developments', 'New Cairo', 95, 33.00, 'Scenario residential development.'),
('Ainava', 'Akam Developments', 'New Cairo', 80, 34.00, 'Ainava development.'),
('Scene 7', 'Akam Developments', 'New Cairo', 75, 35.00, 'Scene 7 development.'),

-- Upwyde Developments
('The Gryd', 'Upwyde Developments', 'New Cairo', 110, 34.00, 'Gryd development.'),
('Jazebeya', 'Upwyde Developments', 'New Cairo', 90, 33.00, 'Jazebeya residential development.'),
('Sky Ramp', 'Upwyde Developments', 'New Cairo', 85, 35.00, 'Sky Ramp development.'),
('White Walk', 'Upwyde Developments', 'New Cairo', 95, 34.00, 'White Walk development.'),
('White Residence', 'Upwyde Developments', 'New Cairo', 100, 33.00, 'White Residence development.'),
('Cinco', 'Upwyde Developments', 'New Cairo', 75, 36.00, 'Cinco development.'),
('Prk Vie', 'Upwyde Developments', 'New Cairo', 80, 35.00, 'Park Vie development.'),
('Granoy', 'Upwyde Developments', 'New Cairo', 70, 37.00, 'Granoy development.'),
('It Business Hub', 'Upwyde Developments', 'New Capital', 60, 40.00, 'IT business hub.'),
('Iguall', 'Upwyde Developments', 'New Cairo', 85, 34.00, 'Iguall development.'),

-- Marakez
('Ramla', 'Marakez', 'North Coast', 120, 43.00, 'Ramla coastal development.'),
('D Parks New Cairo', 'Marakez', 'New Cairo', 140, 34.00, 'D Parks development in New Cairo.'),
('Campus District 5', 'Marakez', 'New Cairo', 100, 36.00, 'Campus development in District 5.'),
('Crescent Walk East', 'Marakez', 'New Cairo', 90, 37.00, 'Eastern Crescent Walk.'),
('Crescent Walk South', 'Marakez', 'New Cairo', 85, 37.00, 'Southern Crescent Walk.'),
('AEON Towers', 'Marakez', 'New Capital', 70, 42.00, 'AEON towers development.'),
('Crescent Walk', 'Marakez', 'New Cairo', 130, 36.00, 'Main Crescent Walk development.'),
('Mindhaus New Katameya', 'Marakez', 'New Cairo', 95, 38.00, 'Mindhaus development in New Katameya.'),
('DISTRICT 5', 'Marakez', 'New Cairo', 150, 35.00, 'Main District 5 development.'),
('Clubside Apartments District 5', 'Marakez', 'New Cairo', 80, 37.00, 'Clubside apartments in District 5.'),
('Plateau District 5', 'Marakez', 'New Cairo', 90, 36.00, 'Plateau development in District 5.'),

-- Al Manara Developments
('Bella East', 'Al Manara Developments', 'New Cairo', 100, 32.00, 'Bella East development.'),
('Bella Romance', 'Al Manara Developments', 'New Cairo', 85, 33.00, 'Bella Romance development.'),
('Bella Vento', 'Al Manara Developments', 'New Cairo', 90, 32.00, 'Bella Vento development.'),

-- Rock Developments
('Rock Gold', 'Rock Developments', 'New Cairo', 110, 34.00, 'Rock Gold development.'),
('Rock Capital', 'Rock Developments', 'New Capital', 120, 37.00, 'Rock Capital development.'),
('Rock Eden', 'Rock Developments', 'New Cairo', 100, 35.00, 'Rock Eden development.'),
('Rock Vera', 'Rock Developments', 'New Cairo', 95, 36.00, 'Rock Vera development.'),
('Rock White', 'Rock Developments', 'New Cairo', 90, 35.00, 'Rock White development.'),

-- Dubai Misr
('Capital Dubai Mall', 'Dubai Misr', 'New Capital', 50, 45.00, 'Capital Dubai mall.'),
('Obsidier', 'Dubai Misr', 'New Capital', 80, 40.00, 'Obsidier development.'),
('Lumia Residence', 'Dubai Misr', 'New Cairo', 110, 36.00, 'Lumia residential development.'),
('Lumia Residence- New Capital', 'Dubai Misr', 'New Capital', 100, 38.00, 'Lumia residence in New Capital.'),
('Lumia Lagoons', 'Dubai Misr', 'North Coast', 90, 45.00, 'Lumia lagoons coastal development.'),

-- Living Yards Developments
('The Loft Plaza', 'Living Yards Developments', 'New Cairo', 70, 36.00, 'Loft plaza development.'),
('Noir', 'Living Yards Developments', 'New Cairo', 85, 37.00, 'Noir development.'),
('The Loft', 'Living Yards Developments', 'New Cairo', 100, 35.00, 'Main Loft development.'),
('The Loft Capital Center Commercial', 'Living Yards Developments', 'New Capital', 60, 42.00, 'Loft commercial in Capital Center.'),
('Solay', 'Living Yards Developments', 'New Cairo', 95, 36.00, 'Solay development.'),

-- Horizon Egypt Development
('Saada Commercial Hub', 'Horizon Egypt Development', 'New Cairo', 60, 38.00, 'Saada commercial hub.'),
('Saada North Coast', 'Horizon Egypt Development', 'North Coast', 120, 42.00, 'Saada North Coast development.'),
('Saada Boutique', 'Horizon Egypt Development', 'New Cairo', 80, 35.00, 'Saada boutique development.'),
('Saada', 'Horizon Egypt Development', 'New Cairo', 140, 34.00, 'Main Saada development.'),

-- Housing And Development Properties HDP
('The Island - Marina 5', 'Housing And Development Properties HDP', 'New Capital', 90, 39.00, 'Island development in Marina 5.'),
('Westview Residence', 'Housing And Development Properties HDP', 'Sheikh Zayed', 110, 33.00, 'Westview residential development.'),
('SQ1', 'Housing And Development Properties HDP', 'New Cairo', 100, 35.00, 'SQ1 development.'),
('Terrace', 'Housing And Development Properties HDP', 'New Cairo', 85, 36.00, 'Terrace development.'),
('Talda', 'Housing And Development Properties HDP', 'New Cairo', 95, 34.00, 'Talda residential development.'),
('Club Hills Residence', 'Housing And Development Properties HDP', 'New Cairo', 120, 35.00, 'Club Hills residential development.'),
('The Gray', 'Housing And Development Properties HDP', 'New Cairo', 80, 37.00, 'Gray development.'),

-- The Ark Development
('Rafts', 'The Ark Development', 'North Coast', 75, 44.00, 'Rafts coastal development.'),

-- Arabella
('Direction White - Oyster', 'Arabella', 'North Coast', 80, 46.00, 'Direction White in Oyster.'),
('Direction White Phase One', 'Arabella', 'North Coast', 90, 45.00, 'Direction White phase one.'),
('Water Creek - Direction White', 'Arabella', 'North Coast', 70, 47.00, 'Water Creek in Direction White.'),
('Direction White', 'Arabella', 'North Coast', 120, 44.00, 'Main Direction White development.'),

-- Empire State Developments
('El Centro Business Complex', 'Empire State Developments', 'New Capital', 60, 42.00, 'El Centro business complex.'),

-- Brouq Developments
('Terraside Business Park', 'Brouq Developments', 'New Capital', 80, 40.00, 'Terraside business park.'),
('Bling Capital Center', 'Brouq Developments', 'New Capital', 70, 43.00, 'Bling Capital Center.'),
('Spark Capital Insights', 'Brouq Developments', 'New Capital', 65, 44.00, 'Spark Capital Insights.'),

-- EGYGAB
('The Islands', 'EGYGAB', 'New Cairo', 120, 34.00, 'Islands development.'),
('Granda Life', 'EGYGAB', 'New Cairo', 100, 35.00, 'Granda Life development.'),
('The Edge', 'EGYGAB', 'New Cairo', 90, 36.00, 'Edge development.'),
('Masaya', 'EGYGAB', 'New Cairo', 85, 37.00, 'Masaya development.'),
('The Median Residences', 'EGYGAB', 'New Cairo', 110, 35.00, 'Median residences.'),

-- Lasirena Group (Large coastal developer)
('Palm Beach Ain Sokhna', 'Lasirena Group', 'Ain Sokhna', 130, 40.00, 'Palm Beach in Ain Sokhna.'),
('Canan Capital', 'Lasirena Group', 'New Capital', 100, 38.00, 'Canan Capital development.'),
('Lasirena Bay', 'Lasirena Group', 'North Coast', 150, 42.00, 'Lasirena Bay coastal development.'),
('Lasirena Sokhna Resort', 'Lasirena Group', 'Ain Sokhna', 120, 45.00, 'Lasirena resort in Sokhna.'),
('Lasirena Ras Sudr', 'Lasirena Group', 'Ras Sudr', 90, 38.00, 'Lasirena development in Ras Sudr.'),
('Majesty Bay El Galala Lasirena', 'Lasirena Group', 'Ain Sokhna', 80, 48.00, 'Majesty Bay in El Galala.'),
('Lasirena North Coast', 'Lasirena Group', 'North Coast', 160, 41.00, 'Lasirena North Coast development.'),
('La Vento Oyoun Mousa', 'Lasirena Group', 'South Sinai', 70, 50.00, 'La Vento in Oyoun Mousa.'),
('Lasirena Palm Beach', 'Lasirena Group', 'Ain Sokhna', 110, 43.00, 'Lasirena Palm Beach.'),
('Cape Bay Blumar Lasirena', 'Lasirena Group', 'North Coast', 85, 46.00, 'Cape Bay Blumar development.'),

-- El Gabry Developments
('The 8 Extension', 'El Gabry Developments', 'New Cairo', 90, 34.00, 'Extension of The 8 development.'),
('The 8', 'El Gabry Developments', 'New Cairo', 120, 33.00, 'Main The 8 development.'),
('Lac Ville', 'El Gabry Developments', 'New Cairo', 100, 35.00, 'Lac Ville development.'),
('Majorelle', 'El Gabry Developments', 'New Cairo', 85, 36.00, 'Majorelle development.'),
('IRA', 'El Gabry Developments', 'New Cairo', 75, 37.00, 'IRA development.'),
('One50', 'El Gabry Developments', 'New Cairo', 80, 38.00, 'One50 development.'),

-- Naia Developments
('Naia Bay', 'Naia Developments', 'North Coast', 110, 44.00, 'Naia Bay coastal development.'),
('Naia West', 'Naia Developments', 'Sheikh Zayed', 95, 32.00, 'Naia West development.'),

-- Golden Pillars
('Tadawy', 'Golden Pillars', 'New Cairo', 90, 33.00, 'Tadawy development.'),

-- History For Urban Development HUD
('Blue Sky Mall', 'History For Urban Development HUD', 'New Cairo', 50, 38.00, 'Blue Sky mall development.'),
('Blue Waters Mall', 'History For Urban Development HUD', 'New Cairo', 55, 39.00, 'Blue Waters mall.'),

-- West End Developments
('West End', 'West End Developments', 'Sheikh Zayed', 120, 32.00, 'West End development.'),

-- The Waterway Developments
('Triangle', 'The Waterway Developments', 'New Cairo', 100, 35.00, 'Triangle development.'),
('Kairo', 'The Waterway Developments', 'New Capital', 90, 38.00, 'Kairo development.'),
('The Waterway - New Cairo', 'The Waterway Developments', 'New Cairo', 150, 34.00, 'Waterway development in New Cairo.'),
('The Waterway North Coast', 'The Waterway Developments', 'North Coast', 120, 42.00, 'Waterway North Coast development.'),
('WBR1', 'The Waterway Developments', 'New Cairo', 80, 36.00, 'WBR1 development.'),
('The Capitalway', 'The Waterway Developments', 'New Capital', 110, 39.00, 'Capitalway development.'),
('The View Waterway', 'The Waterway Developments', 'New Cairo', 140, 35.00, 'View development in Waterway.'),
('W Signature', 'The Waterway Developments', 'New Cairo', 70, 40.00, 'W Signature development.'),

-- Mabany Edris
('Central Avenue', 'Mabany Edris', 'New Capital', 100, 37.00, 'Central Avenue development.'),
('Green IV October', 'Mabany Edris', '6th of October', 120, 30.00, 'Green IV development in October.'),
('Green 3', 'Mabany Edris', '6th of October', 110, 31.00, 'Green 3 development.'),
('Green 5', 'Mabany Edris', '6th of October', 100, 31.00, 'Green 5 development.'),
('Green 6', 'Mabany Edris', '6th of October', 95, 32.00, 'Green 6 development.'),
('Koun', 'Mabany Edris', 'New Cairo', 85, 34.00, 'Koun development.'),
('ONS', 'Mabany Edris', 'New Cairo', 80, 35.00, 'ONS development.'),

-- JD Developments
('London', 'JD Developments', 'New Cairo', 90, 35.00, 'London-themed development.'),

-- Saudi Group Development
('Valea', 'Saudi Group Development', 'New Cairo', 95, 34.00, 'Valea development.'),

-- El Masria Group Developments
('Isola Sheraton', 'El Masria Group Developments', 'New Cairo', 100, 35.00, 'Isola Sheraton development.'),
('Isola Centra', 'El Masria Group Developments', 'New Cairo', 90, 36.00, 'Isola Centra development.'),
('Isola Quattro', 'El Masria Group Developments', 'New Cairo', 85, 37.00, 'Isola Quattro development.'),
('Isola October', 'El Masria Group Developments', '6th of October', 110, 32.00, 'Isola development in October.'),
('Isola Villa', 'El Masria Group Developments', 'New Cairo', 75, 38.00, 'Isola Villa development.'),

-- Grand Plaza For Real Estate And Touristic Development
('La Mirada', 'Grand Plaza For Real Estate And Touristic Development', 'North Coast', 80, 45.00, 'La Mirada coastal development.'),

-- Al Fath Group
('AMAZ BUSINESS COMPLEX', 'Al Fath Group', 'New Capital', 70, 42.00, 'AMAZ business complex.'),
('Skybridge SIGNATURE HUB', 'Al Fath Group', 'New Capital', 60, 45.00, 'Skybridge signature hub.'),
('Helio Eye', 'Al Fath Group', 'New Capital', 50, 48.00, 'Helio Eye development.'),

-- EDGESTONE Development And Real Estate
('Moraya Residence', 'EDGESTONE Development And Real Estate', 'New Cairo', 95, 34.00, 'Moraya residential development.'),

-- Orascom Development Egypt
('Qemet Owest', 'Orascom Development Egypt', 'Sheikh Zayed', 120, 35.00, 'Qemet development in Owest.'),
('O West Orascom', 'Orascom Development Egypt', 'Sheikh Zayed', 200, 33.00, 'O West main development.'),
('Makadi Heights', 'Orascom Development Egypt', 'Red Sea', 100, 48.00, 'Makadi Heights Red Sea development.'),
('Parkside - Owest', 'Orascom Development Egypt', 'Sheikh Zayed', 140, 34.00, 'Parkside development in Owest.'),

-- Ajna Developments
('Kasakuon - Eastville', 'Ajna Developments', 'New Cairo', 90, 33.00, 'Kasakuon development in Eastville.'),
('Carnelia', 'Ajna Developments', 'Ain Sokhna', 80, 42.00, 'Carnelia coastal development.'),
('Eastville', 'Ajna Developments', 'New Cairo', 130, 32.00, 'Main Eastville development.'),

-- Juzur Development
('J East', 'Juzur Development', 'New Cairo', 100, 34.00, 'J East development.'),
('Neo Business Park', 'Juzur Development', 'New Capital', 70, 40.00, 'Neo business park.'),

-- Nations Of Sky
('Zomra East', 'Nations Of Sky', 'New Cairo', 85, 35.00, 'Zomra East development.'),

-- Pyramids Developments
('Pyramids Business Tower', 'Pyramids Developments', 'New Capital', 60, 42.00, 'Pyramids business tower.'),
('Champs Elysees Mall', 'Pyramids Developments', 'New Capital', 40, 48.00, 'Champs Elysees mall.'),
('Sky City', 'Pyramids Developments', 'New Capital', 80, 40.00, 'Sky City development.'),
('Pyramids City', 'Pyramids Developments', 'New Capital', 150, 38.00, 'Main Pyramids City development.'),
('Pyramids Mall', 'Pyramids Developments', 'New Capital', 50, 45.00, 'Pyramids mall.'),
('Grand Square Mall', 'Pyramids Developments', 'New Capital', 45, 47.00, 'Grand Square mall.'),
('Paris Mall', 'Pyramids Developments', 'New Capital', 40, 50.00, 'Paris-themed mall.'),
('La Capitale', 'Pyramids Developments', 'New Capital', 90, 41.00, 'La Capitale development.'),
('Pyramids Heights', 'ADD Properties', 'New Cairo', 110, 33.00, 'Pyramids Heights development.'),

-- TG Development
('Palm Island', 'TG Development', 'North Coast', 100, 43.00, 'Palm Island coastal development.'),
('Palm East For TG Developments', 'TG Development', 'New Cairo', 120, 34.00, 'Palm East development.');

-- Update materialized view after adding all projects
REFRESH MATERIALIZED VIEW lead_analytics_mv;

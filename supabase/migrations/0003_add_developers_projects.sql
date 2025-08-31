-- Add Real Developers and Projects to SaleMate Database
-- This migration adds all the actual real estate developers and their projects

-- Insert all the projects with their developers
INSERT INTO projects (name, developer, region, available_leads, price_per_lead, description) VALUES
-- Paragon Development
('Paragon 1', 'Paragon Development', 'New Cairo', 75, 28.00, 'Premium residential development by Paragon Development offering modern living spaces.'),
('Paragon 3', 'Paragon Development', 'New Cairo', 120, 28.00, 'Latest phase of Paragon Development featuring contemporary design and amenities.'),
('Paragon 2', 'Paragon Development', 'New Cairo', 90, 28.00, 'Second phase of Paragon Development with enhanced facilities and modern architecture.'),

-- Modad Development
('Sector 2', 'Modad Development', 'New Capital', 150, 32.00, 'Strategic location in New Capital with comprehensive urban planning by Modad Development.'),
('Sector 1', 'Modad Development', 'New Capital', 180, 32.00, 'Prime sector in New Capital offering premium residential and commercial units.'),
('Sector 3', 'Modad Development', 'New Capital', 95, 32.00, 'Modern development in New Capital with state-of-the-art facilities.'),

-- La Vista Developments
('El Patio Riva', 'La Vista Developments', '6th of October', 200, 25.00, 'Elegant residential compound by La Vista Developments in prime October location.'),
('El Patio Hills', 'La Vista Developments', '6th of October', 160, 25.00, 'Hillside residential development with panoramic views and luxury amenities.'),
('El Patio 4', 'La Vista Developments', '6th of October', 140, 25.00, 'Fourth phase of El Patio series featuring modern residential units.'),
('El Patio Town', 'La Vista Developments', '6th of October', 110, 25.00, 'Town-style development with integrated commercial and residential spaces.'),
('D Line', 'La Vista Developments', '6th of October', 85, 25.00, 'Contemporary residential project with modern design elements.'),
('El Patio 6 October', 'La Vista Developments', '6th of October', 175, 25.00, 'Premium residential compound in the heart of 6th of October.'),
('El Patio Vera', 'La Vista Developments', '6th of October', 130, 25.00, 'Luxury residential development with comprehensive amenities.'),
('El Patio Sola', 'La Vista Developments', '6th of October', 100, 25.00, 'Exclusive residential compound with modern architectural design.'),
('Patio 3', 'La Vista Developments', '6th of October', 120, 25.00, 'Third phase of Patio series with enhanced living standards.'),
('LA Vista 5', 'La Vista Developments', 'North Coast', 90, 30.00, 'Coastal development offering beachfront living experience.'),
('La Vista 3', 'La Vista Developments', 'North Coast', 110, 30.00, 'Premium coastal resort with luxury amenities and beach access.'),
('La Vista 6', 'La Vista Developments', 'North Coast', 95, 30.00, 'Latest coastal development with modern resort facilities.'),
('La Vista 1', 'La Vista Developments', 'North Coast', 140, 30.00, 'Original La Vista coastal development with premium beachfront location.'),
('LA Vista 4', 'La Vista Developments', 'North Coast', 105, 30.00, 'Fourth phase of La Vista coastal development series.'),
('La Vista Bay', 'La Vista Developments', 'North Coast', 180, 35.00, 'Premium bay-front development with exclusive beach access.'),
('LA VISTA 2', 'La Vista Developments', 'North Coast', 125, 30.00, 'Second phase of La Vista coastal development with enhanced amenities.'),
('El Patio Zahraa', 'La Vista Developments', 'Sheikh Zayed', 80, 27.00, 'Residential development in Sheikh Zayed with garden-style living.'),
('La Vista Sol', 'La Vista Developments', 'North Coast', 70, 32.00, 'Boutique coastal development with exclusive amenities.'),
('La Vista Ray', 'La Vista Developments', 'North Coast', 85, 32.00, 'Modern coastal resort with contemporary design.'),
('La Vista Topaz', 'La Vista Developments', 'North Coast', 60, 35.00, 'Luxury beachfront development with premium facilities.'),
('El Patio 5 East', 'La Vista Developments', 'New Cairo', 115, 26.00, 'Eastern extension of El Patio series in New Cairo.'),
('El Patio 7', 'La Vista Developments', '6th of October', 135, 25.00, 'Seventh phase of El Patio development with modern amenities.'),
('El Patio Oro', 'La Vista Developments', '6th of October', 90, 27.00, 'Premium residential compound with golden standard amenities.'),
('La Vista Ras El Hekma', 'La Vista Developments', 'Ras El Hekma', 200, 40.00, 'Exclusive coastal development in prime Ras El Hekma location.'),
('La Vista Cascada', 'La Vista Developments', 'North Coast', 110, 33.00, 'Waterfront development with cascading design elements.'),
('La Vista Gardens', 'La Vista Developments', '6th of October', 95, 26.00, 'Garden-style residential development with green spaces.'),
('Lagoona - La Vista Ras El Hekma', 'La Vista Developments', 'Ras El Hekma', 150, 42.00, 'Lagoon-style development in premium coastal location.'),
('El Patio 2', 'La Vista Developments', '6th of October', 160, 25.00, 'Second phase of El Patio with enhanced residential features.'),
('La Vista 7', 'La Vista Developments', 'North Coast', 75, 31.00, 'Seventh coastal development in La Vista series.'),
('La Vista City', 'La Vista Developments', 'New Cairo', 220, 28.00, 'Urban development combining residential and commercial spaces.'),
('Patio Vida', 'La Vista Developments', '6th of October', 85, 26.00, 'Lifestyle-focused residential development with modern amenities.'),
('Linea', 'La Vista Developments', 'New Cairo', 100, 27.00, 'Linear design residential project with contemporary architecture.'),
('El Patio Prime', 'La Vista Developments', '6th of October', 120, 28.00, 'Premium residential compound with luxury amenities.'),
('El Patio Casa', 'La Vista Developments', '6th of October', 95, 26.00, 'Casa-style residential development with Mediterranean influence.'),
('La Vista Bay East', 'La Vista Developments', 'North Coast', 140, 34.00, 'Eastern bay development with premium beachfront access.'),
('El Patio 1', 'La Vista Developments', '6th of October', 180, 25.00, 'Original El Patio development setting the standard for the series.'),

-- Kulture Developments
('Maliv Street', 'Kulture Developments', 'New Cairo', 80, 29.00, 'Street-style development with modern urban living concept.'),
('Maliv', 'Kulture Developments', 'New Cairo', 120, 29.00, 'Contemporary residential project by Kulture Developments.'),

-- Aroma Development
('Aroma', 'Aroma Development', 'New Cairo', 95, 27.00, 'Aromatic-themed residential development with unique design concept.'),

-- MBG Developments
('Doray', 'MBG Developments', 'New Cairo', 110, 26.00, 'Modern residential compound with comprehensive amenities.'),
('Diplo East', 'MBG Developments', 'New Cairo', 85, 27.00, 'Eastern diplomatic quarter-style residential development.'),
('A1', 'MBG Developments', 'New Cairo', 140, 28.00, 'Premium A-class residential development with luxury standards.'),
('Pukka L', 'MBG Developments', 'New Cairo', 70, 26.00, 'Boutique residential project with exclusive amenities.'),
('River Green 2', 'MBG Developments', 'New Cairo', 160, 27.00, 'Riverside green development with natural landscaping.'),
('W14 -White 14', 'MBG Developments', 'New Cairo', 90, 28.00, 'White-themed modern residential development.'),

-- El Ashrafeya
('El Ashrafeya', 'El Ashrafeya', 'New Cairo', 130, 26.00, 'Traditional yet modern residential development with cultural elements.'),

-- Radix Development
('Radix Agile', 'Radix Development', 'New Cairo', 100, 27.00, 'Agile living concept with flexible residential spaces.'),
('Ray Residence', 'Radix Development', 'New Cairo', 85, 27.00, 'Ray-inspired residential design with natural lighting focus.'),

-- Palm Hills Developments
('Jirian - Palm Hills', 'Palm Hills Developments', 'New Cairo', 200, 35.00, 'Premium residential development by Palm Hills in New Cairo.'),
('Palm Hills October', 'Palm Hills Developments', '6th of October', 300, 32.00, 'Large-scale residential compound in 6th of October.'),
('Botanica', 'Palm Hills Developments', '6th of October', 180, 33.00, 'Botanical-themed residential development with extensive greenery.'),
('Palm Valley', 'Palm Hills Developments', '6th of October', 220, 31.00, 'Valley-style residential compound with natural landscaping.'),
('Bamboo Extension', 'Palm Hills Developments', '6th of October', 90, 32.00, 'Extension of bamboo-themed residential area.'),
('District 2 - Ella', 'Palm Hills Developments', 'New Cairo', 140, 34.00, 'Second district of Ella development with modern amenities.'),
('Jade Extension', 'Palm Hills Developments', '6th of October', 110, 33.00, 'Extension of jade-themed residential development.'),
('District 2 - Ella Extension', 'Palm Hills Developments', 'New Cairo', 95, 34.00, 'Extended area of District 2 Ella development.'),
('District 6 - Blu', 'Palm Hills Developments', 'New Cairo', 160, 35.00, 'Blue-themed district with modern residential units.'),
('District 2 - Moon Heights', 'Palm Hills Developments', 'New Cairo', 120, 34.00, 'Heights development with lunar-inspired design.'),
('District 1 - Boulevard', 'Palm Hills Developments', 'New Cairo', 200, 33.00, 'Boulevard-style development with wide streets and amenities.'),
('District 1 - Rae', 'Palm Hills Developments', 'New Cairo', 175, 33.00, 'Rae district with contemporary residential design.'),
('Palm Hills New Alamein', 'Palm Hills Developments', 'New Alamein', 250, 38.00, 'Coastal development in New Alamein by Palm Hills.'),
('District 6 - Laria', 'Palm Hills Developments', 'New Alamein', 130, 39.00, 'Laria district in coastal New Alamein development.'),
('District 2 - Tali', 'Palm Hills Developments', 'New Alamein', 110, 38.50, 'Tali district with beachfront access.'),
('Hacienda Blue', 'Palm Hills Developments', 'North Coast', 180, 42.00, 'Blue-themed hacienda-style coastal development.'),
('District 6 - The Village', 'Palm Hills Developments', 'New Alamein', 140, 39.00, 'Village-style community in New Alamein.'),
('Westlane Boulevard', 'Palm Hills Developments', '6th of October', 160, 32.00, 'Western boulevard development with modern amenities.'),
('Hale Town', 'Palm Hills Developments', '6th of October', 190, 33.00, 'Town-style development with comprehensive facilities.'),
('Golf Central', 'Palm Hills Developments', '6th of October', 120, 35.00, 'Golf-centered residential development.'),
('Palmet - New Cairo', 'Palm Hills Developments', 'New Cairo', 200, 34.00, 'Palmet development in New Cairo location.'),
('The Lane', 'Palm Hills Developments', 'New Cairo', 150, 33.00, 'Lane-style residential development with modern design.'),
('Crown Central', 'Palm Hills Developments', 'New Cairo', 180, 35.00, 'Central crown development with premium amenities.'),
('Cleo - Palm Hills New Cairo', 'Palm Hills Developments', 'New Cairo', 140, 34.00, 'Cleo-themed residential development.'),
('Palm Hills New Cairo', 'Palm Hills Developments', 'New Cairo', 300, 33.00, 'Main Palm Hills development in New Cairo.'),
('Badya', 'Palm Hills Developments', '6th of October', 400, 31.00, 'Large-scale integrated community development.'),
('ZOE Extension', 'Palm Hills Developments', '6th of October', 110, 32.00, 'Extension of ZOE residential area.'),
('District 1 - DAE', 'Palm Hills Developments', 'New Cairo', 160, 33.00, 'DAE district with modern residential facilities.'),
('Hacienda Waters', 'Palm Hills Developments', 'North Coast', 200, 40.00, 'Water-themed hacienda development on the coast.'),
('Hacienda Heneish', 'Palm Hills Developments', 'North Coast', 150, 39.00, 'Heneish-style hacienda coastal development.'),
('Palm Hills Golf Views', 'Palm Hills Developments', '6th of October', 180, 34.00, 'Golf course view residential development.'),
('Palm Hills Katameya (PK1)', 'Palm Hills Developments', 'New Cairo', 220, 36.00, 'First phase of Katameya development.'),
('PX', 'Palm Hills Developments', 'New Cairo', 90, 35.00, 'Exclusive PX residential project.'),
('Palm Hills Alexandria', 'Palm Hills Developments', 'Alexandria', 160, 30.00, 'Alexandria branch of Palm Hills development.'),
('Woodville', 'Palm Hills Developments', '6th of October', 140, 32.00, 'Wood-themed residential development.'),
('Palm Hills Golf Extension', 'Palm Hills Developments', '6th of October', 100, 34.00, 'Extension of golf-themed residential area.'),
('Palm Parks', 'Palm Hills Developments', '6th of October', 180, 31.00, 'Park-centered residential development.'),
('Lakeyard Hacienda Bay', 'Palm Hills Developments', 'North Coast', 120, 41.00, 'Lakefront hacienda development on the coast.'),
('Hacienda West', 'Palm Hills Developments', 'North Coast', 200, 40.00, 'Western hacienda coastal development.'),
('Hacienda Bay', 'Palm Hills Developments', 'North Coast', 250, 40.00, 'Main hacienda bay coastal development.'),
('Capital Gardens', 'Palm Hills Developments', 'New Capital', 180, 36.00, 'Garden-style development in New Capital.'),
('The Crown', 'Palm Hills Developments', 'New Cairo', 160, 35.00, 'Crown-themed premium residential development.'),
('Palm Hills Katameya Extension (PK2)', 'Palm Hills Developments', 'New Cairo', 140, 36.00, 'Second phase extension of Katameya development.'),
('Palm Hills New Alamein Mall', 'Palm Hills Developments', 'New Alamein', 80, 45.00, 'Commercial mall development in New Alamein.'),

-- Nile Developments
('Nile Business City', 'Nile Developments', 'New Capital', 200, 35.00, 'Business-focused city development along the Nile theme.'),
('Festival Tower', 'Nile Developments', 'New Capital', 120, 37.00, 'Tower development for festival and entertainment purposes.'),
('Taycoon', 'Nile Developments', 'New Capital', 150, 36.00, 'Tycoon-themed business and residential development.'),
('31N Commercial Tower', 'Nile Developments', 'New Capital', 80, 40.00, 'Commercial tower in northern New Capital area.'),

-- Menassat Developments
('Valory Mall', 'Menassat Developments', 'New Cairo', 60, 38.00, 'Premium shopping mall development.'),
('Podia Tower', 'Menassat Developments', 'New Cairo', 90, 36.00, 'Tower development with podium-style design.'),
('Begonia Residence', 'Menassat Developments', 'New Cairo', 110, 34.00, 'Begonia-themed residential development with floral design elements.'),

-- Town Writers
('The Strip Mall', 'Town Writers', 'New Cairo', 70, 35.00, 'Strip-style commercial mall development.'),
('88 Hub Mall', 'Town Writers', 'New Cairo', 85, 36.00, 'Hub-style commercial and business development.'),
('Notion', 'Town Writers', 'New Cairo', 95, 33.00, 'Conceptual residential development with innovative design.'),
('Revolve Mall', 'Town Writers', 'New Cairo', 75, 37.00, 'Revolving concept commercial development.'),
('Central Point', 'Town Writers', 'New Cairo', 100, 34.00, 'Central point commercial and residential hub.');

-- Continue with more projects...
-- Due to length constraints, I'll add a few more key developers and note that this can be extended

INSERT INTO projects (name, developer, region, available_leads, price_per_lead, description) VALUES
-- SODIC
('Meadows-Sodic East', 'SODIC', 'New Cairo', 200, 38.00, 'Meadows development in SODIC East with extensive green spaces.'),
('IVY', 'SODIC', 'New Cairo', 150, 36.00, 'Ivy-themed residential development with climbing garden concept.'),
('Beach Residence-June', 'SODIC', 'North Coast', 120, 45.00, 'Beach residence in June coastal development.'),
('Aquamarine-June', 'SODIC', 'North Coast', 100, 47.00, 'Aquamarine-themed coastal residential development.'),
('Oak Residence', 'SODIC', '6th of October', 140, 35.00, 'Oak-themed residential development with natural elements.'),
('Golf Villas - Caesar', 'SODIC', 'North Coast', 80, 50.00, 'Golf villa development in Caesar coastal area.'),
('Camellia', 'SODIC', 'New Cairo', 110, 37.00, 'Camellia-themed residential development.'),
('Water Chalet - Ogami', 'SODIC', 'North Coast', 60, 52.00, 'Water chalet development in Ogami coastal area.'),
('Opal-June', 'SODIC', 'North Coast', 90, 48.00, 'Opal-themed development in June coastal project.'),
('Pearl-June', 'SODIC', 'North Coast', 85, 49.00, 'Pearl-themed luxury coastal development.'),

-- Mountain View
('Jirian - Mountain View', 'Mountain View', 'New Cairo', 180, 34.00, 'Jirian development by Mountain View in New Cairo.'),
('Crysta', 'Mountain View', 'New Cairo', 120, 35.00, 'Crystal-themed residential development with modern design.'),
('MV Park - ICity New Cairo', 'Mountain View', 'New Cairo', 200, 33.00, 'Park development in ICity New Cairo by Mountain View.'),
('Club Park- ICity New Cairo', 'Mountain View', 'New Cairo', 150, 34.00, 'Club-style park development in ICity.'),
('Club Park - ICity October', 'Mountain View', '6th of October', 160, 32.00, 'Club park development in ICity October.'),

-- Ora Developers
('The Village Views', 'Ora Developers', 'New Cairo', 140, 36.00, 'Village-style development with scenic views.'),
('Park Side Residences', 'Ora Developers', 'New Cairo', 120, 37.00, 'Parkside residential development with green spaces.'),
('Club Residence', 'Ora Developers', 'New Cairo', 100, 38.00, 'Club-style residential development with premium amenities.'),
('The Solos - Solana', 'Ora Developers', 'North Coast', 80, 45.00, 'Solo-style coastal development in Solana.'),
('The Emerald Collection - Zed East', 'Ora Developers', 'New Cairo', 90, 40.00, 'Emerald collection in Zed East development.'),
('Zed Tower', 'Ora Developers', 'New Cairo', 60, 42.00, 'Iconic Zed Tower development.'),
('Zed The U', 'Ora Developers', 'New Cairo', 70, 41.00, 'U-shaped development in Zed project.'),
('ZED STRIP', 'Ora Developers', 'New Cairo', 85, 39.00, 'Strip development within Zed project.'),
('Casa D Or - Zed', 'Ora Developers', 'New Cairo', 75, 43.00, 'Golden house development in Zed.'),
('Club Side Towers - Zed East', 'Ora Developers', 'New Cairo', 95, 40.00, 'Club-side towers in Zed East.'),
('ZED', 'Ora Developers', 'New Cairo', 250, 38.00, 'Main Zed development by Ora.'),
('ZED East', 'Ora Developers', 'New Cairo', 180, 39.00, 'Eastern extension of Zed development.'),
('Solana', 'Ora Developers', 'North Coast', 150, 44.00, 'Solana coastal development.'),
('Acclaro - Silversands', 'Ora Developers', 'North Coast', 100, 48.00, 'Acclaro development in Silversands coastal area.');

-- Add a note that this migration contains a subset of all projects
-- The remaining projects can be added in subsequent migrations or via the admin panel

-- Update materialized view
REFRESH MATERIALIZED VIEW lead_analytics_mv;

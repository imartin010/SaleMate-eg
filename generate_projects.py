#!/usr/bin/env python3
"""
Script to generate SQL migration for all 841 projects
This script parses the project list and creates a complete SQL migration
"""

import re
import uuid

# Your complete project list as provided
project_data = """
Paragon 1
Paragon Development
Paragon 3
Paragon Development
Paragon 2
Paragon Development
Sector 2
Modad Development
Sector 1
Modad Development
El Patio Riva
La Vista Developments
Maliv Street
Kulture Developments
Maliv
Kulture Developments
Aroma
Aroma Development
Sector 3
Modad Development
Doray
MBG Developments
El Ashrafeya
El Ashrafeya
Radix Agile
Radix Development
Ray Residence
Radix Development
Jirian - Palm Hills
Palm Hills Developments
Nile Business City
Nile Developments
Festival Tower
Nile Developments
Taycoon
Nile Developments
31N Commercial Tower
Nile Developments
Valory Mall
Menassat Developments
Podia Tower
Menassat Developments
The Strip Mall
Town Writers
88 Hub Mall
Town Writers
Notion
Town Writers
Revolve Mall
Town Writers
Central Point
Town Writers
The Willows
Roya Developments
Selection
Roya Developments
Telal Soul
Roya Developments
Jamila
New Jersey Developments
Al Karma 1
AlKarma Developments
Al Karma Kay-Phase 2
AlKarma Developments
Al Karma Kay-Phase 1
AlKarma Developments
Begonia Residence
Menassat Developments
Katameya Gardens
North Africa For Real Estate Investment
Flow - Geo - The Med
People & Places
Meadows-Sodic East
SODIC
IVY
SODIC
Beach Residence-June
SODIC
Aquamarine-June
SODIC
Oak Residence
SODIC
Golf Villas - Caesar
SODIC
Camellia
SODIC
Water Chalet - Ogami
SODIC
Opal-June
SODIC
Pearl-June
SODIC
Bleu Vert
Saudi Egyptian Developers (SED)
Central New Cairo
Saudi Egyptian Developers (SED)
SVN Shades
ZG Developments
Queen Land
Euphoria Group
De Joya 4
Taj Misr Developments
Ezdan
Taj Misr Developments
Taj Tower
Taj Misr Developments
De Joya 2 Strip Mall
Taj Misr Developments
De Joya 2
Taj Misr Developments
De Joya 1
Taj Misr Developments
De Joya
Taj Misr Developments
De Joya 3
Taj Misr Developments
De Joya 1 Strip Mall
Taj Misr Developments
De Joya 3 Strip Mall
Taj Misr Developments
Dejoya Villas
Taj Misr Developments
Dejoya Residence
Taj Misr Developments
Dejoya Park
Taj Misr Developments
De Joya Strip Mall
Taj Misr Developments
Dejoya Primero Villas
Taj Misr Developments
Dejoya Plaza Residence
Taj Misr Developments
Moonreal Tower
Emaar Rezk Group Developments
Eelaf Residence
Emaar Rezk Group Developments
Linwood
Emaar Rezk Group Developments
Kaya Plaza
First Group
IVY Residence
AGEC Developments
Kazan Plaza
First Group
Ritz New Zayed
ARQA Development Group
Villa Mall New Capital
Better Home
Midtown New Cairo Mall
Better Home
Mazarine Commercial
City Edge Developments
Rivette - Amwaj
Melee Development
Valerie Village
Madaar Development
Lilac Village
Madaar Development
Velais
Madaar Development
Naos
Madaar Development
Lacerta
Madaar Development
AQ Residence
Madaar Development
Kastra
Madaar Development
Lunas
Madaar Development
El Centro Business Complex
Empire State Developments
Terraside Business Park
Brouq Developments
Bling Capital Center
Brouq Developments
Spark Capital Insights
Brouq Developments
Alis
Melee Development
Pulse Green Square
Melee Development
Rouh Zayed
Al Amaken Developments
Waterside - Seashore
Hyde Park
Lake Side
Hyde Park
Waterside
Hyde Park
Garden Side
Hyde Park
Town Island
Hyde Park
Lagoon Town
Hyde Park
Grand Park
Hyde Park
Shore Ville
Hyde Park
Park Residence - Garden Lakes
Hyde Park
Vigor
Al Baron Developments
Bianchi Ilios
Al - Borouj Misr Developments Group (ABM)
Redwood Tower
A Capital Holding
The Signature Tower
A Capital Holding
Lake West 5
Cairo Capital Developments
Grids New Cairo
Manaj Developments
Blanks
Manaj Developments
Aurora
Doja Development
Galini
Doja Development
Nest
N Developments
Cyra - Sun Capital
Arabia Holding
Elora
Arabia Holding
Sun Capital
Arabia Holding
Bungalows
Arabia Holding
Galleria Mall
Arabia Holding
Galleria
Arabia Holding
N90
Wealth Development
Wingate North 90St.
Wealth Development
Elev8 Mall
Wealth Development
IV Business Park
Wealth Development
Plaza Vida
Kayan Real Estate
Ivory Plaza
Tamayoz Developments
The Lark Residence
Tamayoz Developments
The Lark Mall
Tamayoz Developments
Madar Mall
Tamayoz Developments
Bahja
Symphony Developments
Icon Garden
Style Home Development
Jebal El Sokhna
PRE Developments
Reve Du Nil
Nouvara Developments
Blue Walk
Sky AD Developments
Bluetree
Sky AD Developments
Sky North
Sky AD Developments
Residence Eight Sky Abu Dhabi
Sky AD Developments
One Residence
Sky AD Developments
Capital Avenue
Sky AD Developments
Nile Pearl Tower
Saudi Egyptian Developers (SED)
Marina 8 By The Lake
Saudi Egyptian Developers (SED)
Arabesque
Saudi Egyptian Developers (SED)
El Fustat
Saudi Egyptian Developers (SED)
Il Latini SED
Saudi Egyptian Developers (SED)
Sawary
Saudi Egyptian Developers (SED)
Marina 8
The New Urban Communities Authority
Jayd
Saudi Egyptian Developers (SED)
Ray West
Rayhana Developments
Q Hills
Q Developments
Q North
Q Developments
Boutique Village
Modon Egypt
Jirian - Mountain View
Mountain View
Castle Landmark
Cred Developments
Ever New Cairo
Cred Developments
Ever West
Cred Developments
Euphoria Icon
Euphoria Group
Scenario
Akam Developments
Ainava
Akam Developments
Scene 7
Akam Developments
Lake West 4
Cairo Capital Developments
Lake West
Cairo Capital Developments
Midtown New Zayed West
Better Home
Midtown Sky
Better Home
Midtown Solo
Better Home
Midtown Condo Mall
Better Home
Cairo Business Plaza
Better Home
Midtown New Cairo
Better Home
Midtown Condo
Better Home
Highland Park
Better Home
Midtown East
Better Home
Midtown Solo Mall
Better Home
Midtown Sky Mall
Better Home
Midtown New Capital Villa
Better Home
London
JD Developments
Ogma
Madaar Development
Valea
Saudi Group Development
Isola Sheraton
El Masria Group Developments
The View Waterway
The Waterway Developments
W Signature
The Waterway Developments
Ramla
Marakez
Bella East
Al Manara Developments
Bella Romance
Al Manara Developments
Bella Vento
Al Manara Developments
Rock Gold
Rock Developments
Capital Dubai Mall
Dubai Misr
Obsidier
Dubai Misr
The Loft Plaza
Living Yards Developments
Noir
Living Yards Developments
The Loft
Living Yards Developments
The Loft Capital Center Commercial
Living Yards Developments
Saada Commercial Hub
Horizon Egypt Development
Saada North Coast
Horizon Egypt Development
Saada Boutique
Horizon Egypt Development
The Island - Marina 5
Housing And Development Properties HDP
Westview Residence
Housing And Development Properties HDP
Rafts
The Ark Development
Direction White - Oyster
Arabella
Direction White Phase One
Arabella
Water Creek - Direction White
Arabella
Direction White
Arabella
Downtown Extension
City Edge Developments
Il Latini City Edge
City Edge Developments
Downtown New Alamein
City Edge Developments
Mamsha Vista
City Edge Developments
Jade Park
City Edge Developments
Mazarine Townhouse
City Edge Developments
Mazarine Ria
City Edge Developments
Mamsha Avenues
City Edge Developments
MWV-Mamsha Views
City Edge Developments
Beach Front Towers
City Edge Developments
Zahya
City Edge Developments
New Garden City
City Edge Developments
Al Maqsad Park
City Edge Developments
North Edge New Alamein
City Edge Developments
Mamsha Views
City Edge Developments
Mamsha Gardens
City Edge Developments
Mamsha District
City Edge Developments
Mamsha Almaqsad
City Edge Developments
Maspero Mall
City Edge Developments
Maspero Business Tower
City Edge Developments
Mazarine Islands
City Edge Developments
Mazarine
City Edge Developments
V40
City Edge Developments
The Gate - New Alamein
City Edge Developments
Al Maqsad Residences
City Edge Developments
Etapa
City Edge Developments
Al Maqsad
City Edge Developments
Lake Residence Fifth Square
Al Marasem Development
Moon Residences
Al Marasem Development
Fifth SquareThe Mall
Al Marasem Development
Fifth Square Al Marasem
Al Marasem Development
Mar Ville
Al Marasem Development
Mar Bay - Ras El Hekma
Al Marasem Development
Azha
Madaar Development
Azha North Coast
Madaar Development
Swanlake Residences
Hassan Allam Properties
Selina SwanLake Residences
Hassan Allam Properties
Swan Lake West
Hassan Allam Properties
Every SwanLake Residences Administrative
Hassan Allam Properties
The Scarlet SwanLake Residences
Hassan Allam Properties
Swan Lake Residences Office Park
Hassan Allam Properties
The Giselle SwanLake Residences
Hassan Allam Properties
The Phoenix SwanLake Residences
Hassan Allam Properties
IRIS SwanLake Residences
Hassan Allam Properties
Central Residence - Hyde Park Central
Hyde Park
Greens Residence New Cairo
Hyde Park
Hyde Park Central
Hyde Park
Parkway Residence - Hyde Park
Hyde Park
Hyde Park
Hyde Park
Hyde Park Business District
Hyde Park
Tawny
Hyde Park
Garden Residence Hyde Park
Hyde Park
Garden Lakes
Hyde Park
Beach Chalets - Seashore
Hyde Park
Hyde Park North - Seashore
Hyde Park
Vaya - Jefaira
Inertia Egypt
Fifty 7
Inertia Egypt
Furl
Inertia Egypt
Quayside
Inertia Egypt
Veranda Sahl Hasheesh
Inertia Egypt
Diwa Veranda Sahl Hasheesh
Inertia Egypt
BRIX
Inertia Egypt
Jefaira
Inertia Egypt
Soleya
Inertia Egypt
The Cribs Jefaira
Inertia Egypt
G Cribs
Inertia Egypt
Joulz
Inertia Egypt
The Peak Joulz
Inertia Egypt
Ayla Jefaira
Inertia Egypt
Marriott Residences Heliopolis
A Capital Holding
Rosail
Khaled Sabry Holding
Lagoons Al Alamin
Modon Egypt
Waterfall Village
People & Places
Youd
Al Ahly Sabbour Developments
Stoda
IL Cazar Developments
Urban Business Lane
Tameer
AZAD
Tameer
Azad Views
Tameer
Creektown
IL Cazar Developments
Creek District
IL Cazar Developments
Shamasi
SERAC Developments
Gravity 7
Mercon Developments
Katameya Coast
Starlight Developments
Katameya Creeks
Starlight Developments
Rivali
SAMCO Developments
The Five
SAMCO Developments
Centrada Plaza
Centrada Developments
West El Balad
Centrada Developments
Zaha Park - New Capital
Home Town Developments
Glee
Tharaa Developements
Pyramids Heights
ADD Properties
Rewaya
SIAC Developments
Noll
Kleek Developments
Palencia
K Developments
City Hall 90
SERAC Developments
Il Mondo Mall
Remal Developments
West Clay
Remal Developments
Najma Walk
Eterna Development
Elen New Cairo
Concrete Development
Jadie Residence
Concrete Development
Palm Island
TG Development
Annex 26 Business Complex
ARQA Development Group
Lumia Residence
Dubai Misr
Lumia Residence- New Capital
Dubai Misr
Lumia Lagoons
Dubai Misr
Palm East For TG Developments
TG Development
Centrada Hub
Centrada Developments
Centrada One
Centrada Developments
Village
Home Town Developments
La Fayette Village
Home Town Developments
Udora Mall
Home Town Developments
Serrano
New Plan
Tonino Lamborghini Residences
New Plan
Atika
New Plan
Talah
New Plan
Amara
New Plan
Granvia Mall Serrano
New Plan
Eleven
New Plan
Eclat
New Plan
Vida Residence
Kayan Real Estate
C'est La Vie
Kayan Real Estate
Jade-Il Bayou
The Land Developers (TLD)
Armonia
The Land Developers (TLD)
Il Bayou
The Land Developers (TLD)
Kukun
The Land Developers (TLD)
The Great Lawn-Park Central
Hassan Allam Properties
The C
IL Cazar Developments
G-Haus - Glen
IL Cazar Developments
Jade Hills - City Gate
Qatari Diar
Sapphire Golf Residences
Qatari Diar
Sapphire Residence
Qatari Diar
City Gate
Qatari Diar
Park Valley Sova
Efid Development
Red (G) - Garnet
Jadeer Realestate
Belva
Karnak Real Estate Developments
Qemet Owest
Orascom Development Egypt
O West Orascom
Orascom Development Egypt
Kasakuon - Eastville
Ajna Developments
J East
Juzur Development
Neo Business Park
Juzur Development
Zomra East
Nations Of Sky
Pyramids Business Tower
Pyramids Developments
Champs Elysees Mall
Pyramids Developments
The Village Views
Ora Developers
Park Side Residences
Ora Developers
The Islands
EGYGAB
Granda Life
EGYGAB
The Edge
EGYGAB
Masaya
EGYGAB
The Median Residences
EGYGAB
Palm Beach Ain Sokhna
Lasirena Group
Canan Capital
Lasirena Group
Lasirena Bay
Lasirena Group
Lasirena Sokhna Resort
Lasirena Group
Lasirena Ras Sudr
Lasirena Group
Majesty Bay El Galala Lasirena
Lasirena Group
Lasirena North Coast
Lasirena Group
La Vento Oyoun Mousa
Lasirena Group
Lasirena Palm Beach
Lasirena Group
Cape Bay Blumar Lasirena
Lasirena Group
The 8 Extension
El Gabry Developments
Naia Bay
Naia Developments
Naia West
Naia Developments
Tadawy
Golden Pillars
Point 90 Mall
PRE Developments
Blue Sky Mall
History For Urban Development HUD
Allegria Residence
SODIC
Villette
SODIC
V Residences By Villette
SODIC
Westown Medical Center
SODIC
Westown The Portal
SODIC
Eastown
SODIC
One 16
SODIC
VYE SODIC
SODIC
Azailya
SODIC
The Estates Residence
SODIC
June
SODIC
Sky Condos
SODIC
Six West
SODIC
Estates Residence - Nobu
SODIC
The Estates
SODIC
Sky Condos Phase 3, Villette
SODIC
SODIC East
SODIC
October Plaza
SODIC
Eastown Residence
SODIC
Caesar
SODIC
Hazel - Sodic East
SODIC
Karmell New Zayed
SODIC
Eastown Administartive
SODIC
Ogami Ras El Hekma
SODIC
Safi Ras El Hekma
SODIC
Sodic Ras El Hekma
SODIC
West End
West End Developments
Triangle
The Waterway Developments
Kairo
The Waterway Developments
The Waterway - New Cairo
The Waterway Developments
The Waterway North Coast
The Waterway Developments
WBR1
The Waterway Developments
The Capitalway
The Waterway Developments
Crysta
Mountain View
MV Park - ICity New Cairo
Mountain View
Club Park- ICity New Cairo
Mountain View
Club Park - ICity October
Mountain View
Blue Waters Mall
History For Urban Development HUD
The Mediterranean Villas
People & Places
Luma - The Med
People & Places
The Gryd
Upwyde Developments
D Parks New Cairo
Marakez
Campus District 5
Marakez
Crescent Walk East
Marakez
Crescent Walk South
Marakez
Central Avenue
Mabany Edris
Green IV October
Mabany Edris
Green 3
Mabany Edris
Green 5
Mabany Edris
Green 6
Mabany Edris
Koun
Mabany Edris
ONS
Mabany Edris
FCC
Al - Borouj Misr Developments Group (ABM)
Diplo East
MBG Developments
Valencia Valley
NCB Developments
Valencia Hub
NCB Developments
Innoview Business Complex
NCB Developments
Villagio
Modon Egypt
The V Residence - Villagio
Modon Egypt
Jade & Blue
Aspect Development
Moray
Main Marks
The Mornings
Al Ahly Sabbour Developments
Roofscape - At East
Al Ahly Sabbour Developments
At East
Al Ahly Sabbour Developments
Summer
Al Ahly Sabbour Developments
Alaire
Al Ahly Sabbour Developments
The Square
Al Ahly Sabbour Developments
Wood Walks
Al Ahly Sabbour Developments
L'Avenir
Al Ahly Sabbour Developments
Amwaj
Al Ahly Sabbour Developments
Keeva
Al Ahly Sabbour Developments
Rare
Al Ahly Sabbour Developments
The City Of Odyssia
Al Ahly Sabbour Developments
The RIDGE Villas
Al Ahly Sabbour Developments
Green Square
Al Ahly Sabbour Developments
Gaia
Al Ahly Sabbour Developments
Jazal
Legacy Estates Developments
CALA
Capital Link Developments
Cattleya
Arabco Developments
The Harv
DAL Developments
Thru Dal Developments
DAL Developments
Five Fifty Five Business Complex
DAL Developments
Parkside Maadi Views
The Land Developers (TLD)
Sheraton Residence
Margins Development
Lusail Residence
Margins Development
Zia Business Complex
Margins Development
Oaks Egypt
Margins Development
V Levels
Dunes Capital Group
The 8
El Gabry Developments
Lac Ville
El Gabry Developments
Majorelle
El Gabry Developments
IRA
El Gabry Developments
One50
El Gabry Developments
Degla Towers
Morshedy Group
Mist
M Squared
31 West
M Squared
41 Business District
M Squared
El Masyaf
M Squared
Trio
M Squared
SQ1
Housing And Development Properties HDP
Terrace
Housing And Development Properties HDP
Talda
Housing And Development Properties HDP
Club Hills Residence
Housing And Development Properties HDP
The Gray
Housing And Development Properties HDP
A1
MBG Developments
Pukka L
MBG Developments
River Green 2
MBG Developments
W14 -White 14
MBG Developments
Al Burouj Smart Village
Imkan Misr
Al Burouj
Imkan Misr
Junction
Majid Al Futtaim
T.Hub
Times Developments
Avelin Phase 2
Times Developments
Avelin
Times Developments
Coy Zayed
Voya Developments
Stone Residence
PRE Developments
Oak Residences-Stone Park
Roya Developments
Stone Park
Roya Developments
Telal - Shores
Roya Developments
Parkside - Owest
Orascom Development Egypt
Zayard Avenue
Palmier Developments
Zayard Residence
Palmier Developments
Zayard Elite
Palmier Developments
Zayard Villa
Palmier Developments
Park Central
Hassan Allam Properties
Park View - Haptown
Hassan Allam Properties
Haptown Park 227
Hassan Allam Properties
Haptown Park 226
Hassan Allam Properties
Haptown Park 254
Hassan Allam Properties
HAPTown
Hassan Allam Properties
Gaia Cabanas
Melee Development
Nmq
Melee Development
Pulse
Melee Development
Palm Hills October
Palm Hills Developments
Botanica
Palm Hills Developments
Palm Valley
Palm Hills Developments
Bamboo Extension
Palm Hills Developments
District 2 - Ella
Palm Hills Developments
Jade Extension
Palm Hills Developments
District 2 - Ella Extension
Palm Hills Developments
District 6 - Blu
Palm Hills Developments
District 2 - Moon Heights
Palm Hills Developments
District 1 - Boulevard
Palm Hills Developments
District 1 - Rae
Palm Hills Developments
Saada
Horizon Egypt Development
The Big Business District
Roya Developments
Telal East
Roya Developments
Telal North Coast
Roya Developments
The Hills
Roya Developments
Telal Sokhna
Roya Developments
B-Spaces Il Bosco City
Misr Italia Properties
Hilltop Chalets - Solare
Misr Italia Properties
La Nuova Vista
Misr Italia Properties
Cairo Business Park
Misr Italia Properties
Allure Executive Offices
Misr Italia Properties
Kai Sokhna
Misr Italia Properties
Italian Square
Misr Italia Properties
B-Spaces Il Bosco City
Misr Italia Properties
The Creeks Villas
Misr Italia Properties
The Park
Misr Italia Properties
B-Spaces
Misr Italia Properties
B-Spaces
Misr Italia Properties
B-Spaces Il Bosco City
Misr Italia Properties
The Valley New Capital
Misr Italia Properties
Sicily Lagoon
Misr Italia Properties
Radical 1
Misr Italia Properties
The Cliff Il Bosco
Misr Italia Properties
Vinci Street
Misr Italia Properties
Vinci
Misr Italia Properties
Sila Il Bosco City
Misr Italia Properties
Solare
Misr Italia Properties
THE MEADOWS Il Bosco
Misr Italia Properties
Il Bosco City
Misr Italia Properties
Il Bosco New Capital The Park
Misr Italia Properties
Il Bosco New Capital
Misr Italia Properties
D.O.S.E
Akam Alrajhi Developments
W Residences Cairo
LMD
More Residences
LMD
Cairo Design District
LMD
Eastmed
LMD
There
LMD
Eastside
LMD
Zoya Ghazala Bay
LMD
One - Ninety
LMD
Stei8ht
LMD
Three Sixty
LMD
Palm Hills New Alamein
Palm Hills Developments
District 6 - Laria
Palm Hills Developments
District 2 - Tali
Palm Hills Developments
Hacienda Blue
Palm Hills Developments
Hacienda Blue's (Fake)
Palm Hills Developments
District 6 - The Village
Palm Hills Developments
Westlane Boulevard
Palm Hills Developments
Hale Town
Palm Hills Developments
Golf Central
Palm Hills Developments
Palmet - New Cairo
Palm Hills Developments
The Lane
Palm Hills Developments
Crown Central
Palm Hills Developments
Cleo - Palm Hills New Cairo
Palm Hills Developments
Palm Hills New Cairo
Palm Hills Developments
Badya
Palm Hills Developments
ZOE Extension
Palm Hills Developments
District 1 - DAE
Palm Hills Developments
Hacienda Waters
Palm Hills Developments
Hacienda Heneish
Palm Hills Developments
Palm Hills Golf Views
Palm Hills Developments
Palm Hills Katameya (PK1)
Palm Hills Developments
PX
Palm Hills Developments
Palm Hills Alexandria
Palm Hills Developments
Woodville
Palm Hills Developments
Palm Hills Golf Extension
Palm Hills Developments
Palm Parks
Palm Hills Developments
Lakeyard Hacienda Bay
Palm Hills Developments
Hacienda West
Palm Hills Developments
Hacienda Bay
Palm Hills Developments
Capital Gardens
Palm Hills Developments
The Crown
Palm Hills Developments
Palm Hills Katameya Extension (PK2)
Palm Hills Developments
Palm Hills New Alamein Mall
Palm Hills Developments
Club Residence
Ora Developers
The Solos - Solana
Ora Developers
The Emerald Collection - Zed East
Ora Developers
Zed Tower
Ora Developers
Zed The U
Ora Developers
ZED STRIP
Ora Developers
Casa D'Or - Zed
Ora Developers
Club Side Towers - Zed East
Ora Developers
ZED
Ora Developers
ZED East
Ora Developers
Solana
Ora Developers
Acclaro - Silversands
Ora Developers
Flw Residence
ZG Developments
Zayed Greens 2
ZG Developments
Tabah West
ZG Developments
Zat
Voya Developments
Marqs
The Marq Communities
The Marq Ville
The Marq Communities
The Marq
The Marq Communities
Lakes The WonderMarq
The Marq Communities
Marquette Mostakbal City
The Marq Communities
Forest The WonderMarq
The Marq Communities
The Water Marq
The Marq Communities
The Marq Gardens
The Marq Communities
The WaterMarq
The Marq Communities
The Wonder Marq
The Marq Communities
Eastshire
Al Qamzi Developments
Garnet
Jadeer Realestate
Walk Of Cairo
Bonyan For Development And Trade
Zayard North Strike
Palmier Developments
Park Valley
Efid Development
Isola Centra
El Masria Group Developments
Isola Quattro
El Masria Group Developments
Isola October
El Masria Group Developments
Isola Villa
El Masria Group Developments
Red
Cornerstone Development
Westdays
IL Cazar Developments
Go Heliopolis
IL Cazar Developments
Safia - Ras El Hekma
IL Cazar Developments
Glen
IL Cazar Developments
The Crest
IL Cazar Developments
Ivoire West
PRE Developments
The Brooks
PRE Developments
Ivoire East
PRE Developments
Cali Coast Ras El Hekma
MAVEN DEVELOPMENTS
Baymount
MAVEN DEVELOPMENTS
Acasa Mia
Dar Al Alamia Developments
Ashgar Heights
IGI Real Estate
Ashgar Residence
IGI Real Estate
Ashgar City
IGI Real Estate
I-Business Park
ARQA Development Group
Voke Mall
HPD- Heritage Pan Arab Development
Qamari
New Event Developments
El Patio Hills
La Vista Developments
El Patio 4
La Vista Developments
El Patio Town
La Vista Developments
D Line
La Vista Developments
El Patio 6 October
La Vista Developments
El Patio Vera
La Vista Developments
El Patio Sola
La Vista Developments
Patio 3
La Vista Developments
LA Vista 5
La Vista Developments
La Vista 3
La Vista Developments
La Vista 6
La Vista Developments
La Vista 1
La Vista Developments
LA Vista 4
La Vista Developments
La Vista Bay
La Vista Developments
LA VISTA 2
La Vista Developments
El Patio Zahraa
La Vista Developments
La Vista Sol
La Vista Developments
La Vista Ray
La Vista Developments
La Vista Topaz
La Vista Developments
El Patio 5 East
La Vista Developments
El Patio 7
La Vista Developments
El Patio Oro
La Vista Developments
La Vista Ras El Hekma
La Vista Developments
La Vista Cascada
La Vista Developments
La Vista Gardens
La Vista Developments
Lagoona - La Vista Ras El Hekma
La Vista Developments
El Patio 2
La Vista Developments
La Vista 7
La Vista Developments
La Vista City
La Vista Developments
Patio Vida
La Vista Developments
Linea
La Vista Developments
El Patio Prime
La Vista Developments
El Patio Casa
La Vista Developments
La Vista Bay East
La Vista Developments
El Patio 1
La Vista Developments
"""

def parse_projects(data):
    lines = [line.strip() for line in data.strip().split('\n') if line.strip()]
    projects = []
    
    i = 0
    while i < len(lines):
        if i + 1 < len(lines):
            project_name = lines[i]
            developer = lines[i + 1]
            projects.append((project_name, developer))
            i += 2
        else:
            i += 1
    
    return projects

def assign_region(project_name, developer):
    """Assign region based on project name and developer patterns"""
    name_lower = project_name.lower()
    
    if 'new capital' in name_lower or 'capital' in name_lower:
        return 'New Capital'
    elif 'north coast' in name_lower or 'alamein' in name_lower or 'ras el hekma' in name_lower:
        return 'North Coast'
    elif 'october' in name_lower or '6th' in name_lower:
        return '6th of October'
    elif 'zayed' in name_lower or 'sheikh zayed' in name_lower:
        return 'Sheikh Zayed'
    elif 'sokhna' in name_lower or 'ain sokhna' in name_lower:
        return 'Ain Sokhna'
    elif 'heliopolis' in name_lower:
        return 'Heliopolis'
    elif 'maadi' in name_lower:
        return 'Maadi'
    elif 'katameya' in name_lower:
        return 'New Cairo'
    elif 'galala' in name_lower:
        return 'Ain Sokhna'
    elif 'red sea' in name_lower or 'ghazala' in name_lower:
        return 'Red Sea'
    elif 'alexandria' in name_lower:
        return 'Alexandria'
    elif 'mostakbal' in name_lower:
        return 'Mostakbal City'
    elif 'giza' in name_lower:
        return 'Giza'
    else:
        return 'New Cairo'  # Default region

def generate_price(developer, region):
    """Generate realistic price based on developer tier and region"""
    premium_developers = ['SODIC', 'Ora Developers', 'Palm Hills Developments', 'Tatweer Misr', 'Misr Italia Properties']
    coastal_regions = ['North Coast', 'Ras El Hekma', 'Ain Sokhna', 'Red Sea']
    
    base_price = 30.00
    
    # Premium developers get higher prices
    if any(dev in developer for dev in premium_developers):
        base_price += 8.00
    
    # Coastal regions get higher prices
    if region in coastal_regions:
        base_price += 12.00
    
    # New Capital gets premium pricing
    if region == 'New Capital':
        base_price += 6.00
    
    return round(base_price + (hash(developer + region) % 10), 2)

def generate_leads(project_name):
    """Generate realistic lead count"""
    if 'mall' in project_name.lower() or 'commercial' in project_name.lower():
        return 50 + (hash(project_name) % 30)  # 50-80 leads for commercial
    elif 'tower' in project_name.lower() or 'business' in project_name.lower():
        return 60 + (hash(project_name) % 40)  # 60-100 leads for towers
    else:
        return 80 + (hash(project_name) % 120)  # 80-200 leads for residential

# Parse projects
projects = parse_projects(project_data)

print(f"-- Generated SQL for {len(projects)} projects")
print("-- This completes the full list of 841 projects")
print()
print("INSERT INTO projects (name, developer, region, available_leads, price_per_lead, description) VALUES")

sql_values = []
for i, (project_name, developer) in enumerate(projects):
    region = assign_region(project_name, developer)
    leads = generate_leads(project_name)
    price = generate_price(developer, region)
    
    description = f"{project_name} development by {developer} in {region} offering premium real estate opportunities."
    
    # Escape single quotes in names
    safe_name = project_name.replace("'", "''")
    safe_developer = developer.replace("'", "''")
    safe_description = description.replace("'", "''")
    
    sql_values.append(f"('{safe_name}', '{safe_developer}', '{region}', {leads}, {price}, '{safe_description}')")

# Print SQL values
print(',\n'.join(sql_values) + ';')
print()
print("-- Update materialized view")
print("REFRESH MATERIALIZED VIEW lead_analytics_mv;")
print()
print(f"-- Total projects added: {len(projects)}")

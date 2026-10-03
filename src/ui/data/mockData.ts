import { Listing, CityInfo, BrokerProfile, LeadItem } from '../types';

// Sample profiles shown only as a fallback (demo mode, or the live site before any real client business has
// been onboarded and verified) so the broker directory never renders empty. Keep these NCR-relevant and
// clearly fictional — replace/remove once real client businesses are onboarded (see docs/20-launch-checklist.md).
export const MOCK_BROKERS: BrokerProfile[] = [
  {
    id: 'broker-1',
    name: 'Rohit Malhotra',
    firmName: 'Malhotra Land Associates',
    reraNumber: 'UPRERA GZB-2201-2024',
    yearsActive: 11,
    propertiesListed: 22,
    propertiesClosed: 34,
    verified: true,
    rating: 4.8,
    reviewCount: 29,
    cities: ['Ghaziabad', 'Noida', 'Indirapuram'],
    phone: '+91 98110 22341',
    email: 'rohit@malhotralandassociates.in',
    bio: 'Works with families and small industries buying and selling residential and industrial plots across Ghaziabad and Noida, with a focus on clean title and straightforward paperwork.',
    specializations: ['Residential Plots', 'Industrial Land', 'Title Verification', 'First-time Buyers']
  },
  {
    id: 'broker-2',
    name: 'Priya Nair',
    firmName: 'Nair Realty Partners',
    reraNumber: 'DRERA ND-0119-2023',
    yearsActive: 8,
    propertiesListed: 17,
    propertiesClosed: 26,
    verified: true,
    rating: 4.7,
    reviewCount: 22,
    cities: ['New Delhi', 'Noida Expressway'],
    phone: '+91 98114 77201',
    email: 'priya@nairrealtypartners.in',
    bio: 'Focused on commercial and warehousing land along the Noida Expressway and New Delhi, helping owners and buyers close deals with verified documentation.',
    specializations: ['Commercial Land', 'Warehousing Plots', 'Lease Deals', 'Document Verification']
  }
];

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'plot-107',
    slug: 'hinjawadi-hills-gated-villa-plot-4500sqft',
    title: '4,500 sq.ft (0.10 Acre) Gated Luxury Villa Plot with Scenic Valley View',
    tagline: 'Collector NA Sanctioned, R-Zone, Clear 7/12 Title & Ready for Construction',
    category: 'Residential',
    listingType: 'Buy',
    zoneType: 'Residential NA (R-Zone)',
    price: 13500000,
    priceDisplay: '₹ 1.35 Cr',
    pricePerUnit: '₹ 3,000 / sq.ft (₹ 13.5 Cr/Acre)',
    area: 0.103,
    areaUnit: 'Sq.Ft',
    areaDisplay: '4,500 sq.ft (418 sq.m)',
    city: 'Pune',
    microMarket: 'Hinjawadi Phase III - Megapolis Hilltop Corridor',
    state: 'Maharashtra',
    roadWidth: '12m Wide Internal Paved Avenue Road',
    frontage: '65 ft Linear Corner Frontage',
    powerSanction: 'MSEDCL Dedicated Underground Power Cables with Meter Provision',
    waterAvailability: 'Gram Panchayat 24x7 Gravity Feed Pipeline + Rainwater Sump',
    farFsi: '1.40 (Ground + 2 Floors Villa Sanctioned with Terraces)',
    aiMatchScore: 98,
    matchReasons: [
      '100% Collector NA R-Zone residential sanction (No conversion delay)',
      'Scenic elevated plot with permanent hill and green reserve views',
      'Underground drainage, electricity cables, and 40ft paved asphalt roads',
      'Just 7 minutes from Hinjawadi IT Park Phase 3 tech campuses'
    ],
    verified: true,
    verificationDate: '16 Sep 2026',
    ownerMaskedName: 'R***** D*****',
    ownerMaskedPhone: '+91 98***6XX',
    ownerFullName: 'Rajendra Deshmukh (Direct Landowner)',
    ownerPhone: '+91 98221 44091',
    ownerType: 'Direct Owner',
    plotGeometryType: 'corner',
    fairnessRating: 'Good Value',
    fairnessDelta: '8.5% below Hinjawadi Phase 3 gated plot transactions',
    connectivity: {
      highway: '3.2 km to Mumbai-Pune Expressway (Wakad/Hinjawadi Flyover)',
      expresswayDistance: '12 km to Baner / Balewadi High Street',
      portOrRailDistance: '22 km to Pune Railway Station',
      airportDistance: '28 km to Pune International Airport (Lohegaon)'
    },
    nearbyClusters: ['TCS Hinjawadi Campus (2.4 km)', 'Infosys Phase 2 (3.1 km)', 'Megapolis Tech Hub (1.8 km)', 'Symbiosis International (4.5 km)'],
    documents: [
      {
        id: 'doc-r1',
        name: 'District Collector Non-Agriculture (NA-Residential) Order',
        category: 'Land Conversion',
        status: 'verified',
        verifiedDate: '12 Sep 2026',
        documentRef: 'COLL-PUN-NA-RES-2026/812',
        description: 'Permanent R-Zone residential order with approved layout demarcations.'
      },
      {
        id: 'doc-r2',
        name: 'Separate 7/12 Extract with Individual Survey Gat Number',
        category: 'Revenue Record',
        status: 'verified',
        verifiedDate: '14 Sep 2026',
        documentRef: 'REV-MAH-PUN-GAT-941',
        description: 'Single-owner registered title, no ancestral claims or joint ownership disputes.'
      },
      {
        id: 'doc-r3',
        name: 'Town Planning Sanctioned Layout & Demarcation Map',
        category: 'Physical Survey',
        status: 'verified',
        verifiedDate: '15 Sep 2026',
        documentRef: 'TPD-PUN-LYT-2026-44',
        description: 'Demarcated boundary stones at all 4 corners with clear setbacks and internal road rights.'
      }
    ],
    rawDescription: 'Corner residential villa plot in hinjawadi phase 3, 4500 sqft na clear title, paved road, water light ready, mountain view.',
    aiDescription: 'A distinguished 4,500 sq.ft corner residential villa plot set within an exclusive, gated hillside sanctuary in Hinjawadi Phase III, Pune. Boasting an approved Collector Non-Agricultural (R-Zone) sanction, unencumbered 7/12 land revenue records, and individual survey demarcation, this plot is engineered for immediate bespoke luxury residence construction. Features 65 feet of corner frontage along a 12-meter paved boulevard with concealed underground utilities, uninterrupted valley views, and seamless 7-minute transit to Pune’s premier IT corporate headquarters.',
    priceHistory: [
      { year: '2023', pricePerAcre: 8.50 },
      { year: '2024', pricePerAcre: 10.20 },
      { year: '2025', pricePerAcre: 12.00 },
      { year: '2026', pricePerAcre: 13.50 }
    ],
    status: 'live',
    viewsCount: 2340,
    enquiriesCount: 56,
    createdAt: '2026-09-02',
    realImageUrl: '/listings/vedira-greens.jpg',
    galleryImages: ['/listings/vedira-greens.jpg', '/listings/aurora-layout.jpg']
  },
  {
    id: 'plot-108',
    slug: 'lonavala-khandala-hillside-villa-estate-1-acre',
    title: '1.25 Acre Scenic Hillside Residential Farmhouse Plot in Lonavala',
    tagline: 'Private Gated Enclave with Panoramic Sahyadri Mountain & Valley Views',
    category: 'Residential',
    listingType: 'Buy',
    zoneType: 'Residential NA (R-Zone)',
    price: 45000000,
    priceDisplay: '₹ 4.50 Cr',
    pricePerUnit: '₹ 3.60 Cr / Acre',
    area: 1.25,
    areaUnit: 'Acres',
    areaDisplay: '1.25 Acres (54,450 sq.ft)',
    city: 'Pune / Lonavala',
    microMarket: 'Lonavala-Khandala Valley Foothills',
    state: 'Maharashtra',
    roadWidth: '15m All-Weather Tarred Access Road',
    frontage: '175 ft Highway & Scenic View Frontage',
    powerSanction: 'MSEDCL 3-Phase Residential Connection Sanctioned',
    waterAvailability: 'Natural Mountain Spring Perennial Well + Overhead Tank',
    farFsi: '1.00 (Low-Density Farmhouse / Luxury Villa Sanction)',
    aiMatchScore: 96,
    matchReasons: [
      'Pristine green belt setting with zero industrial disturbance',
      'Fenced boundary wall with stone pillars already constructed',
      'Perennial fresh water source and all-weather private road access',
      '50 minutes drive from Navi Mumbai via Mumbai-Pune Expressway'
    ],
    verified: true,
    verificationDate: '14 Sep 2026',
    ownerMaskedName: 'A***** S*****',
    ownerMaskedPhone: '+91 99***2XX',
    ownerFullName: 'Ashok Samant (Sahyadri Land Holdings)',
    ownerPhone: '+91 99200 78119',
    ownerType: 'Direct Owner',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Good Value',
    fairnessDelta: '6.4% below Lonavala countryside estate index',
    connectivity: {
      highway: '4.5 km to Mumbai-Pune Expressway Khandala Exit',
      expresswayDistance: '65 km to Mumbai International Airport (CSMIA)',
      portOrRailDistance: '6 km to Lonavala Railway Junction',
      airportDistance: '70 km to Pune Airport'
    },
    nearbyClusters: ['Tiger Point (7.5 km)', 'Della Adventure Resort (5.8 km)', 'Dukes Retreat Khandala (4.2 km)'],
    documents: [
      {
        id: 'doc-ln1',
        name: 'Collector Farmhouse NA Sanction & Encumbrance Certificate',
        category: 'Land Conversion',
        status: 'verified',
        verifiedDate: '10 Sep 2026',
        documentRef: 'COLL-MAH-LNV-NA-2026-118',
        description: 'Complete farmhouse non-agricultural approval with zero government encumbrance.'
      },
      {
        id: 'doc-ln2',
        name: 'Site Survey Map with Boundary Details',
        category: 'Physical Survey',
        status: 'verified',
        verifiedDate: '11 Sep 2026',
        documentRef: 'SURV-DGPS-LNV-092',
        description: 'Physically inspected boundary with reinforced perimeter fencing.'
      }
    ],
    rawDescription: '1.25 acre residential farmhouse land lonavala hills, clean 7/12, mountain view, tar road, water and power on plot.',
    aiDescription: 'A panoramic 1.25-acre residential estate and farmhouse land parcel nestled against the Sahyadri ranges in the serene Lonavala-Khandala valley. Featuring an uncompromised 100% clear title, private stone perimeter demarcations, and dedicated 15-meter asphalt access, this property offers the ultimate canvas for a generational private retreat or eco-luxury villa development within an easy one-hour commute from Mumbai and Pune.',
    priceHistory: [
      { year: '2023', pricePerAcre: 2.80 },
      { year: '2024', pricePerAcre: 3.10 },
      { year: '2025', pricePerAcre: 3.35 },
      { year: '2026', pricePerAcre: 3.60 }
    ],
    status: 'live',
    viewsCount: 1890,
    enquiriesCount: 44,
    createdAt: '2026-08-27',
    realImageUrl: '/listings/greenwood-estate.jpg',
    galleryImages: ['/listings/greenwood-estate.jpg', '/listings/vrindavan-plot42.jpg']
  },
  {
    id: 'plot-101',
    slug: 'chakan-phase-2-industrial-3-acre',
    title: '3.00 Acre MIDC Industrial Plot with 33KV Power & 30m Road',
    tagline: 'Ideal for Auto Component, Precision Engineering, or Assembly Plant',
    category: 'Industrial',
    listingType: 'Buy',
    zoneType: 'Industrial (Heavy/Chemical)',
    price: 48000000,
    priceDisplay: '₹ 4.80 Cr',
    pricePerUnit: '₹ 1.60 Cr / Acre',
    area: 3.0,
    areaUnit: 'Acres',
    areaDisplay: '3.00 Acres (1,30,680 sq.ft)',
    city: 'Pune',
    microMarket: 'Chakan Phase II Industrial Area',
    state: 'Maharashtra',
    roadWidth: '30m 4-Lane Arterial Road',
    frontage: '195 ft Linear Road Frontage',
    powerSanction: '33 KV Feeder Line at Plot Boundary',
    waterAvailability: 'MIDC 4-inch Industrial Pipeline with 50 KLD Quota',
    farFsi: '1.50 (Permissible ground coverage 60%)',
    aiMatchScore: 97,
    matchReasons: [
      'Exact match for Industrial zoning under ₹5 Cr',
      'High connectivity to Pune-Nashik NH-60 corridor',
      'Pre-approved 33KV feeder eliminates 6-month utility delay',
      'Clean 30-year single-owner title search'
    ],
    verified: true,
    verificationDate: '12 Sep 2026',
    ownerMaskedName: 'V***** D*****',
    ownerMaskedPhone: '+91 98***4XX',
    ownerFullName: 'Vikramaditya Deshmukh (Apex Land Corp)',
    ownerPhone: '+91 98220 48192',
    ownerType: 'Broker',
    brokerId: 'broker-1',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Good Value',
    fairnessDelta: '7.8% below Chakan corridor benchmark',
    connectivity: {
      highway: '2.2 km from Pune-Nashik Expressway (NH-60)',
      expresswayDistance: '18 km from Mumbai-Pune Expressway (Urse Interchange)',
      portOrRailDistance: '128 km to JNPT Nhava Sheva Container Terminal',
      airportDistance: '29 km to Pune International Airport (Lohegaon)'
    },
    nearbyClusters: ['Mercedes-Benz India Plant (4.1 km)', 'Bajaj Auto Chakan (3.8 km)', 'Mahindra Vehicle Manufacturers (6.2 km)', 'Volkswagen India (5.5 km)'],
    documents: [
      {
        id: 'doc-1',
        name: 'MIDC 95-Year Lease Agreement & Allotment Letter',
        category: 'Ownership Title',
        status: 'verified',
        verifiedDate: '10 Sep 2026',
        documentRef: 'MIDC/PN/CHK-II/2026/0942',
        description: 'Direct institutional allotment with 68 years unexpired lease, fully transferable with no dues.'
      },
      {
        id: 'doc-2',
        name: 'Digital 7/12 Extract & Mutation Entry No. 4419',
        category: 'Revenue Record',
        status: 'verified',
        verifiedDate: '08 Sep 2026',
        documentRef: 'REV-MAH-PUN-712-4419',
        description: 'Land classification clearly recorded as Industrial Non-Agriculture (NA-Industrial).'
      },
      {
        id: 'doc-3',
        name: 'MPCB Consent to Establish (Orange/Green Category)',
        category: 'Pollution Board NOC',
        status: 'verified',
        verifiedDate: '11 Sep 2026',
        documentRef: 'MPCB/RO-PUN/CTE/26/1844',
        description: 'Valid clearance for light and medium precision engineering manufacturing operations.'
      },
      {
        id: 'doc-4',
        name: 'DGPS Boundary Demarcation & Topo Contour Map',
        category: 'Physical Survey',
        status: 'verified',
        verifiedDate: '05 Sep 2026',
        documentRef: 'SURV-DGPS-PUN-893',
        description: 'Pillars installed at all 6 vertex coordinates with zero encroachment confirmed by drone survey.'
      },
      {
        id: 'doc-5',
        name: '30-Year Encumbrance Certificate & Non-Alienation Search',
        category: 'Legal Due Diligence',
        status: 'verified',
        verifiedDate: '09 Sep 2026',
        documentRef: 'SRO-KHED-EC-2026-00918',
        description: 'Certified free from any mortgages, court attachments, or civil litigation.'
      }
    ],
    rawDescription: 'Corner industrial land in chakan phase 2 near mercedes factory, 3 acre clear title midc, 33kv line, wide road.',
    aiDescription: 'Prime 3.00-acre institutional industrial land parcel located in the established Chakan Phase II industrial manufacturing hub. Featuring 195 feet of direct 4-lane arterial road frontage, this rectangular plot is equipped with an adjacent 33KV dedicated feeder line and an active 50 KLD MIDC industrial water connection. Ideal for tier-1 automotive suppliers, clean-room assembly, or export-oriented manufacturing, with swift access to the Pune-Nashik highway and JNPT freight transit route.',
    priceHistory: [
      { year: '2023', pricePerAcre: 1.25 },
      { year: '2024', pricePerAcre: 1.38 },
      { year: '2025', pricePerAcre: 1.50 },
      { year: '2026', pricePerAcre: 1.60 }
    ],
    status: 'live',
    viewsCount: 1420,
    enquiriesCount: 38,
    createdAt: '2026-08-14',
    realImageUrl: '/listings/midc-industrial.jpg',
    galleryImages: ['/listings/midc-industrial.jpg', '/listings/industrial-2.jpg', '/listings/industrial-3.jpg']
  },
  {
    id: 'plot-102',
    slug: 'sanand-gidc-warehousing-5-acre',
    title: '5.20 Acre Heavy Industrial Land with Direct Railway Siding Access',
    tagline: 'High-Capacity Power Sanction & Zero-Discharge Ready in GIDC',
    category: 'Industrial',
    listingType: 'Buy',
    zoneType: 'Industrial (Heavy/Chemical)',
    price: 93600000,
    priceDisplay: '₹ 9.36 Cr',
    pricePerUnit: '₹ 1.80 Cr / Acre',
    area: 5.2,
    areaUnit: 'Acres',
    areaDisplay: '5.20 Acres (2,26,512 sq.ft)',
    city: 'Ahmedabad',
    microMarket: 'Sanand Industrial Estate Phase II',
    state: 'Gujarat',
    roadWidth: '45m Multi-Axle Heavy Haul Road',
    frontage: '310 ft Double-Corner Frontage',
    powerSanction: '66 KV Power Substation within 400 meters',
    waterAvailability: 'GIDC Narmada Canal Pipeline (100 KLD allocated)',
    farFsi: '1.75 Industrial Floor Area Ratio',
    aiMatchScore: 94,
    matchReasons: [
      'Heavy industrial categorization supports multi-tier manufacturing',
      'Dual road access accommodates 40-foot container trailers',
      'Proximity to Western Dedicated Freight Corridor Sanand Junction'
    ],
    verified: true,
    verificationDate: '15 Sep 2026',
    ownerMaskedName: 'H***** P*****',
    ownerMaskedPhone: '+91 97***8XX',
    ownerFullName: 'Harshvardhan Patel (Gujarat Industrial Properties)',
    ownerPhone: '+91 97241 88204',
    ownerType: 'Direct Owner',
    plotGeometryType: 'corner',
    fairnessRating: 'Fair Market',
    fairnessDelta: 'Aligned with GIDC allotment circle rate (+2.1%)',
    connectivity: {
      highway: '3.5 km from Sanand-Viramgam State Highway SH-17',
      expresswayDistance: '22 km to Ahmedabad Ring Road & Sarkhej Interchange',
      portOrRailDistance: '190 km to Mundra Port / Pipavav Rail Freight link',
      airportDistance: '38 km to Sardar Vallabhbhai Patel International Airport'
    },
    nearbyClusters: ['Tata Motors EV Facility (2.9 km)', 'Micron Technology Assembly Hub (4.4 km)', 'Colgate-Palmolive Sanand (3.1 km)'],
    documents: [
      {
        id: 'doc-10',
        name: 'GIDC Possession Certificate & Sanction Order',
        category: 'Ownership Title',
        status: 'verified',
        verifiedDate: '14 Sep 2026',
        documentRef: 'GIDC/SND/P-II/2026/102',
        description: 'Complete 99-year leasehold title with full capital payment clearance certificate.'
      }
    ],
    rawDescription: '5.2 acre sanand plot corner near tata motors factory, high power line, big truck access, clear gidc papers.',
    aiDescription: 'Strategic 5.20-acre heavy industrial land asset in Gujarat’s flagship Sanand manufacturing cluster. Featuring 310 feet of double-corner frontage onto 45-meter heavy haul corridors, the parcel is engineered for frictionless multi-axle logistics and containerized freight. Equipped with 66KV substation adjacency and Narmada industrial water feeds, it offers an immediate construction-ready footprint for EV manufacturing, electronics assembly, or automated engineering complexes.',
    priceHistory: [
      { year: '2023', pricePerAcre: 1.35 },
      { year: '2024', pricePerAcre: 1.52 },
      { year: '2025', pricePerAcre: 1.68 },
      { year: '2026', pricePerAcre: 1.80 }
    ],
    status: 'live',
    viewsCount: 980,
    enquiriesCount: 22,
    createdAt: '2026-08-20',
    realImageUrl: '/listings/industrial-2.jpg',
    galleryImages: ['/listings/industrial-2.jpg', '/listings/midc-industrial.jpg']
  },
  {
    id: 'plot-103',
    slug: 'bhiwandi-mumbai-logistics-warehouse-plot-4-acre',
    title: '4.10 Acre Logistics & Distribution Land with NH-160 Frontage',
    tagline: 'Direct Expressway Connectivity for E-Commerce & 3PL Hubs',
    category: 'Warehousing',
    listingType: 'Lease',
    zoneType: 'Warehousing & Logistics',
    price: 350000,
    priceDisplay: '₹ 3.50 L / mo (Lease)',
    pricePerUnit: '₹ 85,360 / Acre / Month',
    area: 4.1,
    areaUnit: 'Acres',
    areaDisplay: '4.10 Acres (1,78,596 sq.ft)',
    city: 'Mumbai / MMR',
    microMarket: 'Bhiwandi Mankoli Logistics Zone',
    state: 'Maharashtra',
    roadWidth: '36m 6-Lane Mumbai-Nashik Corridor',
    frontage: '240 ft Highway Frontage',
    powerSanction: 'MSEDCL Dedicated 250 KVA Transformer',
    waterAvailability: 'Borewell + Municipal Industrial Tanker Bay',
    farFsi: '1.20 Ground Coverage 55% for Grade-A PEB Sheds',
    aiMatchScore: 99,
    matchReasons: [
      'Top-tier location for Mumbai same-day delivery logistics',
      'Long lease tenure available (up to 15 years institutional lease)',
      'Pre-leveled land parcel with retaining wall and storm water drainage'
    ],
    verified: true,
    verificationDate: '14 Sep 2026',
    ownerMaskedName: 'A***** S*****',
    ownerMaskedPhone: '+91 98***2XX',
    ownerFullName: 'Ananya Singhania (Singhania Logistics)',
    ownerPhone: '+91 98114 77201',
    ownerType: 'Broker',
    brokerId: 'broker-2',
    plotGeometryType: 'linear-highway',
    fairnessRating: 'Good Value',
    fairnessDelta: '9.2% below Mankoli interchange average',
    connectivity: {
      highway: 'Direct NH-160 (Mumbai-Agra / Nashik Highway) frontage',
      expresswayDistance: '14 km to Samruddhi Mahamarg (Thane interchange)',
      portOrRailDistance: '52 km to JNPT Container Terminal via MTHL Atal Setu',
      airportDistance: '34 km to Navi Mumbai International Airport (NMIAL)'
    },
    nearbyClusters: ['Amazon Fulfillment Center BOM7 (1.2 km)', 'Flipkart Mega Hub (2.4 km)', 'DHL Supply Chain Campus (3.0 km)'],
    documents: [
      {
        id: 'doc-21',
        name: 'Collector Non-Agriculture (NA-Warehousing) Order',
        category: 'Land Conversion',
        status: 'verified',
        verifiedDate: '01 Sep 2026',
        documentRef: 'COLL-THN-NA-LOG-441',
        description: 'Complete commercial warehousing sanction without height or floor restriction.'
      }
    ],
    rawDescription: 'Bhiwandi mankoli 4 acre warehouse land right on highway, 15 year lease, pre-graded, ideal 3PL flipkart amazon.',
    aiDescription: 'A premier 4.10-acre logistics and supply-chain campus parcel positioned directly on the NH-160 Mumbai-Nashik corridor in Bhiwandi’s institutional logistics belt. Featuring 240 feet of direct highway frontage with NHAI-approved ingress slip lanes, the plot offers grade-level load-bearing compaction, pre-built perimeter storm water channels, and immediate readiness for 1,00,000+ sq.ft PEB distribution centers serving Greater Mumbai and Western India.',
    priceHistory: [
      { year: '2023', pricePerAcre: 0.65 },
      { year: '2024', pricePerAcre: 0.72 },
      { year: '2025', pricePerAcre: 0.79 },
      { year: '2026', pricePerAcre: 0.85 }
    ],
    status: 'live',
    viewsCount: 2150,
    enquiriesCount: 64,
    createdAt: '2026-08-25',
    realImageUrl: '/listings/warehouse-1.jpg',
    galleryImages: ['/listings/warehouse-1.jpg', '/listings/warehouse-2.jpg']
  },
  {
    id: 'plot-109',
    slug: 'devanahalli-bengaluru-airport-plotted-development-2400sqft',
    title: '2,400 sq.ft (5.5 Guntas) BIAAPA Approved Plotted Layout near BLR Airport',
    tagline: 'Ready-to-Build Luxury Villa Plot in High-Growth North Bengaluru Tech Corridor',
    category: 'Residential',
    listingType: 'Buy',
    zoneType: 'Residential NA (R-Zone)',
    price: 9600000,
    priceDisplay: '₹ 96.00 Lakhs',
    pricePerUnit: '₹ 4,000 / sq.ft',
    area: 0.055,
    areaUnit: 'Sq.Ft',
    areaDisplay: '2,400 sq.ft (60 x 40 ft)',
    city: 'Bengaluru',
    microMarket: 'Devanahalli - International Airport Tech Park',
    state: 'Karnataka',
    roadWidth: '15m Landscaped Avenue with Walkways',
    frontage: '40 ft East-Facing Frontage',
    powerSanction: 'BESCOM Underground Electrical Cabling & Solar Lighting',
    waterAvailability: 'Cauvery Phase V Water Supply Pipeline Line Active',
    farFsi: '1.75 Residential Villa Sanction',
    aiMatchScore: 95,
    matchReasons: [
      'BIAAPA approved layout with A-Katha transfer ready',
      'East-facing vastu compliant 60x40 dimension',
      '12 minutes from Kempegowda International Airport Terminal 2',
      'Underground cabling, landscaped club house, and kids park'
    ],
    verified: true,
    verificationDate: '15 Sep 2026',
    ownerMaskedName: 'M***** K*****',
    ownerMaskedPhone: '+91 99***7XX',
    ownerFullName: 'Manoj Kumar (Bangalore Plotted Homes)',
    ownerPhone: '+91 99008 23901',
    ownerType: 'Broker',
    brokerId: 'broker-2',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Fair Market',
    fairnessDelta: '4.2% below Devanahalli airport corridor retail price',
    connectivity: {
      highway: '2.0 km to Bellary Road / NH-44 Airport Expressway',
      expresswayDistance: '14 km to Hebbal Flyover & Outer Ring Road',
      portOrRailDistance: '18 km to Yelahanka Railway Station',
      airportDistance: '9 km to Kempegowda International Airport (BLR)'
    },
    nearbyClusters: ['KIADB Aerospace SEZ (4.2 km)', 'Shell Technology Center (6.1 km)', 'Upcoming Foxconn BLR (5.5 km)'],
    documents: [
      {
        id: 'doc-blr1',
        name: 'BIAAPA Approved Layout Plan & E-Khata Certificate',
        category: 'Town Planning & Revenue',
        status: 'verified',
        verifiedDate: '14 Sep 2026',
        documentRef: 'BIAAPA/TP/DEV-2026/194',
        description: 'Complete approval with relinquishment deed for civic amenities and roads executed.'
      }
    ],
    rawDescription: 'Devanahalli 2400 sqft residential plot, east facing, biaapa approved, club house, near airport tech park.',
    aiDescription: 'A premium 2,400 sq.ft (60x40) East-facing residential villa plot in a boutique master-planned community in Devanahalli, North Bengaluru. Strategically located just 12 minutes from Kempegowda International Airport and the KIADB Aerospace Park, this BIAAPA-approved parcel features an unblemished A-Khata title, underground utility conduits, avenue plantation, and full readiness for immediate custom home construction.',
    priceHistory: [
      { year: '2023', pricePerAcre: 2.80 },
      { year: '2024', pricePerAcre: 3.30 },
      { year: '2025', pricePerAcre: 3.75 },
      { year: '2026', pricePerAcre: 4.00 }
    ],
    status: 'live',
    viewsCount: 1650,
    enquiriesCount: 39,
    createdAt: '2026-09-01',
    realImageUrl: '/listings/plotted-aerial.jpg',
    galleryImages: ['/listings/plotted-aerial.jpg', '/listings/aurora-layout.jpg']
  },
  {
    id: 'plot-110',
    slug: 'alibaug-mandwa-coastal-villa-plot-10000sqft',
    title: '10,000 sq.ft (0.23 Acre) Coastal NA Residential Plot in Alibaug',
    tagline: 'Secluded Gated Coconut Grove Sanctuary 10 Mins from Mandwa Ro-Ro Jetty',
    category: 'Residential',
    listingType: 'Buy',
    zoneType: 'Residential NA (R-Zone)',
    price: 28500000,
    priceDisplay: '₹ 2.85 Cr',
    pricePerUnit: '₹ 2,850 / sq.ft (₹ 12.4 Cr/Acre)',
    area: 0.23,
    areaUnit: 'Sq.Ft',
    areaDisplay: '10,000 sq.ft (0.23 Acre)',
    city: 'Mumbai / MMR',
    microMarket: 'Alibaug - Mandwa Coastal Corridor',
    state: 'Maharashtra',
    roadWidth: '9m Paved Coastal Village Approach',
    frontage: '110 ft Wide Frontage',
    powerSanction: 'MSEDCL Residential Connection with Transformer on Site',
    waterAvailability: 'Sweet-water Borewell + Municipal Pipeline',
    farFsi: '1.00 (Ground + 1 Luxury Coastal Villa with Swimming Pool Sanction)',
    aiMatchScore: 94,
    matchReasons: [
      'Collector Non-Agriculture (NA) order already passed',
      'Perimeter boundary wall with mature coconut palms',
      'Only 10 minutes speed-boat/Ro-Ro connectivity to Gateway of India, Mumbai',
      'Fresh water table at just 18 feet depth'
    ],
    verified: true,
    verificationDate: '13 Sep 2026',
    ownerMaskedName: 'S***** K*****',
    ownerMaskedPhone: '+91 98***3XX',
    ownerFullName: 'Sanjay Kadam (Direct Landowner)',
    ownerPhone: '+91 98204 11902',
    ownerType: 'Direct Owner',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Good Value',
    fairnessDelta: '7.1% below Mandwa speed-boat landing corridor rates',
    connectivity: {
      highway: '4.0 km to Mandwa Jetty (Speedboat to Mumbai in 20 minutes)',
      expresswayDistance: '18 km to Alibaug City Center',
      portOrRailDistance: '38 km to MTHL Atal Setu Nhava Sheva connection',
      airportDistance: '68 km to upcoming Navi Mumbai International Airport'
    },
    nearbyClusters: ['Mandwa Ro-Ro Terminal (4.2 km)', 'Awas Beach (3.0 km)', 'Sasawane Coastal Enclave (2.5 km)'],
    documents: [
      {
        id: 'doc-abg1',
        name: 'Collector NA Residential Sanction & Mutation No. 382',
        category: 'Land Conversion',
        status: 'verified',
        verifiedDate: '11 Sep 2026',
        documentRef: 'COLL-RAI-ABG-NA-2026-90',
        description: 'Approved coastal residential zoning with complete CRZ clearance certificate.'
      }
    ],
    rawDescription: 'Alibaug mandwa 10000 sqft residential plot na title, boundary wall, coconut grove, near beach and roro.',
    aiDescription: 'An idyllic 10,000 sq.ft non-agricultural coastal residential land parcel situated in Alibaug’s celebrated Mandwa corridor. Graced by mature coconut groves, stone boundary walls, and sweet-water aquifers, the property is just 10 minutes from the Mandwa jetty, providing a 20-minute speedboat commute to South Mumbai. Fully sanctioned for private luxury villa architecture with extensive landscaped grounds.',
    priceHistory: [
      { year: '2023', pricePerAcre: 9.00 },
      { year: '2024', pricePerAcre: 10.40 },
      { year: '2025', pricePerAcre: 11.50 },
      { year: '2026', pricePerAcre: 12.40 }
    ],
    status: 'live',
    viewsCount: 2210,
    enquiriesCount: 51,
    createdAt: '2026-08-29',
    realImageUrl: '/listings/vrindavan-plot42.jpg',
    galleryImages: ['/listings/vrindavan-plot42.jpg', '/listings/villa-corner.jpg']
  },
  {
    id: 'plot-104',
    slug: 'sriperumbudur-chennai-electronics-plot-7-acre',
    title: '7.50 Acre Industrial Zone Land near Foxconn & Hyundai Corridors',
    tagline: 'SIPCOT Expansion Zone with High-Capacity Effluent & Power Grid',
    category: 'Industrial',
    listingType: 'Buy',
    zoneType: 'Industrial (Light/Engineering)',
    price: 135000000,
    priceDisplay: '₹ 13.50 Cr',
    pricePerUnit: '₹ 1.80 Cr / Acre',
    area: 7.5,
    areaUnit: 'Acres',
    areaDisplay: '7.50 Acres (3,26,700 sq.ft)',
    city: 'Chennai',
    microMarket: 'Sriperumbudur - Oragadam Industrial Belt',
    state: 'Tamil Nadu',
    roadWidth: '32m Dual-Carriageway Arterial',
    frontage: '380 ft Expansive Frontage',
    powerSanction: '110 KV Grid Tangedco Substation Adjacent',
    waterAvailability: 'SIPCOT Treated Water Pipeline (150 KLD)',
    farFsi: '1.50 Industrial Ground Coverage 60%',
    aiMatchScore: 92,
    matchReasons: [
      'Proximity to Chennai Automotive & Electronics corridor',
      'Abundant skilled manufacturing workforce in 10km radius',
      'Clear DTCP Industrial Approval with Zero Encumbrances'
    ],
    verified: true,
    verificationDate: '11 Sep 2026',
    ownerMaskedName: 'S***** R*****',
    ownerMaskedPhone: '+91 94***7XX',
    ownerFullName: 'Sivaramakrishnan Rajagopal (Southern Industrial Estates)',
    ownerPhone: '+91 94440 91822',
    ownerType: 'Broker',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Fair Market',
    fairnessDelta: 'Matches prevailing SIPCOT transaction index',
    connectivity: {
      highway: '1.8 km to Chennai-Bengaluru Highway (NH-48)',
      expresswayDistance: '6 km to upcoming Bangalore-Chennai Expressway (NE-7)',
      portOrRailDistance: '44 km to Chennai Port / 49 km to Ennore Kamarajar Port',
      airportDistance: '32 km to Chennai International Airport'
    },
    nearbyClusters: ['Hyundai Motor India Factory (5.2 km)', 'Foxconn Electronics Mega Site (3.9 km)', 'Dell India Manufacturing (6.8 km)'],
    documents: [
      {
        id: 'doc-31',
        name: 'DTCP Industrial Layout Sanction & Patta Certificate',
        category: 'Town Planning & Revenue',
        status: 'verified',
        verifiedDate: '09 Sep 2026',
        documentRef: 'DTCP/KANCHI/IND-778',
        description: 'Clear Patta in seller name with boundary coordinates verified by Taluk surveyor.'
      }
    ],
    rawDescription: 'Sriperumbudur 7.5 acre industrial land near hyundai, 380ft frontage, direct 110kv line, water ready, clear DTCP.',
    aiDescription: 'An expansive 7.50-acre industrial plot located in Tamil Nadu’s premier electronic hardware and automotive manufacturing epicenter of Sriperumbudur-Oragadam. Boasting 380 feet of clear dual-carriageway frontage and immediate proximity to a 110KV TANGEDCO power substation, this parcel is configured for large-scale production, precision electronics assembly, or automated component manufacturing.',
    priceHistory: [
      { year: '2023', pricePerAcre: 1.40 },
      { year: '2024', pricePerAcre: 1.55 },
      { year: '2025', pricePerAcre: 1.68 },
      { year: '2026', pricePerAcre: 1.80 }
    ],
    status: 'live',
    viewsCount: 890,
    enquiriesCount: 19,
    createdAt: '2026-08-28',
    realImageUrl: '/listings/industrial-3.jpg',
    galleryImages: ['/listings/industrial-3.jpg', '/listings/midc-industrial.jpg']
  },
  {
    id: 'plot-105',
    slug: 'hosur-bengaluru-tech-commercial-3-acre',
    title: '3.40 Acre Commercial & IT Zone Land at Hosur-Electronic City Corridor',
    tagline: 'Ideal for Data Center, R&D Campus, or Tech Park Facility',
    category: 'Commercial',
    listingType: 'Buy',
    zoneType: 'Commercial IT/SEZ',
    price: 170000000,
    priceDisplay: '₹ 17.00 Cr',
    pricePerUnit: '₹ 5.00 Cr / Acre',
    area: 3.4,
    areaUnit: 'Acres',
    areaDisplay: '3.40 Acres (1,48,104 sq.ft)',
    city: 'Bengaluru / Hosur',
    microMarket: 'Hosur SIPCOT IT Park Expansion',
    state: 'Tamil Nadu / Karnataka Border',
    roadWidth: '40m Multi-Lane Tech Corridor',
    frontage: '210 ft Highway Frontage',
    powerSanction: 'Dual 66KV HT Substation Feeds (Redundant N+1 ready)',
    waterAvailability: 'SIPCOT Industrial Supply + Rainwater Harvesting Sump',
    farFsi: '3.25 High FSI with IT/Data Center Allowance',
    aiMatchScore: 95,
    matchReasons: [
      'High FSI (3.25) optimizes built-up area for tech campuses',
      'Dual grid power redundancy crucial for Data Center operations',
      'Tamil Nadu IT Policy power subsidy benefits applicable'
    ],
    verified: true,
    verificationDate: '13 Sep 2026',
    ownerMaskedName: 'K***** N*****',
    ownerMaskedPhone: '+91 99***5XX',
    ownerFullName: 'Karthik Narayanan (Southern Tech Realty)',
    ownerPhone: '+91 99401 88392',
    ownerType: 'Direct Owner',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Good Value',
    fairnessDelta: '11.5% below Electronic City tech hub land price',
    connectivity: {
      highway: '1.2 km from NH-44 Bengaluru-Hosur Elevated Expressway',
      expresswayDistance: '14 km from Electronic City Phase 1 Infosys Campus',
      portOrRailDistance: '18 km to Bengaluru Cantonment Freight Terminal',
      airportDistance: '62 km to Kempegowda International Airport (BLR)'
    },
    nearbyClusters: ['Tata Electronics Megasite (8.4 km)', 'Delta Electronics (4.1 km)', 'Electronic City IT Hub (15 km)'],
    documents: [
      {
        id: 'doc-41',
        name: 'Commercial IT Zone Master Plan Sanction Order',
        category: 'Zoning & Master Plan',
        status: 'verified',
        verifiedDate: '07 Sep 2026',
        documentRef: 'HOSUR-MP-2026-IT-11',
        description: 'Designated for High-Density IT/ITES, Data Centers, and Innovation Laboratories.'
      }
    ],
    rawDescription: '3.4 acre IT commercial land hosur near electronic city, dual power line, 3.25 fsi, data center suitable.',
    aiDescription: 'A rare high-FSI (3.25) commercial and technology park parcel located in the fast-growing Hosur-Bengaluru tech corridor. Benefiting from dual-source 66KV redundant grid feeds and high-bandwidth fiber backbones, the site is primed for next-generation AI data centers, precision tech assembly, or corporate enterprise campuses seeking significant operational cost advantages over central Bengaluru.',
    priceHistory: [
      { year: '2023', pricePerAcre: 3.80 },
      { year: '2024', pricePerAcre: 4.20 },
      { year: '2025', pricePerAcre: 4.65 },
      { year: '2026', pricePerAcre: 5.00 }
    ],
    status: 'live',
    viewsCount: 1740,
    enquiriesCount: 42,
    createdAt: '2026-08-18',
    realImageUrl: '/listings/warehouse-2.jpg',
    galleryImages: ['/listings/warehouse-2.jpg', '/listings/warehouse-1.jpg']
  },
  {
    id: 'plot-106',
    slug: 'noida-expressway-residential-na-villa-plots-2-acre',
    title: '2.25 Acre Clear Title NA Residential Parcel in Sector 150 Extension',
    tagline: 'Gated Villa Society or Low-Density Luxury Development Footprint',
    category: 'Residential',
    listingType: 'Buy',
    zoneType: 'Residential NA (R-Zone)',
    price: 112500000,
    priceDisplay: '₹ 11.25 Cr',
    pricePerUnit: '₹ 5.00 Cr / Acre',
    area: 2.25,
    areaUnit: 'Acres',
    areaDisplay: '2.25 Acres (98,010 sq.ft)',
    city: 'Delhi-NCR',
    microMarket: 'Noida Expressway Sector 150 Belt',
    state: 'Uttar Pradesh',
    roadWidth: '24m Wide Sector Boulevard',
    frontage: '160 ft Frontage',
    powerSanction: 'NPCL 11KV Underground Cable Network',
    waterAvailability: 'Noida Authority 24x7 Water Connection',
    farFsi: '1.80 R-Zone Residential FSI',
    aiMatchScore: 89,
    matchReasons: [
      'Zero agricultural encumbrance, complete Section 143 NA Order',
      'Surrounded by premium green golf and eco-parks',
      'Close to upcoming Jewar Noida International Airport'
    ],
    verified: true,
    verificationDate: '10 Sep 2026',
    ownerMaskedName: 'P***** G*****',
    ownerMaskedPhone: '+91 98***1XX',
    ownerFullName: 'Pradeep Gupta (Capital Land Partners)',
    ownerPhone: '+91 98102 34911',
    ownerType: 'Broker',
    plotGeometryType: 'rectangular',
    fairnessRating: 'Fair Market',
    fairnessDelta: 'In line with Sector 150 peripheral plot benchmarks',
    connectivity: {
      highway: '800 meters to Noida-Greater Noida Expressway',
      expresswayDistance: '12 km to Yamuna Expressway Zero Point',
      portOrRailDistance: '19 km to Anand Vihar Railway Terminal',
      airportDistance: '28 km to upcoming Jewar Noida International Airport (DXN)'
    },
    nearbyClusters: ['Shaheed Bhagat Singh Sports City', 'Tata Eureka Park', 'Pari Chowk Central Hub'],
    documents: [
      {
        id: 'doc-51',
        name: 'UP Revenue Code Section 143 Non-Agriculture Order',
        category: 'Land Conversion',
        status: 'verified',
        verifiedDate: '02 Sep 2026',
        documentRef: 'UP-GBN-NA-143-802',
        description: 'Complete non-agricultural declaration for residential plotted development.'
      }
    ],
    rawDescription: 'Noida sector 150 area 2.25 acre residential na plot, clear title, wide road, close to expressway.',
    aiDescription: 'A premium 2.25-acre non-agricultural residential land parcel in Delhi-NCR’s most sought-after low-density residential corridor. Positioned along a 24-meter landscaped sector boulevard, the plot offers an unencumbered freehold title, ready utility hookups, and optimal proportions for boutique luxury villa developments or senior-living communities.',
    priceHistory: [
      { year: '2023', pricePerAcre: 4.10 },
      { year: '2024', pricePerAcre: 4.45 },
      { year: '2025', pricePerAcre: 4.80 },
      { year: '2026', pricePerAcre: 5.00 }
    ],
    status: 'live',
    viewsCount: 1110,
    enquiriesCount: 27,
    createdAt: '2026-08-30',
    realImageUrl: '/listings/villa-corner.jpg',
    galleryImages: ['/listings/villa-corner.jpg', '/listings/plotted-aerial.jpg']
  }
];

export const CITIES_DATA: CityInfo[] = [
  {
    name: 'Pune',
    state: 'Maharashtra',
    plotCount: 642,
    avgPricePerAcre: '₹ 1.55 Cr',
    popularHubs: ['Chakan Phase I & II', 'Talegaon MIDC', 'Ranjangaon', 'Hinjawadi IT Corridor']
  },
  {
    name: 'Ahmedabad',
    state: 'Gujarat',
    plotCount: 510,
    avgPricePerAcre: '₹ 1.75 Cr',
    popularHubs: ['Sanand GIDC', 'Mandal-Becharaji SIR', 'Changodar Industrial Zone', 'Dholera SIR']
  },
  {
    name: 'Mumbai / MMR',
    state: 'Maharashtra',
    plotCount: 430,
    avgPricePerAcre: '₹ 2.80 Cr',
    popularHubs: ['Bhiwandi Logistics Hub', 'Taloja MIDC', 'Panvel Warehousing Corridor', 'Badlapur']
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    plotCount: 388,
    avgPricePerAcre: '₹ 1.70 Cr',
    popularHubs: ['Sriperumbudur SIPCOT', 'Oragadam Auto Hub', 'Gummidipoondi', 'Thiruvallur']
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    plotCount: 395,
    avgPricePerAcre: '₹ 4.20 Cr',
    popularHubs: ['Hosur-Electronic City', 'Dabaspete Industrial Area', 'Peenya', 'Devenahalli Airport Hub']
  },
  {
    name: 'Delhi-NCR',
    state: 'Delhi / UP / Haryana',
    plotCount: 475,
    avgPricePerAcre: '₹ 3.90 Cr',
    popularHubs: ['Greater Noida Industrial', 'Manesar IMT', 'Faridabad Industrial Area', 'Yamuna Expressway']
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    plotCount: 320,
    avgPricePerAcre: '₹ 2.45 Cr',
    popularHubs: ['Hardware Park', 'Pharma City', 'Patancheru', 'Adibatla Aerospace SEZ']
  }
];

export const MOCK_LEADS: LeadItem[] = [
  {
    id: 'lead-01',
    listingId: 'plot-101',
    listingTitle: '3.00 Acre MIDC Industrial Plot with 33KV Power & 30m Road',
    buyerName: 'Rajeev Singhania (Singhania Castings Pvt Ltd)',
    buyerPhone: '+91 98201 55920',
    buyerBudget: '₹ 4.5 - 5.5 Cr',
    intent: 'Immediate Acquisition',
    unlockedAt: '16 Sep 2026, 11:20 AM',
    status: 'Site Visit Scheduled'
  },
  {
    id: 'lead-02',
    listingId: 'plot-101',
    listingTitle: '3.00 Acre MIDC Industrial Plot with 33KV Power & 30m Road',
    buyerName: 'Col. Arvind Mehra (GreenTech Logistics)',
    buyerPhone: '+91 99100 48831',
    buyerBudget: '₹ 4.0 - 5.0 Cr',
    intent: 'Immediate Acquisition',
    unlockedAt: '15 Sep 2026, 04:45 PM',
    status: 'Contacted'
  },
  {
    id: 'lead-03',
    listingId: 'plot-103',
    listingTitle: '4.10 Acre Logistics & Distribution Land with NH-160 Frontage',
    buyerName: 'Sneha Kulkarni (Apex 3PL Networks)',
    buyerPhone: '+91 97663 11840',
    buyerBudget: '₹ 3.0 - 4.0 L / mo',
    intent: 'Lease Evaluation',
    unlockedAt: '17 Sep 2026, 09:15 AM',
    status: 'New'
  }
];

export const BLOG_POSTS = [
  {
    id: 'b-1',
    title: 'Navigating MIDC 95-Year Lease Transfer & Title Due Diligence in 2026',
    tag: 'Legal & Compliance',
    date: '12 Sep 2026',
    readTime: '6 min read',
    excerpt: 'Step-by-step checklist on obtaining consent to assign, unencumbered NOCs, and avoiding transfer fee surprises in Maharashtra industrial estates.'
  },
  {
    id: 'b-2',
    title: 'Evaluating Heavy Vehicle Turning Radii & Frontage for Grade-A Logistics Parks',
    tag: 'Engineering & Layout',
    date: '04 Sep 2026',
    readTime: '8 min read',
    excerpt: 'How 40-foot multi-axle trailer turning geometry and 30m road widths dictate real land value along Dedicated Freight Corridors.'
  },
  {
    id: 'b-3',
    title: 'The Impact of the Western DFC on Land Parcels in Sanand, Bhiwandi, and Rewari',
    tag: 'Market Intelligence',
    date: '28 Aug 2026',
    readTime: '5 min read',
    excerpt: 'A quantitative analysis of 3-year land price appreciation within 15 km of freight terminals and ICD dry ports.'
  }
];

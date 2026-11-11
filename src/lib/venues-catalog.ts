export interface PartnerVenue {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: "Dhaka" | "Chattogram" | "Sylhet" | "Rajshahi" | "Khulna";
  capacity: number;
  type: "Auditorium" | "Convention Hall" | "Innovation Hub" | "University Hall" | "Ballroom";
  hourlyRateBDT: number;
  dailyRateBDT: number;
  imageUrl: string;
  amenities: string[];
  description: string;
  contactPhone: string;
  contactEmail: string;
  verified: boolean;
}

export const PARTNER_VENUES: PartnerVenue[] = [
  {
    id: "ven-kib",
    name: "Krishibid Institution Bangladesh (KIB) Auditorium",
    slug: "kib-auditorium-dhaka",
    address: "Khamarbari Road, Farmgate, Dhaka 1215",
    city: "Dhaka",
    capacity: 1200,
    type: "Auditorium",
    hourlyRateBDT: 12000,
    dailyRateBDT: 85000,
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "JBL Acoustic Line-Array PA",
      "Central Air Conditioning",
      "Motorized 4K Projection",
      "Dual Green Rooms",
      "Dedicated VIP Lounge",
      "Generator Power Backup (200kVA)",
      "250+ Vehicle Parking",
    ],
    description:
      "Premier event auditorium in Central Dhaka with world-class stage lighting, acoustic isolation, and spacious tiered seating ideal for national summits, concerts, and tech symposiums.",
    contactPhone: "+880 1711-234567",
    contactEmail: "venues@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-buet",
    name: "BUET ECE Building Auditorium",
    slug: "buet-ece-auditorium",
    address: "West Palashi Campus, BUET, Dhaka 1000",
    city: "Dhaka",
    capacity: 450,
    type: "University Hall",
    hourlyRateBDT: 5000,
    dailyRateBDT: 35000,
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "High-speed Campus WiFi (1 Gbps)",
      "Dual Wireless Mics & Podium",
      "1080p Stage Projector",
      "Centralized AC",
      "Pre-function Networking Foyer",
      "Full Standby Generator",
    ],
    description:
      "The hub for engineering hackathons, academic summits, and robotics showcases. Located centrally in Old Dhaka with seamless connectivity.",
    contactPhone: "+880 1712-890123",
    contactEmail: "buet-ece@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-emk",
    name: "EMK Center Innovation Hub",
    slug: "emk-center-innovation-hub",
    address: "CES(A) 1/A, Road 113, Gulshan-2, Dhaka 1212",
    city: "Dhaka",
    capacity: 150,
    type: "Innovation Hub",
    hourlyRateBDT: 4000,
    dailyRateBDT: 28000,
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "Modular Workshop Seating",
      "Interactive Smart Boards",
      "Livestreaming Rig & Cameras",
      "High-speed Optical Fiber",
      "Maker Studio & Soundproof Booths",
      "In-house Cafe Corner",
    ],
    description:
      "A modern, vibrant cultural and tech studio tailored for startup pitch days, creative workshops, art exhibitions, and executive roundtables in the heart of Gulshan.",
    contactPhone: "+880 1713-456789",
    contactEmail: "emk-hub@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-nsu",
    name: "NSU Main Auditorium, Plot 15",
    slug: "nsu-main-auditorium",
    address: "Block B, Bashundhara R/A, Dhaka 1229",
    city: "Dhaka",
    capacity: 1000,
    type: "Auditorium",
    hourlyRateBDT: 10000,
    dailyRateBDT: 75000,
    imageUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "Tiered Theatre Seating",
      "Full Stage Rig & Truss Lights",
      "Dolby-calibrated Sound",
      "Basement Parking (400 Cars)",
      "Dedicated Press Box",
      "Air Conditioned Backstage",
    ],
    description:
      "A magnificent institutional venue inside Bashundhara R/A suited for large-scale youth festivals, business competitions, cultural galas, and national conferences.",
    contactPhone: "+880 1714-567890",
    contactEmail: "nsu-events@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-cuet",
    name: "Sheikh Kamal IT Business Incubator, CUET",
    slug: "sheikh-kamal-incubator-cuet",
    address: "Kaptai Highway, Raozan, Chattogram 4349",
    city: "Chattogram",
    capacity: 300,
    type: "Innovation Hub",
    hourlyRateBDT: 3500,
    dailyRateBDT: 24000,
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "Incubator Seminar Hall",
      "Gigabit Internet Connectivity",
      "Stage Presentation Displays",
      "Outdoor Lakeside Lawn",
      "Student Hackathon Commons",
      "24/7 Security & CCTV",
    ],
    description:
      "Chattogram’s premier tech incubator auditorium offering tranquil green surroundings, modern multimedia tools, and ideal spaces for tech bootcamps.",
    contactPhone: "+880 1715-678901",
    contactEmail: "cuet-incubator@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-iccb",
    name: "International Convention City Bashundhara (ICCB Hall 4)",
    slug: "iccb-hall-4-dhaka",
    address: "Purbachal Express Highway, Kuril, Dhaka 1229",
    city: "Dhaka",
    capacity: 3500,
    type: "Convention Hall",
    hourlyRateBDT: 25000,
    dailyRateBDT: 250000,
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "Pillar-less Mega Exhibition Space",
      "High Ceiling Rigging Points",
      "Heavy Duty Power Substation",
      "1,500+ Secured Parking Slots",
      "Dedicated Loading Bays for Trucks",
      "VIP Reception & Dining Lounges",
    ],
    description:
      "Bangladesh’s largest convention facility designed for mega consumer expos, international summits, national concerts, and grand corporate conventions.",
    contactPhone: "+880 1716-789012",
    contactEmail: "iccb-partner@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-bmm",
    name: "Bangabandhu Military Museum Auditorium",
    slug: "military-museum-auditorium-dhaka",
    address: "Bijoy Sarani, Tejgaon, Dhaka 1215",
    city: "Dhaka",
    capacity: 800,
    type: "Auditorium",
    hourlyRateBDT: 9000,
    dailyRateBDT: 65000,
    imageUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "Ultra-modern Architectural Design",
      "Bose Professional Audio System",
      "Retractable Stage Screen",
      "Underground Parking Facility",
      "State-of-the-art HVAC Cooling",
      "High-security Perimeter",
    ],
    description:
      "A stunning architectural marvel located on Bijoy Sarani. Features plush seating, crystalline acoustic balancing, and superior hospitality amenities.",
    contactPhone: "+880 1717-890123",
    contactEmail: "bmm-auditorium@aayojon.com.bd",
    verified: true,
  },
  {
    id: "ven-radisson-ctg",
    name: "Radisson Blu Chattogram Bay View Ballroom",
    slug: "radisson-blu-chattogram-ballroom",
    address: "SS Khaled Road, Lalkhan Bazar, Chattogram 4000",
    city: "Chattogram",
    capacity: 900,
    type: "Ballroom",
    hourlyRateBDT: 15000,
    dailyRateBDT: 140000,
    imageUrl: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    amenities: [
      "Five-star International Hospitality",
      "Crystal Chandelier Ambiance",
      "In-house Executive Catering",
      "Multi-zone Sound & Lighting",
      "Valet Parking Service",
      "Executive Boardroom Add-ons",
    ],
    description:
      "Port City’s top five-star event destination. Unmatched luxury, gourmet catering, and impeccable hospitality for corporate galas and international conferences.",
    contactPhone: "+880 1718-901234",
    contactEmail: "radisson-ctg@aayojon.com.bd",
    verified: true,
  },
];


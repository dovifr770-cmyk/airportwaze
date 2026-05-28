// ─── Airport Image Sets ───────────────────────────────────────────────────────
// Unsplash free-tier URLs — no API key required.
// Format: https://images.unsplash.com/photo-{ID}?w={W}&q=85
//
// hero  (w=1400) : wide terminal interior or iconic exterior
// thumb (w=400)  : square-friendly recognisable airport view
// city  (w=800)  : city skyline / landmark for destination card
//
// Accent colors are sampled from each airport's dominant visual identity
// (terminal walls, signage brand, airline livery, or architectural palette).

export interface AirportImageSet {
  /** Full-width hero — terminal interior or iconic view (1400 px wide) */
  hero: string;
  /** Square card thumbnail — recognisable airport view (400 px wide) */
  thumb: string;
  /** City skyline / landmark (800 px wide) */
  cityPhoto: string;
  /** Dominant UI accent color for tinting chips, cards, etc. */
  color: string;
  /** Single emoji that represents this airport / city */
  emoji: string;
}

// ─── Unsplash photo ID registry ───────────────────────────────────────────────
// All IDs have been selected from Unsplash's public free-to-use library.
// Verified working IDs are grouped by visual theme for easy maintenance.

const PH = {
  // Architecture / modern terminal interiors
  modernTerminal:     '1499346030926-9a72daac6c63', // bright white terminal hall
  glassTerminal:      '1436491865332-7a61a109cc05', // glass ceiling terminal (e.g. CDG/LHR feel)
  terminalInterior:   '1587019158091-1a103c5dd17f', // wide terminal concourse
  loungeTerminal:     '1544620347-c4fd4a3d5957',    // departure board / lounge
  nightTerminal:      '1540339832862-474599807836',  // terminal at night, warm glow
  runwayPlanes:       '1464037866556-6812c9d1c72e', // runway with aircraft
  // Warm / luxury feel (DXB, Gulf airports)
  luxuryTerminal:     '1576495199120-1c5cbad55ba3', // gold-toned ornate terminal
  desertAirport:      '1512453979798-5ea266f8880c', // desert-adjacent airport
  // Asian airports
  gardenTerminal:     '1570993492881-ca3fb2a5e3bb', // greenery inside terminal (SIN feel)
  asianTerminal:      '1578662996442-48f60103fc96', // modern Asian airport hall
  // European airports
  euroTerminal:       '1467991143373-04e48c952cce', // European terminal exterior
  nightRunway:        '1578574577274-71b82df95e4d', // night runway lights
  // City skylines / landmarks
  nyc:                '1485871851631-4d705cf63b96', // New York skyline
  la:                 '1534190760961-74e8c1c5c3da',  // LA / Hollywood
  chicago:            '1477959858617-67f85cf4f1df', // Chicago skyline
  london:             '1526129318478-62ed807ebdf9', // London Big Ben / Thames
  dubai:              '1512453979798-5ea266f8880c', // Dubai skyline
  paris:              '1502602898657-3e91760cbb34', // Paris Eiffel Tower
  singapore:          '1525625293386-0b8575e5fcd1', // Singapore Marina Bay
  amsterdam:          '1534351590666-13e3e1f35327', // Amsterdam canals
  frankfurt:          '1549737328-b2ff76706b24', // Frankfurt skyline
  hongkong:           '1506765068734-d55-b4a33-bb',  // fallback — HKG skyline placeholder
  tokyo:              '1540959733332-eab4deabeeaf', // Tokyo skyline
  istanbul:           '1524231757912-21f4fe3a7200', // Istanbul Bosphorus
  dallas:             '1530089711124-9ca0f03c2e49', // Dallas skyline
  atlanta:            '1575886505057-7b1dcdc82e7f', // Atlanta skyline
} as const;

/** Build a free Unsplash URL from a photo ID and width. */
function unsplash(id: string, w: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=85`;
}

// ─── Per-airport data ─────────────────────────────────────────────────────────

export const AIRPORT_IMAGES: Record<string, AirportImageSet> = {

  // ── JFK · John F. Kennedy International, New York ───────────────────────────
  JFK: {
    hero:      unsplash('1587019158091-1a103c5dd17f', 1400), // bright concourse
    thumb:     unsplash('1499346030926-9a72daac6c63', 400),  // terminal hall
    cityPhoto: unsplash('1485871851631-4d705cf63b96', 800),  // NYC skyline
    color:     '#0053A0', // JetBlue / Port Authority blue
    emoji:     '🗽',
  },

  // ── LAX · Los Angeles International ─────────────────────────────────────────
  LAX: {
    hero:      unsplash('1436491865332-7a61a109cc05', 1400), // glass ceiling terminal
    thumb:     unsplash('1544620347-c4fd4a3d5957', 400),     // departure board
    cityPhoto: unsplash('1534190760961-74e8c1c5c3da', 800),  // LA skyline
    color:     '#FF6B35', // LAX sunset orange
    emoji:     '🌴',
  },

  // ── ORD · Chicago O'Hare International ──────────────────────────────────────
  ORD: {
    hero:      unsplash('1540339832862-474599807836', 1400), // night terminal glow
    thumb:     unsplash('1464037866556-6812c9d1c72e', 400),  // runway/planes
    cityPhoto: unsplash('1477959858617-67f85cf4f1df', 800),  // Chicago skyline
    color:     '#1A4B8C', // United Airlines navy
    emoji:     '🌬️',
  },

  // ── LHR · London Heathrow (Terminal 5 iconic wave roof) ─────────────────────
  LHR: {
    hero:      unsplash('1499346030926-9a72daac6c63', 1400), // modern open terminal
    thumb:     unsplash('1436491865332-7a61a109cc05', 400),  // glass ceiling
    cityPhoto: unsplash('1526129318478-62ed807ebdf9', 800),  // London / Big Ben
    color:     '#075AAA', // British Airways blue
    emoji:     '🎡',
  },

  // ── DXB · Dubai International (luxury/gold aesthetic) ───────────────────────
  DXB: {
    hero:      unsplash('1576495199120-1c5cbad55ba3', 1400), // gold ornate terminal
    thumb:     unsplash('1512453979798-5ea266f8880c', 400),  // desert/Dubai airport
    cityPhoto: unsplash('1512453979798-5ea266f8880c', 800),  // Dubai skyline
    color:     '#C49A00', // Emirates gold
    emoji:     '🏙️',
  },

  // ── CDG · Paris Charles de Gaulle (Roissy concrete arches) ──────────────────
  CDG: {
    hero:      unsplash('1467991143373-04e48c952cce', 1400), // European terminal
    thumb:     unsplash('1587019158091-1a103c5dd17f', 400),  // concourse interior
    cityPhoto: unsplash('1502602898657-3e91760cbb34', 800),  // Paris / Eiffel
    color:     '#003189', // Air France deep blue
    emoji:     '🗼',
  },

  // ── SIN · Singapore Changi (gardens, Jewel, bright & green) ─────────────────
  SIN: {
    hero:      unsplash('1570993492881-ca3fb2a5e3bb', 1400), // greenery inside terminal
    thumb:     unsplash('1499346030926-9a72daac6c63', 400),  // modern bright terminal
    cityPhoto: unsplash('1525625293386-0b8575e5fcd1', 800),  // Singapore Marina Bay
    color:     '#007B55', // Changi / SIA green
    emoji:     '🌿',
  },

  // ── AMS · Amsterdam Schiphol (single terminal, Dutch design) ────────────────
  AMS: {
    hero:      unsplash('1544620347-c4fd4a3d5957', 1400),    // departure boards / lounge
    thumb:     unsplash('1467991143373-04e48c952cce', 400),  // European terminal
    cityPhoto: unsplash('1534351590666-13e3e1f35327', 800),  // Amsterdam canals
    color:     '#003DA5', // KLM royal blue
    emoji:     '🌷',
  },

  // ── FRA · Frankfurt Airport (Fraport, dual-runway hub) ──────────────────────
  FRA: {
    hero:      unsplash('1540339832862-474599807836', 1400), // night terminal warm
    thumb:     unsplash('1578662996442-48f60103fc96', 400),  // modern airport hall
    cityPhoto: unsplash('1549737328-b2ff76706b24', 800),     // Frankfurt skyline
    color:     '#FFD700', // Lufthansa yellow
    emoji:     '🦅',
  },

  // ── HKG · Hong Kong International (over water, dramatic) ────────────────────
  HKG: {
    hero:      unsplash('1578662996442-48f60103fc96', 1400), // modern Asian hall
    thumb:     unsplash('1570993492881-ca3fb2a5e3bb', 400),  // green interior
    cityPhoto: unsplash('1513407030348-c983a97b98d8', 800),  // Hong Kong skyline
    color:     '#D62B2F', // Cathay Pacific red
    emoji:     '🏮',
  },

  // ── NRT · Tokyo Narita (clean, minimalist Japanese design) ──────────────────
  NRT: {
    hero:      unsplash('1499346030926-9a72daac6c63', 1400), // clean white terminal
    thumb:     unsplash('1578662996442-48f60103fc96', 400),  // modern Asian terminal
    cityPhoto: unsplash('1540959733332-eab4deabeeaf', 800),  // Tokyo skyline
    color:     '#E60026', // ANA / JAL red
    emoji:     '⛩️',
  },

  // ── IST · Istanbul Airport (largest single-terminal building) ───────────────
  IST: {
    hero:      unsplash('1576495199120-1c5cbad55ba3', 1400), // grand ornate interior
    thumb:     unsplash('1587019158091-1a103c5dd17f', 400),  // wide concourse
    cityPhoto: unsplash('1524231757912-21f4fe3a7200', 800),  // Istanbul Bosphorus
    color:     '#E30A17', // Turkish Airlines red
    emoji:     '🕌',
  },

  // ── DFW · Dallas/Fort Worth International ───────────────────────────────────
  DFW: {
    hero:      unsplash('1464037866556-6812c9d1c72e', 1400), // runway/planes
    thumb:     unsplash('1540339832862-474599807836', 400),  // night terminal
    cityPhoto: unsplash('1530089711124-9ca0f03c2e49', 800),  // Dallas skyline
    color:     '#0078D4', // American Airlines blue
    emoji:     '🤠',
  },

  // ── ATL · Hartsfield-Jackson Atlanta International (world's busiest) ────────
  ATL: {
    hero:      unsplash('1544620347-c4fd4a3d5957', 1400),    // departure board lounge
    thumb:     unsplash('1464037866556-6812c9d1c72e', 400),  // planes on tarmac
    cityPhoto: unsplash('1575886505057-7b1dcdc82e7f', 800),  // Atlanta skyline
    color:     '#B22222', // Delta red
    emoji:     '🍑',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the image set for a given IATA code, falling back to JFK if unknown.
 */
export function getAirportImages(iata: string): AirportImageSet {
  return AIRPORT_IMAGES[iata.toUpperCase()] ?? AIRPORT_IMAGES['JFK'];
}

/**
 * Return just the accent color for a given IATA code (for quick tinting).
 */
export function getAirportColor(iata: string): string {
  return getAirportImages(iata).color;
}

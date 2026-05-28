// ─── Airport Terminal Data ────────────────────────────────────────────────────
// Public-domain knowledge: airline → terminal mappings for major airports.
// Source: official airport websites (public information, no scraping).

export interface TerminalInfo {
  terminal: string;
  terminalFull: string;
  gatePrefix: string;
  walkMinutesFromSecurity: number; // avg minutes from security to gate area
  amenities: string[];
  tips: string[];
}

export interface AirlineTerminalMap {
  [airlineCode: string]: TerminalInfo;
}

export interface AirportData {
  code: string;
  name: string;
  city: string;
  country: string;
  terminals: string[];
  airlineTerminals: AirlineTerminalMap;
  defaultTerminal: TerminalInfo;
  transferTimesBetweenTerminals: Record<string, Record<string, number>>; // T1→T4: minutes
}

// ── JFK ─────────────────────────────────────────────────────────────────────
const JFK_T1: TerminalInfo = {
  terminal: '1', terminalFull: 'Terminal 1',
  gatePrefix: '1',
  walkMinutesFromSecurity: 8,
  amenities: ['Air France Lounge', 'Lufthansa Lounge', 'Duty Free', 'Multiple restaurants'],
  tips: ['Air France and Lufthansa lounges are on Level 3', 'Shops close 30min before boarding'],
};

const JFK_T4: TerminalInfo = {
  terminal: '4', terminalFull: 'Terminal 4',
  gatePrefix: 'B,C',
  walkMinutesFromSecurity: 10,
  amenities: ['Delta SkyClub', 'Shake Shack', "Michael Jordan's Steak House", 'Duty Free'],
  tips: ['B gates are domestic, C gates are international', 'SkyClub requires Delta status or Amex Platinum', 'Long walk between B and C concourse — allow 10 min'],
};

const JFK_T5: TerminalInfo = {
  terminal: '5', terminalFull: 'Terminal 5 (JetBlue)',
  gatePrefix: '5',
  walkMinutesFromSecurity: 7,
  amenities: ['JetBlue Mint Studio', 'Shake Shack', 'Deep Blue Sushi', 'Brookfield Place shops'],
  tips: ['JetBlue Mint lounge at Gate 25', 'Best food court at JFK — great options airside', 'Free WiFi throughout'],
};

const JFK_T7: TerminalInfo = {
  terminal: '7', terminalFull: 'Terminal 7',
  gatePrefix: '7',
  walkMinutesFromSecurity: 6,
  amenities: ['British Airways Galleries First', 'BA Galleries Business', 'Wetherspoons pub'],
  tips: ['British Airways First + Business lounges on Level 3', 'Small terminal — very easy to navigate'],
};

const JFK_T8: TerminalInfo = {
  terminal: '8', terminalFull: 'Terminal 8 (American Airlines)',
  gatePrefix: '8',
  walkMinutesFromSecurity: 9,
  amenities: ['Admirals Club', 'Flagship Lounge', 'The Palm restaurant', 'Brooks Brothers'],
  tips: ['Admirals Club near gates 1-12', 'Flagship Dining for Flagship Business/First passengers', 'Airside connection to T7 available'],
};

export const JFK_DATA: AirportData = {
  code: 'JFK',
  name: 'John F. Kennedy International Airport',
  city: 'New York',
  country: 'US',
  terminals: ['1', '2', '4', '5', '7', '8'],
  airlineTerminals: {
    // Terminal 1
    'AF': JFK_T1, 'LH': JFK_T1, 'JL': JFK_T1, 'KE': JFK_T1,
    'AY': JFK_T1, 'LX': JFK_T1, 'TP': JFK_T1, 'IB': JFK_T1,
    'SN': JFK_T1, 'GA': JFK_T1, 'SQ': JFK_T1,
    // Terminal 4
    'DL': JFK_T4, 'VS': JFK_T4, 'WS': JFK_T4, 'EK': JFK_T4,
    'EY': JFK_T4, 'AC': JFK_T4, 'AM': JFK_T4, 'AR': JFK_T4,
    'AZ': JFK_T4, 'MX': JFK_T4, 'LA': JFK_T4, 'UX': JFK_T4,
    'KL': JFK_T4, 'AM': JFK_T4, 'SK': JFK_T4, 'TK': JFK_T4,
    // Terminal 5
    'B6': JFK_T5,
    // Terminal 7
    'BA': JFK_T7, 'EI': JFK_T7,
    // Terminal 8
    'AA': JFK_T8, 'IB': JFK_T8, 'QF': JFK_T8, 'FI': JFK_T8,
    'RJ': JFK_T8, 'CX': JFK_T8,
  },
  defaultTerminal: JFK_T4,
  transferTimesBetweenTerminals: {
    '1': { '2': 8, '4': 12, '5': 15, '7': 18, '8': 20 },
    '2': { '1': 8, '4': 8,  '5': 12, '7': 16, '8': 18 },
    '4': { '1': 12,'2': 8,  '5': 10, '7': 14, '8': 12 },
    '5': { '1': 15,'2': 12, '4': 10, '7': 10, '8': 12 },
    '7': { '1': 18,'2': 16, '4': 14, '5': 10, '8': 5  },
    '8': { '1': 20,'2': 18, '4': 12, '5': 12, '7': 5  },
  },
};

// ── LAX ─────────────────────────────────────────────────────────────────────
export const LAX_DATA: AirportData = {
  code: 'LAX',
  name: 'Los Angeles International Airport',
  city: 'Los Angeles',
  country: 'US',
  terminals: ['1', '2', '3', '4', '5', '6', '7', '8', 'TBIT'],
  airlineTerminals: {
    'WN': { terminal: '1', terminalFull: 'Terminal 1 (Southwest)', gatePrefix: '1', walkMinutesFromSecurity: 5, amenities: ['Urth Caffé', 'Shake Shack'], tips: ['Southwest uses automatic check-in kiosks'] },
    'AF': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: '2', walkMinutesFromSecurity: 7, amenities: ['Air France Lounge', 'KLM lounge'], tips: [] },
    'KL': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: '2', walkMinutesFromSecurity: 7, amenities: [], tips: [] },
    'AS': { terminal: '3', terminalFull: 'Terminal 3 (Alaska)', gatePrefix: '3', walkMinutesFromSecurity: 6, amenities: ['Alaska Lounge'], tips: [] },
    'AA': { terminal: '4', terminalFull: 'Terminal 4 (American)', gatePrefix: '4', walkMinutesFromSecurity: 8, amenities: ['Admirals Club'], tips: ['Admirals Club on Level 3'] },
    'DL': { terminal: '5', terminalFull: 'Terminal 5 (Delta)', gatePrefix: '5', walkMinutesFromSecurity: 8, amenities: ['Delta SkyClub'], tips: [] },
    'UA': { terminal: '7', terminalFull: 'Terminal 7 (United)', gatePrefix: '7', walkMinutesFromSecurity: 7, amenities: ['United Club'], tips: [] },
    'LH': { terminal: 'TBIT', terminalFull: 'Tom Bradley International Terminal', gatePrefix: 'TB', walkMinutesFromSecurity: 12, amenities: ['Multiple international lounges', 'World duty free'], tips: ['Long walks between gates — add 10 min buffer'] },
    'BA': { terminal: 'TBIT', terminalFull: 'Tom Bradley International Terminal', gatePrefix: 'TB', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'QF': { terminal: 'TBIT', terminalFull: 'Tom Bradley International Terminal', gatePrefix: 'TB', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
  },
  defaultTerminal: { terminal: '4', terminalFull: 'Terminal 4', gatePrefix: '4', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
  transferTimesBetweenTerminals: {},
};

// ── ORD ─────────────────────────────────────────────────────────────────────
export const ORD_DATA: AirportData = {
  code: 'ORD',
  name: "O'Hare International Airport",
  city: 'Chicago',
  country: 'US',
  terminals: ['1', '2', '3', '5'],
  airlineTerminals: {
    'UA': { terminal: '1', terminalFull: 'Terminal 1 (United)', gatePrefix: 'B,C', walkMinutesFromSecurity: 10, amenities: ['United Club (B6, B18, C18)', 'Polaris Lounge'], tips: ['B and C concourses connected underground'] },
    'AA': { terminal: '3', terminalFull: 'Terminal 3 (American)', gatePrefix: 'G,H,K,L', walkMinutesFromSecurity: 8, amenities: ['Admirals Club (H5)', 'Flagship Lounge'], tips: ['Flagship Lounge requires international business class'] },
    'WN': { terminal: '5', terminalFull: 'Terminal 5 (International/Southwest)', gatePrefix: 'M', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
    'LH': { terminal: '5', terminalFull: 'Terminal 5', gatePrefix: 'M', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
    'AF': { terminal: '5', terminalFull: 'Terminal 5', gatePrefix: 'M', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
  },
  defaultTerminal: { terminal: '3', terminalFull: 'Terminal 3', gatePrefix: 'G', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
  transferTimesBetweenTerminals: {},
};

// ── LHR ─────────────────────────────────────────────────────────────────────
export const LHR_DATA: AirportData = {
  code: 'LHR',
  name: 'Heathrow Airport',
  city: 'London',
  country: 'UK',
  terminals: ['2', '3', '4', '5'],
  airlineTerminals: {
    'UA': { terminal: '2', terminalFull: 'Terminal 2 (The Queen\'s Terminal)', gatePrefix: 'A,B', walkMinutesFromSecurity: 10, amenities: ['United Club', 'Star Alliance lounges'], tips: ['A gates for Schengen, B gates for long-haul'] },
    'LH': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'A,B', walkMinutesFromSecurity: 10, amenities: ['Lufthansa Business Lounge'], tips: [] },
    'VS': { terminal: '3', terminalFull: 'Terminal 3', gatePrefix: '3', walkMinutesFromSecurity: 8, amenities: ['Virgin Clubhouse (best lounge at LHR)'], tips: ['Virgin Clubhouse is arguably the best airport lounge in the world'] },
    'AA': { terminal: '3', terminalFull: 'Terminal 3', gatePrefix: '3', walkMinutesFromSecurity: 8, amenities: ['Admirals Club'], tips: [] },
    'EK': { terminal: '3', terminalFull: 'Terminal 3', gatePrefix: '3', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'QF': { terminal: '3', terminalFull: 'Terminal 3', gatePrefix: '3', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'BA': { terminal: '5', terminalFull: 'Terminal 5 (British Airways)', gatePrefix: 'A,B,C', walkMinutesFromSecurity: 12, amenities: ['Concorde Room', 'Galleries First/Business', 'many restaurants'], tips: ['Galleries First is post-security on Level 3', 'Satellite B/C connected by automated train'] },
  },
  defaultTerminal: { terminal: '5', terminalFull: 'Terminal 5', gatePrefix: 'A', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
  transferTimesBetweenTerminals: {
    '2': { '3': 20, '4': 25, '5': 30 },
    '3': { '2': 20, '4': 20, '5': 30 },
    '4': { '2': 25, '3': 20, '5': 35 },
    '5': { '2': 30, '3': 30, '4': 35 },
  },
};

// ── DXB ─────────────────────────────────────────────────────────────────────
// Emirates hub. T3 is exclusively Emirates/Qantas codeshare. T1 serves all others.
// T2 is a low-cost/charter terminal (flydubai, Air Arabia, etc.).
// There is NO landside pedestrian connection between terminals — transfers require
// the free intercontinental shuttle bus or a taxi/ride-share.
export const DXB_DATA: AirportData = {
  code: 'DXB',
  name: 'Dubai International Airport',
  city: 'Dubai',
  country: 'AE',
  terminals: ['1', '2', '3'],
  airlineTerminals: {
    // Terminal 3 — Emirates exclusive (Concourses A, B, C)
    'EK': { terminal: '3', terminalFull: 'Terminal 3 (Emirates)', gatePrefix: 'A,B,C', walkMinutesFromSecurity: 12,
      amenities: ['Emirates First Class Lounge & Spa', 'Emirates Business Lounge', 'Duty Free (world largest)', 'DNATA food court', 'The Change Group', 'Multiple restaurants airside'],
      tips: [
        'Concourse A handles most long-haul; B and C are primarily A380 gates',
        'The famous Emirates Duty Free is post-security — budget 20 min',
        'First Class passengers get a dedicated check-in hall and lounge with pool and spa',
        'Concourses A-B-C are connected airside — no need to re-clear security between them',
        'A380 boarding uses two jet bridges simultaneously — allow extra 10 min for boarding queues',
      ],
    },
    'QF': { terminal: '3', terminalFull: 'Terminal 3 (Emirates/Qantas)', gatePrefix: 'A,B', walkMinutesFromSecurity: 12,
      amenities: ['Emirates Business Lounge (Qantas codeshare pax eligible on some fares)'],
      tips: ['Qantas uses T3 on its DXB stopover flights as a codeshare with Emirates'],
    },
    // Terminal 1 — all other international carriers (Concourses D, E, F, G)
    'BA': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E,F', walkMinutesFromSecurity: 10,
      amenities: ['British Airways Terraces Lounge (D gates)', 'Costa Coffee', 'Duty Free', 'Multiple restaurants'],
      tips: ['Concourse D is closest to check-in; F and G are farthest — add 10 min if assigned there'],
    },
    'LH': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10,
      amenities: ['Star Alliance branded lounge area'], tips: ['Star Alliance carriers mostly use Concourses D and E'],
    },
    'AF': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'KL': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'UA': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AA': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'SQ': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'CX': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'TK': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E,F', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'EY': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'MS': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'RJ': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'GF': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'WY': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    // Terminal 2 — low-cost / regional (flydubai, Air Arabia, some charter)
    'FZ': { terminal: '2', terminalFull: 'Terminal 2 (flydubai)', gatePrefix: '2', walkMinutesFromSecurity: 6,
      amenities: ['Basic food outlets', 'ATM'],
      tips: ['T2 is much smaller and basic — minimal retail', 'No fast-track security available'],
    },
    'G9': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: '2', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: '1', terminalFull: 'Terminal 1',
    gatePrefix: 'D,E,F',
    walkMinutesFromSecurity: 10,
    amenities: ['Duty Free', 'Restaurants', 'ATM'],
    tips: ['Check your specific concourse (D/E/F/G) on boarding pass — distances vary significantly'],
  },
  // Inter-terminal transfers require FREE shuttle bus (airside or landside depending on status)
  // Connecting passengers between T1 and T3 must go through immigration → bus → re-check security
  // UNLESS travelling on an EK codeshare and DXB has arranged an airside connect (rare)
  transferTimesBetweenTerminals: {
    '1': { '2': 20, '3': 30 },
    '2': { '1': 20, '3': 35 },
    '3': { '1': 30, '2': 35 },
  },
};

// ── CDG ─────────────────────────────────────────────────────────────────────
// Three terminal complexes. T2 is by far the largest (Air France/SkyTeam hub).
// T2 subdivided into halls: 2A, 2B, 2C, 2D, 2E, 2F, 2G (satellite).
// T1 is a circular 1970s design (Star Alliance). T3 is low-cost.
// Airside transfer between T2 sub-halls requires CDGval automated shuttle (free).
// T1↔T2 also use CDGval. Allow generous time — CDG is notorious for long connections.
export const CDG_DATA: AirportData = {
  code: 'CDG',
  name: 'Paris Charles de Gaulle Airport',
  city: 'Paris',
  country: 'FR',
  terminals: ['1', '2A', '2B', '2C', '2D', '2E', '2F', '2G', '3'],
  airlineTerminals: {
    // Terminal 2E / 2F — Air France long-haul (M and K gates in 2E Hall; L gates in 2F)
    'AF': { terminal: '2E', terminalFull: 'Terminal 2E/2F (Air France)', gatePrefix: 'K,L,M', walkMinutesFromSecurity: 15,
      amenities: ['Air France La Première Lounge (2E)', 'Air France Business Lounge (2E & 2F)', 'Relay shops', 'Boulangerie Paul', 'Duty Free (large)'],
      tips: [
        'Hall K is for Schengen routes; Hall M for intercontinental — make sure you go to the right one',
        'Hall 2G is a satellite connected by CDGval from 2E — allow 15 extra min if gates are there',
        'La Première lounge (First) is outstanding but requires confirmation at reception',
        'International connections within T2 require CDGval shuttle — follow yellow CORRESPONDANCES signs',
        'CDG is consistently ranked slowest for transfers in Europe — budget 90 min minimum',
      ],
    },
    // Terminal 2C / 2D — Air France medium-haul European (Schengen)
    'KL': { terminal: '2E', terminalFull: 'Terminal 2E (KLM/SkyTeam)', gatePrefix: 'K,M', walkMinutesFromSecurity: 15,
      amenities: ['Air France / KLM shared lounge'], tips: ['KLM uses T2E alongside Air France'],
    },
    'DL': { terminal: '2E', terminalFull: 'Terminal 2E (Delta/SkyTeam)', gatePrefix: 'K,M', walkMinutesFromSecurity: 15,
      amenities: [], tips: ['Delta SkyTeam partner — T2E with AF'],
    },
    'AZ': { terminal: '2E', terminalFull: 'Terminal 2E (SkyTeam)', gatePrefix: 'K,M', walkMinutesFromSecurity: 15, amenities: [], tips: [] },
    'MU': { terminal: '2E', terminalFull: 'Terminal 2E (SkyTeam)', gatePrefix: 'K,M', walkMinutesFromSecurity: 15, amenities: [], tips: [] },
    'KE': { terminal: '2E', terminalFull: 'Terminal 2E (SkyTeam)', gatePrefix: 'K,M', walkMinutesFromSecurity: 15, amenities: [], tips: [] },
    'AM': { terminal: '2E', terminalFull: 'Terminal 2E (SkyTeam)', gatePrefix: 'K,M', walkMinutesFromSecurity: 15, amenities: [], tips: [] },
    // Terminal 2A / 2C — oneworld carriers (some)
    'BA': { terminal: '2A', terminalFull: 'Terminal 2A (British Airways)', gatePrefix: 'A', walkMinutesFromSecurity: 10,
      amenities: ['British Airways Lounge'], tips: ['Short terminal — easy navigation'] },
    'IB': { terminal: '2C', terminalFull: 'Terminal 2C (Iberia)', gatePrefix: 'C', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AA': { terminal: '2B', terminalFull: 'Terminal 2B', gatePrefix: 'B', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    // Terminal 1 — Star Alliance (circular building)
    'LH': { terminal: '1', terminalFull: 'Terminal 1 (Star Alliance)', gatePrefix: '1', walkMinutesFromSecurity: 12,
      amenities: ['Lufthansa Business Lounge', 'Star Alliance Lounge', 'Multiple restaurants'],
      tips: [
        'T1 is the iconic circular "Satellite" 1970s structure — all gates radiate from centre',
        'Navigation is straightforward once inside — one ring road, gates numbered around it',
        'CDGval shuttle from T1 to T2 takes about 8 min but add 10 min for waiting/walking',
      ],
    },
    'UA': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: '1', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'AC': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: '1', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'TK': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: '1', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'SQ': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: '1', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'EK': { terminal: '2C', terminalFull: 'Terminal 2C (Emirates at CDG)', gatePrefix: 'C', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    // Terminal 3 — low-cost (easyJet, Vueling, etc.)
    'VY': { terminal: '3', terminalFull: 'Terminal 3 (Low-Cost)', gatePrefix: '3', walkMinutesFromSecurity: 5,
      amenities: ['Basic snack bars'], tips: ['T3 is far from T1/T2 — long bus ride or CDGval'] },
    'U2': { terminal: '3', terminalFull: 'Terminal 3 (Low-Cost)', gatePrefix: '3', walkMinutesFromSecurity: 5, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: '2E', terminalFull: 'Terminal 2E',
    gatePrefix: 'K,M',
    walkMinutesFromSecurity: 15,
    amenities: ['Duty Free', 'Restaurants', 'Lounges'],
    tips: ['Always verify your specific hall letter (2A–2G) — distances within T2 are very large'],
  },
  transferTimesBetweenTerminals: {
    // CDGval automated people mover connects T1, T2 (all halls), T3
    // Times include walking to/from CDGval station + ride + security re-entry where needed
    '1':  { '2A': 20, '2B': 22, '2C': 22, '2D': 22, '2E': 25, '2F': 25, '2G': 35, '3': 30 },
    '2A': { '1': 20, '2B': 8,  '2C': 8,  '2D': 10, '2E': 12, '2F': 12, '2G': 22, '3': 28 },
    '2B': { '1': 22, '2A': 8,  '2C': 6,  '2D': 8,  '2E': 10, '2F': 10, '2G': 20, '3': 26 },
    '2C': { '1': 22, '2A': 8,  '2B': 6,  '2D': 8,  '2E': 10, '2F': 10, '2G': 20, '3': 26 },
    '2D': { '1': 22, '2A': 10, '2B': 8,  '2C': 8,  '2E': 8,  '2F': 8,  '2G': 18, '3': 24 },
    '2E': { '1': 25, '2A': 12, '2B': 10, '2C': 10, '2D': 8,  '2F': 6,  '2G': 15, '3': 22 },
    '2F': { '1': 25, '2A': 12, '2B': 10, '2C': 10, '2D': 8,  '2E': 6,  '2G': 15, '3': 22 },
    '2G': { '1': 35, '2A': 22, '2B': 20, '2C': 20, '2D': 18, '2E': 15, '2F': 15, '3': 30 },
    '3':  { '1': 30, '2A': 28, '2B': 26, '2C': 26, '2D': 24, '2E': 22, '2F': 22, '2G': 30 },
  },
};

// ── SIN ─────────────────────────────────────────────────────────────────────
// Changi Airport — consistently voted world's best airport.
// 4 terminals + Jewel (retail/hotel complex between T1 and T3).
// T1, T2, T3 are connected airside by Skytrain (free, 24h).
// T4 is separated — requires bus transfer (airside) or Skytrain-then-bus.
// Singapore Airlines uses T2 & T3. Most connections are seamless airside.
export const SIN_DATA: AirportData = {
  code: 'SIN',
  name: 'Singapore Changi Airport',
  city: 'Singapore',
  country: 'SG',
  terminals: ['1', '2', '3', '4'],
  airlineTerminals: {
    // Singapore Airlines & SilkAir → T2 and T3
    'SQ': { terminal: '3', terminalFull: 'Terminal 3 (Singapore Airlines)', gatePrefix: 'A,B,C,D', walkMinutesFromSecurity: 10,
      amenities: ['Singapore Airlines SilverKris Lounge (T3)', 'The Private Room (First)', 'Jewel connection', 'Halo (rooftop garden)', 'Kinetic Rain sculpture', 'Duty Free', 'Many restaurants'],
      tips: [
        'SilverKris Business Lounge is one of the best in Asia — near Gates D41-D59',
        'Jewel Changi (with the indoor Rain Vortex waterfall) is accessible from T1/T2/T3 — allow 30 min to explore',
        'T3 is the most spacious and easiest to navigate of all terminals',
        'Skytrain between T2 and T3 runs every 3 min — airside, no security re-check needed',
        'Changi has 24h dining, a rooftop pool (T1, transit hotel guests), a cinema, and free city tours for transiting passengers',
      ],
    },
    'MI': { terminal: '2', terminalFull: 'Terminal 2 (Scoot/SilkAir)', gatePrefix: 'D', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'TR': { terminal: '2', terminalFull: 'Terminal 2 (Scoot)', gatePrefix: 'D', walkMinutesFromSecurity: 8,
      amenities: ['Basic food court'], tips: ['Scoot is the low-cost arm of SIA — T2'] },
    // Star Alliance at T2
    'LH': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'C,D', walkMinutesFromSecurity: 8, amenities: ['Star Alliance Lounge T2'], tips: [] },
    'UA': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'C,D', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'AC': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'C,D', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'TG': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'C,D', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'NH': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    // oneworld at T1
    'BA': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8,
      amenities: ['British Airways Lounge T1'], tips: ['T1 has the connection to Jewel and transit hotel'] },
    'QF': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'CX': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'MH': { terminal: '1', terminalFull: 'Terminal 1 (Malaysia Airlines)', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    // T4 — Cathay Pacific regional & some others
    'KA': { terminal: '4', terminalFull: 'Terminal 4', gatePrefix: 'F', walkMinutesFromSecurity: 7,
      amenities: ['SATS Premier Lounge T4', 'Food court'],
      tips: [
        'T4 is the newest but NOT connected airside to T1/T2/T3 — bus transfer takes 10-15 min',
        'FAST (Fully Automated Seamless Travel) system — self-service bag drop and automated gates',
        'If connecting T4 → T1/T2/T3 allow at least 60 min and follow TRANSFER signs to the free bus',
      ],
    },
    'AK': { terminal: '4', terminalFull: 'Terminal 4 (AirAsia)', gatePrefix: 'F', walkMinutesFromSecurity: 7, amenities: [], tips: [] },
    'VN': { terminal: '4', terminalFull: 'Terminal 4', gatePrefix: 'F', walkMinutesFromSecurity: 7, amenities: [], tips: [] },
    'EK': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'AF': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'KL': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: '2', terminalFull: 'Terminal 2',
    gatePrefix: 'C,D',
    walkMinutesFromSecurity: 8,
    amenities: ['Duty Free', 'Restaurants', 'Lounges'],
    tips: ['Skytrain connects T1-T2-T3 airside every 3-5 min — fast and free'],
  },
  transferTimesBetweenTerminals: {
    // T1-T2-T3: free Skytrain airside, no re-security (same terminal security level)
    '1': { '2': 10, '3': 12, '4': 25 },
    '2': { '1': 10, '3': 10, '4': 25 },
    '3': { '1': 12, '2': 10, '4': 25 },
    // T4 is separate — bus transfer required, immigration clearance if non-Schengen
    '4': { '1': 25, '2': 25, '3': 25 },
  },
};

// ── AMS ─────────────────────────────────────────────────────────────────────
// Amsterdam Schiphol is a SINGLE terminal building divided into departure piers (D, E, F, G, H).
// This is one of the most efficient airports in the world for connecting passengers.
// KLM / SkyTeam dominate. Schengen and non-Schengen airside areas are separated post-security.
// Non-Schengen → Schengen connections require passport control (EU queue fast).
export const AMS_DATA: AirportData = {
  code: 'AMS',
  name: 'Amsterdam Airport Schiphol',
  city: 'Amsterdam',
  country: 'NL',
  terminals: ['Main'],  // Single terminal; piers D, E, F, G, H
  airlineTerminals: {
    // KLM — uses all piers; long-haul usually D/E
    'KL': { terminal: 'Main', terminalFull: 'Main Terminal – Piers D/E (KLM long-haul)', gatePrefix: 'D,E', walkMinutesFromSecurity: 10,
      amenities: ['KLM Crown Lounge (Pier D, Pier E)', 'KLM Crown Lounge Business (non-Schengen, Pier E)', 'Heineken outlet', 'Rijksmuseum mini-museum airside', 'Multiple restaurants'],
      tips: [
        'KLM Crown Lounges are in Pier D (Schengen) and Pier E (non-Schengen) — check your departure zone',
        'The Rijksmuseum in-terminal exhibit is free and world-class — a genuine highlight',
        'Schiphol Plaza (landside) has a full shopping mall, supermarket, and casino',
        'Single terminal means no inter-terminal bus/train — all piers connected by wide corridors and moving walkways',
        'During busy periods D/E non-Schengen security can back up — arrive at gate 45 min early',
      ],
    },
    'AF': { terminal: 'Main', terminalFull: 'Main Terminal – Pier F (Air France)', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'DL': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D/E (SkyTeam)', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AZ': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D/E', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'KE': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D/E', gatePrefix: 'D,E', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    // Star Alliance
    'LH': { terminal: 'Main', terminalFull: 'Main Terminal – Pier G/H', gatePrefix: 'G,H', walkMinutesFromSecurity: 12,
      amenities: ['Star Alliance lounge (Pier H)'],
      tips: ['Pier G/H is the farthest from check-in — moving walkways help but still 12-15 min walk'] },
    'UA': { terminal: 'Main', terminalFull: 'Main Terminal – Pier G/H', gatePrefix: 'G,H', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'AC': { terminal: 'Main', terminalFull: 'Main Terminal – Pier G/H', gatePrefix: 'G,H', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'TK': { terminal: 'Main', terminalFull: 'Main Terminal – Pier G/H', gatePrefix: 'G,H', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'SN': { terminal: 'Main', terminalFull: 'Main Terminal – Pier B (Brussels Airlines)', gatePrefix: 'B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    // oneworld
    'BA': { terminal: 'Main', terminalFull: 'Main Terminal – Pier F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'IB': { terminal: 'Main', terminalFull: 'Main Terminal – Pier F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'EI': { terminal: 'Main', terminalFull: 'Main Terminal – Pier B/C', gatePrefix: 'B,C', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    // Low-cost (Schengen piers B/C)
    'FR': { terminal: 'Main', terminalFull: 'Main Terminal – Pier B/C (Ryanair)', gatePrefix: 'B,C', walkMinutesFromSecurity: 6,
      amenities: [], tips: ['Ryanair and other LCCs use B/C — basic, no frills, close to security'] },
    'HV': { terminal: 'Main', terminalFull: 'Main Terminal – Pier B/C (Transavia)', gatePrefix: 'B,C', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
    'EW': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D', gatePrefix: 'D', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: 'Main', terminalFull: 'Main Terminal',
    gatePrefix: 'D,E',
    walkMinutesFromSecurity: 10,
    amenities: ['KLM Crown Lounge', 'Heineken Bar', 'Rijksmuseum exhibit', 'Duty Free'],
    tips: [
      'Single terminal — no inter-terminal transfers needed',
      'Schengen flights use piers B/C/D; non-Schengen use D/E/F/G/H (some piers serve both)',
      'Transferring Schengen→Non-Schengen requires going through passport control — follow blue TRANSFER signs',
    ],
  },
  transferTimesBetweenTerminals: {
    // All piers within same terminal — times = pier-to-pier walking
    'B': { 'C': 5, 'D': 8, 'E': 12, 'F': 15, 'G': 18, 'H': 20 },
    'C': { 'B': 5, 'D': 6, 'E': 10, 'F': 12, 'G': 15, 'H': 18 },
    'D': { 'B': 8, 'C': 6, 'E': 8,  'F': 10, 'G': 12, 'H': 15 },
    'E': { 'B': 12,'C': 10,'D': 8,  'F': 8,  'G': 10, 'H': 12 },
    'F': { 'B': 15,'C': 12,'D': 10, 'E': 8,  'G': 8,  'H': 10 },
    'G': { 'B': 18,'C': 15,'D': 12, 'E': 10, 'F': 8,  'H': 5  },
    'H': { 'B': 20,'C': 18,'D': 15, 'E': 12, 'F': 10, 'G': 5  },
  },
};

// ── FRA ─────────────────────────────────────────────────────────────────────
// Frankfurt Airport — Lufthansa/Star Alliance hub, Germany's largest.
// TWO terminals: T1 (A, B, C, D, Z concourses) and T2 (D gates).
// T1 and T2 connected by SkyLine automated monorail (free, airside).
// Famous for long walks — B/C concourses can be 20 min end-to-end.
// Non-Schengen arriving passengers must clear immigration then re-security for next flight.
export const FRA_DATA: AirportData = {
  code: 'FRA',
  name: 'Frankfurt Airport',
  city: 'Frankfurt',
  country: 'DE',
  terminals: ['1', '2'],
  airlineTerminals: {
    // Terminal 1 — Lufthansa & Star Alliance (concourses A, B, C, Z)
    'LH': { terminal: '1', terminalFull: 'Terminal 1 (Lufthansa/Star Alliance)', gatePrefix: 'A,B,C,Z', walkMinutesFromSecurity: 15,
      amenities: ['Lufthansa Senator Lounge A', 'Lufthansa Business Lounge A/B/C', 'Lufthansa First Class Terminal (separate building!)', 'Star Alliance Lounge Z', 'Many restaurants in B/C'],
      tips: [
        'Lufthansa First Class Terminal is a separate building — limo pickup, private security, valet — only for F class',
        'Concourse B is very long — from B1 to B48 can be 25 min walk; moving walkways help',
        'Star Alliance Lounge in Concourse Z is convenient for many connections',
        'The B/C pier uses a long corridor with moving walkways — start walking immediately after security',
        'Connections involving two Lufthansa non-Schengen flights can be done airside without re-clearing immigration',
        'Schengen → non-Schengen transfer requires passing through passport control — follow blue TRANSFER signs',
      ],
    },
    'UA': { terminal: '1', terminalFull: 'Terminal 1 – Concourse B/Z (Star Alliance)', gatePrefix: 'B,Z', walkMinutesFromSecurity: 12,
      amenities: ['Star Alliance Lounge'], tips: ['United uses B or Z concourse — check boarding pass'] },
    'AC': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'B,Z', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'TG': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'B,Z', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'SQ': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'B,Z', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'NH': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'B,Z', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'TK': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'A,Z', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    // Terminal 2 — non-Star Alliance (oneworld, SkyTeam, unaffiliated)
    'AA': { terminal: '2', terminalFull: 'Terminal 2 (American Airlines)', gatePrefix: 'D', walkMinutesFromSecurity: 10,
      amenities: ['oneworld Lounge T2'], tips: ['T2 is smaller and easier to navigate than T1'] },
    'BA': { terminal: '2', terminalFull: 'Terminal 2 (British Airways)', gatePrefix: 'D', walkMinutesFromSecurity: 10,
      amenities: ['British Airways Lounge'], tips: [] },
    'IB': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AF': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'KL': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'DL': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'EK': { terminal: '2', terminalFull: 'Terminal 2 (Emirates)', gatePrefix: 'D', walkMinutesFromSecurity: 10,
      amenities: ['Emirates Lounge T2'], tips: ['Emirates uses T2 — well served, less congested than T1'] },
    'EY': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'QF': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'CX': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: '1', terminalFull: 'Terminal 1',
    gatePrefix: 'A,B',
    walkMinutesFromSecurity: 15,
    amenities: ['Lufthansa Lounges', 'Star Alliance Lounge', 'Restaurants', 'Duty Free'],
    tips: [
      'SkyLine monorail connects T1 ↔ T2 airside — free, runs every 2 min, 3 min journey',
      'Allow 20 min for T1→T2 transfers (walk to SkyLine + ride + walk)',
      'FRA is one of the largest airports in Europe — always budget extra time',
    ],
  },
  transferTimesBetweenTerminals: {
    '1': { '2': 20 },
    '2': { '1': 20 },
  },
};

// ── HKG ─────────────────────────────────────────────────────────────────────
// Hong Kong International — single mega-terminal on Lantau Island.
// Two piers: main Terminal (T1) with North and South concourses, and the SkyPier for ferry connections.
// Cathay Pacific dominates from the main T1 pier.
// Extremely efficient — airside connections are straightforward.
// Mainland China transit (SkyPier) is a unique ferry-to-Guangdong bridge service.
export const HKG_DATA: AirportData = {
  code: 'HKG',
  name: 'Hong Kong International Airport',
  city: 'Hong Kong',
  country: 'HK',
  terminals: ['T1', 'SkyPier'],
  airlineTerminals: {
    // Cathay Pacific — T1, various gates
    'CX': { terminal: 'T1', terminalFull: 'Terminal 1 (Cathay Pacific)', gatePrefix: '1,2,3,4,5,6,7,8', walkMinutesFromSecurity: 12,
      amenities: ['The Wing Lounge (First & Business)', 'The Pier Lounge (Business)', 'The Cabin Lounge (Business)', 'Cathay Delight (F only)', 'HKIA Regal Hotel airside'],
      tips: [
        'The Wing and The Pier lounges are among the finest in the world — First Class lounge has a full spa and day suites',
        'Gates 1-24: south pier (closer to check-in)',
        'Gates 60-79: north pier — connected to main terminal by enclosed walkway or APM (Automated People Mover)',
        'APM (people mover) runs between main terminal and north satellite — free, takes 3 min, runs 24h',
        'HKG is immaculately clean and easy to navigate — excellent signage in English and Chinese',
        'Sky100 observation deck is landside — not accessible once airside',
      ],
    },
    'KA': { terminal: 'T1', terminalFull: 'Terminal 1 (Cathay Dragon/HK Express)', gatePrefix: '1,2,3', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'HX': { terminal: 'T1', terminalFull: 'Terminal 1 (Hong Kong Express)', gatePrefix: '1,2', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    // Other airlines
    'BA': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '1,2,3', walkMinutesFromSecurity: 12, amenities: ['British Airways Lounge'], tips: [] },
    'QF': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '1,2,3', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'AA': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '1,2,3', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'EK': { terminal: 'T1', terminalFull: 'Terminal 1 (Emirates)', gatePrefix: '5,6,7', walkMinutesFromSecurity: 12,
      amenities: ['Emirates Lounge HKG'], tips: [] },
    'SQ': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '3,4,5', walkMinutesFromSecurity: 12, amenities: ['Singapore Airlines KrisFlyer Lounge'], tips: [] },
    'LH': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '5,6', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'UA': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '5,6', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'AF': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '5,6', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'MH': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '3,4', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'JL': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '3,4', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'NH': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '3,4', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'TK': { terminal: 'T1', terminalFull: 'Terminal 1', gatePrefix: '5,6', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: 'T1', terminalFull: 'Terminal 1',
    gatePrefix: '1,2,3',
    walkMinutesFromSecurity: 12,
    amenities: ['Duty Free', 'Multiple restaurants', 'Airport hotel (airside)'],
    tips: [
      'One of the most efficient airports in Asia — connections under 60 min are often fine',
      'SkyPier connects to mainland China ports by ferry — separate security and immigration',
      'Airport Express into Kowloon/HK Island is 24 min — fastest city link of any major airport',
    ],
  },
  transferTimesBetweenTerminals: {
    'T1': { 'SkyPier': 15 },
    'SkyPier': { 'T1': 15 },
  },
};

// ── NRT ─────────────────────────────────────────────────────────────────────
// Tokyo Narita — 3 terminals. T1 (South/North wings), T2, T3 (low-cost).
// Japan Airlines uses T2; ANA/All Nippon uses T1.
// T1 and T2 are connected by a FREE inter-terminal shuttle bus (airside — but need to exit and re-enter).
// T3 is connected by a free shuttle to T2 but is MUCH farther.
// Note: Tokyo Haneda (HND) has largely taken over domestic and some int'l routes.
export const NRT_DATA: AirportData = {
  code: 'NRT',
  name: 'Narita International Airport',
  city: 'Tokyo',
  country: 'JP',
  terminals: ['1', '2', '3'],
  airlineTerminals: {
    // Terminal 1 — ANA, Star Alliance + some others
    'NH': { terminal: '1', terminalFull: 'Terminal 1 (ANA)', gatePrefix: 'N,S', walkMinutesFromSecurity: 10,
      amenities: ['ANA Lounge (First & Business)', 'ANA Suite Lounge (First)', 'Duty Free Japan', 'Many Japanese dining options'],
      tips: [
        'T1 has two wings: North (N gates) and South (S gates) — connected airside',
        'ANA Suite Lounge for First Class has exceptional Japanese cuisine',
        'Arrive early — Japanese customs can be thorough for non-Japanese passport holders',
        'Duty Free is extensive — pick up on the way to gate as there are good prices',
      ],
    },
    'UA': { terminal: '1', terminalFull: 'Terminal 1 (Star Alliance)', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: ['United Club T1'], tips: [] },
    'LH': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AC': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'TG': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'SQ': { terminal: '1', terminalFull: 'Terminal 1', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    // Terminal 2 — Japan Airlines (JAL), oneworld + Delta
    'JL': { terminal: '2', terminalFull: 'Terminal 2 (Japan Airlines)', gatePrefix: 'N,S', walkMinutesFromSecurity: 10,
      amenities: ['JAL Sakura Lounge (First & Business)', 'JAL First Class Lounge (by invite)', 'Tempura / Sushi restaurants airside'],
      tips: [
        'JAL Sakura Lounge is top-tier — breakfast service with traditional Japanese options',
        'T2 North wing vs South wing — both easily accessible airside',
        'JAL First Class requires J Class or JAL Mileage Bank Diamond to access First Lounge',
      ],
    },
    'AA': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'BA': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'QF': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'DL': { terminal: '2', terminalFull: 'Terminal 2 (Delta)', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'KE': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AF': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'KL': { terminal: '2', terminalFull: 'Terminal 2', gatePrefix: 'N,S', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    // Terminal 3 — low-cost carriers
    'JW': { terminal: '3', terminalFull: 'Terminal 3 (Vanilla Air/Jetstar)', gatePrefix: '3', walkMinutesFromSecurity: 6,
      amenities: ['Basic snack bar'], tips: ['T3 is the most basic — limited facilities, simple layout'] },
    'GK': { terminal: '3', terminalFull: 'Terminal 3 (Jetstar Japan)', gatePrefix: '3', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: '2', terminalFull: 'Terminal 2',
    gatePrefix: 'N,S',
    walkMinutesFromSecurity: 10,
    amenities: ['JAL Lounge', 'Duty Free', 'Japanese restaurants'],
    tips: [
      'Free shuttle bus between T1 and T2 (airside): every 5-10 min, 10 min journey',
      'T3 shuttle from T2 takes ~20 min',
      'Transit (without Japan visa) is allowed for most nationalities within the international zones',
    ],
  },
  transferTimesBetweenTerminals: {
    '1': { '2': 15, '3': 35 },
    '2': { '1': 15, '3': 20 },
    '3': { '1': 35, '2': 20 },
  },
};

// ── IST ─────────────────────────────────────────────────────────────────────
// Istanbul Airport — opened 2019, one of the world's largest single-terminal airports.
// Turkish Airlines mega-hub. Replaced Atatürk Airport (ISL, now closed to commercial ops).
// Single main terminal with multiple piers. Connections are almost entirely within one building.
// Turkey is not in Schengen — all flights are "international" by EU standards.
// Transit passengers do NOT need a Turkish visa if staying airside.
export const IST_DATA: AirportData = {
  code: 'IST',
  name: 'Istanbul Airport',
  city: 'Istanbul',
  country: 'TR',
  terminals: ['Main'],
  airlineTerminals: {
    'TK': { terminal: 'Main', terminalFull: 'Istanbul Airport – Main Terminal (Turkish Airlines)', gatePrefix: 'A,B,C,D,E,F', walkMinutesFromSecurity: 15,
      amenities: [
        'Turkish Airlines Lounge (largest airport lounge in the world — 7,500 sqm, Pier E)',
        'Turkish Airlines Miles&Smiles Lounge',
        'Turkish Do&Co restaurant airside',
        'Extensive Duty Free',
        'Turkish Coffee corner',
        'Prayer rooms on multiple piers',
      ],
      tips: [
        'Turkish Airlines Lounge at Pier E is genuinely massive — allow 45 min to experience it properly',
        'The lounge has a full à la carte restaurant, Turkish hammam-style spa, kids zone, and cinema',
        'Pier letters go A through F — from check-in to Pier F can take 20 min; moving walkways throughout',
        'Istanbul layover over 6 hrs: TK offers FREE hotel, meal, and city tour for transit pax (check eligibility at transfer desk)',
        'Security queues can be very long at peak times (6-9am, 6-9pm) — arrive at gate 45 min early',
        'Domestic and international flights use the same terminal but different piers (domestic = A/B)',
        'No re-security needed for airside international → international connections',
      ],
    },
    // Other airlines at IST
    'LH': { terminal: 'Main', terminalFull: 'Main Terminal – Pier C/D', gatePrefix: 'C,D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'AF': { terminal: 'Main', terminalFull: 'Main Terminal – Pier C/D', gatePrefix: 'C,D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'BA': { terminal: 'Main', terminalFull: 'Main Terminal – Pier C/D', gatePrefix: 'C,D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'EK': { terminal: 'Main', terminalFull: 'Main Terminal – Pier C/D', gatePrefix: 'C,D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'UA': { terminal: 'Main', terminalFull: 'Main Terminal – Pier C/D', gatePrefix: 'C,D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'QR': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D', gatePrefix: 'D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'EY': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D', gatePrefix: 'D', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'SQ': { terminal: 'Main', terminalFull: 'Main Terminal – Pier D/E', gatePrefix: 'D,E', walkMinutesFromSecurity: 14, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: 'Main', terminalFull: 'Main Terminal',
    gatePrefix: 'A,B,C,D,E,F',
    walkMinutesFromSecurity: 15,
    amenities: ['Turkish Airlines Lounge', 'Duty Free', 'Turkish Do&Co dining', 'Prayer rooms'],
    tips: [
      'Single mega-terminal — all connections are within the same building',
      'Moving walkways throughout but terminal is very large — always check gate and allow walk time',
      'Turkish Airlines transit pax: check TRANSFER desk on arrival for free hotel/city tour offers',
    ],
  },
  transferTimesBetweenTerminals: {}, // Single terminal — no inter-terminal transfers
};

// ── DFW ─────────────────────────────────────────────────────────────────────
// Dallas Fort Worth — massive airport, second largest in the US by area.
// 5 terminals (A, B, C, D, E) arranged in a horseshoe around a central highway (Hwy 97).
// Skylink automated people mover connects all terminals AIRSIDE — free, runs 24h.
// International arrivals land at D; customs/immigration can be slow.
// American Airlines hub — uses A, B, C, D (most flights).
export const DFW_DATA: AirportData = {
  code: 'DFW',
  name: 'Dallas Fort Worth International Airport',
  city: 'Dallas',
  country: 'US',
  terminals: ['A', 'B', 'C', 'D', 'E'],
  airlineTerminals: {
    'AA': { terminal: 'A', terminalFull: 'Terminal A (American Airlines)', gatePrefix: 'A', walkMinutesFromSecurity: 8,
      amenities: ['Admirals Club (A24, A31)', 'Centurion Lounge (A22)', 'Flagship Lounge (D)', 'Multiple restaurants throughout'],
      tips: [
        'American Airlines uses A, B, C, and D — check your specific terminal and gate on boarding pass',
        'Flagship Lounge (international business class) is in Terminal D',
        'Centurion Lounge at A22 requires Amex Platinum/Centurion card',
        'Skylink train runs a loop — always go in the direction of travel (check overhead map)',
        'A→D is a full loop on Skylink — can take 12 min if going the long way; go opposite direction',
      ],
    },
    // AA also uses B, C, D for domestic/international
    'WN': { terminal: 'E', terminalFull: 'Terminal E (Southwest)', gatePrefix: 'E', walkMinutesFromSecurity: 6,
      amenities: [], tips: ['Southwest uses Terminal E — no Skylink at E, use shuttle bus to other terminals'] },
    'UA': { terminal: 'E', terminalFull: 'Terminal E', gatePrefix: 'E', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
    'DL': { terminal: 'E', terminalFull: 'Terminal E', gatePrefix: 'E', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
    'AS': { terminal: 'E', terminalFull: 'Terminal E', gatePrefix: 'E', walkMinutesFromSecurity: 6, amenities: [], tips: [] },
    'BA': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10,
      amenities: ['British Airways Lounge (D20)', 'American Airlines Flagship Lounge', 'Duty Free', 'International restaurants'],
      tips: ['Terminal D handles all international arrivals including US Customs and Border Protection'] },
    'LH': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AF': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'AM': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'IB': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'JL': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
    'EK': { terminal: 'D', terminalFull: 'Terminal D (International)', gatePrefix: 'D', walkMinutesFromSecurity: 10, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: 'D', terminalFull: 'Terminal D (International)',
    gatePrefix: 'D',
    walkMinutesFromSecurity: 10,
    amenities: ['Flagship Lounge', 'Duty Free', 'International restaurants'],
    tips: [
      'Skylink people mover connects A-B-C-D airside, free, runs 24h (NOT Terminal E)',
      'Terminal E passengers must take a bus to/from Skylink',
      'DFW CBP (US Customs) can have 60+ min wait at peak hours — factor into connection times',
      'Global Entry kiosks available at Terminal D for expedited customs',
    ],
  },
  transferTimesBetweenTerminals: {
    // Skylink times (airside, no re-security) between A-B-C-D
    // E requires separate bus to Skylink and re-security
    'A': { 'B': 8,  'C': 10, 'D': 12, 'E': 25 },
    'B': { 'A': 8,  'C': 8,  'D': 10, 'E': 22 },
    'C': { 'A': 10, 'B': 8,  'D': 8,  'E': 20 },
    'D': { 'A': 12, 'B': 10, 'C': 8,  'E': 20 },
    'E': { 'A': 25, 'B': 22, 'C': 20, 'D': 20 },
  },
};

// ── ATL ─────────────────────────────────────────────────────────────────────
// Atlanta Hartsfield-Jackson — world's busiest airport by passenger count.
// Main domestic terminal → 7 concourses (T, A, B, C, D, E, F) in a straight line.
// International Terminal (F) opened 2012 and handles ALL international flights.
// Underground automated train (Plane Train) connects all concourses — free, fast.
// Also a underground pedestrian walkway (with moving walkway) for shorter distances.
export const ATL_DATA: AirportData = {
  code: 'ATL',
  name: 'Hartsfield-Jackson Atlanta International Airport',
  city: 'Atlanta',
  country: 'US',
  terminals: ['Domestic', 'International', 'T', 'A', 'B', 'C', 'D', 'E', 'F'],
  airlineTerminals: {
    'DL': { terminal: 'T', terminalFull: 'Main Domestic Terminal / Concourses A-E (Delta)', gatePrefix: 'A,B,C,D,E', walkMinutesFromSecurity: 8,
      amenities: ['Delta Sky Club (T, A, B, C, D, E, F — multiple locations)', 'Delta One Lounge (C)', 'Tons of local Atlanta dining (Waffle House, Paschal\'s, etc.)'],
      tips: [
        'Delta dominates ATL — uses A, B, C, D, and E concourses plus the International F concourse',
        'Delta Sky Club Delta One Lounge in Concourse C is exceptional for Delta One (business) pax',
        'Plane Train (underground automated) connects main terminal → T → A → B → C → D → E → F in one line',
        'Plane Train runs every 2 min, 24h — fastest way between concourses',
        'Underground pedestrian tunnel also connects all concourses — useful if Plane Train is crowded',
        'F concourse (International) has a dedicated customs hall — CBP wait times posted on ATL app',
      ],
    },
    'WN': { terminal: 'Domestic', terminalFull: 'Domestic Terminal (Southwest)', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: ['Southwest is in concourses A and B'] },
    'UA': { terminal: 'Domestic', terminalFull: 'Domestic Terminal', gatePrefix: 'A,B,C', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'AA': { terminal: 'Domestic', terminalFull: 'Domestic Terminal – Concourse A', gatePrefix: 'A', walkMinutesFromSecurity: 8,
      amenities: ['Admirals Club A3'], tips: [] },
    'AS': { terminal: 'Domestic', terminalFull: 'Domestic Terminal', gatePrefix: 'A,B', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'F9': { terminal: 'Domestic', terminalFull: 'Domestic Terminal – Concourse A', gatePrefix: 'A', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    'NK': { terminal: 'Domestic', terminalFull: 'Domestic Terminal – Concourse A', gatePrefix: 'A', walkMinutesFromSecurity: 8, amenities: [], tips: [] },
    // International (F concourse)
    'AF': { terminal: 'F', terminalFull: 'International Terminal – Concourse F (Air France)', gatePrefix: 'F', walkMinutesFromSecurity: 12,
      amenities: ['Air France Lounge F', 'Multiple international restaurants'], tips: ['Concourse F is the international terminal — Plane Train to F takes ~5 min from main terminal'] },
    'LH': { terminal: 'F', terminalFull: 'International Terminal – Concourse F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'KL': { terminal: 'F', terminalFull: 'International Terminal – Concourse F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'BA': { terminal: 'F', terminalFull: 'International Terminal – Concourse F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'EK': { terminal: 'F', terminalFull: 'International Terminal – Concourse F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
    'TK': { terminal: 'F', terminalFull: 'International Terminal – Concourse F', gatePrefix: 'F', walkMinutesFromSecurity: 12, amenities: [], tips: [] },
  },
  defaultTerminal: {
    terminal: 'T', terminalFull: 'Main Domestic Terminal',
    gatePrefix: 'A,B,C,D,E',
    walkMinutesFromSecurity: 8,
    amenities: ['Delta Sky Club', 'Atlanta dining', 'Duty Free'],
    tips: [
      'Plane Train (underground) connects all concourses — runs every 2 min, free',
      'Concourses are in a straight line: Main → T → A → B → C → D → E → F (international)',
      'F concourse (International): arriving passengers clear US Customs here, then connect via Plane Train',
      'International → Domestic connection: collect bags, clear customs, re-check bags, re-security at domestic checkpoints',
    ],
  },
  transferTimesBetweenTerminals: {
    // Plane Train (underground, airside) — no re-security for domestic-domestic or int'l-int'l
    // Int'l → Domestic: must clear customs and re-security
    'T': { 'A': 5,  'B': 7,  'C': 9,  'D': 11, 'E': 13, 'F': 15 },
    'A': { 'T': 5,  'B': 5,  'C': 7,  'D': 9,  'E': 11, 'F': 13 },
    'B': { 'T': 7,  'A': 5,  'C': 5,  'D': 7,  'E': 9,  'F': 11 },
    'C': { 'T': 9,  'A': 7,  'B': 5,  'D': 5,  'E': 7,  'F': 9  },
    'D': { 'T': 11, 'A': 9,  'B': 7,  'C': 5,  'E': 5,  'F': 7  },
    'E': { 'T': 13, 'A': 11, 'B': 9,  'C': 7,  'D': 5,  'F': 5  },
    'F': { 'T': 15, 'A': 13, 'B': 11, 'C': 9,  'D': 7,  'E': 5  },
  },
};

// ── Registry ────────────────────────────────────────────────────────────────
export const AIRPORT_REGISTRY: Record<string, AirportData> = {
  JFK: JFK_DATA,
  LAX: LAX_DATA,
  ORD: ORD_DATA,
  LHR: LHR_DATA,
  DXB: DXB_DATA,
  CDG: CDG_DATA,
  SIN: SIN_DATA,
  AMS: AMS_DATA,
  FRA: FRA_DATA,
  HKG: HKG_DATA,
  NRT: NRT_DATA,
  IST: IST_DATA,
  DFW: DFW_DATA,
  ATL: ATL_DATA,
};

// Airline code → full name (public IATA data)
export const AIRLINE_NAMES: Record<string, string> = {
  AA: 'American Airlines',  AF: 'Air France',         AC: 'Air Canada',
  AK: 'AirAsia',            AM: 'Aeroméxico',          AR: 'Aerolíneas Argentinas',
  AS: 'Alaska Airlines',    AY: 'Finnair',             AZ: 'ITA Airways',
  B6: 'JetBlue',            BA: 'British Airways',     CX: 'Cathay Pacific',
  DL: 'Delta Air Lines',    EI: 'Aer Lingus',          EK: 'Emirates',
  EW: 'Eurowings',          EY: 'Etihad Airways',      F9: 'Frontier Airlines',
  FI: 'Icelandair',         FR: 'Ryanair',             FZ: 'flydubai',
  G9: 'Air Arabia',         GA: 'Garuda Indonesia',    GF: 'Gulf Air',
  GK: 'Jetstar Japan',      HV: 'Transavia',           HX: 'Hong Kong Express',
  IB: 'Iberia',             JL: 'Japan Airlines',      JW: 'Vanilla Air',
  KA: 'Cathay Dragon / HK Express', KE: 'Korean Air', KL: 'KLM',
  LA: 'LATAM Airlines',     LH: 'Lufthansa',           LX: 'Swiss',
  MH: 'Malaysia Airlines',  MI: 'SilkAir',             MS: 'EgyptAir',
  MU: 'China Eastern',      MX: 'Mexicana',            NH: 'All Nippon Airways (ANA)',
  NK: 'Spirit Airlines',    QF: 'Qantas',              QR: 'Qatar Airways',
  RJ: 'Royal Jordanian',    SK: 'Scandinavian Airlines', SN: 'Brussels Airlines',
  SQ: 'Singapore Airlines', TG: 'Thai Airways',        TK: 'Turkish Airlines',
  TP: 'TAP Air Portugal',   TR: 'Scoot',               UA: 'United Airlines',
  U2: 'easyJet',            UX: 'Air Europa',           VN: 'Vietnam Airlines',
  VS: 'Virgin Atlantic',    VY: 'Vueling',             WN: 'Southwest Airlines',
  WS: 'WestJet',            WY: 'Oman Air',
};

/**
 * Looks up terminal info for a flight number at a given airport.
 * Flight number format: AA1234, DL123, B6456, etc.
 */
export function lookupTerminal(flightNumber: string, airportCode: string): TerminalInfo | null {
  const airport = AIRPORT_REGISTRY[airportCode.toUpperCase()];
  if (!airport) return null;

  // Extract 2-letter airline code (handle 1-letter codes too like 'B6')
  const match = flightNumber.trim().toUpperCase().match(/^([A-Z]{2}|[A-Z]\d)\d+/);
  if (!match) return null;

  const airlineCode = match[1];
  return airport.airlineTerminals[airlineCode] ?? airport.defaultTerminal;
}

/**
 * Returns transfer time in minutes between two terminals at the same airport.
 */
export function getTransferTime(
  airportCode: string,
  fromTerminal: string,
  toTerminal: string
): number {
  const airport = AIRPORT_REGISTRY[airportCode.toUpperCase()];
  if (!airport) return 15; // default
  if (fromTerminal === toTerminal) return 0;
  return airport.transferTimesBetweenTerminals[fromTerminal]?.[toTerminal] ?? 20;
}

/**
 * Extracts airline IATA code from a flight number string.
 */
export function getAirlineCode(flightNumber: string): string | null {
  const match = flightNumber.trim().toUpperCase().match(/^([A-Z]{2}|[A-Z]\d)/);
  return match ? match[1] : null;
}

// ══════════════════════════════════════════════════════════
// Terminal Connectivity Graphs
// ──────────────────────────────────────────────────────────
// One TerminalGraph per supported airport.  Each edge is a
// directed connection; set bidirectional:true when the return
// journey uses identical properties.
//
// Covered airports: JFK · ATL · DEN · LHR · CDG · ORD
// ══════════════════════════════════════════════════════════

import type { TerminalGraph } from '../types/models/terminalTransit';

// ── JFK — John F. Kennedy International ──────────────────
// AirTrain runs a loop (all terminals) at grade level — LANDSIDE.
// Only one confirmed airside connector: between T2/T3 concourses
// (being rebuilt) and a short walking link adjacent to T4/T5.
// All other inter-terminal moves exit the secure area.

const JFK: TerminalGraph = {
  airportCode: 'JFK',
  airportName: 'John F. Kennedy International',
  terminals: ['T1', 'T4', 'T5', 'T7', 'T8'],
  edges: [
    // ── AirTrain (all landside, ~8-min frequency) ─────────
    {
      id: 'jfk-airtrain-t1-t4',
      fromTerminal: 'T1', toTerminal: 'T4',
      routeType: 'landside', transportMode: 'train',
      label: 'AirTrain JFK',
      averageMinutes: 12, frequencyMinutes: 8, walkingMetres: 150,
      restrictions: ['requires_security_recheck'],
      notes: 'Follow "AirTrain" signs to the elevated platform. Free between terminals.',
      isOperational: true, bidirectional: true,
      operatingHours: { open: '05:00', close: '23:45' },
    },
    {
      id: 'jfk-airtrain-t4-t5',
      fromTerminal: 'T4', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'train',
      label: 'AirTrain JFK',
      averageMinutes: 8, frequencyMinutes: 8, walkingMetres: 120,
      restrictions: ['requires_security_recheck'],
      notes: 'Depart via the AirTrain platform on Level 1 of T4.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'jfk-airtrain-t5-t7',
      fromTerminal: 'T5', toTerminal: 'T7',
      routeType: 'landside', transportMode: 'train',
      label: 'AirTrain JFK',
      averageMinutes: 7, frequencyMinutes: 8, walkingMetres: 100,
      restrictions: ['requires_security_recheck'],
      isOperational: true, bidirectional: true,
    },
    {
      id: 'jfk-airtrain-t7-t8',
      fromTerminal: 'T7', toTerminal: 'T8',
      routeType: 'landside', transportMode: 'train',
      label: 'AirTrain JFK',
      averageMinutes: 6, frequencyMinutes: 8, walkingMetres: 80,
      restrictions: ['requires_security_recheck'],
      isOperational: true, bidirectional: true,
    },
    {
      id: 'jfk-airtrain-t1-t8',
      fromTerminal: 'T1', toTerminal: 'T8',
      routeType: 'landside', transportMode: 'train',
      label: 'AirTrain JFK (via Federal Circle)',
      averageMinutes: 20, frequencyMinutes: 8, walkingMetres: 200,
      restrictions: ['requires_security_recheck'],
      notes: 'Take the AirTrain anti-clockwise to T8.',
      isOperational: true, bidirectional: true,
    },
    // ── Only airside option: T4 ↔ T5 walking connector ───
    {
      id: 'jfk-airside-t4-t5-walk',
      fromTerminal: 'T4', toTerminal: 'T5',
      routeType: 'airside', transportMode: 'walking',
      label: 'Airside Connector Walkway',
      averageMinutes: 22, frequencyMinutes: null, walkingMetres: 900,
      restrictions: ['ticketed_passengers_only'],
      notes: 'Follow blue "Terminal Transfer" signs at Level 3 near Gate B20. Only available to ticketed passengers.',
      isOperational: true, bidirectional: true,
    },
  ],
};

// ── ATL — Hartsfield-Jackson Atlanta International ────────
// Entirely airside underground people-mover (the "Plane Train").
// No immigration barrier between concourses — perfect for transfers.
// F = International Terminal (Maynard Jackson International Terminal).

const ATL: TerminalGraph = {
  airportCode: 'ATL',
  airportName: 'Hartsfield-Jackson Atlanta International',
  terminals: ['T', 'A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    // ── Plane Train (airside, 2-min frequency) ────────────
    {
      id: 'atl-train-t-a', fromTerminal: 'T', toTerminal: 'A',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Plane Train', averageMinutes: 3, frequencyMinutes: 2, walkingMetres: 50,
      restrictions: [], notes: 'Board at the underground station beneath the atrium.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'atl-train-a-b', fromTerminal: 'A', toTerminal: 'B',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Plane Train', averageMinutes: 2, frequencyMinutes: 2, walkingMetres: 50,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'atl-train-b-c', fromTerminal: 'B', toTerminal: 'C',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Plane Train', averageMinutes: 2, frequencyMinutes: 2, walkingMetres: 50,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'atl-train-c-d', fromTerminal: 'C', toTerminal: 'D',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Plane Train', averageMinutes: 2, frequencyMinutes: 2, walkingMetres: 50,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'atl-train-d-e', fromTerminal: 'D', toTerminal: 'E',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Plane Train', averageMinutes: 2, frequencyMinutes: 2, walkingMetres: 50,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'atl-train-e-f', fromTerminal: 'E', toTerminal: 'F',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Plane Train (to International Terminal)',
      averageMinutes: 3, frequencyMinutes: 2, walkingMetres: 100,
      restrictions: [],
      notes: 'F is the international terminal. Customs & Immigration is in Terminal F.',
      isOperational: true, bidirectional: true,
    },
    // ── Walking shortcuts between adjacent concourses ─────
    {
      id: 'atl-walk-a-b', fromTerminal: 'A', toTerminal: 'B',
      routeType: 'airside', transportMode: 'walking',
      label: 'Airside Walkway', averageMinutes: 6, frequencyMinutes: null, walkingMetres: 480,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'atl-walk-b-c', fromTerminal: 'B', toTerminal: 'C',
      routeType: 'airside', transportMode: 'walking',
      label: 'Airside Walkway', averageMinutes: 6, frequencyMinutes: null, walkingMetres: 480,
      restrictions: [], isOperational: true, bidirectional: true,
    },
  ],
};

// ── DEN — Denver International ────────────────────────────
// All concourses connected via underground tunnel train — fully airside.
// A, B, C connect through the main Jeppesen Terminal (M).

const DEN: TerminalGraph = {
  airportCode: 'DEN',
  airportName: 'Denver International',
  terminals: ['M', 'A', 'B', 'C'],
  edges: [
    {
      id: 'den-train-m-a', fromTerminal: 'M', toTerminal: 'A',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Underground Concourse Train',
      averageMinutes: 5, frequencyMinutes: 3, walkingMetres: 60,
      restrictions: [],
      notes: 'Take the tunnel train from the main terminal basement level.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'den-train-m-b', fromTerminal: 'M', toTerminal: 'B',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Underground Concourse Train',
      averageMinutes: 7, frequencyMinutes: 3, walkingMetres: 60,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'den-train-m-c', fromTerminal: 'M', toTerminal: 'C',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'Underground Concourse Train',
      averageMinutes: 9, frequencyMinutes: 3, walkingMetres: 60,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    // Walking tunnel (alternative, longer)
    {
      id: 'den-walk-a-b', fromTerminal: 'A', toTerminal: 'B',
      routeType: 'airside', transportMode: 'walking',
      label: 'Underground Walkway',
      averageMinutes: 14, frequencyMinutes: null, walkingMetres: 1100,
      restrictions: [], notes: 'Follows the art gallery tunnel. Allow extra time.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'den-walk-b-c', fromTerminal: 'B', toTerminal: 'C',
      routeType: 'airside', transportMode: 'walking',
      label: 'Underground Walkway',
      averageMinutes: 14, frequencyMinutes: null, walkingMetres: 1100,
      restrictions: [], isOperational: true, bidirectional: true,
    },
  ],
};

// ── LHR — London Heathrow ─────────────────────────────────
// T2 ↔ T3: airside underground walkway (no security recheck).
// All other pairs exit the secure zone → security recheck required.
// For int'l → int'l passengers, landside exit = immigration + potential visa.

const LHR: TerminalGraph = {
  airportCode: 'LHR',
  airportName: 'London Heathrow Airport',
  terminals: ['T2', 'T3', 'T4', 'T5'],
  edges: [
    // ── ONLY airside link in all of LHR ──────────────────
    {
      id: 'lhr-airside-t2-t3',
      fromTerminal: 'T2', toTerminal: 'T3',
      routeType: 'airside', transportMode: 'walking',
      label: "Airside Walkway (Queen's Terminal connector)",
      averageMinutes: 14, frequencyMinutes: null, walkingMetres: 900,
      restrictions: ['ticketed_passengers_only'],
      notes: 'Follow "Flight Connections" signs past the gate lounges.',
      isOperational: true, bidirectional: true,
    },
    // ── Landside inter-terminal bus ───────────────────────
    {
      id: 'lhr-bus-t2-t4',
      fromTerminal: 'T2', toTerminal: 'T4',
      routeType: 'landside', transportMode: 'shuttle_bus',
      label: 'Heathrow Inter-Terminal Shuttle',
      averageMinutes: 25, frequencyMinutes: 12, walkingMetres: 220,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      notes: 'Board the free shuttle at the T2 Ground Transport Centre, Level 0.',
      isOperational: true, bidirectional: true,
      operatingHours: { open: '05:30', close: '23:30' },
    },
    {
      id: 'lhr-bus-t3-t4',
      fromTerminal: 'T3', toTerminal: 'T4',
      routeType: 'landside', transportMode: 'shuttle_bus',
      label: 'Heathrow Inter-Terminal Shuttle',
      averageMinutes: 22, frequencyMinutes: 12, walkingMetres: 180,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      isOperational: true, bidirectional: true,
      operatingHours: { open: '05:30', close: '23:30' },
    },
    // ── T5 Connections — require Elizabeth line or bus ────
    {
      id: 'lhr-rail-t2-t5',
      fromTerminal: 'T2', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'train',
      label: 'Heathrow Express / Elizabeth Line',
      averageMinutes: 11, frequencyMinutes: 6, walkingMetres: 300,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      notes: 'Use Heathrow Central station (T2/T3). Buy ticket or use contactless.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'lhr-rail-t3-t5',
      fromTerminal: 'T3', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'train',
      label: 'Heathrow Express / Elizabeth Line',
      averageMinutes: 13, frequencyMinutes: 6, walkingMetres: 280,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      isOperational: true, bidirectional: true,
    },
    {
      id: 'lhr-rail-t4-t5',
      fromTerminal: 'T4', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'train',
      label: 'Elizabeth Line (via Heathrow Central)',
      averageMinutes: 18, frequencyMinutes: 8, walkingMetres: 350,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      notes: 'T4 has its own Elizabeth Line station. Change at Heathrow Central for T5.',
      isOperational: true, bidirectional: true,
    },
    // ── Airside bus (off-peak / backup) ──────────────────
    {
      id: 'lhr-airside-bus-t2-t5',
      fromTerminal: 'T2', toTerminal: 'T5',
      routeType: 'airside', transportMode: 'bus',
      label: 'Airside Transfer Bus',
      averageMinutes: 45, frequencyMinutes: 30, walkingMetres: 400,
      restrictions: ['ticketed_passengers_only'],
      notes: 'Available to connecting passengers only. Not recommended — allow at least 90 min connection.',
      isOperational: true, bidirectional: true,
      operatingHours: { open: '06:00', close: '22:00' },
    },
  ],
};

// ── CDG — Paris Charles de Gaulle ─────────────────────────
// CDGVAL automated rail (airside) links T1 and T3.
// T2 is the main Air France hub — many sub-terminals (2A–2G).
// For simplicity we model T1, T2, T3.

const CDG: TerminalGraph = {
  airportCode: 'CDG',
  airportName: 'Paris Charles de Gaulle Airport',
  terminals: ['T1', 'T2', 'T3'],
  edges: [
    {
      id: 'cdg-cdgval-t1-t3',
      fromTerminal: 'T1', toTerminal: 'T3',
      routeType: 'airside', transportMode: 'automated_people_mover',
      label: 'CDGVAL Automated Rail',
      averageMinutes: 8, frequencyMinutes: 4, walkingMetres: 80,
      restrictions: [],
      notes: 'Free automated train. Runs 24h between T1, T3, and on-site hotels.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'cdg-cdgval-t1-t2',
      fromTerminal: 'T1', toTerminal: 'T2',
      routeType: 'landside', transportMode: 'automated_people_mover',
      label: 'CDGVAL (via RER/bus transfer)',
      averageMinutes: 15, frequencyMinutes: 4, walkingMetres: 300,
      restrictions: ['requires_security_recheck'],
      notes: 'CDGVAL stops at T2 on the landside ring — you exit secure zone and re-enter.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'cdg-bus-t2-t3',
      fromTerminal: 'T2', toTerminal: 'T3',
      routeType: 'landside', transportMode: 'shuttle_bus',
      label: 'CDG Shuttle Bus',
      averageMinutes: 18, frequencyMinutes: 15, walkingMetres: 250,
      restrictions: ['requires_security_recheck'],
      notes: 'Free CDG shuttle. Board at the terminal departure level.',
      isOperational: true, bidirectional: true,
      operatingHours: { open: '06:00', close: '23:00' },
    },
  ],
};

// ── ORD — Chicago O'Hare International ───────────────────
// Domestic terminals (T1–T3) are all airside-connected underground.
// T5 is the international terminal — requires landside transit.

const ORD: TerminalGraph = {
  airportCode: 'ORD',
  airportName: "Chicago O'Hare International",
  terminals: ['T1', 'T2', 'T3', 'T5'],
  edges: [
    {
      id: 'ord-walk-t1-t2',
      fromTerminal: 'T1', toTerminal: 'T2',
      routeType: 'airside', transportMode: 'walking',
      label: 'Underground Pedway',
      averageMinutes: 8, frequencyMinutes: null, walkingMetres: 600,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'ord-walk-t2-t3',
      fromTerminal: 'T2', toTerminal: 'T3',
      routeType: 'airside', transportMode: 'walking',
      label: 'Underground Pedway',
      averageMinutes: 10, frequencyMinutes: null, walkingMetres: 750,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    {
      id: 'ord-walk-t1-t3',
      fromTerminal: 'T1', toTerminal: 'T3',
      routeType: 'airside', transportMode: 'walking',
      label: 'Underground Pedway',
      averageMinutes: 15, frequencyMinutes: null, walkingMetres: 1200,
      restrictions: [], isOperational: true, bidirectional: true,
    },
    // T5 (International) — ATS people mover, landside
    {
      id: 'ord-ats-t1-t5',
      fromTerminal: 'T1', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'automated_people_mover',
      label: 'O\'Hare ATS (Automated Transit System)',
      averageMinutes: 14, frequencyMinutes: 5, walkingMetres: 200,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      notes: 'Free ATS people mover between domestic and international terminals.',
      isOperational: true, bidirectional: true,
    },
    {
      id: 'ord-ats-t2-t5',
      fromTerminal: 'T2', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'automated_people_mover',
      label: 'O\'Hare ATS',
      averageMinutes: 12, frequencyMinutes: 5, walkingMetres: 180,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      isOperational: true, bidirectional: true,
    },
    {
      id: 'ord-ats-t3-t5',
      fromTerminal: 'T3', toTerminal: 'T5',
      routeType: 'landside', transportMode: 'automated_people_mover',
      label: 'O\'Hare ATS',
      averageMinutes: 10, frequencyMinutes: 5, walkingMetres: 160,
      restrictions: ['requires_security_recheck', 'requires_transit_visa'],
      isOperational: true, bidirectional: true,
    },
  ],
};

// ── Registry ──────────────────────────────────────────────

export const TERMINAL_GRAPHS: Record<string, TerminalGraph> = {
  JFK,
  ATL,
  DEN,
  LHR,
  CDG,
  ORD,
};

export function getTerminalGraph(airportCode: string): TerminalGraph | null {
  return TERMINAL_GRAPHS[airportCode.toUpperCase()] ?? null;
}

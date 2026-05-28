// ══════════════════════════════════════════════════════════
// Dev Mock Data — realistic fake entities for all modules.
// Import from here instead of hitting Supabase in dev mode.
// ══════════════════════════════════════════════════════════

import type { Flight }          from '../types/models/flight';
import type { CrowdReport, CrowdSignal } from '../types/models/crowdReport';
import type { CrowdDelay }      from '../services/navigation/crowdDelayEngine';

// ── Time helpers ─────────────────────────────────────────

const NOW      = new Date();
const inMin    = (m: number) => new Date(NOW.getTime() + m * 60_000);
const inHours  = (h: number) => new Date(NOW.getTime() + h * 3_600_000);
const agoMin   = (m: number) => new Date(NOW.getTime() - m * 60_000);

// ══════════════════════════════════════════════════════════
// FLIGHTS — four connecting pairs across different scenarios
// ══════════════════════════════════════════════════════════

/** Scenario A: UA 123 → DL 456 at JFK T4→T8 (tight, 90 min, international)
 *  Arrival at T4 (Delta / SkyTeam hub), departure from T8 (British Airways).
 *  Transit requires AirTrain (landside) → CRITICAL warning for int'l pax. */
export const FLIGHT_UA123: Flight = {
  id: 'mock_ua123',
  flightNumber: 'UA 123',
  airline: 'United Airlines',
  airlineCode: 'UA',
  origin:      { code: 'LAX', iataCode: 'LAX', name: 'Los Angeles Intl',   city: 'Los Angeles', country: 'US', timezone: 'America/Los_Angeles' },
  destination: { code: 'JFK', iataCode: 'JFK', name: 'John F. Kennedy Intl', city: 'New York',   country: 'US', timezone: 'America/New_York'    },
  departureTerminal: 'T7',
  departureGateCode: 'B14',
  scheduledDeparture: inHours(-5.5),
  scheduledArrival:   inMin(-30),
  estimatedArrival:   inMin(-20),   // 10 min early
  arrivalTerminal:    'T4',
  arrivalGateCode:    'B12',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status: 'arriving',
  codeshareNumbers: [],
  dataSource: 'mock',
  lastSyncedAt: NOW,
  createdAt:    NOW,
  updatedAt:    NOW,
};

export const FLIGHT_DL456: Flight = {
  id: 'mock_dl456',
  flightNumber: 'DL 456',
  airline: 'Delta Air Lines',
  airlineCode: 'DL',
  origin:      { code: 'JFK', iataCode: 'JFK', name: 'John F. Kennedy Intl', city: 'New York', country: 'US', timezone: 'America/New_York' },
  destination: { code: 'LHR', iataCode: 'LHR', name: 'Heathrow Airport',     city: 'London',   country: 'GB', timezone: 'Europe/London'    },
  departureTerminal: 'T8',
  departureGateCode: 'C3',
  scheduledDeparture: inHours(1.5),
  scheduledArrival:   inHours(8.5),
  arrivalTerminal:    '3',
  arrivalGateCode:    'A14',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status: 'scheduled',
  codeshareNumbers: ['VS 201'],
  dataSource: 'mock',
  lastSyncedAt: NOW,
  createdAt:    NOW,
  updatedAt:    NOW,
};

/** Scenario B: AA 200 → B6 300 at ATL (domestic, safe 2 h buffer)
 *  Arrival at T (Main terminal), departure from Concourse F.
 *  Transit via Plane Train (fully airside) → risk=none. */
export const FLIGHT_AA200: Flight = {
  id: 'mock_aa200',
  flightNumber: 'AA 200',
  airline: 'American Airlines',
  airlineCode: 'AA',
  origin:      { code: 'ORD', iataCode: 'ORD', name: "O'Hare International", city: 'Chicago',  country: 'US', timezone: 'America/Chicago'     },
  destination: { code: 'ATL', iataCode: 'ATL', name: 'Hartsfield-Jackson',   city: 'Atlanta',  country: 'US', timezone: 'America/New_York'    },
  departureTerminal: '3',
  departureGateCode: 'H2',
  scheduledDeparture: inHours(-3),
  scheduledArrival:   inMin(-15),
  estimatedArrival:   inMin(-10),
  arrivalTerminal:    'T',
  arrivalGateCode:    'T4',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status: 'landing',
  codeshareNumbers: [],
  dataSource: 'mock',
  lastSyncedAt: NOW,
  createdAt:    NOW,
  updatedAt:    NOW,
};

export const FLIGHT_B6300: Flight = {
  id: 'mock_b6300',
  flightNumber: 'B6 300',
  airline: 'JetBlue Airways',
  airlineCode: 'B6',
  origin:      { code: 'ATL', iataCode: 'ATL', name: 'Hartsfield-Jackson', city: 'Atlanta', country: 'US', timezone: 'America/New_York' },
  destination: { code: 'BOS', iataCode: 'BOS', name: 'Logan International', city: 'Boston', country: 'US', timezone: 'America/New_York' },
  departureTerminal: 'F',
  departureGateCode: 'F22',
  scheduledDeparture: inHours(2),
  scheduledArrival:   inHours(4),
  arrivalTerminal:    'C',
  arrivalGateCode:    'C19',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status: 'scheduled',
  codeshareNumbers: [],
  dataSource: 'mock',
  lastSyncedAt: NOW,
  createdAt:    NOW,
  updatedAt:    NOW,
};

/** Scenario C: UA 500 → UA 600 at DEN (at-risk, 25 min, domestic, delayed inbound)
 *  Arrival at Concourse B, departure from Concourse C.
 *  Transit via underground train (fully airside) → risk=none but TIGHT_WINDOW blocker. */
export const FLIGHT_UA500: Flight = {
  id: 'mock_ua500',
  flightNumber: 'UA 500',
  airline: 'United Airlines',
  airlineCode: 'UA',
  origin:      { code: 'SFO', iataCode: 'SFO', name: 'San Francisco Intl', city: 'San Francisco', country: 'US', timezone: 'America/Los_Angeles' },
  destination: { code: 'DEN', iataCode: 'DEN', name: 'Denver International', city: 'Denver',       country: 'US', timezone: 'America/Denver'     },
  departureTerminal: '3',
  departureGateCode: 'F11',
  scheduledDeparture: inHours(-2.5),
  scheduledArrival:   inMin(5),
  estimatedArrival:   inMin(22),   // 17-min delay
  arrivalTerminal:    'B',
  arrivalGateCode:    'B38',
  departureDelayMinutes: 17,
  arrivalDelayMinutes:   17,
  status: 'delayed',
  codeshareNumbers: [],
  dataSource: 'mock',
  lastSyncedAt: NOW,
  createdAt:    NOW,
  updatedAt:    NOW,
};

export const FLIGHT_UA600: Flight = {
  id: 'mock_ua600',
  flightNumber: 'UA 600',
  airline: 'United Airlines',
  airlineCode: 'UA',
  origin:      { code: 'DEN', iataCode: 'DEN', name: 'Denver International', city: 'Denver',   country: 'US', timezone: 'America/Denver'      },
  destination: { code: 'MIA', iataCode: 'MIA', name: 'Miami International',  city: 'Miami',    country: 'US', timezone: 'America/New_York'   },
  departureTerminal: 'C',
  departureGateCode: 'C54',
  scheduledDeparture: inMin(47),
  scheduledArrival:   inHours(4.8),
  arrivalTerminal:    'D',
  arrivalGateCode:    'D31',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status: 'scheduled',
  codeshareNumbers: [],
  dataSource: 'mock',
  lastSyncedAt: NOW,
  createdAt:    NOW,
  updatedAt:    NOW,
};

// ── Convenience pairs ─────────────────────────────────────

export const MOCK_CONNECTIONS = [
  {
    id:       'conn_a',
    label:    'JFK: UA 123 → DL 456',
    scenario: 'tight' as const,
    inbound:  FLIGHT_UA123,
    outbound: FLIGHT_DL456,
    inboundNum:  'UA 123',
    outboundNum: 'DL 456',
    date:     NOW.toISOString().slice(0, 10),
  },
  {
    id:       'conn_b',
    label:    'ATL: AA 200 → B6 300',
    scenario: 'safe' as const,
    inbound:  FLIGHT_AA200,
    outbound: FLIGHT_B6300,
    inboundNum:  'AA 200',
    outboundNum: 'B6 300',
    date:     NOW.toISOString().slice(0, 10),
  },
  {
    id:       'conn_c',
    label:    'DEN: UA 500 → UA 600',
    scenario: 'at_risk' as const,
    inbound:  FLIGHT_UA500,
    outbound: FLIGHT_UA600,
    inboundNum:  'UA 500',
    outboundNum: 'UA 600',
    date:     NOW.toISOString().slice(0, 10),
  },
];

// ══════════════════════════════════════════════════════════
// CROWD REPORTS — five realistic active reports at JFK T4
// ══════════════════════════════════════════════════════════

export const MOCK_CROWD_REPORTS: CrowdReport[] = [
  {
    id:            'cr_001',
    isAnonymous:   true,
    airportCode:   'JFK',
    locationType:  'security',
    locationLabel: 'Security Checkpoint B (Pre-check + General)',
    type:          'security_slow',
    severity:      4,
    upvotes:       11,
    downvotes:     1,
    isVerified:    true,
    createdAt:     agoMin(8),
    expiresAt:     inHours(1),
    isActive:      true,
  },
  {
    id:            'cr_002',
    isAnonymous:   false,
    airportCode:   'JFK',
    locationType:  'gate',
    locationLabel: 'Gate B12 boarding area',
    type:          'crowded',
    severity:      3,
    upvotes:       5,
    downvotes:     0,
    isVerified:    false,
    createdAt:     agoMin(14),
    expiresAt:     inHours(1),
    isActive:      true,
  },
  {
    id:            'cr_003',
    isAnonymous:   true,
    airportCode:   'JFK',
    locationType:  'passport_control',
    locationLabel: 'T4 Customs & Border Protection Hall',
    type:          'customs_slow',
    severity:      5,
    upvotes:       22,
    downvotes:     2,
    isVerified:    true,
    createdAt:     agoMin(4),
    expiresAt:     inHours(2),
    isActive:      true,
  },
  {
    id:            'cr_004',
    isAnonymous:   true,
    airportCode:   'JFK',
    locationType:  'elevator',
    locationLabel: 'Elevator A — Central Hall (B→C connector)',
    type:          'elevator_broken',
    severity:      3,
    upvotes:       7,
    downvotes:     0,
    isVerified:    false,
    createdAt:     agoMin(25),
    expiresAt:     inHours(3),
    isActive:      true,
  },
  {
    id:            'cr_005',
    isAnonymous:   false,
    airportCode:   'JFK',
    locationType:  'gate',
    locationLabel: 'Gate C3 area',
    type:          'clear_path',
    severity:      1,
    upvotes:       4,
    downvotes:     0,
    isVerified:    false,
    createdAt:     agoMin(3),
    expiresAt:     inHours(1),
    isActive:      true,
  },
];

// ══════════════════════════════════════════════════════════
// CROWD SIGNALS — aggregated from the reports above
// (mirrors what get_crowd_signals() RPC would return)
// ══════════════════════════════════════════════════════════

export const MOCK_CROWD_SIGNALS: CrowdSignal[] = [
  {
    airportCode:       'JFK',
    locationType:      'security',
    locationLabel:     'Security Checkpoint B',
    reportCount:       8,
    avgSeverity:       4.1,
    dominantType:      'security_slow',
    positiveCount:     0,
    negativeCount:     8,
    totalUpvotes:      18,
    hasVerifiedReport: true,
    latestReportAt:    agoMin(4),
    earliestExpiry:    inHours(1),
  },
  {
    airportCode:       'JFK',
    locationType:      'passport_control',
    locationLabel:     'T4 Customs & Border Protection',
    reportCount:       12,
    avgSeverity:       4.8,
    dominantType:      'customs_slow',
    positiveCount:     0,
    negativeCount:     12,
    totalUpvotes:      31,
    hasVerifiedReport: true,
    latestReportAt:    agoMin(2),
    earliestExpiry:    inHours(2),
  },
  {
    airportCode:       'JFK',
    locationType:      'gate',
    locationLabel:     'Gate B12 boarding area',
    reportCount:       3,
    avgSeverity:       2.7,
    dominantType:      'crowded',
    positiveCount:     0,
    negativeCount:     3,
    totalUpvotes:      5,
    hasVerifiedReport: false,
    latestReportAt:    agoMin(14),
    earliestExpiry:    inHours(1),
  },
  {
    airportCode:       'JFK',
    locationType:      'elevator',
    locationLabel:     'Elevator A — Central Hall',
    reportCount:       4,
    avgSeverity:       3.0,
    dominantType:      'elevator_broken',
    positiveCount:     0,
    negativeCount:     4,
    totalUpvotes:      7,
    hasVerifiedReport: false,
    latestReportAt:    agoMin(25),
    earliestExpiry:    inHours(3),
  },
  {
    airportCode:       'JFK',
    locationType:      'gate',
    locationLabel:     'Gate C3 area',
    reportCount:       4,
    avgSeverity:       1.0,
    dominantType:      'clear_path',
    positiveCount:     4,
    negativeCount:     0,
    totalUpvotes:      4,
    hasVerifiedReport: false,
    latestReportAt:    agoMin(3),
    earliestExpiry:    inHours(1),
  },
];

// ══════════════════════════════════════════════════════════
// PRE-COMPUTED CROWD DELAYS  (so useCrowdReports can return
// these instantly without calling computeCrowdDelays)
// ══════════════════════════════════════════════════════════

export const MOCK_CROWD_DELAYS: CrowdDelay[] = [
  {
    locationLabel: 'T4 Customs & Border Protection',
    locationType:  'passport_control',
    dominantType:  'customs_slow',
    delayMinutes:  18,
    avgSeverity:   4.8,
    reportCount:   12,
    hasVerified:   true,
    isPositive:    false,
  },
  {
    locationLabel: 'Security Checkpoint B',
    locationType:  'security',
    dominantType:  'security_slow',
    delayMinutes:  11,
    avgSeverity:   4.1,
    reportCount:   8,
    hasVerified:   true,
    isPositive:    false,
  },
  {
    locationLabel: 'Gate B12 boarding area',
    locationType:  'gate',
    dominantType:  'crowded',
    delayMinutes:  3,
    avgSeverity:   2.7,
    reportCount:   3,
    hasVerified:   false,
    isPositive:    false,
  },
  {
    locationLabel: 'Elevator A — Central Hall',
    locationType:  'elevator',
    dominantType:  'elevator_broken',
    delayMinutes:  4,
    avgSeverity:   3.0,
    reportCount:   4,
    hasVerified:   false,
    isPositive:    false,
  },
  {
    locationLabel: 'Gate C3 area',
    locationType:  'gate',
    dominantType:  'clear_path',
    delayMinutes:  0,
    avgSeverity:   1.0,
    reportCount:   4,
    hasVerified:   false,
    isPositive:    true,
  },
];

// ══════════════════════════════════════════════════════════
// MOCK USER — dev auto-login
// ══════════════════════════════════════════════════════════

export const MOCK_USER = {
  id:        'dev-user-001',
  email:     'dev@airportwaze.app',
  fullName:  'Dev Tester',
  avatarUrl: null,
  createdAt: new Date('2024-01-01'),
  settings:  {
    navigationMode:      'walking' as const,
    alertsEnabled:       true,
    connectionThreshold: 30,
    units:               'metric' as const,
    preferredAirports:   ['JFK', 'LAX', 'ATL'],
  },
};

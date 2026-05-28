// ══════════════════════════════════════════════════════════
// Mock data — realistic JFK Terminal 4 gate-to-gate route.
// Used while the real navigation graph isn't loaded yet.
// Replace with poisService.getFullGraph(airportId) in prod.
// ══════════════════════════════════════════════════════════

import type { Flight } from '../../types/models/flight';
import type { ConnectionRoute, EnrichedStep } from './connectionEngine';

// ── Mock flights ──────────────────────────────────────────

const NOW = new Date();
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000);

export const MOCK_INBOUND_FLIGHT: Flight = {
  id:                    'UA123_mock',
  flightNumber:          'UA 123',
  airline:               'United Airlines',
  airlineCode:           'UA',
  origin:                { code: 'LAX', iataCode: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', timezone: 'America/Los_Angeles' },
  destination:           { code: 'JFK', iataCode: 'JFK', name: 'JFK International', city: 'New York',    country: 'US', timezone: 'America/New_York'    },
  departureTerminal:     '7',
  departureGateCode:     'B14',
  scheduledDeparture:    inHours(-5.5),
  scheduledArrival:      inHours(-0.5),
  estimatedArrival:      inHours(-0.35),   // 9 min early
  arrivalTerminal:       '4',
  arrivalGateCode:       'B12',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status:                'arriving',
  codeshareNumbers:      [],
  dataSource:            'mock',
  lastSyncedAt:          new Date(),
  createdAt:             new Date(),
  updatedAt:             new Date(),
};

export const MOCK_OUTBOUND_FLIGHT: Flight = {
  id:                    'DL456_mock',
  flightNumber:          'DL 456',
  airline:               'Delta Air Lines',
  airlineCode:           'DL',
  origin:                { code: 'JFK', iataCode: 'JFK', name: 'JFK International', city: 'New York',    country: 'US', timezone: 'America/New_York'  },
  destination:           { code: 'LHR', iataCode: 'LHR', name: 'Heathrow Airport',  city: 'London',      country: 'GB', timezone: 'Europe/London'     },
  departureTerminal:     '4',
  departureGateCode:     'C3',
  scheduledDeparture:    inHours(1.5),
  scheduledArrival:      inHours(8.5),
  arrivalTerminal:       '3',
  arrivalGateCode:       'A14',
  departureDelayMinutes: 0,
  arrivalDelayMinutes:   0,
  status:                'scheduled',
  codeshareNumbers:      ['VS 201'],
  dataSource:            'mock',
  lastSyncedAt:          new Date(),
  createdAt:             new Date(),
  updatedAt:             new Date(),
};

// ── Mock route: JFK T4 Gate B12 → Gate C3 ────────────────
// Total: ~340 m · ~7 min walk · no security re-check needed

const STEPS: EnrichedStep[] = [
  {
    stepIndex:         0,
    instruction:       'Head straight along Concourse B',
    landmark:          'Pass Gates B10 and B11 on your right',
    distanceMeters:    110,
    direction:         'straight',
    cumulativeSeconds: 79,
    cumulativeMinutes: 2,
    isLast:            false,
    coordinates:       { lat: 40.6413, lng: -73.7781 },
  },
  {
    stepIndex:         1,
    instruction:       'Turn left at the Information Desk',
    landmark:          'Blue "i" overhead sign, coffee kiosk on left',
    distanceMeters:    15,
    direction:         'left',
    cumulativeSeconds: 90,
    cumulativeMinutes: 2,
    isLast:            false,
    coordinates:       { lat: 40.6410, lng: -73.7778 },
  },
  {
    stepIndex:         2,
    instruction:       'Walk through the Central Hall toward Gate C',
    landmark:          'Large "Gate C →" overhead sign',
    distanceMeters:    90,
    direction:         'straight',
    cumulativeSeconds: 155,
    cumulativeMinutes: 3,
    isLast:            false,
    coordinates:       { lat: 40.6408, lng: -73.7773 },
  },
  {
    stepIndex:         3,
    instruction:       'Take Elevator A to Level 3 — Departures',
    landmark:          'Silver elevator doors, press button "3"',
    distanceMeters:    0,
    direction:         'elevator_up',
    cumulativeSeconds: 215,
    cumulativeMinutes: 4,
    isLast:            false,
    coordinates:       { lat: 40.6406, lng: -73.7770 },
  },
  {
    stepIndex:         4,
    instruction:       'Exit elevator and turn right',
    landmark:          '"Gate C" sign directly ahead',
    distanceMeters:    10,
    direction:         'right',
    cumulativeSeconds: 230,
    cumulativeMinutes: 4,
    isLast:            false,
    coordinates:       { lat: 40.6406, lng: -73.7768 },
  },
  {
    stepIndex:         5,
    instruction:       'Continue straight past Gates C1 and C2',
    landmark:          'Duty-free shop on right, gates on left',
    distanceMeters:    80,
    direction:         'straight',
    cumulativeSeconds: 307,
    cumulativeMinutes: 6,
    isLast:            false,
    coordinates:       { lat: 40.6404, lng: -73.7764 },
  },
  {
    stepIndex:         6,
    instruction:       'Arrive at Gate C3 — your departure gate',
    landmark:          'Gate C3 display board — check for your flight',
    distanceMeters:    35,
    direction:         'straight',
    cumulativeSeconds: 370,
    cumulativeMinutes: 7,
    isLast:            true,
    coordinates:       { lat: 40.6403, lng: -73.7761 },
  },
];

export const MOCK_ROUTE: ConnectionRoute = {
  steps:               STEPS,
  totalDistanceMeters: 340,
  totalTimeSeconds:    370,
  totalTimeMinutes:    7,
  congestionFactor:    1.1,
  requiresSecurity:    false,
  requiresCustoms:     false,
  requiresElevator:    true,
  mode:                'walking',
};

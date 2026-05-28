export const SUPPORTED_AIRPORTS = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York',    country: 'US' },
  { code: 'LHR', name: 'Heathrow Airport',              city: 'London',       country: 'GB' },
  { code: 'CDG', name: 'Charles de Gaulle',             city: 'Paris',        country: 'FR' },
  { code: 'DXB', name: 'Dubai International',           city: 'Dubai',        country: 'AE' },
  { code: 'LAX', name: 'Los Angeles International',     city: 'Los Angeles',  country: 'US' },
  { code: 'SIN', name: 'Changi Airport',                city: 'Singapore',    country: 'SG' },
  { code: 'ORD', name: "O'Hare International",          city: 'Chicago',      country: 'US' },
  { code: 'HND', name: 'Haneda Airport',                city: 'Tokyo',        country: 'JP' },
  { code: 'FRA', name: 'Frankfurt Airport',             city: 'Frankfurt',    country: 'DE' },
  { code: 'AMS', name: 'Amsterdam Schiphol',            city: 'Amsterdam',    country: 'NL' },
  { code: 'HKG', name: 'Hong Kong International',       city: 'Hong Kong',    country: 'HK' },
  { code: 'NRT', name: 'Narita International',          city: 'Tokyo',        country: 'JP' },
  { code: 'IST', name: 'Istanbul Airport',              city: 'Istanbul',     country: 'TR' },
  { code: 'DFW', name: 'Dallas Fort Worth International', city: 'Dallas',     country: 'US' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', country: 'US' },
] as const;

export type SupportedAirportCode = typeof SUPPORTED_AIRPORTS[number]['code'];

// Minimum recommended connection time (minutes) per airport
export const MIN_CONNECTION_MINUTES: Record<string, number> = {
  JFK: 60,
  LHR: 75,   // multiple terminals, large footprint
  CDG: 90,   // very large, international transfers notorious for delays
  DXB: 60,   // T1↔T3 transfers need bus; within same terminal 45 min ok
  LAX: 60,
  SIN: 60,   // T4 connections need 75+
  ORD: 60,
  HND: 45,
  FRA: 60,   // large, long walks, T1↔T2 Skyline
  AMS: 50,   // single terminal but Schengen zone changes add time
  HKG: 60,
  NRT: 75,   // T1↔T2 bus + security; generally slow
  IST: 60,   // single mega-terminal; security queues can be slow
  DFW: 60,   // international: 90 min (customs at D)
  ATL: 60,   // international → domestic: 90 min (customs + re-security)
};

// ─── AviationStack Flight Service ─────────────────────────────────────────────
// Free tier: 100 calls/month. Quota is tracked by quotaManager.
// Falls back to null (→ static database) when quota is exhausted or key is missing.

import type { Flight, FlightStatus, Airport } from '../../types/flight';
import { canUseAviationStack, getQuotaStatus } from '../aviation/quotaManager';

const BASE = 'https://api.aviationstack.com/v1';

// Raw shape returned by AviationStack
interface RawFlight {
  flight: { iata: string };
  airline: { name: string; iata: string };
  departure: {
    airport: string; iata: string; icao: string;
    terminal: string; gate: string;
    scheduled: string; estimated: string; actual: string;
    delay: number;
  };
  arrival: {
    airport: string; iata: string; icao: string;
    terminal: string; gate: string;
    scheduled: string; estimated: string; actual: string;
  };
  flight_status: string;
  aircraft?: { registration: string };
}

const STATUS_MAP: Record<string, FlightStatus> = {
  scheduled: 'scheduled',
  active:    'departed',
  landed:    'landed',
  cancelled: 'cancelled',
  incident:  'diverted',
  diverted:  'diverted',
};

function toAirport(raw: RawFlight['departure'] | RawFlight['arrival']): Airport {
  return {
    code: raw.iata, icao: raw.icao ?? '',
    name: raw.airport, city: raw.airport,
    country: '', timezone: '', coordinates: { lat: 0, lng: 0 },
  };
}

function mapFlight(raw: RawFlight): Flight {
  return {
    id:                  `${raw.flight.iata}_${raw.departure.scheduled}`,
    flightNumber:        raw.flight.iata,
    airline:             raw.airline.name,
    airlineCode:         raw.airline.iata,
    origin:              toAirport(raw.departure),
    destination:         toAirport(raw.arrival),
    scheduledDeparture:  new Date(raw.departure.scheduled),
    estimatedDeparture:  raw.departure.estimated ? new Date(raw.departure.estimated) : undefined,
    actualDeparture:     raw.departure.actual     ? new Date(raw.departure.actual)     : undefined,
    scheduledArrival:    new Date(raw.arrival.scheduled),
    estimatedArrival:    raw.arrival.estimated    ? new Date(raw.arrival.estimated)    : undefined,
    actualArrival:       raw.arrival.actual       ? new Date(raw.arrival.actual)       : undefined,
    gate:                raw.departure.gate     ?? '',
    terminal:            raw.departure.terminal ?? '',
    status:              STATUS_MAP[raw.flight_status] ?? 'scheduled',
    delayMinutes:        raw.departure.delay ?? 0,
  };
}

async function fetchFlights(params: Record<string, string>): Promise<Flight[]> {
  const key = process.env.EXPO_PUBLIC_AVIATION_STACK_KEY;
  if (!key) throw new Error('No AviationStack key configured');
  const qs  = new URLSearchParams({ access_key: key, ...params });
  const res = await fetch(`${BASE}/flights?${qs}`);
  if (!res.ok) throw new Error(`AviationStack error: ${res.status}`);
  const json = await res.json();
  return (json.data ?? []).map(mapFlight);
}

export const flightService = {
  /**
   * Fetch flight by number. Returns null if:
   * - No API key configured
   * - Monthly quota exhausted (100 calls free)
   * - API error
   * Caller should fall back to static database on null.
   */
  async getByNumber(flightNumber: string, date?: string): Promise<Flight | null> {
    const allowed = await canUseAviationStack();
    if (!allowed) return null;
    try {
      const flights = await fetchFlights({
        flight_iata: flightNumber,
        ...(date ? { flight_date: date } : {}),
      });
      return flights[0] ?? null;
    } catch {
      return null;
    }
  },

  async getByRoute(origin: string, destination: string, date: string): Promise<Flight[]> {
    const allowed = await canUseAviationStack();
    if (!allowed) return [];
    try {
      return await fetchFlights({ dep_iata: origin, arr_iata: destination, flight_date: date });
    } catch {
      return [];
    }
  },

  /** Returns current quota status without consuming a call. */
  getQuota: getQuotaStatus,
};

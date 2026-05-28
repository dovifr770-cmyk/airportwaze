import type { FlightStatusType, ConnectionRisk, TrackingRole, FlightChangeType } from '../database';

export type { FlightStatusType, ConnectionRisk, TrackingRole, FlightChangeType };

// ── Airport reference (lightweight, embedded in flights) ──

export interface AirportRef {
  code: string;     // IATA
  name: string;
  city: string;
  country: string;
  timezone: string;
}

// ── Core flight ───────────────────────────────────────────

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  aircraftType?: string;
  aircraftRegistration?: string;
  // Route
  origin: AirportRef;
  destination: AirportRef;
  // Departure
  departureTerminal?: string;
  departureGateId?: string;
  departureGateCode?: string;
  scheduledDeparture: Date;
  estimatedDeparture?: Date;
  actualDeparture?: Date;
  departureDelayMinutes: number;
  // Arrival
  arrivalTerminal?: string;
  arrivalGateId?: string;
  arrivalGateCode?: string;
  scheduledArrival: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  arrivalDelayMinutes: number;
  // Status
  status: FlightStatusType;
  cancellationReason?: string;
  baggageClaim?: string;
  codeshareNumbers: string[];
  // Meta
  dataSource: string;
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Effective times (resolved departure/arrival for display) ─

export function effectiveDeparture(f: Flight): Date {
  return f.actualDeparture ?? f.estimatedDeparture ?? f.scheduledDeparture;
}

export function effectiveArrival(f: Flight): Date {
  return f.actualArrival ?? f.estimatedArrival ?? f.scheduledArrival;
}

// ── User-tracked flight ───────────────────────────────────

export interface TrackedFlight {
  id: string;
  userId: string;
  flightId?: string;
  flightNumber: string;
  flightDate: string;       // "YYYY-MM-DD"
  role: TrackingRole;
  notes?: string;
  notifyGateChanges: boolean;
  notifyDelays: boolean;
  notifyBoarding: boolean;
  notifyCancellation: boolean;
  addedAt: Date;
  flight?: Flight;          // populated when joined
}

// ── User connection (inbound + outbound pair) ─────────────

export interface UserConnection {
  id: string;
  userId: string;
  // Inbound
  inboundFlightId?: string;
  inboundFlightNumber: string;
  // Outbound
  outboundFlightId?: string;
  outboundFlightNumber: string;
  // Context
  connectionDate: string;
  layoverAirportCode: string;
  // Computed risk
  connectionTimeMinutes?: number;
  walkingTimeMinutes?: number;
  bufferMinutes?: number;
  riskLevel?: ConnectionRisk;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Populated when joined
  inboundFlight?: Flight;
  outboundFlight?: Flight;
}

// ── Flight change event ───────────────────────────────────

export interface FlightChange {
  id: string;
  flightId: string;
  changeType: FlightChangeType;
  previousValue?: string;
  newValue?: string;
  changedAt: Date;
  notifiedCount: number;
}

// ── Connection analysis ───────────────────────────────────

export interface ConnectionAnalysis {
  inbound: Flight;
  outbound: Flight;
  connectionTimeMinutes: number;
  walkingTimeMinutes: number;
  bufferMinutes: number;
  riskLevel: ConnectionRisk;
  isTight: boolean;
  isAtRisk: boolean;
  isMissed: boolean;
}

export function analyzeConnection(
  inbound: Flight,
  outbound: Flight,
  walkingTimeMinutes: number,
): ConnectionAnalysis {
  const arrivalMs  = effectiveArrival(inbound).getTime();
  const departMs   = effectiveDeparture(outbound).getTime();
  const connMin    = Math.round((departMs - arrivalMs) / 60_000);
  const bufferMin  = connMin - walkingTimeMinutes;

  let riskLevel: ConnectionRisk;
  if (connMin <= 0 || bufferMin < 0) riskLevel = 'impossible';
  else if (bufferMin < 10)           riskLevel = 'at_risk';
  else if (bufferMin < 25)           riskLevel = 'tight';
  else                               riskLevel = 'safe';

  return {
    inbound,
    outbound,
    connectionTimeMinutes: connMin,
    walkingTimeMinutes,
    bufferMinutes: bufferMin,
    riskLevel,
    isTight:   riskLevel === 'tight',
    isAtRisk:  riskLevel === 'at_risk',
    isMissed:  riskLevel === 'impossible',
  };
}

// ── Status display helpers ────────────────────────────────

export const STATUS_LABELS: Record<FlightStatusType, string> = {
  scheduled:  'On time',
  boarding:   'Boarding',
  gate_closed:'Gate closed',
  departed:   'Departed',
  delayed:    'Delayed',
  cancelled:  'Cancelled',
  diverted:   'Diverted',
  landed:     'Landed',
  arriving:   'Arriving',
};

export const STATUS_COLORS: Record<FlightStatusType, { bg: string; text: string }> = {
  scheduled:   { bg: '#1e3a5f', text: '#60a5fa' },
  boarding:    { bg: '#14532d', text: '#4ade80' },
  gate_closed: { bg: '#451a03', text: '#fb923c' },
  departed:    { bg: '#312e81', text: '#a78bfa' },
  delayed:     { bg: '#7c2d12', text: '#fb923c' },
  cancelled:   { bg: '#7f1d1d', text: '#f87171' },
  diverted:    { bg: '#422006', text: '#fbbf24' },
  landed:      { bg: '#064e3b', text: '#34d399' },
  arriving:    { bg: '#1e3a8a', text: '#93c5fd' },
};

export const RISK_COLORS: Record<ConnectionRisk, { bg: string; text: string; border: string }> = {
  safe:       { bg: '#14532d', text: '#4ade80',  border: '#166534' },
  tight:      { bg: '#7c2d12', text: '#fb923c',  border: '#9a3412' },
  at_risk:    { bg: '#7f1d1d', text: '#f87171',  border: '#991b1b' },
  impossible: { bg: '#1c1917', text: '#78716c',  border: '#292524' },
};

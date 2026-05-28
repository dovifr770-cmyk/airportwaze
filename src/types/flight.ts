export type FlightStatus =
  | 'scheduled'
  | 'boarding'
  | 'gate_closed'
  | 'departed'
  | 'delayed'
  | 'cancelled'
  | 'diverted'
  | 'landed';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface Airport {
  code: string;   // IATA e.g. "JFK"
  icao: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: GeoCoords;
}

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  airlineCode: string;
  origin: Airport;
  destination: Airport;
  scheduledDeparture: Date;
  estimatedDeparture?: Date;
  actualDeparture?: Date;
  scheduledArrival: Date;
  estimatedArrival?: Date;
  actualArrival?: Date;
  gate: string;
  terminal: string;
  status: FlightStatus;
  aircraft?: string;
  delayMinutes?: number;
  baggage?: string;
}

export interface ConnectionFlights {
  inbound: Flight;
  outbound: Flight;
  connectionTimeMinutes: number;
  isTight: boolean;     // < 45 min buffer
  isAtRisk: boolean;    // < 20 min buffer
}

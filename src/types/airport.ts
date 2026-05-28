export type ParkingType = 'economy' | 'standard' | 'express' | 'valet' | 'covered';

export type ParkingFeature =
  | 'ev_charging'
  | 'covered'
  | '24h_shuttle'
  | 'disabled_spaces'
  | 'security_cameras'
  | 'car_wash';

export type AmenityType =
  | 'restaurant'
  | 'cafe'
  | 'shop'
  | 'lounge'
  | 'atm'
  | 'pharmacy'
  | 'hotel'
  | 'chapel'
  | 'nursery'
  | 'shower';

export interface Floor {
  level: number;
  name: string;
  mapUrl?: string;
}

export interface Gate {
  id: string;
  code: string;
  terminalId: string;
  floor: number;
  coordinates: { x: number; y: number; lat?: number; lng?: number };
  status: 'open' | 'closed' | 'boarding' | 'departed';
  amenities: string[];
}

export interface Terminal {
  id: string;
  name: string;
  code: string;
  floors: Floor[];
  gates: Gate[];
}

export interface ParkingLot {
  id: string;
  name: string;
  code: string;
  type: ParkingType;
  distanceToTerminalMeters: number;
  walkingTimeMinutes: number;
  ratePerDay: number;
  ratePerHour: number;
  totalSpaces: number;
  availableSpaces?: number;
  coordinates: { lat: number; lng: number };
  features: ParkingFeature[];
}

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  terminal: string;
  floor: number;
  hours?: string;
  description?: string;
}

export interface AirportMap {
  airportCode: string;
  terminals: Terminal[];
  parkingLots: ParkingLot[];
  amenities: Amenity[];
}

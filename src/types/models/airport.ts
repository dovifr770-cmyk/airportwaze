// ── Airport, Terminal, Floor ─────────────────────────────
// Application-layer types (not raw DB rows — dates are Date objects, etc.)

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface IndoorCoords {
  x: number;   // 0–1 normalised to floor plan width
  y: number;   // 0–1 normalised to floor plan height
}

export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface Airport {
  id: string;
  iataCode: string;
  icaoCode?: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: GeoCoords;
  isSupported: boolean;
  terminals: Terminal[];
  createdAt: Date;
}

export interface Terminal {
  id: string;
  airportId: string;
  name: string;
  code: string;
  floors: TerminalFloor[];
  createdAt: Date;
}

export interface TerminalFloor {
  id: string;
  terminalId: string;
  level: number;
  name: string;
  mapSvgUrl?: string;
  mapImgUrl?: string;
  boundingBox?: BoundingBox;
  createdAt: Date;
}

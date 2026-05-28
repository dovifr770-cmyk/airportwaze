import type { PoiType, GateStatus, GateType } from '../database';
import type { GeoCoords, IndoorCoords } from './airport';

export type { PoiType, GateStatus, GateType };

// ── Point of Interest ────────────────────────────────────

export interface Poi {
  id: string;
  airportId: string;
  terminalId?: string;
  floorId?: string;
  name: string;
  shortName?: string;
  type: PoiType;
  floorLevel: number;
  coordinates?: GeoCoords;
  indoorCoords?: IndoorCoords;
  description?: string;
  hours?: string;
  phone?: string;
  website?: string;
  isAccessible: boolean;
  isActive: boolean;
  features: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ── Gate (extends POI) ───────────────────────────────────

export interface Gate {
  id: string;
  poiId?: string;
  airportId: string;
  terminalId?: string;
  floorId?: string;
  code: string;           // "A1"
  fullCode?: string;      // "JFK-T4-A1"
  floorLevel: number;
  status: GateStatus;
  type: GateType;
  adjacentGateIds: string[];
  airlines: string[];
  coordinates?: GeoCoords;
  indoorCoords?: IndoorCoords;
  createdAt: Date;
  updatedAt: Date;
}

// ── Navigation graph edge ─────────────────────────────────

export type StepDirection =
  | 'straight' | 'left' | 'right'
  | 'elevator_up' | 'elevator_down'
  | 'escalator_up' | 'escalator_down'
  | 'moving_walkway';

export interface RouteStep {
  instruction: string;
  landmark?: string;
  distanceMeters: number;
  direction: StepDirection;
  coordinates?: GeoCoords;
}

export interface NavigationEdge {
  id: string;
  airportId: string;
  fromPoiId: string;
  toPoiId: string;
  distanceMeters: number;
  walkSeconds: number;
  runSeconds?: number;
  wheelchairSeconds?: number;
  requiresSecurity: boolean;
  requiresCustoms: boolean;
  usesElevator: boolean;
  usesEscalator: boolean;
  usesMovingWalkway: boolean;
  isAccessible: boolean;
  steps: RouteStep[];
  notes?: string;
  createdAt: Date;
}

// ── Computed navigation route ─────────────────────────────

export type NavigationMode = 'walking' | 'running' | 'wheelchair';

export interface NavigationRoute {
  id: string;
  from: Poi;
  to: Poi;
  distanceMeters: number;
  estimatedMinutes: number;
  congestionFactor: number;         // 1.0 = normal, 1.5 = crowded
  isWheelchairAccessible: boolean;
  requiresSecurityRe: boolean;
  requiresCustoms: boolean;
  steps: RouteStep[];
  mode: NavigationMode;
  calculatedAt: Date;
}

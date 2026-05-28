import type { NavigationMode } from './auth';

export type { NavigationMode };

export type RoutePointType =
  | 'gate'
  | 'security'
  | 'customs'
  | 'baggage'
  | 'lounge'
  | 'shop'
  | 'restroom'
  | 'elevator';

export type StepDirection =
  | 'straight'
  | 'left'
  | 'right'
  | 'elevator_up'
  | 'elevator_down'
  | 'escalator_up'
  | 'escalator_down';

export interface RoutePoint {
  id: string;
  name: string;
  type: RoutePointType;
  terminal: string;
  floor: number;
  coordinates: { lat: number; lng: number };
}

export interface RouteStep {
  instruction: string;
  landmark?: string;
  distance: number;       // metres
  direction: StepDirection;
  coordinates: { lat: number; lng: number };
}

export interface NavigationRoute {
  id: string;
  from: RoutePoint;
  to: RoutePoint;
  distance: number;                 // metres
  estimatedWalkingTime: number;     // minutes
  congestionFactor: number;         // 1.0 = normal, 1.5 = crowded
  steps: RouteStep[];
  isWheelchairAccessible: boolean;
  updatedAt: Date;
}

export type CrowdsourceType =
  | 'queue_long'
  | 'queue_short'
  | 'gate_closed'
  | 'delay'
  | 'crowded'
  | 'empty';

export interface CrowdsourceReport {
  id: string;
  type: CrowdsourceType;
  location: string;   // gate ID or area label
  airportCode: string;
  userId: string;
  confidence: number; // upvote count
  createdAt: Date;
  expiresAt: Date;
}

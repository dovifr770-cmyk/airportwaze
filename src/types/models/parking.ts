import type { ParkingFacilityType, ParkingTier } from '../database';
import type { GeoCoords } from './airport';

export type { ParkingFacilityType, ParkingTier };

// ── Parking zone ──────────────────────────────────────────

export type ParkingFeature =
  | 'ev_charging'
  | 'covered'
  | 'shuttle_24h'
  | 'disabled_spaces'
  | 'security_cameras'
  | 'car_wash'
  | 'cctv'
  | 'motorcycle';

export interface ParkingZone {
  id: string;
  airportId: string;
  airportCode: string;
  name: string;
  shortCode?: string;
  description?: string;
  type: ParkingFacilityType;
  tier: ParkingTier;
  coordinates?: GeoCoords;
  address?: string;
  primaryTerminalId?: string;
  distanceToTerminalMeters?: number;
  walkingTimeMinutes?: number;
  shuttleTimeMinutes?: number;
  shuttleFrequencyMinutes?: number;
  // Capacity
  totalSpaces: number;
  totalDisabledSpaces: number;
  totalEvSpaces: number;
  totalOversizedSpaces: number;
  // Live availability
  availableSpaces?: number;
  availableDisabled?: number;
  availableEv?: number;
  availabilitySource?: string;
  availabilityUpdatedAt?: Date;
  // Pricing
  currency: string;
  ratePerHour?: number;
  ratePerDay?: number;
  ratePerWeek?: number;
  rateMonthly?: number;
  isFree: boolean;
  freeMinutes?: number;
  maxStayHours?: number;
  features: ParkingFeature[];
  // Booking
  requiresBooking: boolean;
  bookingUrl?: string;
  bookingProvider?: string;
  // Status
  isActive: boolean;
  isOpen24h: boolean;
  operatingHours?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  // Computed
  pricingTiers?: ParkingPricingTier[];
}

export interface ParkingPricingTier {
  id: string;
  parkingZoneId: string;
  label: string;
  minHours: number;
  maxHours?: number;
  ratePerHour?: number;
  flatRate?: number;
  displayOrder: number;
  createdAt: Date;
}

// ── Availability snapshot ─────────────────────────────────

export interface ParkingSnapshot {
  id: string;
  parkingZoneId: string;
  airportCode: string;
  availableSpaces: number;
  totalSpaces: number;
  occupancyPct: number;
  recordedAt: Date;
}

// ── Availability summary (from view) ─────────────────────

export interface ParkingAvailabilitySummary {
  airportCode: string;
  tier: ParkingTier;
  zoneCount: number;
  totalSpaces: number;
  availableSpaces: number;
  availabilityPct: number;
  cheapestDayRate?: number;
  priesiestDayRate?: number;
}

// ── Helpers ───────────────────────────────────────────────

export function occupancyLevel(zone: ParkingZone): 'full' | 'low' | 'medium' | 'high' {
  if (zone.availableSpaces === undefined) return 'medium';
  if (zone.availableSpaces === 0) return 'full';
  const pct = zone.availableSpaces / zone.totalSpaces;
  if (pct < 0.1) return 'low';
  if (pct < 0.4) return 'medium';
  return 'high';
}

export function formatParkingRate(zone: ParkingZone): string {
  if (zone.isFree) return 'Free';
  if (zone.ratePerDay) return `$${zone.ratePerDay.toFixed(0)}/day`;
  if (zone.ratePerHour) return `$${zone.ratePerHour.toFixed(0)}/hr`;
  return 'See rates';
}

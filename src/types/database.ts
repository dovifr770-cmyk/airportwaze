// ══════════════════════════════════════════════════════════
// Supabase database types — mirrors the PostgreSQL schema.
// Re-generate with: npm run supabase:types
// ══════════════════════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

// ─── Enum literals ──────────────────────────────────────

export type PoiType =
  | 'gate' | 'elevator' | 'escalator' | 'stairs' | 'moving_walkway'
  | 'security_checkpoint' | 'customs' | 'passport_control' | 'baggage_claim'
  | 'information_desk' | 'check_in' | 'lost_and_found' | 'first_aid'
  | 'medical' | 'prayer_room' | 'nursing_room' | 'shower' | 'left_luggage'
  | 'charging_station' | 'restaurant' | 'cafe' | 'bar' | 'fast_food'
  | 'vending' | 'shop' | 'duty_free' | 'pharmacy' | 'atm'
  | 'currency_exchange' | 'newsstand' | 'lounge' | 'hotel' | 'spa' | 'gym'
  | 'restroom' | 'restroom_family' | 'smoking_area' | 'pet_relief';

export type GateStatus =
  | 'open' | 'boarding' | 'gate_closed' | 'departed'
  | 'arriving' | 'closed' | 'maintenance';

export type GateType = 'domestic' | 'international' | 'both' | 'private' | 'charter';

export type ParkingFacilityType =
  | 'economy' | 'standard' | 'express' | 'covered' | 'valet' | 'remote' | 'free';

export type ParkingTier = 'free' | 'basic' | 'premium' | 'valet';

export type CrowdReportType =
  | 'queue_long' | 'queue_short' | 'queue_closed'
  | 'crowded' | 'empty'
  | 'gate_delay' | 'gate_closed' | 'gate_changed' | 'gate_open'
  | 'security_slow' | 'security_fast'
  | 'customs_slow' | 'customs_fast'
  | 'baggage_delayed' | 'baggage_arrived'
  | 'elevator_broken' | 'escalator_broken' | 'moving_walkway_off'
  | 'helpful_info' | 'clear_path';

export type ReportLocationType =
  | 'gate' | 'security' | 'customs' | 'passport_control'
  | 'baggage_claim' | 'lounge' | 'elevator' | 'escalator'
  | 'terminal' | 'parking' | 'poi' | 'general';

export type FlightStatusType =
  | 'scheduled' | 'boarding' | 'gate_closed' | 'departed'
  | 'delayed' | 'cancelled' | 'diverted' | 'landed' | 'arriving';

export type ConnectionRisk = 'safe' | 'tight' | 'at_risk' | 'impossible';
export type TrackingRole = 'tracking' | 'inbound' | 'outbound';
export type FlightChangeType =
  | 'gate' | 'terminal' | 'status' | 'departure_delay' | 'arrival_delay'
  | 'cancellation' | 'aircraft';

// ─── Table row types ─────────────────────────────────────

export interface DbAirport {
  id: string;
  iata_code: string;
  icao_code: string | null;
  name: string;
  city: string;
  country: string;
  timezone: string;
  coordinates: Json | null;       // PostGIS geometry — use lat/lng helpers
  is_supported: boolean;
  created_at: string;
}

export interface DbTerminal {
  id: string;
  airport_id: string;
  name: string;
  code: string;
  floor_count: number;
  created_at: string;
}

export interface DbTerminalFloor {
  id: string;
  terminal_id: string;
  level: number;
  name: string;
  map_svg_url: string | null;
  map_img_url: string | null;
  bbox_min_lat: number | null;
  bbox_min_lng: number | null;
  bbox_max_lat: number | null;
  bbox_max_lng: number | null;
  created_at: string;
}

export interface DbPoi {
  id: string;
  airport_id: string;
  terminal_id: string | null;
  floor_id: string | null;
  name: string;
  short_name: string | null;
  type: PoiType;
  floor_level: number;
  coordinates: Json | null;
  indoor_x: number | null;
  indoor_y: number | null;
  description: string | null;
  hours: string | null;
  phone: string | null;
  website: string | null;
  is_accessible: boolean;
  is_active: boolean;
  features: string[];
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface DbGate {
  id: string;
  poi_id: string | null;
  airport_id: string;
  terminal_id: string | null;
  floor_id: string | null;
  code: string;
  full_code: string | null;
  floor_level: number;
  status: GateStatus;
  type: GateType;
  adjacent_gate_ids: string[];
  airlines: string[];
  coordinates: Json | null;
  indoor_x: number | null;
  indoor_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbNavigationEdge {
  id: string;
  airport_id: string;
  from_poi_id: string;
  to_poi_id: string;
  distance_meters: number;
  walk_seconds: number;
  run_seconds: number | null;
  wheelchair_seconds: number | null;
  requires_security: boolean;
  requires_customs: boolean;
  uses_elevator: boolean;
  uses_escalator: boolean;
  uses_moving_walkway: boolean;
  is_accessible: boolean;
  steps: Json;              // RouteStep[]
  notes: string | null;
  created_at: string;
}

export interface DbParkingZone {
  id: string;
  airport_id: string;
  airport_code: string;
  name: string;
  short_code: string | null;
  description: string | null;
  type: ParkingFacilityType;
  tier: ParkingTier;
  coordinates: Json | null;
  address: string | null;
  primary_terminal_id: string | null;
  distance_to_terminal_m: number | null;
  walking_time_min: number | null;
  shuttle_time_min: number | null;
  shuttle_frequency_min: number | null;
  total_spaces: number;
  total_disabled_spaces: number;
  total_ev_spaces: number;
  total_oversized_spaces: number;
  available_spaces: number | null;
  available_disabled: number | null;
  available_ev: number | null;
  availability_source: string | null;
  availability_updated_at: string | null;
  currency: string;
  rate_per_hour: number | null;
  rate_per_day: number | null;
  rate_per_week: number | null;
  rate_monthly: number | null;
  is_free: boolean;
  free_minutes: number | null;
  max_stay_hours: number | null;
  features: string[];
  requires_booking: boolean;
  booking_url: string | null;
  booking_provider: string | null;
  is_active: boolean;
  is_open_24h: boolean;
  operating_hours: Json | null;
  created_at: string;
  updated_at: string;
}

export interface DbParkingPricingTier {
  id: string;
  parking_zone_id: string;
  label: string;
  min_hours: number;
  max_hours: number | null;
  rate_per_hour: number | null;
  flat_rate: number | null;
  display_order: number;
  created_at: string;
}

export interface DbCrowdReport {
  id: string;
  user_id: string | null;
  is_anonymous: boolean;
  airport_code: string;
  airport_id: string | null;
  terminal_id: string | null;
  location_type: ReportLocationType;
  location_id: string | null;
  location_label: string;
  coordinates: Json | null;
  type: CrowdReportType;
  severity: number;       // 1–5
  description: string | null;
  upvotes: number;
  downvotes: number;
  is_verified: boolean;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface DbCrowdReportVote {
  id: string;
  report_id: string;
  user_id: string;
  vote: 1 | -1;
  created_at: string;
}

export interface DbFlight {
  id: string;
  flight_number: string;
  airline: string;
  airline_code: string;
  aircraft_type: string | null;
  aircraft_registration: string | null;
  origin_code: string;
  destination_code: string;
  origin_airport_id: string | null;
  destination_airport_id: string | null;
  departure_terminal: string | null;
  departure_gate_id: string | null;
  departure_gate_code: string | null;
  scheduled_departure: string;
  estimated_departure: string | null;
  actual_departure: string | null;
  departure_delay_min: number;
  arrival_terminal: string | null;
  arrival_gate_id: string | null;
  arrival_gate_code: string | null;
  scheduled_arrival: string;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  arrival_delay_min: number;
  status: FlightStatusType;
  cancellation_reason: string | null;
  baggage_claim: string | null;
  codeshare_numbers: string[];
  data_source: string;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbUserTrackedFlight {
  id: string;
  user_id: string;
  flight_id: string | null;
  flight_number: string;
  flight_date: string;      // ISO date "YYYY-MM-DD"
  role: TrackingRole;
  notes: string | null;
  notify_gate_changes: boolean;
  notify_delays: boolean;
  notify_boarding: boolean;
  notify_cancellation: boolean;
  added_at: string;
}

export interface DbUserConnection {
  id: string;
  user_id: string;
  inbound_flight_id: string | null;
  inbound_flight_number: string;
  outbound_flight_id: string | null;
  outbound_flight_number: string;
  connection_date: string;
  layover_airport_code: string;
  connection_time_min: number | null;
  walking_time_min: number | null;
  buffer_min: number | null;        // generated column
  risk_level: ConnectionRisk | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbFlightChange {
  id: string;
  flight_id: string;
  change_type: FlightChangeType;
  previous_value: string | null;
  new_value: string | null;
  changed_at: string;
  notified_count: number;
}

// ─── Materialised view types ──────────────────────────────

export interface DbCrowdSignalSummary {
  airport_code: string;
  terminal_id: string | null;
  location_type: ReportLocationType;
  location_id: string | null;
  location_label: string;
  report_count: number;
  avg_severity: number;
  dominant_type: CrowdReportType;
  positive_count: number;
  negative_count: number;
  total_upvotes: number;
  has_verified_report: boolean;
  latest_report_at: string;
  earliest_expiry: string;
}

// ─── Function return types ────────────────────────────────

export interface DbCrowdSignalRow {
  location_label: string;
  location_type: string;
  dominant_type: string;
  avg_severity: number;
  report_count: number;
  positive_count: number;
  negative_count: number;
  has_verified: boolean;
  latest_at: string;
}

export interface DbParkingOptionRow {
  id: string;
  name: string;
  short_code: string | null;
  type: string;
  tier: string;
  available_spaces: number | null;
  occupancy_pct: number | null;
  rate_per_hour: number | null;
  rate_per_day: number | null;
  walking_time_min: number | null;
  features: string[];
  is_full: boolean;
}

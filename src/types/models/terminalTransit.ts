// ══════════════════════════════════════════════════════════
// Terminal Transit Types
// ──────────────────────────────────────────────────────────
// Represents the physical connectivity graph between airport
// terminals, feasibility rules per passenger status, and the
// agent's output (route options + warnings).
// ══════════════════════════════════════════════════════════

// ── Graph primitives ──────────────────────────────────────

/** Whether the route stays in the sterile/airside zone */
export type RouteType = 'airside' | 'landside' | 'mixed';

export type TransportMode =
  | 'walking'
  | 'train'
  | 'automated_people_mover'
  | 'monorail'
  | 'shuttle_bus'
  | 'bus';

/** Legal / operational constraints on a specific edge */
export type TransitRestriction =
  | 'requires_immigration_clearance'   // must clear full immigration
  | 'requires_customs_clearance'       // must clear customs/baggage claim
  | 'requires_visa_or_entry'           // entry visa needed to transit this way
  | 'requires_transit_visa'            // transit-only visa (nationality-dependent)
  | 'requires_security_recheck'        // exit secure zone → re-screen at destination
  | 'requires_border_crossing'         // physically crosses international border
  | 'closed_overnight'                 // service unavailable at night
  | 'ticketed_passengers_only';        // boarding pass required to access route

/** One directed (or bidirectional) connection between two terminals */
export interface TerminalEdge {
  id: string;
  fromTerminal: string;
  toTerminal: string;

  routeType: RouteType;
  transportMode: TransportMode;

  /** Human-readable service name, e.g. "AirTrain Blue Line" */
  label: string;

  /** End-to-end journey time in minutes (includes average wait for next departure) */
  averageMinutes: number;

  /** Minutes between departures. null = on-demand / continuous (e.g. walking) */
  frequencyMinutes: number | null;

  /** Approximate walking distance in metres (set even for non-walking modes for legs within stations) */
  walkingMetres: number;

  restrictions: TransitRestriction[];

  /** Extra context shown to the passenger */
  notes?: string;

  isOperational: boolean;
  /** If true, the reverse direction (toTerminal → fromTerminal) uses identical properties */
  bidirectional: boolean;

  /** "HH:MM" local-airport time.  Absent = 24h service. */
  operatingHours?: { open: string; close: string };
}

/** Complete connectivity graph for one airport */
export interface TerminalGraph {
  airportCode: string;
  airportName: string;
  /** All terminal identifiers referenced in edges */
  terminals: string[];
  edges: TerminalEdge[];
}

// ── Agent query ───────────────────────────────────────────

export type PassengerStatus =
  | 'domestic_to_domestic'
  | 'domestic_to_international'
  | 'international_to_domestic'
  | 'international_to_international';

export type TransitOptimisation = 'fastest' | 'least_walking' | 'airside_only';

export interface TransitQueryInput {
  airportCode: string;
  fromTerminal: string;
  toTerminal: string;
  passengerStatus: PassengerStatus;
  /** Total minutes available for the entire connection (flights + transit + everything) */
  connectionWindowMinutes?: number;
  preferences?: {
    airsideOnly?: boolean;
    minimiseWalking?: boolean;
  };
}

// ── Agent output ──────────────────────────────────────────

export type TransitRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface TransitWarning {
  code: string;
  level: TransitRiskLevel;
  title: string;
  detail: string;
}

/** One segment of the route (one edge traversal) */
export interface TransitStep {
  stepNumber: number;
  fromTerminal: string;
  toTerminal: string;
  transportMode: TransportMode;
  routeType: RouteType;
  label: string;
  instruction: string;
  durationMinutes: number;
  frequencyMinutes: number | null;
  walkingMetres: number;
  notes?: string;
  warnings: TransitWarning[];
}

export interface TransitRoute {
  id: TransitOptimisation;
  optimisation: TransitOptimisation;
  totalMinutes: number;
  totalWalkingMetres: number;
  isAirsideOnly: boolean;
  steps: TransitStep[];
  overallRisk: TransitRiskLevel;
  warnings: TransitWarning[];      // de-duped across all steps
  /** False when this route is physically/legally incompatible with passengerStatus */
  isFeasible: boolean;
}

export interface TransitAgentResult {
  query: TransitQueryInput;
  /** True only when the same-terminal shortcut fires */
  sameTerminal: boolean;
  /** True when we have no graph data for this airport */
  noDataAvailable: boolean;
  /** False when NO physical path exists at all */
  isFeasible: boolean;
  /** Warnings that apply regardless of which route is chosen */
  blockers: TransitWarning[];
  routes: TransitRoute[];
  /** Best route for a general traveller (fastest feasible, else fastest regardless) */
  recommendedRoute: TransitRoute | null;
  /** Estimated extra minutes to add when connection window is tight */
  bufferImpactMinutes: number;
}

// ── Feasibility layer (route-screen focused) ──────────────
// A simpler, time-budget–oriented view on top of the Dijkstra
// engine.  Used by TransitFeasibilityCard on the route screen.

/** Public transfer type accepted by the feasibility function */
export type TransferType =
  | 'intl_to_intl'   // international → international
  | 'intl_to_dom'    // international → domestic (always needs immigration)
  | 'dom_to_dom';    // domestic      → domestic

export type TransitFeasibilityStatus = 'safe' | 'warning' | 'critical';

/** One row in the displayed itinerary breakdown */
export interface ItineraryStep {
  stepNumber: number;
  icon: string;          // emoji
  label: string;         // short service/action name
  description: string;   // full instruction sentence
  durationMin: number;
  /** True for added-penalty rows (immigration, security recheck, crowd) */
  isPenalty: boolean;
  penaltyLevel?: 'warning' | 'critical';
}

/** Full result of computeTransitFeasibility() */
export interface TransitFeasibilityResult {
  // Query echo
  airportCode:         string;
  fromTerminal:        string;
  toTerminal:          string;
  connectionWindowMin: number;
  transferType:        TransferType;

  // Time breakdown (all in minutes)
  baseDurationMin:         number;   // raw edge travel time
  immigrationPenaltyMin:   number;   // 0 or 45
  landsidePenaltyMin:      number;   // 0 or 20
  crowdDelayMin:           number;   // live security / customs delay
  totalEstimatedTimeMin:   number;   // sum of all above

  // Buffer arithmetic
  bufferTimeLeft:          number;   // connectionWindow − total (negative = over budget)

  // Feasibility verdict
  feasibilityStatus:       TransitFeasibilityStatus; // safe ≥20 | warning 0–19 | critical <0
  requiresImmigration:     boolean;
  isLandside:              boolean;

  // Step-by-step itinerary shown in the card
  itinerary: ItineraryStep[];
}

// ── Risk helpers (used by UI) ─────────────────────────────

export const RISK_RANK: Record<TransitRiskLevel, number> = {
  none: 0, low: 1, medium: 2, high: 3, critical: 4,
};

export function maxRisk(a: TransitRiskLevel, b: TransitRiskLevel): TransitRiskLevel {
  return RISK_RANK[a] >= RISK_RANK[b] ? a : b;
}

export const RISK_COLOR: Record<TransitRiskLevel, { bg: string; text: string; border: string }> = {
  none:     { bg: '#052e16', text: '#4ade80', border: '#166534' },
  low:      { bg: '#052e16', text: '#86efac', border: '#166534' },
  medium:   { bg: '#451a03', text: '#fbbf24', border: '#92400e' },
  high:     { bg: '#431407', text: '#f97316', border: '#7c2d12' },
  critical: { bg: '#450a0a', text: '#f87171', border: '#991b1b' },
};

export const TRANSPORT_ICON: Record<TransportMode, string> = {
  walking:                '🚶',
  train:                  '🚊',
  automated_people_mover: '🚈',
  monorail:               '🚝',
  shuttle_bus:            '🚌',
  bus:                    '🚌',
};

export const TRANSPORT_LABEL: Record<TransportMode, string> = {
  walking:                'Walk',
  train:                  'Train',
  automated_people_mover: 'People Mover',
  monorail:               'Monorail',
  shuttle_bus:            'Shuttle',
  bus:                    'Bus',
};

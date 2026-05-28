// ══════════════════════════════════════════════════════════
// Connection Engine — core logic for AirportWaze routing.
//
// Responsibilities:
//  • Walking-time calculation with mode & congestion factors
//  • Dijkstra route building over navigation graph
//  • Gate-close-time derivation (international vs domestic)
//  • Real-time countdown model
//  • Connection risk assessment
// ══════════════════════════════════════════════════════════

import type { NavigationEdge, NavigationMode, RouteStep } from '../../types/models/poi';
import type { ConnectionRisk } from '../../types/database';
import { runDijkstra } from './dijkstra';

// ── Speed constants ───────────────────────────────────────

const SPEED_FACTORS: Record<NavigationMode, number> = {
  walking:    1.00,
  running:    0.56,   // 2.5 m/s vs 1.4 m/s base
  wheelchair: 1.43,   // 0.9 m/s
};

// ── Gate-close offsets ────────────────────────────────────
// Gate closes N minutes before scheduled departure

const GATE_CLOSE_MIN_DOMESTIC      = 15;
const GATE_CLOSE_MIN_INTERNATIONAL = 25;

// ── Urgency levels (more granular than ConnectionRisk) ────

export type UrgencyLevel = 'safe' | 'steady' | 'hurry' | 'run' | 'closed';

export interface UrgencyConfig {
  level:        UrgencyLevel;
  /** Primary text color */
  color:        string;
  /** Card / ring background */
  bgColor:      string;
  /** Short label for status chip */
  label:        string;
  /** Coaching message */
  message:      string;
  /** Whether to animate a pulse effect */
  pulse:        boolean;
}

export const URGENCY_CONFIGS: Record<UrgencyLevel, UrgencyConfig> = {
  safe:   { level: 'safe',   color: '#4ade80', bgColor: '#14532d', label: 'On Track',      message: 'You have plenty of time.',            pulse: false },
  steady: { level: 'steady', color: '#fbbf24', bgColor: '#78350f', label: 'Move Steadily', message: 'Walk at a steady pace.',              pulse: false },
  hurry:  { level: 'hurry',  color: '#fb923c', bgColor: '#7c2d12', label: 'Move Quickly',  message: "Don't stop — keep moving.",           pulse: true  },
  run:    { level: 'run',    color: '#f87171', bgColor: '#7f1d1d', label: 'RUN!',           message: 'Gate closes in minutes. Run now.',    pulse: true  },
  closed: { level: 'closed', color: '#94a3b8', bgColor: '#1c1917', label: 'Gate Closed',   message: 'Contact airline immediately.',        pulse: false },
};

// ── Countdown model ───────────────────────────────────────

export interface GateCountdown {
  totalSeconds:    number;
  minutesLeft:     number;
  secondsLeft:     number;
  displayMinutes:  string;   // zero-padded  "08"
  displaySeconds:  string;   // zero-padded  "42"
  urgency:         UrgencyLevel;
  config:          UrgencyConfig;
  isClosed:        boolean;
  /** Fraction 0→1 from maxSeconds to 0, clamped */
  progressFraction: number;
}

// ── Enriched step (route step + cumulative timing) ────────

export interface EnrichedStep extends RouteStep {
  stepIndex:         number;
  cumulativeSeconds: number;
  cumulativeMinutes: number;
  isLast:            boolean;
}

// ── Computed connection route ─────────────────────────────

export interface ConnectionRoute {
  steps:               EnrichedStep[];
  totalDistanceMeters: number;
  totalTimeSeconds:    number;
  totalTimeMinutes:    number;
  congestionFactor:    number;
  requiresSecurity:    boolean;
  requiresCustoms:     boolean;
  requiresElevator:    boolean;
  mode:                NavigationMode;
}

// ── Full connection plan (assembled by the hook) ──────────

export interface ConnectionPlan {
  connectionTimeMinutes: number;
  walkingTimeMinutes:    number;
  bufferMinutes:         number;
  riskLevel:             ConnectionRisk;
  gateCloseTime:         Date;
  route:                 ConnectionRoute;
}

// ══════════════════════════════════════════════════════════
// Pure functions
// ══════════════════════════════════════════════════════════

/** When does the gate close relative to scheduled departure? */
export function getGateCloseTime(
  scheduledDeparture: Date,
  isInternational = false,
): Date {
  const offset = (isInternational ? GATE_CLOSE_MIN_INTERNATIONAL : GATE_CLOSE_MIN_DOMESTIC) * 60_000;
  return new Date(scheduledDeparture.getTime() - offset);
}

/** Build a real-time countdown snapshot (call every second). */
export function buildCountdown(
  gateCloseTime: Date,
  maxSeconds:    number,
  now            = new Date(),
): GateCountdown {
  const msLeft      = gateCloseTime.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1_000));
  const mins         = Math.floor(totalSeconds / 60);
  const secs         = totalSeconds % 60;
  const isClosed     = msLeft <= 0;

  let urgency: UrgencyLevel;
  if (isClosed)      urgency = 'closed';
  else if (mins < 5)  urgency = 'run';
  else if (mins < 15) urgency = 'hurry';
  else if (mins < 30) urgency = 'steady';
  else                urgency = 'safe';

  return {
    totalSeconds,
    minutesLeft:      mins,
    secondsLeft:      secs,
    displayMinutes:   String(mins).padStart(2, '0'),
    displaySeconds:   String(secs).padStart(2, '0'),
    urgency,
    config:           URGENCY_CONFIGS[urgency],
    isClosed,
    progressFraction: Math.min(1, Math.max(0, totalSeconds / Math.max(maxSeconds, 1))),
  };
}

/** Connection risk from buffer time alone. */
export function calculateRisk(
  connectionMinutes: number,
  walkingMinutes:    number,
): ConnectionRisk {
  const buffer = connectionMinutes - walkingMinutes;
  if (connectionMinutes <= 0 || buffer < 0) return 'impossible';
  if (buffer < 10)                          return 'at_risk';
  if (buffer < 25)                          return 'tight';
  return 'safe';
}

/** Adjust walk seconds for speed mode and crowd congestion. */
export function adjustTime(
  walkSeconds:     number,
  mode:            NavigationMode,
  congestion = 1.0,
): number {
  return Math.round(walkSeconds * SPEED_FACTORS[mode] * congestion);
}

// ══════════════════════════════════════════════════════════
// Route builder
// ══════════════════════════════════════════════════════════

/**
 * Builds a ConnectionRoute by running Dijkstra over the
 * navigation edge list and enriching each step with
 * cumulative timing.
 *
 * @param allEdges    Full airport navigation graph
 * @param fromPoiId   Starting POI (arrival gate)
 * @param toPoiId     Destination POI (departure gate)
 * @param mode        Walking mode
 * @param congestion  1.0 = normal, 1.5 = crowded
 */
export function buildConnectionRoute(
  allEdges:   NavigationEdge[],
  fromPoiId:  string,
  toPoiId:    string,
  mode:       NavigationMode = 'walking',
  congestion  = 1.0,
): ConnectionRoute | null {
  // 1. Build weighted graph (apply mode + congestion to edge weights)
  const graphEdges = allEdges.map((e) => ({
    id:     e.id,
    fromId: e.fromPoiId,
    toId:   e.toPoiId,
    weight: adjustTime(e.walkSeconds, mode, congestion),
  }));

  // 2. Find shortest path
  const result = runDijkstra(graphEdges, fromPoiId, toPoiId);
  if (!result) return null;

  // 3. Reconstruct ordered edge objects
  const edgeById = new Map(allEdges.map((e) => [e.id, e]));
  const orderedEdges = result.edgeIds.map((id) => ({
    edge:        edgeById.get(id)!,
    timeSeconds: adjustTime(edgeById.get(id)!.walkSeconds, mode, congestion),
  }));

  // 4. Flatten + enrich steps
  const steps: EnrichedStep[] = [];
  let cumSec  = 0;
  let stepIdx = 0;

  for (const { edge, timeSeconds } of orderedEdges) {
    // Distribute edge time evenly across its steps
    const perStepSec = edge.steps.length > 0 ? Math.round(timeSeconds / edge.steps.length) : 0;

    for (const rawStep of edge.steps) {
      cumSec += perStepSec;
      steps.push({
        ...rawStep,
        stepIndex:         stepIdx++,
        cumulativeSeconds: cumSec,
        cumulativeMinutes: Math.ceil(cumSec / 60),
        isLast:            false,
      });
    }
  }

  if (steps.length > 0) steps[steps.length - 1].isLast = true;

  return {
    steps,
    totalDistanceMeters: orderedEdges.reduce((s, { edge }) => s + edge.distanceMeters, 0),
    totalTimeSeconds:    result.totalSeconds,
    totalTimeMinutes:    Math.ceil(result.totalSeconds / 60),
    congestionFactor:    congestion,
    requiresSecurity:    orderedEdges.some(({ edge }) => edge.requiresSecurity),
    requiresCustoms:     orderedEdges.some(({ edge }) => edge.requiresCustoms),
    requiresElevator:    orderedEdges.some(({ edge }) => edge.usesElevator),
    mode,
  };
}

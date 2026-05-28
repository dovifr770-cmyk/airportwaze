// ══════════════════════════════════════════════════════════
// Crowd Delay Engine
//
// Takes live CrowdSignal aggregates (from the materialized
// view / RPC) and maps them to:
//   1. A per-location delay in minutes (shown in banners)
//   2. A congestion multiplier for the connection engine
//   3. A per-step crowd warning for the route screen
// ══════════════════════════════════════════════════════════

import type { CrowdSignal, CrowdReportType, ReportLocationType } from '../../types/models/crowdReport';
import type { EnrichedStep } from './connectionEngine';

// ── Positive (no-delay) report types ─────────────────────

const POSITIVE_TYPES = new Set<CrowdReportType>([
  'queue_short', 'empty', 'security_fast', 'customs_fast',
  'baggage_arrived', 'gate_open', 'helpful_info', 'clear_path',
]);

// ── Base delay (minutes) at severity = 3, confidence = 1 ─

const BASE_DELAY_MIN: Partial<Record<CrowdReportType, number>> = {
  security_slow:      9,
  queue_long:         6,
  queue_closed:       4,
  crowded:            3,
  gate_delay:         6,
  gate_closed:        8,
  gate_changed:       5,
  customs_slow:       14,
  baggage_delayed:    12,
  elevator_broken:    4,
  escalator_broken:   2,
  moving_walkway_off: 1,
};

// ── Which step types each location type can affect ────────

const LOCATION_TO_STEP_TYPES: Record<ReportLocationType, string[]> = {
  security:       ['security'],
  customs:        ['customs'],
  passport_control: ['customs'],
  gate:           ['walk', 'destination'],
  elevator:       ['elevator'],
  escalator:      ['escalator'],
  terminal:       ['walk'],
  baggage_claim:  ['walk'],
  lounge:         ['walk'],
  parking:        ['walk'],
  poi:            ['walk'],
  general:        ['walk', 'security', 'customs'],
};

// ── Congestion multiplier caps ────────────────────────────

const MAX_CONGESTION = 2.2;   // 120 % slower at worst
const MIN_CONGESTION = 0.85;  // slight improvement for "fast" signals

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

export interface CrowdDelay {
  /** Human-readable location (e.g. "Security Checkpoint B") */
  locationLabel:   string;
  locationType:    ReportLocationType;
  dominantType:    CrowdReportType;
  delayMinutes:    number;
  /** 1-5 */
  avgSeverity:     number;
  reportCount:     number;
  hasVerified:     boolean;
  isPositive:      boolean;
}

// ══════════════════════════════════════════════════════════
// Core functions
// ══════════════════════════════════════════════════════════

/**
 * Convert one CrowdSignal into a CrowdDelay.
 * Delay grows with severity and tapers when only 1 report exists.
 */
export function signalToDelay(signal: CrowdSignal): CrowdDelay {
  const isPositive = POSITIVE_TYPES.has(signal.dominantType);

  let delayMinutes = 0;
  if (!isPositive) {
    const base          = BASE_DELAY_MIN[signal.dominantType] ?? 2;
    const severityFactor = signal.avgSeverity / 3;        // 1.0 at moderate
    const confidence    = Math.min(1, signal.reportCount / 3); // 0→1 over 3+ reports
    delayMinutes        = Math.round(base * severityFactor * confidence);
  }

  return {
    locationLabel: signal.locationLabel,
    locationType:  signal.locationType,
    dominantType:  signal.dominantType,
    delayMinutes,
    avgSeverity:   signal.avgSeverity,
    reportCount:   signal.reportCount,
    hasVerified:   signal.hasVerifiedReport,
    isPositive,
  };
}

/**
 * Convert all active CrowdSignals into CrowdDelay objects,
 * sorted by delay descending (worst first).
 */
export function computeCrowdDelays(signals: CrowdSignal[]): CrowdDelay[] {
  return signals
    .map(signalToDelay)
    .sort((a, b) => b.delayMinutes - a.delayMinutes);
}

/**
 * Total delay minutes from all signals for a given airport.
 * Optionally filter to only signals whose locationType matches
 * one of the step types in `stepFilter`.
 */
export function getTotalCrowdDelayMinutes(
  delays:      CrowdDelay[],
  stepFilter?: string[],
): number {
  const relevant = stepFilter
    ? delays.filter((d) =>
        (LOCATION_TO_STEP_TYPES[d.locationType] ?? []).some((s) => stepFilter.includes(s)),
      )
    : delays;

  // Diminishing-returns sum: first signal full weight, subsequent ones 50 %
  return relevant.reduce((total, d, i) => total + (i === 0 ? d.delayMinutes : d.delayMinutes * 0.5), 0);
}

/**
 * Derive an adjusted congestion multiplier from signals so
 * the Dijkstra engine weights edges correctly.
 *
 * Formula: start at baseCongestion (default 1.0), add
 * 0.1 per delay-minute of the most impactful signal, cap at 2.2.
 */
export function getCongestionMultiplier(
  signals:         CrowdSignal[],
  baseCongestion   = 1.0,
): number {
  if (!signals.length) return baseCongestion;

  const delays       = computeCrowdDelays(signals).filter((d) => !d.isPositive);
  const positiveCount = signals.filter((s) => POSITIVE_TYPES.has(s.dominantType)).length;

  // Positive reports pull congestion down slightly
  let multiplier = baseCongestion - positiveCount * 0.04;

  // Worst signal contributes most
  if (delays.length > 0) {
    multiplier += delays[0].delayMinutes * 0.10;
    // Additional signals add diminishing weight
    delays.slice(1).forEach((d) => { multiplier += d.delayMinutes * 0.03; });
  }

  return Math.min(MAX_CONGESTION, Math.max(MIN_CONGESTION, multiplier));
}

/**
 * Find the most relevant crowd delay for a given route step.
 * Returns null if there's no crowd impact on this step.
 */
export function getSignalForStep(
  step:   EnrichedStep,
  delays: CrowdDelay[],
): CrowdDelay | null {
  const match = delays.find((d) => {
    const affectedSteps = LOCATION_TO_STEP_TYPES[d.locationType] ?? [];
    return affectedSteps.includes(step.type);
  });
  return match && !match.isPositive && match.delayMinutes > 0 ? match : null;
}

// ══════════════════════════════════════════════════════════
// Display helpers
// ══════════════════════════════════════════════════════════

/** Emoji + short label for a dominant crowd report type */
export const CROWD_TYPE_DISPLAY: Record<CrowdReportType, { emoji: string; shortLabel: string }> = {
  queue_long:         { emoji: '🔴', shortLabel: 'Long queue'        },
  queue_short:        { emoji: '🟢', shortLabel: 'Short queue'       },
  queue_closed:       { emoji: '🚫', shortLabel: 'Queue closed'      },
  crowded:            { emoji: '👥', shortLabel: 'Very crowded'      },
  empty:              { emoji: '✅', shortLabel: 'Not crowded'       },
  gate_delay:         { emoji: '⏱', shortLabel: 'Gate delay'        },
  gate_closed:        { emoji: '🚫', shortLabel: 'Gate closed'       },
  gate_changed:       { emoji: '🔄', shortLabel: 'Gate changed'      },
  gate_open:          { emoji: '🟢', shortLabel: 'Gate open'         },
  security_slow:      { emoji: '🔴', shortLabel: 'Security slow'     },
  security_fast:      { emoji: '🟢', shortLabel: 'Security fast'     },
  customs_slow:       { emoji: '🔴', shortLabel: 'Customs slow'      },
  customs_fast:       { emoji: '🟢', shortLabel: 'Customs fast'      },
  baggage_delayed:    { emoji: '⏳', shortLabel: 'Baggage delayed'   },
  baggage_arrived:    { emoji: '✅', shortLabel: 'Baggage ready'     },
  elevator_broken:    { emoji: '⚠️', shortLabel: 'Elevator out'      },
  escalator_broken:   { emoji: '⚠️', shortLabel: 'Escalator out'    },
  moving_walkway_off: { emoji: '⚠️', shortLabel: 'Walkway off'      },
  helpful_info:       { emoji: 'ℹ️', shortLabel: 'Info'              },
  clear_path:         { emoji: '🟢', shortLabel: 'Clear path'        },
};

/** Severity to colour mapping */
export function severityColor(severity: number): string {
  if (severity >= 4) return '#f87171';   // red
  if (severity >= 3) return '#fb923c';   // orange
  if (severity >= 2) return '#fbbf24';   // yellow
  return '#4ade80';                       // green
}

// ── useTerminalTransit ─────────────────────────────────────
// Thin React wrapper around runTerminalTransitAgent.
// Re-runs synchronously whenever any input changes.
// The engine is pure CPU (no network) so there is no async
// loading phase — memoisation is enough.

import { useMemo } from 'react';
import { runTerminalTransitAgent } from '../services/navigation/terminalTransitAgent';
import type {
  PassengerStatus,
  TransitAgentResult,
  TransitOptimisation,
} from '../types/models/terminalTransit';

export interface UseTerminalTransitOptions {
  /** Preferred optimisation strategy for the recommended-route pick */
  preferredStrategy?: TransitOptimisation;
  /** Total minutes available for the whole connection */
  connectionWindowMinutes?: number;
}

export interface UseTerminalTransitReturn {
  result:    TransitAgentResult | null;
  /** Shorthand: is transit needed at all? */
  needsTransit: boolean;
  /** Shorthand: is the recommended route airside-only? */
  isAirsideClear: boolean;
}

/**
 * @param airportCode  IATA code, e.g. "JFK"
 * @param fromTerminal Terminal the passenger arrives at, e.g. "T4"
 * @param toTerminal   Terminal the passenger departs from, e.g. "T8"
 * @param passengerStatus  Journey type
 */
export function useTerminalTransit(
  airportCode:     string | undefined | null,
  fromTerminal:    string | undefined | null,
  toTerminal:      string | undefined | null,
  passengerStatus: PassengerStatus,
  options:         UseTerminalTransitOptions = {},
): UseTerminalTransitReturn {
  const { connectionWindowMinutes } = options;

  const result = useMemo<TransitAgentResult | null>(() => {
    if (!airportCode || !fromTerminal || !toTerminal) return null;

    return runTerminalTransitAgent({
      airportCode,
      fromTerminal,
      toTerminal,
      passengerStatus,
      connectionWindowMinutes,
    });
  }, [airportCode, fromTerminal, toTerminal, passengerStatus, connectionWindowMinutes]);

  const needsTransit   = !!result && !result.sameTerminal && !result.noDataAvailable;
  const isAirsideClear = !!result?.recommendedRoute?.isAirsideOnly;

  return { result, needsTransit, isAirsideClear };
}

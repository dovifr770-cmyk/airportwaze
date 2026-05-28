// ═══════════════════════════════════════════════════════════
// useTransitFeasibility
// Synchronous hook that wraps computeTransitFeasibility().
// Re-runs automatically whenever terminals, transferType,
// connectionWindow, or crowd delays change.
// ═══════════════════════════════════════════════════════════

import { useMemo } from 'react';
import { computeTransitFeasibility } from '../services/navigation/terminalTransitAgent';
import type { TransferType, TransitFeasibilityResult } from '../types/models/terminalTransit';
import type { CrowdDelay } from '../services/navigation/crowdDelayEngine';

export interface UseTransitFeasibilityReturn {
  /** null when same-terminal or no graph data for this airport */
  result:      TransitFeasibilityResult | null;
  /** Convenience: is a cross-terminal transfer actually needed? */
  needsTransit: boolean;
}

export function useTransitFeasibility(
  airportCode:          string | undefined | null,
  fromTerminal:         string | undefined | null,
  toTerminal:           string | undefined | null,
  connectionWindowMin:  number | undefined | null,
  transferType:         TransferType,
  crowdDelays:          CrowdDelay[],
): UseTransitFeasibilityReturn {
  const result = useMemo<TransitFeasibilityResult | null>(() => {
    if (
      !airportCode ||
      !fromTerminal ||
      !toTerminal ||
      fromTerminal === toTerminal ||
      !connectionWindowMin ||
      connectionWindowMin <= 0
    ) return null;

    return computeTransitFeasibility(
      airportCode,
      fromTerminal,
      toTerminal,
      connectionWindowMin,
      transferType,
      crowdDelays,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    airportCode,
    fromTerminal,
    toTerminal,
    connectionWindowMin,
    transferType,
    // Deep-compare crowd delays by serialising them; they change infrequently
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(crowdDelays),
  ]);

  return {
    result,
    needsTransit: !!result,
  };
}

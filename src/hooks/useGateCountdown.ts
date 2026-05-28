import { useState, useEffect, useRef } from 'react';
import { buildCountdown, type GateCountdown } from '../services/navigation/connectionEngine';

/**
 * Ticks every second and returns a fresh GateCountdown snapshot.
 *
 * @param gateCloseTime   When the gate closes (null = not set yet)
 * @param maxSeconds      The "full" value for the progress ring (default: 90 min)
 */
export function useGateCountdown(
  gateCloseTime: Date | null,
  maxSeconds     = 90 * 60,
): GateCountdown | null {
  const [countdown, setCountdown] = useState<GateCountdown | null>(
    gateCloseTime ? buildCountdown(gateCloseTime, maxSeconds) : null,
  );

  const closeMs = gateCloseTime?.getTime() ?? null;

  useEffect(() => {
    if (!closeMs) { setCountdown(null); return; }

    const update = () =>
      setCountdown(buildCountdown(new Date(closeMs), maxSeconds));

    update();                                    // immediate
    const id = setInterval(update, 1_000);
    return () => clearInterval(id);
  }, [closeMs, maxSeconds]);

  return countdown;
}

import { useState, useEffect, useCallback } from 'react';
import { flightsService } from '../services/supabase';
import type { Flight } from '../types/models/flight';
import type { ConnectionRisk } from '../types/database';
import {
  calculateRisk,
  getGateCloseTime,
  type ConnectionRoute,
} from '../services/navigation/connectionEngine';
import {
  MOCK_INBOUND_FLIGHT,
  MOCK_OUTBOUND_FLIGHT,
  MOCK_ROUTE,
} from '../services/navigation/mockRoutes';

export type DashboardStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ConnectionDashboardState {
  status:                DashboardStatus;
  error:                 string | null;
  inboundFlight:         Flight | null;
  outboundFlight:        Flight | null;
  route:                 ConnectionRoute | null;
  gateCloseTime:         Date | null;
  /** Total minutes from inbound arrival to outbound departure */
  connectionTimeMinutes: number;
  walkingTimeMinutes:    number;
  bufferMinutes:         number;
  riskLevel:             ConnectionRisk | null;
  /** Reload with fresh flight data */
  refresh:               () => void;
}

/**
 * Orchestrates fetching both flights, computing the gate-to-gate
 * route, and assembling the full connection plan.
 *
 * Pass empty strings to stay in 'idle' — no network call is made.
 * Pass 'MOCK' as either flight number to use demo data.
 */
export function useConnectionDashboard(
  inboundNumber:  string,
  outboundNumber: string,
  date:           string,  // "YYYY-MM-DD"
): ConnectionDashboardState {
  const [state, setState] = useState<Omit<ConnectionDashboardState, 'refresh'>>({
    status: 'idle', error: null,
    inboundFlight: null, outboundFlight: null,
    route: null, gateCloseTime: null,
    connectionTimeMinutes: 0, walkingTimeMinutes: 0,
    bufferMinutes: 0, riskLevel: null,
  });

  const load = useCallback(async () => {
    const trimIn  = inboundNumber.trim().toUpperCase();
    const trimOut = outboundNumber.trim().toUpperCase();
    if (!trimIn || !trimOut) return;

    setState((s) => ({ ...s, status: 'loading', error: null }));

    try {
      let inbound:  Flight | null;
      let outbound: Flight | null;

      // Use mock data when 'MOCK' is passed (demo / dev)
      if (trimIn === 'MOCK' || trimOut === 'MOCK') {
        inbound  = MOCK_INBOUND_FLIGHT;
        outbound = MOCK_OUTBOUND_FLIGHT;
      } else {
        [inbound, outbound] = await Promise.all([
          flightsService.getByNumber(trimIn,  date),
          flightsService.getByNumber(trimOut, date),
        ]);
      }

      if (!inbound || !outbound) {
        setState((s) => ({
          ...s, status: 'error',
          error: `Could not find ${!inbound ? trimIn : trimOut}. Check the flight number and date.`,
        }));
        return;
      }

      // Effective times
      const arrivalTime   = inbound.estimatedArrival   ?? inbound.scheduledArrival;
      const departureTime = outbound.estimatedDeparture ?? outbound.scheduledDeparture;

      const connMin    = Math.round((departureTime.getTime() - arrivalTime.getTime()) / 60_000);
      const walkingMin = MOCK_ROUTE.totalTimeMinutes;   // swap with real route later
      const bufferMin  = connMin - walkingMin;
      const riskLevel  = calculateRisk(connMin, walkingMin);

      // Gate closes 15 min before domestic, 25 min before international departure
      const isIntl    = outbound.destination.country !== 'US';
      const gateClose = getGateCloseTime(departureTime, isIntl);

      setState({
        status: 'ready', error: null,
        inboundFlight: inbound, outboundFlight: outbound,
        route:                 MOCK_ROUTE,
        gateCloseTime:         gateClose,
        connectionTimeMinutes: connMin,
        walkingTimeMinutes:    walkingMin,
        bufferMinutes:         bufferMin,
        riskLevel,
      });
    } catch (err: any) {
      setState((s) => ({
        ...s, status: 'error',
        error: err?.message ?? 'Failed to load flight data. Check your connection.',
      }));
    }
  }, [inboundNumber, outboundNumber, date]);

  useEffect(() => { load(); }, [load]);

  return { ...state, refresh: load };
}

/**
 * useDevSeed — runs only when __DEV__ is true (Expo Metro bundler).
 *
 * On mount it:
 *   1. Sets a mock authenticated user → skips the login screen entirely
 *   2. Pre-fills the flight store with two connecting-flight pairs
 *   3. Exposes helpers so DevControls can swap scenarios on the fly
 */

import { useEffect } from 'react';
import { useAuthStore }       from '../stores/authStore';
import { useFlightStore }     from '../stores/flightStore';
import { MOCK_USER, MOCK_CONNECTIONS } from './mockData';

export function useDevSeed() {
  useEffect(() => {
    if (!__DEV__) return;

    // ── 1. Auto-sign-in with the mock user ──
    // Direct Zustand setState — bypasses Supabase entirely
    useAuthStore.setState({
      user:            MOCK_USER as any,
      isAuthenticated: true,
      isLoading:       false,
    });

    // ── 2. Pre-fill flight store with the first two mock connections ──
    const trackedFlights = [
      MOCK_CONNECTIONS[0].inbound,
      MOCK_CONNECTIONS[0].outbound,
      MOCK_CONNECTIONS[1].inbound,
      MOCK_CONNECTIONS[1].outbound,
      MOCK_CONNECTIONS[2].inbound,
      MOCK_CONNECTIONS[2].outbound,
    ];

    // Put the Flight objects directly into the store so dashboard can
    // read flight.origin.code, flight.destination.code, etc. without crashing.
    useFlightStore.setState({
      trackedFlights: trackedFlights as any,
    });

    console.log('[DevSeed] ✅ Mock user set, 6 flights pre-loaded');
  }, []);
}

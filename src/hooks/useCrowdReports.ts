import { useState, useEffect, useCallback, useRef } from 'react';
import { crowdReportsService } from '../services/supabase/crowdReports.service';
import { computeCrowdDelays, getCongestionMultiplier } from '../services/navigation/crowdDelayEngine';
import type { CrowdReport, CrowdSignal, CreateCrowdReportInput } from '../types/models/crowdReport';
import type { CrowdDelay } from '../services/navigation/crowdDelayEngine';
import { useAuthStore } from '../stores/authStore';

const SIGNAL_REFRESH_MS = 5 * 60 * 1_000;   // re-fetch signals every 5 min

export interface CrowdReportsState {
  /** Aggregated crowd signals (from DB materialised view / RPC) */
  signals:       CrowdSignal[];
  /** Raw recent reports streamed in real-time */
  recentReports: CrowdReport[];
  /** Computed delay objects ready for display */
  delays:        CrowdDelay[];
  /** Congestion multiplier for the routing engine (≥1.0) */
  congestion:    number;
  isLoading:     boolean;
  error:         string | null;
  /** Submit a new crowd report; resolves with the created report */
  submit:        (input: CreateCrowdReportInput) => Promise<CrowdReport>;
  /** Vote on an existing report */
  vote:          (reportId: string, value: 1 | -1) => Promise<void>;
  /** Retract a report you submitted */
  retract:       (reportId: string) => Promise<void>;
  /** Force-refresh signals */
  refresh:       () => void;
}

/**
 * Subscribes to real-time crowd reports for `airportCode`.
 *
 * Pass an empty string to stay idle (no network calls).
 */
export function useCrowdReports(airportCode: string): CrowdReportsState {
  const user = useAuthStore((s) => s.user);

  const [signals,       setSignals]       = useState<CrowdSignal[]>([]);
  const [recentReports, setRecentReports] = useState<CrowdReport[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // ── Fetch aggregated signals ──────────────────────────────
  const fetchSignals = useCallback(async () => {
    const code = airportCode.trim().toUpperCase();
    if (!code) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await crowdReportsService.getSignals(code);
      setSignals(data);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load crowd signals.');
    } finally {
      setIsLoading(false);
    }
  }, [airportCode]);

  // ── Initial load + periodic refresh ──────────────────────
  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, SIGNAL_REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // ── Real-time subscription for new reports ────────────────
  useEffect(() => {
    const code = airportCode.trim().toUpperCase();
    if (!code) return;

    const unsub = crowdReportsService.subscribeToAirport(code, (report) => {
      setRecentReports((prev) =>
        [report, ...prev.filter((r) => r.id !== report.id)].slice(0, 50),
      );
      // When a new report arrives, refresh aggregated signals after a short delay
      // (gives the DB trigger time to update the materialized view)
      setTimeout(fetchSignals, 3_000);
    });

    return unsub;
  }, [airportCode, fetchSignals]);

  // ── Derived state ─────────────────────────────────────────
  const delays     = computeCrowdDelays(signals);
  const congestion = getCongestionMultiplier(signals);

  // ── Actions ───────────────────────────────────────────────
  const submit = useCallback(
    async (input: CreateCrowdReportInput): Promise<CrowdReport> => {
      const report = await crowdReportsService.submit(input, user?.id);
      // Optimistically add to recent list immediately
      setRecentReports((prev) => [report, ...prev].slice(0, 50));
      // Refresh signals after submit
      setTimeout(fetchSignals, 2_000);
      return report;
    },
    [user?.id, fetchSignals],
  );

  const vote = useCallback(
    async (reportId: string, value: 1 | -1) => {
      if (!user?.id) throw new Error('Sign in to vote.');
      await crowdReportsService.vote(reportId, user.id, value);
    },
    [user?.id],
  );

  const retract = useCallback(
    async (reportId: string) => {
      await crowdReportsService.retract(reportId);
      setRecentReports((prev) => prev.filter((r) => r.id !== reportId));
    },
    [],
  );

  return {
    signals,
    recentReports,
    delays,
    congestion,
    isLoading,
    error,
    submit,
    vote,
    retract,
    refresh: fetchSignals,
  };
}

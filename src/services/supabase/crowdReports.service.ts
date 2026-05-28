import { supabase } from './client';
import type {
  DbCrowdReport,
  DbCrowdSignalSummary,
  DbCrowdSignalRow,
} from '../../types/database';
import type {
  CrowdReport,
  CrowdSignal,
  CreateCrowdReportInput,
  ReportLocationType,
} from '../../types/models/crowdReport';

// ── Mappers ───────────────────────────────────────────────

function mapReport(row: DbCrowdReport): CrowdReport {
  const coords = row.coordinates as any;
  return {
    id:            row.id,
    userId:        row.user_id ?? undefined,
    isAnonymous:   row.is_anonymous,
    airportCode:   row.airport_code,
    airportId:     row.airport_id ?? undefined,
    terminalId:    row.terminal_id ?? undefined,
    locationType:  row.location_type,
    locationId:    row.location_id ?? undefined,
    locationLabel: row.location_label,
    coordinates:   coords?.coordinates
      ? { lat: coords.coordinates[1], lng: coords.coordinates[0] }
      : undefined,
    type:          row.type,
    severity:      row.severity as CrowdReport['severity'],
    description:   row.description ?? undefined,
    upvotes:       row.upvotes,
    downvotes:     row.downvotes,
    isVerified:    row.is_verified,
    createdAt:     new Date(row.created_at),
    expiresAt:     new Date(row.expires_at),
    isActive:      row.is_active,
  };
}

function mapSignal(row: DbCrowdSignalSummary | DbCrowdSignalRow): CrowdSignal {
  // Handle both the materialized view shape and the RPC function shape
  const r = row as any;
  return {
    airportCode:       r.airport_code,
    terminalId:        r.terminal_id ?? undefined,
    locationType:      r.location_type as ReportLocationType,
    locationId:        r.location_id ?? undefined,
    locationLabel:     r.location_label,
    reportCount:       Number(r.report_count),
    avgSeverity:       Number(r.avg_severity),
    dominantType:      r.dominant_type,
    positiveCount:     Number(r.positive_count ?? 0),
    negativeCount:     Number(r.negative_count ?? 0),
    totalUpvotes:      Number(r.total_upvotes ?? 0),
    hasVerifiedReport: Boolean(r.has_verified_report ?? r.has_verified),
    latestReportAt:    new Date(r.latest_report_at ?? r.latest_at),
    earliestExpiry:    new Date(r.earliest_expiry ?? r.latest_at),
  };
}

// ── Service ───────────────────────────────────────────────

export const crowdReportsService = {

  /** Active reports for an airport (newest first) */
  async listActive(
    airportCode: string,
    locationType?: ReportLocationType,
    locationId?: string,
    limit = 50,
  ): Promise<CrowdReport[]> {
    let query = supabase
      .from('crowd_reports')
      .select('*')
      .eq('airport_code', airportCode.toUpperCase())
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (locationType) query = query.eq('location_type', locationType);
    if (locationId)   query = query.eq('location_id', locationId);

    const { data, error } = await query;
    if (error) throw error;
    return (data as DbCrowdReport[]).map(mapReport);
  },

  /** Aggregated signals via DB function (preferred for display) */
  async getSignals(
    airportCode: string,
    locationType?: ReportLocationType,
    locationId?: string,
    maxAgeMinutes = 120,
  ): Promise<CrowdSignal[]> {
    const { data, error } = await supabase.rpc('get_crowd_signals', {
      p_airport_code:  airportCode.toUpperCase(),
      p_location_type: locationType ?? null,
      p_location_id:   locationId ?? null,
      p_max_age_min:   maxAgeMinutes,
    });
    if (error) throw error;
    return (data as DbCrowdSignalRow[]).map(mapSignal);
  },

  /** Submit a new crowd report */
  async submit(
    input: CreateCrowdReportInput,
    userId?: string,
  ): Promise<CrowdReport> {
    const coords = input.coordinates
      ? `SRID=4326;POINT(${input.coordinates.lng} ${input.coordinates.lat})`
      : null;

    const { data, error } = await supabase
      .from('crowd_reports')
      .insert({
        user_id:        userId ?? null,
        is_anonymous:   input.isAnonymous ?? !userId,
        airport_code:   input.airportCode.toUpperCase(),
        airport_id:     input.airportId,
        terminal_id:    input.terminalId,
        location_type:  input.locationType,
        location_id:    input.locationId,
        location_label: input.locationLabel,
        coordinates:    coords,
        type:           input.type,
        severity:       input.severity ?? 3,
        description:    input.description,
      })
      .select()
      .single();
    if (error) throw error;
    return mapReport(data as DbCrowdReport);
  },

  /** Vote on a report (calls DB function for atomic upvote/downvote) */
  async vote(reportId: string, userId: string, vote: 1 | -1): Promise<void> {
    const { error } = await supabase.rpc('vote_on_report', {
      p_report_id: reportId,
      p_user_id:   userId,
      p_vote:      vote,
    });
    if (error) throw error;
  },

  /** Soft-delete own report */
  async retract(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('crowd_reports')
      .update({ is_active: false })
      .eq('id', reportId);
    if (error) throw error;
  },

  /** Subscribe to new reports at an airport */
  subscribeToAirport(
    airportCode: string,
    onReport: (report: CrowdReport) => void,
  ) {
    const channel = supabase
      .channel(`crowd-${airportCode}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crowd_reports',
          filter: `airport_code=eq.${airportCode.toUpperCase()}`,
        },
        (payload) => onReport(mapReport(payload.new as DbCrowdReport)),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },

  /** Subscribe to report updates (upvotes, verifications) */
  subscribeToUpdates(
    reportId: string,
    onUpdate: (report: CrowdReport) => void,
  ) {
    const channel = supabase
      .channel(`crowd-report-${reportId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crowd_reports',
          filter: `id=eq.${reportId}`,
        },
        (payload) => onUpdate(mapReport(payload.new as DbCrowdReport)),
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};

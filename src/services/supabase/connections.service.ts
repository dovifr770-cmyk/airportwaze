import { supabase } from './client';
import type { DbUserConnection, DbFlight, ConnectionRisk } from '../../types/database';
import type { UserConnection, ConnectionAnalysis } from '../../types/models/flight';
import { analyzeConnection } from '../../types/models/flight';
import { flightsService } from './flights.service';

// ── Mapper ────────────────────────────────────────────────

function mapConnection(row: DbUserConnection): UserConnection {
  return {
    id:                    row.id,
    userId:                row.user_id,
    inboundFlightId:       row.inbound_flight_id ?? undefined,
    inboundFlightNumber:   row.inbound_flight_number,
    outboundFlightId:      row.outbound_flight_id ?? undefined,
    outboundFlightNumber:  row.outbound_flight_number,
    connectionDate:        row.connection_date,
    layoverAirportCode:    row.layover_airport_code,
    connectionTimeMinutes: row.connection_time_min ?? undefined,
    walkingTimeMinutes:    row.walking_time_min ?? undefined,
    bufferMinutes:         row.buffer_min ?? undefined,
    riskLevel:             row.risk_level ?? undefined,
    isActive:              row.is_active,
    createdAt:             new Date(row.created_at),
    updatedAt:             new Date(row.updated_at),
  };
}

// ── Service ───────────────────────────────────────────────

export const connectionsService = {

  /** User's active connections */
  async listActive(userId: string): Promise<UserConnection[]> {
    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('connection_date', { ascending: false });
    if (error) throw error;

    const connections = (data as DbUserConnection[]).map(mapConnection);

    // Populate flight data
    const flightIds = [
      ...connections.map((c) => c.inboundFlightId),
      ...connections.map((c) => c.outboundFlightId),
    ].filter(Boolean) as string[];

    if (flightIds.length) {
      const { data: flights } = await supabase
        .from('flights')
        .select('*')
        .in('id', flightIds);

      if (flights) {
        const flightMap = Object.fromEntries(
          (flights as DbFlight[]).map((f) => [
            f.id,
            { ...f } as any,
          ])
        );
        for (const conn of connections) {
          if (conn.inboundFlightId  && flightMap[conn.inboundFlightId])
            conn.inboundFlight  = flightMap[conn.inboundFlightId];
          if (conn.outboundFlightId && flightMap[conn.outboundFlightId])
            conn.outboundFlight = flightMap[conn.outboundFlightId];
        }
      }
    }

    return connections;
  },

  /** Create a connection pair */
  async create(
    userId: string,
    inboundFlightNumber: string,
    outboundFlightNumber: string,
    connectionDate: string,
    layoverAirportCode: string,
    walkingTimeMinutes?: number,
  ): Promise<UserConnection> {
    // Resolve flight IDs
    const [inbound, outbound] = await Promise.all([
      flightsService.getByNumber(inboundFlightNumber, connectionDate),
      flightsService.getByNumber(outboundFlightNumber, connectionDate),
    ]);

    // Pre-compute risk if both flights are known
    let connectionTimeMin: number | undefined;
    let riskLevel: ConnectionRisk | undefined;

    if (inbound && outbound) {
      const analysis = analyzeConnection(
        inbound,
        outbound,
        walkingTimeMinutes ?? 15,
      );
      connectionTimeMin = analysis.connectionTimeMinutes;
      riskLevel         = analysis.riskLevel;
    }

    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id:                userId,
        inbound_flight_id:      inbound?.id ?? null,
        inbound_flight_number:  inboundFlightNumber.toUpperCase(),
        outbound_flight_id:     outbound?.id ?? null,
        outbound_flight_number: outboundFlightNumber.toUpperCase(),
        connection_date:        connectionDate,
        layover_airport_code:   layoverAirportCode.toUpperCase(),
        connection_time_min:    connectionTimeMin,
        walking_time_min:       walkingTimeMinutes,
        risk_level:             riskLevel,
      })
      .select()
      .single();
    if (error) throw error;

    const conn = mapConnection(data as DbUserConnection);
    if (inbound)  conn.inboundFlight  = inbound;
    if (outbound) conn.outboundFlight = outbound;
    return conn;
  },

  /** Update the walking time (after route is computed) */
  async setWalkingTime(
    connectionId: string,
    walkingTimeMinutes: number,
  ): Promise<void> {
    const { error } = await supabase
      .from('user_connections')
      .update({ walking_time_min: walkingTimeMinutes, updated_at: new Date().toISOString() })
      .eq('id', connectionId);
    if (error) throw error;
  },

  /** Deactivate (user deletes connection) */
  async deactivate(connectionId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_connections')
      .update({ is_active: false })
      .eq('id', connectionId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /** Subscribe to risk level changes for a connection */
  subscribeToRisk(
    connectionId: string,
    onRiskChange: (conn: UserConnection) => void,
  ) {
    const channel = supabase
      .channel(`connection-risk-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_connections',
          filter: `id=eq.${connectionId}`,
        },
        (payload) => onRiskChange(mapConnection(payload.new as DbUserConnection)),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  /** Get live connection analysis (recalculated from fresh flight data) */
  async analyze(connectionId: string, walkingTimeMinutes?: number): Promise<ConnectionAnalysis | null> {
    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('id', connectionId)
      .single();
    if (error || !data) return null;

    const conn = mapConnection(data as DbUserConnection);
    if (!conn.inboundFlightId || !conn.outboundFlightId) return null;

    const [inbound, outbound] = await Promise.all([
      flightsService.getById(conn.inboundFlightId),
      flightsService.getById(conn.outboundFlightId),
    ]);

    if (!inbound || !outbound) return null;

    return analyzeConnection(
      inbound,
      outbound,
      walkingTimeMinutes ?? conn.walkingTimeMinutes ?? 15,
    );
  },
};

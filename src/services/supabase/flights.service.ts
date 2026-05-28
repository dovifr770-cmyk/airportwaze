import { supabase } from './client';
import type {
  DbFlight,
  DbUserTrackedFlight,
  DbFlightChange,
  FlightStatusType,
  TrackingRole,
} from '../../types/database';
import type { Flight, TrackedFlight, FlightChange, AirportRef } from '../../types/models/flight';

// ── Helpers ───────────────────────────────────────────────

const UNKNOWN_AIRPORT: AirportRef = {
  code: '???', name: 'Unknown', city: '', country: '', timezone: '',
};

function airportRef(code: string): AirportRef {
  return { ...UNKNOWN_AIRPORT, code };
}

// ── Mappers ───────────────────────────────────────────────

function mapFlight(row: DbFlight): Flight {
  return {
    id:                    row.id,
    flightNumber:          row.flight_number,
    airline:               row.airline,
    airlineCode:           row.airline_code,
    aircraftType:          row.aircraft_type ?? undefined,
    aircraftRegistration:  row.aircraft_registration ?? undefined,
    origin:                airportRef(row.origin_code),
    destination:           airportRef(row.destination_code),
    departureTerminal:     row.departure_terminal ?? undefined,
    departureGateId:       row.departure_gate_id ?? undefined,
    departureGateCode:     row.departure_gate_code ?? undefined,
    scheduledDeparture:    new Date(row.scheduled_departure),
    estimatedDeparture:    row.estimated_departure ? new Date(row.estimated_departure) : undefined,
    actualDeparture:       row.actual_departure    ? new Date(row.actual_departure)    : undefined,
    departureDelayMinutes: row.departure_delay_min,
    arrivalTerminal:       row.arrival_terminal ?? undefined,
    arrivalGateId:         row.arrival_gate_id ?? undefined,
    arrivalGateCode:       row.arrival_gate_code ?? undefined,
    scheduledArrival:      new Date(row.scheduled_arrival),
    estimatedArrival:      row.estimated_arrival ? new Date(row.estimated_arrival) : undefined,
    actualArrival:         row.actual_arrival    ? new Date(row.actual_arrival)    : undefined,
    arrivalDelayMinutes:   row.arrival_delay_min,
    status:                row.status,
    cancellationReason:    row.cancellation_reason ?? undefined,
    baggageClaim:          row.baggage_claim ?? undefined,
    codeshareNumbers:      row.codeshare_numbers,
    dataSource:            row.data_source,
    lastSyncedAt:          new Date(row.last_synced_at),
    createdAt:             new Date(row.created_at),
    updatedAt:             new Date(row.updated_at),
  };
}

function mapTrackedFlight(row: DbUserTrackedFlight, flight?: Flight): TrackedFlight {
  return {
    id:                  row.id,
    userId:              row.user_id,
    flightId:            row.flight_id ?? undefined,
    flightNumber:        row.flight_number,
    flightDate:          row.flight_date,
    role:                row.role,
    notes:               row.notes ?? undefined,
    notifyGateChanges:   row.notify_gate_changes,
    notifyDelays:        row.notify_delays,
    notifyBoarding:      row.notify_boarding,
    notifyCancellation:  row.notify_cancellation,
    addedAt:             new Date(row.added_at),
    flight,
  };
}

function mapChange(row: DbFlightChange): FlightChange {
  return {
    id:             row.id,
    flightId:       row.flight_id,
    changeType:     row.change_type,
    previousValue:  row.previous_value ?? undefined,
    newValue:       row.new_value ?? undefined,
    changedAt:      new Date(row.changed_at),
    notifiedCount:  row.notified_count,
  };
}

// ── Service ───────────────────────────────────────────────

export const flightsService = {

  /** Fetch by flight ID (primary key) */
  async getById(id: string): Promise<Flight | null> {
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .eq('id', id)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapFlight(data as DbFlight) : null;
  },

  /** Latest flight record for a given number (date optional) */
  async getByNumber(flightNumber: string, date?: string): Promise<Flight | null> {
    let query = supabase
      .from('flights')
      .select('*')
      .ilike('flight_number', flightNumber.toUpperCase())
      .order('scheduled_departure', { ascending: false });

    if (date) {
      const start = `${date}T00:00:00Z`;
      const end   = `${date}T23:59:59Z`;
      query = query.gte('scheduled_departure', start).lte('scheduled_departure', end);
    }

    const { data, error } = await query.limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapFlight(data as DbFlight) : null;
  },

  /** Upsert flight from AviationStack sync */
  async upsert(flight: Flight): Promise<void> {
    const { error } = await supabase.from('flights').upsert({
      id:                    flight.id,
      flight_number:         flight.flightNumber,
      airline:               flight.airline,
      airline_code:          flight.airlineCode,
      aircraft_type:         flight.aircraftType,
      aircraft_registration: flight.aircraftRegistration,
      origin_code:           flight.origin.code,
      destination_code:      flight.destination.code,
      departure_terminal:    flight.departureTerminal,
      departure_gate_code:   flight.departureGateCode,
      scheduled_departure:   flight.scheduledDeparture.toISOString(),
      estimated_departure:   flight.estimatedDeparture?.toISOString(),
      actual_departure:      flight.actualDeparture?.toISOString(),
      departure_delay_min:   flight.departureDelayMinutes,
      arrival_terminal:      flight.arrivalTerminal,
      arrival_gate_code:     flight.arrivalGateCode,
      scheduled_arrival:     flight.scheduledArrival.toISOString(),
      estimated_arrival:     flight.estimatedArrival?.toISOString(),
      actual_arrival:        flight.actualArrival?.toISOString(),
      arrival_delay_min:     flight.arrivalDelayMinutes,
      status:                flight.status,
      cancellation_reason:   flight.cancellationReason,
      baggage_claim:         flight.baggageClaim,
      last_synced_at:        new Date().toISOString(),
    });
    if (error) throw error;
  },

  // ── User-tracked flights ──────────────────────────────

  /** Tracked flights for a user (with joined flight data) */
  async listTracked(userId: string): Promise<TrackedFlight[]> {
    const { data: tracked, error: te } = await supabase
      .from('user_tracked_flights')
      .select('*')
      .eq('user_id', userId)
      .order('flight_date', { ascending: false });
    if (te) throw te;

    const flightIds = (tracked as DbUserTrackedFlight[])
      .map((t) => t.flight_id)
      .filter(Boolean) as string[];

    let flightsMap: Record<string, Flight> = {};
    if (flightIds.length) {
      const { data: flights, error: fe } = await supabase
        .from('flights')
        .select('*')
        .in('id', flightIds);
      if (fe) throw fe;
      flightsMap = Object.fromEntries(
        (flights as DbFlight[]).map((f) => [f.id, mapFlight(f)])
      );
    }

    return (tracked as DbUserTrackedFlight[]).map((t) =>
      mapTrackedFlight(t, t.flight_id ? flightsMap[t.flight_id] : undefined)
    );
  },

  /** Add a flight to user's tracker */
  async trackFlight(
    userId: string,
    flightNumber: string,
    flightDate: string,
    role: TrackingRole = 'tracking',
  ): Promise<TrackedFlight> {
    // Try to link to an existing synced flight
    const existing = await flightsService.getByNumber(flightNumber, flightDate);

    const { data, error } = await supabase
      .from('user_tracked_flights')
      .upsert({
        user_id:       userId,
        flight_id:     existing?.id ?? null,
        flight_number: flightNumber.toUpperCase(),
        flight_date:   flightDate,
        role,
      })
      .select()
      .single();
    if (error) throw error;
    return mapTrackedFlight(data as DbUserTrackedFlight, existing ?? undefined);
  },

  /** Remove from tracker */
  async untrackFlight(userId: string, trackedId: string): Promise<void> {
    const { error } = await supabase
      .from('user_tracked_flights')
      .delete()
      .eq('id', trackedId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // ── Flight changes ────────────────────────────────────

  /** Recent change history for a flight */
  async getChanges(flightId: string, limit = 10): Promise<FlightChange[]> {
    const { data, error } = await supabase
      .from('flight_changes')
      .select('*')
      .eq('flight_id', flightId)
      .order('changed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as DbFlightChange[]).map(mapChange);
  },

  // ── Real-time subscriptions ───────────────────────────

  /** Subscribe to status updates for a set of flights */
  subscribeToFlights(
    flightIds: string[],
    onUpdate: (flight: Flight) => void,
  ) {
    if (!flightIds.length) return () => {};
    const channel = supabase
      .channel(`flights-${flightIds.join('-').slice(0, 40)}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flights',
          filter: `id=in.(${flightIds.join(',')})`,
        },
        (payload) => onUpdate(mapFlight(payload.new as DbFlight)),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },

  /** Subscribe to gate/status change events */
  subscribeToChanges(
    flightId: string,
    onChange: (change: FlightChange) => void,
  ) {
    const channel = supabase
      .channel(`flight-changes-${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'flight_changes',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => onChange(mapChange(payload.new as DbFlightChange)),
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  },
};

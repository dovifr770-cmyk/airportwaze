import { supabase } from './client';
import type {
  DbParkingZone,
  DbParkingPricingTier,
  DbParkingOptionRow,
} from '../../types/database';
import type {
  ParkingZone,
  ParkingPricingTier,
  ParkingTier,
} from '../../types/models/parking';

// ── Mappers ───────────────────────────────────────────────

function mapPricingTier(row: DbParkingPricingTier): ParkingPricingTier {
  return {
    id:             row.id,
    parkingZoneId:  row.parking_zone_id,
    label:          row.label,
    minHours:       row.min_hours,
    maxHours:       row.max_hours ?? undefined,
    ratePerHour:    row.rate_per_hour ?? undefined,
    flatRate:       row.flat_rate ?? undefined,
    displayOrder:   row.display_order,
    createdAt:      new Date(row.created_at),
  };
}

function mapZone(row: DbParkingZone, tiers: ParkingPricingTier[] = []): ParkingZone {
  const coords = row.coordinates as any;
  return {
    id:                      row.id,
    airportId:               row.airport_id,
    airportCode:             row.airport_code,
    name:                    row.name,
    shortCode:               row.short_code ?? undefined,
    description:             row.description ?? undefined,
    type:                    row.type,
    tier:                    row.tier,
    coordinates:             coords?.coordinates
      ? { lat: coords.coordinates[1], lng: coords.coordinates[0] }
      : undefined,
    address:                 row.address ?? undefined,
    primaryTerminalId:       row.primary_terminal_id ?? undefined,
    distanceToTerminalMeters: row.distance_to_terminal_m ?? undefined,
    walkingTimeMinutes:      row.walking_time_min ?? undefined,
    shuttleTimeMinutes:      row.shuttle_time_min ?? undefined,
    shuttleFrequencyMinutes: row.shuttle_frequency_min ?? undefined,
    totalSpaces:             row.total_spaces,
    totalDisabledSpaces:     row.total_disabled_spaces,
    totalEvSpaces:           row.total_ev_spaces,
    totalOversizedSpaces:    row.total_oversized_spaces,
    availableSpaces:         row.available_spaces ?? undefined,
    availableDisabled:       row.available_disabled ?? undefined,
    availableEv:             row.available_ev ?? undefined,
    availabilitySource:      row.availability_source ?? undefined,
    availabilityUpdatedAt:   row.availability_updated_at
      ? new Date(row.availability_updated_at) : undefined,
    currency:                row.currency,
    ratePerHour:             row.rate_per_hour ?? undefined,
    ratePerDay:              row.rate_per_day ?? undefined,
    ratePerWeek:             row.rate_per_week ?? undefined,
    rateMonthly:             row.rate_monthly ?? undefined,
    isFree:                  row.is_free,
    freeMinutes:             row.free_minutes ?? undefined,
    maxStayHours:            row.max_stay_hours ?? undefined,
    features:                row.features as ParkingZone['features'],
    requiresBooking:         row.requires_booking,
    bookingUrl:              row.booking_url ?? undefined,
    bookingProvider:         row.booking_provider ?? undefined,
    isActive:                row.is_active,
    isOpen24h:               row.is_open_24h,
    operatingHours:          row.operating_hours as Record<string, string> | undefined,
    createdAt:               new Date(row.created_at),
    updatedAt:               new Date(row.updated_at),
    pricingTiers:            tiers,
  };
}

// ── Service ───────────────────────────────────────────────

export const parkingService = {

  /** All active parking zones for an airport */
  async listByAirport(airportCode: string): Promise<ParkingZone[]> {
    const { data: zones, error: ze } = await supabase
      .from('parking_zones')
      .select('*')
      .eq('airport_code', airportCode.toUpperCase())
      .eq('is_active', true)
      .order('walking_time_min', { ascending: true });
    if (ze) throw ze;

    const zoneIds = (zones as DbParkingZone[]).map((z) => z.id);
    const { data: tiers, error: te } = await supabase
      .from('parking_pricing_tiers')
      .select('*')
      .in('parking_zone_id', zoneIds)
      .order('display_order');
    if (te) throw te;

    const tiersByZone = (tiers as DbParkingPricingTier[]).reduce<
      Record<string, ParkingPricingTier[]>
    >((acc, t) => {
      (acc[t.parking_zone_id] ??= []).push(mapPricingTier(t));
      return acc;
    }, {});

    return (zones as DbParkingZone[]).map((z) => mapZone(z, tiersByZone[z.id] ?? []));
  },

  /** Filtered parking options via DB function */
  async getOptions(
    airportCode: string,
    tier?: ParkingTier,
    onlyAvailable = false,
  ): Promise<DbParkingOptionRow[]> {
    const { data, error } = await supabase.rpc('get_parking_options', {
      p_airport_code:    airportCode.toUpperCase(),
      p_tier:            tier ?? null,
      p_only_available:  onlyAvailable,
    });
    if (error) throw error;
    return data as DbParkingOptionRow[];
  },

  /** Real-time availability update (called by external feed / webhook) */
  async updateAvailability(
    zoneId: string,
    available: number,
    availableDisabled?: number,
    availableEv?: number,
    source = 'api',
  ): Promise<void> {
    const { error } = await supabase
      .from('parking_zones')
      .update({
        available_spaces:        available,
        available_disabled:      availableDisabled,
        available_ev:            availableEv,
        availability_source:     source,
        availability_updated_at: new Date().toISOString(),
      })
      .eq('id', zoneId);
    if (error) throw error;
  },

  /** Subscribe to live availability changes for an airport */
  subscribeAvailability(
    airportCode: string,
    onUpdate: (zone: Pick<ParkingZone, 'id' | 'availableSpaces' | 'availabilityUpdatedAt'>) => void,
  ) {
    const channel = supabase
      .channel(`parking-availability-${airportCode}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'parking_zones',
          filter: `airport_code=eq.${airportCode.toUpperCase()}`,
        },
        (payload) => {
          const row = payload.new as DbParkingZone;
          onUpdate({
            id:                    row.id,
            availableSpaces:       row.available_spaces ?? undefined,
            availabilityUpdatedAt: row.availability_updated_at
              ? new Date(row.availability_updated_at) : undefined,
          });
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};

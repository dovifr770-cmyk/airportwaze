import { supabase } from './client';
import type { DbAirport, DbTerminal, DbTerminalFloor } from '../../types/database';
import type { Airport, Terminal, TerminalFloor } from '../../types/models/airport';

// ── Mappers ───────────────────────────────────────────────

function mapFloor(row: DbTerminalFloor): TerminalFloor {
  return {
    id: row.id,
    terminalId: row.terminal_id,
    level: row.level,
    name: row.name,
    mapSvgUrl: row.map_svg_url ?? undefined,
    mapImgUrl: row.map_img_url ?? undefined,
    boundingBox: row.bbox_min_lat != null ? {
      minLat: row.bbox_min_lat,
      minLng: row.bbox_min_lng!,
      maxLat: row.bbox_max_lat!,
      maxLng: row.bbox_max_lng!,
    } : undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapTerminal(row: DbTerminal, floors: TerminalFloor[] = []): Terminal {
  return {
    id: row.id,
    airportId: row.airport_id,
    name: row.name,
    code: row.code,
    floors,
    createdAt: new Date(row.created_at),
  };
}

function mapAirport(row: DbAirport, terminals: Terminal[] = []): Airport {
  // coordinates is stored as PostGIS geometry — Supabase returns as GeoJSON
  const coords = row.coordinates as any;
  return {
    id: row.id,
    iataCode: row.iata_code,
    icaoCode: row.icao_code ?? undefined,
    name: row.name,
    city: row.city,
    country: row.country,
    timezone: row.timezone,
    coordinates: {
      lat: coords?.coordinates?.[1] ?? 0,
      lng: coords?.coordinates?.[0] ?? 0,
    },
    isSupported: row.is_supported,
    terminals,
    createdAt: new Date(row.created_at),
  };
}

// ── Service ───────────────────────────────────────────────

export const airportsService = {

  /** All supported airports (for search / picker) */
  async listSupported(): Promise<Airport[]> {
    const { data, error } = await supabase
      .from('airports')
      .select('*')
      .eq('is_supported', true)
      .order('name');
    if (error) throw error;
    return (data as DbAirport[]).map((row) => mapAirport(row));
  },

  /** Full airport with terminals + floors */
  async getByCode(iataCode: string): Promise<Airport | null> {
    const { data: airport, error: ae } = await supabase
      .from('airports')
      .select('*')
      .eq('iata_code', iataCode.toUpperCase())
      .single();
    if (ae) throw ae;
    if (!airport) return null;

    const { data: terminals, error: te } = await supabase
      .from('terminals')
      .select('*')
      .eq('airport_id', airport.id)
      .order('name');
    if (te) throw te;

    const terminalIds = (terminals as DbTerminal[]).map((t) => t.id);

    const { data: floors, error: fe } = await supabase
      .from('terminal_floors')
      .select('*')
      .in('terminal_id', terminalIds)
      .order('level');
    if (fe) throw fe;

    const floorsByTerminal = (floors as DbTerminalFloor[]).reduce<
      Record<string, TerminalFloor[]>
    >((acc, f) => {
      (acc[f.terminal_id] ??= []).push(mapFloor(f));
      return acc;
    }, {});

    const mappedTerminals = (terminals as DbTerminal[]).map((t) =>
      mapTerminal(t, floorsByTerminal[t.id] ?? [])
    );

    return mapAirport(airport as DbAirport, mappedTerminals);
  },

  /** Insert a new airport (admin/seeding use) */
  async upsert(airport: {
    iataCode: string;
    icaoCode?: string;
    name: string;
    city: string;
    country: string;
    timezone: string;
    lat: number;
    lng: number;
    isSupported?: boolean;
  }): Promise<void> {
    const { error } = await supabase.from('airports').upsert({
      iata_code:    airport.iataCode,
      icao_code:    airport.icaoCode,
      name:         airport.name,
      city:         airport.city,
      country:      airport.country,
      timezone:     airport.timezone,
      // Store as PostGIS WKT via raw SQL — or use the PostGIS extension
      // In Supabase you can pass GeoJSON as a string with ST_GeomFromGeoJSON
      is_supported: airport.isSupported ?? false,
    });
    if (error) throw error;
  },
};

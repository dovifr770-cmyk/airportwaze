import { supabase } from './client';
import type { DbPoi, DbGate, DbNavigationEdge, PoiType } from '../../types/database';
import type { Poi, Gate, NavigationEdge, RouteStep, GeoCoords } from '../../types/models/poi';

// ── Mappers ───────────────────────────────────────────────

function coordsFromGeom(geom: any): GeoCoords | undefined {
  if (!geom?.coordinates) return undefined;
  return { lat: geom.coordinates[1], lng: geom.coordinates[0] };
}

function mapPoi(row: DbPoi): Poi {
  return {
    id: row.id,
    airportId: row.airport_id,
    terminalId: row.terminal_id ?? undefined,
    floorId: row.floor_id ?? undefined,
    name: row.name,
    shortName: row.short_name ?? undefined,
    type: row.type,
    floorLevel: row.floor_level,
    coordinates: coordsFromGeom(row.coordinates),
    indoorCoords: (row.indoor_x != null && row.indoor_y != null)
      ? { x: row.indoor_x, y: row.indoor_y }
      : undefined,
    description: row.description ?? undefined,
    hours: row.hours ?? undefined,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    isAccessible: row.is_accessible,
    isActive: row.is_active,
    features: row.features,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapGate(row: DbGate): Gate {
  return {
    id: row.id,
    poiId: row.poi_id ?? undefined,
    airportId: row.airport_id,
    terminalId: row.terminal_id ?? undefined,
    floorId: row.floor_id ?? undefined,
    code: row.code,
    fullCode: row.full_code ?? undefined,
    floorLevel: row.floor_level,
    status: row.status,
    type: row.type,
    adjacentGateIds: row.adjacent_gate_ids,
    airlines: row.airlines,
    coordinates: coordsFromGeom(row.coordinates),
    indoorCoords: (row.indoor_x != null && row.indoor_y != null)
      ? { x: row.indoor_x, y: row.indoor_y }
      : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapEdge(row: DbNavigationEdge): NavigationEdge {
  return {
    id: row.id,
    airportId: row.airport_id,
    fromPoiId: row.from_poi_id,
    toPoiId: row.to_poi_id,
    distanceMeters: row.distance_meters,
    walkSeconds: row.walk_seconds,
    runSeconds: row.run_seconds ?? undefined,
    wheelchairSeconds: row.wheelchair_seconds ?? undefined,
    requiresSecurity: row.requires_security,
    requiresCustoms: row.requires_customs,
    usesElevator: row.uses_elevator,
    usesEscalator: row.uses_escalator,
    usesMovingWalkway: row.uses_moving_walkway,
    isAccessible: row.is_accessible,
    steps: (row.steps as RouteStep[]) ?? [],
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

// ── Service ───────────────────────────────────────────────

export const poisService = {

  /** All POIs in an airport, optionally filtered by type */
  async listByAirport(airportId: string, types?: PoiType[]): Promise<Poi[]> {
    let query = supabase
      .from('pois')
      .select('*')
      .eq('airport_id', airportId)
      .eq('is_active', true);

    if (types?.length) {
      query = query.in('type', types);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data as DbPoi[]).map(mapPoi);
  },

  /** POIs in a specific terminal */
  async listByTerminal(terminalId: string, types?: PoiType[]): Promise<Poi[]> {
    let query = supabase
      .from('pois')
      .select('*')
      .eq('terminal_id', terminalId)
      .eq('is_active', true);

    if (types?.length) query = query.in('type', types);

    const { data, error } = await query.order('floor_level').order('name');
    if (error) throw error;
    return (data as DbPoi[]).map(mapPoi);
  },

  /** All gates in an airport */
  async getGatesByAirport(airportId: string): Promise<Gate[]> {
    const { data, error } = await supabase
      .from('gates')
      .select('*')
      .eq('airport_id', airportId)
      .order('code');
    if (error) throw error;
    return (data as DbGate[]).map(mapGate);
  },

  /** Gates in a terminal */
  async getGatesByTerminal(terminalId: string): Promise<Gate[]> {
    const { data, error } = await supabase
      .from('gates')
      .select('*')
      .eq('terminal_id', terminalId)
      .order('code');
    if (error) throw error;
    return (data as DbGate[]).map(mapGate);
  },

  /** Single gate by code within an airport */
  async getGateByCode(airportId: string, code: string): Promise<Gate | null> {
    const { data, error } = await supabase
      .from('gates')
      .select('*')
      .eq('airport_id', airportId)
      .ilike('code', code)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapGate(data as DbGate) : null;
  },

  /** Navigation edge between two POIs */
  async getEdge(fromPoiId: string, toPoiId: string): Promise<NavigationEdge | null> {
    const { data, error } = await supabase
      .from('navigation_edges')
      .select('*')
      .eq('from_poi_id', fromPoiId)
      .eq('to_poi_id', toPoiId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? mapEdge(data as DbNavigationEdge) : null;
  },

  /** All edges from a given POI (for Dijkstra/A* pathfinding) */
  async getEdgesFrom(fromPoiId: string): Promise<NavigationEdge[]> {
    const { data, error } = await supabase
      .from('navigation_edges')
      .select('*')
      .eq('from_poi_id', fromPoiId);
    if (error) throw error;
    return (data as DbNavigationEdge[]).map(mapEdge);
  },

  /** Full navigation graph for an airport (for offline routing) */
  async getFullGraph(airportId: string): Promise<NavigationEdge[]> {
    const { data, error } = await supabase
      .from('navigation_edges')
      .select('*')
      .eq('airport_id', airportId);
    if (error) throw error;
    return (data as DbNavigationEdge[]).map(mapEdge);
  },

  /** Search POIs by name */
  async search(airportId: string, query: string): Promise<Poi[]> {
    const { data, error } = await supabase
      .from('pois')
      .select('*')
      .eq('airport_id', airportId)
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(20);
    if (error) throw error;
    return (data as DbPoi[]).map(mapPoi);
  },

  /** Update gate status (called when flight data changes) */
  async updateGateStatus(gateId: string, status: Gate['status']): Promise<void> {
    const { error } = await supabase
      .from('gates')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', gateId);
    if (error) throw error;
  },
};

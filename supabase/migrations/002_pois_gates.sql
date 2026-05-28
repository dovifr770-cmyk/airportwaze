-- ══════════════════════════════════════════════════════════
-- Migration 002: POIs, Gates, Indoor Map Structure
-- ══════════════════════════════════════════════════════════

-- All possible point-of-interest types
create type poi_type as enum (
  -- Navigation nodes
  'gate',
  'elevator',
  'escalator',
  'stairs',
  'moving_walkway',
  -- Security / border
  'security_checkpoint',
  'customs',
  'passport_control',
  'baggage_claim',
  -- Services
  'information_desk',
  'check_in',
  'lost_and_found',
  'first_aid',
  'medical',
  'prayer_room',
  'nursing_room',
  'shower',
  'left_luggage',
  'charging_station',
  -- Food & drink
  'restaurant',
  'cafe',
  'bar',
  'fast_food',
  'vending',
  -- Retail
  'shop',
  'duty_free',
  'pharmacy',
  'atm',
  'currency_exchange',
  'newsstand',
  -- Lounges & premium
  'lounge',
  'hotel',
  'spa',
  'gym',
  -- Conveniences
  'restroom',
  'restroom_family',
  'smoking_area',
  'pet_relief'
);

-- ─────────────────────────────────────────
-- Terminal floors (indoor map layers)
-- ─────────────────────────────────────────
create table terminal_floors (
  id          uuid primary key default uuid_generate_v4(),
  terminal_id uuid references terminals(id) on delete cascade,
  level       int    not null,
  name        text   not null,   -- e.g. "Departures Level", "Level 2"
  map_svg_url text,              -- hosted SVG floor plan
  map_img_url text,              -- raster fallback
  -- Bounding box for coordinate mapping (WGS84)
  bbox_min_lat numeric(10,7),
  bbox_min_lng numeric(10,7),
  bbox_max_lat numeric(10,7),
  bbox_max_lng numeric(10,7),
  created_at  timestamptz default now(),
  unique (terminal_id, level)
);

-- ─────────────────────────────────────────
-- POIs (all navigable points in an airport)
-- ─────────────────────────────────────────
create table pois (
  id             uuid        primary key default uuid_generate_v4(),
  airport_id     uuid        references airports(id) on delete cascade,
  terminal_id    uuid        references terminals(id) on delete set null,
  floor_id       uuid        references terminal_floors(id) on delete set null,
  name           text        not null,
  short_name     text,                    -- e.g. "Gate A1"
  type           poi_type    not null,
  floor_level    int         not null default 0,
  -- Real-world GPS coordinates
  coordinates    geometry(Point, 4326),
  -- Indoor map coordinates: 0.0–1.0 normalised to floor plan image
  indoor_x       numeric(6,4),
  indoor_y       numeric(6,4),
  -- Display & info
  description    text,
  hours          text,                    -- "06:00–23:00" or "24/7"
  phone          text,
  website        text,
  -- Attributes
  is_accessible  boolean     default true,   -- wheelchair accessible
  is_active      boolean     default true,
  features       text[]      default '{}',   -- freeform tags
  metadata       jsonb       default '{}',   -- e.g. lounge access rules, menu URL
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

comment on column pois.indoor_x is '0=left edge, 1=right edge of floor plan image';
comment on column pois.indoor_y is '0=top edge, 1=bottom edge of floor plan image';

-- ─────────────────────────────────────────
-- Gates (specialisation of POI)
-- ─────────────────────────────────────────
create type gate_status as enum (
  'open', 'boarding', 'gate_closed', 'departed', 'arriving', 'closed', 'maintenance'
);

create type gate_type as enum (
  'domestic', 'international', 'both', 'private', 'charter'
);

create table gates (
  id            uuid        primary key default uuid_generate_v4(),
  poi_id        uuid        references pois(id) on delete cascade unique,
  airport_id    uuid        references airports(id) on delete cascade,
  terminal_id   uuid        references terminals(id) on delete set null,
  floor_id      uuid        references terminal_floors(id) on delete set null,
  code          text        not null,    -- "A1", "B12"
  full_code     text,                    -- "JFK-T4-B12" — globally unique
  floor_level   int         default 0,
  status        gate_status default 'open',
  type          gate_type   default 'domestic',
  -- Navigation graph helpers
  adjacent_gate_ids uuid[]  default '{}',   -- ordered nearest neighbours
  airlines           text[] default '{}',   -- airlines typically using this gate
  -- Indoor positioning
  coordinates   geometry(Point, 4326),
  indoor_x      numeric(6,4),
  indoor_y      numeric(6,4),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (airport_id, terminal_id, code)
);

-- ─────────────────────────────────────────
-- Navigation graph edges
-- Pre-computed walking paths between ANY two POIs.
-- Populated offline via airport floor plan analysis.
-- ─────────────────────────────────────────
create table navigation_edges (
  id                   uuid primary key default uuid_generate_v4(),
  airport_id           uuid references airports(id) on delete cascade,
  from_poi_id          uuid references pois(id) on delete cascade,
  to_poi_id            uuid references pois(id) on delete cascade,
  -- Distances & time estimates
  distance_meters      int  not null,
  walk_seconds         int  not null,    -- at 1.4 m/s base speed
  run_seconds          int,              -- at 2.5 m/s
  wheelchair_seconds   int,              -- at 0.9 m/s
  -- Edge properties that affect routing
  requires_security    boolean default false,
  requires_customs     boolean default false,
  uses_elevator        boolean default false,
  uses_escalator       boolean default false,
  uses_moving_walkway  boolean default false,
  is_accessible        boolean default true,
  -- Turn-by-turn steps stored as ordered JSONB array
  -- [{instruction, landmark, distance_m, direction, lat, lng}]
  steps                jsonb   not null default '[]',
  notes                text,
  created_at           timestamptz default now(),
  unique (from_poi_id, to_poi_id)
);

comment on column navigation_edges.steps is
  'Ordered array of {instruction, landmark?, distance_m, direction, lat, lng}';

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
create index pois_airport_idx    on pois(airport_id);
create index pois_terminal_idx   on pois(terminal_id);
create index pois_type_idx       on pois(type);
create index pois_active_idx     on pois(is_active) where is_active = true;
create index pois_geom_idx       on pois using gist(coordinates);

create index gates_airport_idx   on gates(airport_id);
create index gates_terminal_idx  on gates(terminal_id);
create index gates_status_idx    on gates(status);
create index gates_code_idx      on gates(code);

create index nav_edges_from_idx  on navigation_edges(from_poi_id);
create index nav_edges_to_idx    on navigation_edges(to_poi_id);
create index nav_edges_airport   on navigation_edges(airport_id);

-- ─────────────────────────────────────────
-- Auto-timestamp triggers
-- ─────────────────────────────────────────
create trigger pois_updated_at  before update on pois  for each row execute function touch_updated_at();
create trigger gates_updated_at before update on gates for each row execute function touch_updated_at();

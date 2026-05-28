-- ══════════════════════════════════════════════════════════
-- Migration 005: Complete Flights, Connections, Gate Changes
-- Replaces the basic `flights` table from migration 001
-- ══════════════════════════════════════════════════════════

-- Drop the placeholder from migration 001
drop table if exists flights cascade;

create type flight_status_type as enum (
  'scheduled',
  'boarding',
  'gate_closed',
  'departed',
  'delayed',
  'cancelled',
  'diverted',
  'landed',
  'arriving'   -- flight is inbound and near destination
);

create type connection_risk as enum (
  'safe',       -- >= 25 min buffer after walking time
  'tight',      -- 10–24 min buffer
  'at_risk',    -- 1–9 min buffer
  'impossible'  -- no time to make it
);

-- ─────────────────────────────────────────
-- Core flights table
-- ─────────────────────────────────────────
create table flights (
  -- Identity
  id                      text              primary key,
  -- Format: "{IATA_number}_{scheduled_departure_UTC_ISO}"
  -- e.g. "UA123_2025-06-15T14:30:00Z"

  flight_number           text              not null,    -- "UA123"
  airline                 text              not null,
  airline_code            text              not null,    -- IATA "UA"
  aircraft_type           text,                          -- "Boeing 737-800"
  aircraft_registration   text,                          -- tail number

  -- Route
  origin_code             text              not null,    -- IATA airport
  destination_code        text              not null,
  origin_airport_id       uuid              references airports(id) on delete set null,
  destination_airport_id  uuid              references airports(id) on delete set null,

  -- Departure
  departure_terminal      text,
  departure_gate_id       uuid              references gates(id) on delete set null,
  departure_gate_code     text,                          -- denormalized for reads
  scheduled_departure     timestamptz       not null,
  estimated_departure     timestamptz,
  actual_departure        timestamptz,
  departure_delay_min     int               not null default 0,

  -- Arrival
  arrival_terminal        text,
  arrival_gate_id         uuid              references gates(id) on delete set null,
  arrival_gate_code       text,                          -- denormalized
  scheduled_arrival       timestamptz       not null,
  estimated_arrival       timestamptz,
  actual_arrival          timestamptz,
  arrival_delay_min       int               not null default 0,

  -- Status & extra
  status                  flight_status_type not null default 'scheduled',
  cancellation_reason     text,
  baggage_claim           text,                          -- carousel ID
  codeshare_numbers       text[]            default '{}',

  -- Data provenance
  data_source             text              default 'aviationstack',
  last_synced_at          timestamptz       default now(),
  created_at              timestamptz       default now(),
  updated_at              timestamptz       default now()
);

comment on column flights.id is
  'Composite key: {IATA_flight_number}_{scheduled_departure_UTC_ISO8601}';

-- ─────────────────────────────────────────
-- User-tracked flights
-- ─────────────────────────────────────────
create type tracking_role as enum (
  'tracking',   -- general watch
  'inbound',    -- arriving leg of a connection
  'outbound'    -- departing leg of a connection
);

create table user_tracked_flights (
  id                  uuid          primary key default uuid_generate_v4(),
  user_id             uuid          references user_profiles(id) on delete cascade,
  flight_id           text          references flights(id) on delete set null,
  -- Stored separately to track before the flight is synced into our DB
  flight_number       text          not null,
  flight_date         date          not null,
  role                tracking_role default 'tracking',
  notes               text,
  -- Per-flight notification preferences
  notify_gate_changes boolean       default true,
  notify_delays       boolean       default true,
  notify_boarding     boolean       default true,
  notify_cancellation boolean       default true,
  added_at            timestamptz   default now(),
  unique (user_id, flight_number, flight_date)
);

-- ─────────────────────────────────────────
-- User connections (inbound + outbound pair)
-- ─────────────────────────────────────────
create table user_connections (
  id                      uuid           primary key default uuid_generate_v4(),
  user_id                 uuid           references user_profiles(id) on delete cascade,

  -- Inbound flight (arriving at layover airport)
  inbound_flight_id       text           references flights(id) on delete set null,
  inbound_flight_number   text           not null,

  -- Outbound flight (departing from layover airport)
  outbound_flight_id      text           references flights(id) on delete set null,
  outbound_flight_number  text           not null,

  connection_date         date           not null,
  layover_airport_code    text           not null,

  -- Computed fields (kept in sync by trigger after flights update)
  connection_time_min     int,           -- outbound_dep - inbound_arr in minutes
  walking_time_min        int,           -- gate-to-gate from navigation_edges
  buffer_min              int generated always as
                          (coalesce(connection_time_min, 0) - coalesce(walking_time_min, 15))
                          stored,
  risk_level              connection_risk,
  is_active               boolean        default true,

  created_at              timestamptz    default now(),
  updated_at              timestamptz    default now()
);

-- ─────────────────────────────────────────
-- Flight change history
-- (drives push notifications + timeline display)
-- ─────────────────────────────────────────
create type flight_change_type as enum (
  'gate',
  'terminal',
  'status',
  'departure_delay',
  'arrival_delay',
  'cancellation',
  'aircraft'
);

create table flight_changes (
  id              uuid              primary key default uuid_generate_v4(),
  flight_id       text              references flights(id) on delete cascade,
  change_type     flight_change_type not null,
  previous_value  text,
  new_value       text,
  changed_at      timestamptz       default now(),
  notified_count  int               default 0    -- users notified about this change
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
create index flights_number_idx       on flights(flight_number);
create index flights_origin_idx       on flights(origin_code);
create index flights_destination_idx  on flights(destination_code);
create index flights_dep_idx          on flights(scheduled_departure);
create index flights_arr_idx          on flights(scheduled_arrival);
create index flights_status_idx       on flights(status);
create index flights_synced_idx       on flights(last_synced_at);

create index tracked_user_idx         on user_tracked_flights(user_id);
create index tracked_flight_idx       on user_tracked_flights(flight_id);
create index tracked_date_idx         on user_tracked_flights(flight_date);

create index connections_user_idx     on user_connections(user_id);
create index connections_airport_idx  on user_connections(layover_airport_code);
create index connections_date_idx     on user_connections(connection_date);
create index connections_risk_idx     on user_connections(risk_level);
create index connections_active_idx   on user_connections(is_active) where is_active = true;

create index changes_flight_idx       on flight_changes(flight_id);
create index changes_time_idx         on flight_changes(changed_at desc);

-- ─────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────
alter table user_tracked_flights enable row level security;
alter table user_connections     enable row level security;

-- Users only see their own tracked flights and connections
create policy "tracked_flights_own" on user_tracked_flights
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "connections_own" on user_connections
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Flights table is publicly readable (no PII)
alter table flights enable row level security;
create policy "flights_public_read" on flights for select using (true);

-- flight_changes readable by anyone (used for push notification dispatch)
alter table flight_changes enable row level security;
create policy "flight_changes_read" on flight_changes for select using (true);

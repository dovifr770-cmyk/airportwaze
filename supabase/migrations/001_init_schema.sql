-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ─────────────────────────────────────────
-- User profiles (extends auth.users)
-- ─────────────────────────────────────────
create table user_profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  email              text not null,
  full_name          text,
  avatar_url         text,
  preferred_airports text[]    default '{}',
  saved_flights      text[]    default '{}',
  settings           jsonb     default '{}',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─────────────────────────────────────────
-- Airports
-- ─────────────────────────────────────────
create table airports (
  id           uuid primary key default uuid_generate_v4(),
  iata_code    text unique not null,
  icao_code    text unique,
  name         text not null,
  city         text not null,
  country      text not null,
  timezone     text not null,
  coordinates  geometry(Point, 4326),
  is_supported boolean default false,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────
-- Terminals
-- ─────────────────────────────────────────
create table terminals (
  id          uuid primary key default uuid_generate_v4(),
  airport_id  uuid references airports(id) on delete cascade,
  name        text not null,
  code        text not null,
  floor_count int  default 1,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- Gates
-- ─────────────────────────────────────────
create table gates (
  id          uuid primary key default uuid_generate_v4(),
  terminal_id uuid references terminals(id) on delete cascade,
  airport_id  uuid references airports(id),
  code        text not null,
  floor_level int  default 1,
  coordinates geometry(Point, 4326),
  status      text default 'open'
              check (status in ('open', 'closed', 'boarding', 'departed')),
  amenities   text[] default '{}',
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- Flights (synced from aviation APIs via Edge Function)
-- ─────────────────────────────────────────
create table flights (
  id                   text primary key,
  flight_number        text not null,
  airline              text,
  airline_code         text,
  origin_code          text,
  destination_code     text,
  scheduled_departure  timestamptz,
  estimated_departure  timestamptz,
  actual_departure     timestamptz,
  scheduled_arrival    timestamptz,
  estimated_arrival    timestamptz,
  actual_arrival       timestamptz,
  gate                 text,
  terminal             text,
  status               text default 'scheduled',
  delay_minutes        int  default 0,
  raw_data             jsonb,
  last_synced_at       timestamptz default now(),
  created_at           timestamptz default now()
);

-- ─────────────────────────────────────────
-- Parking lots
-- ─────────────────────────────────────────
create table parking_lots (
  id                          uuid primary key default uuid_generate_v4(),
  airport_id                  uuid references airports(id),
  airport_code                text not null,
  name                        text not null,
  code                        text,
  type                        text check (type in ('economy','standard','express','valet','covered')),
  distance_to_terminal_meters int,
  walking_time_minutes        int,
  rate_per_day                numeric(10,2),
  rate_per_hour               numeric(10,2),
  total_spaces                int,
  available_spaces            int,
  coordinates                 geometry(Point, 4326),
  features                    text[] default '{}',
  updated_at                  timestamptz default now()
);

-- ─────────────────────────────────────────
-- Pre-computed navigation routes
-- ─────────────────────────────────────────
create table navigation_routes (
  id                        uuid primary key default uuid_generate_v4(),
  airport_id                uuid references airports(id),
  from_gate_id              uuid references gates(id),
  to_gate_id                uuid references gates(id),
  distance_meters           int  not null,
  base_walking_time_minutes int  not null,
  steps                     jsonb not null default '[]',
  is_wheelchair_accessible  boolean default true,
  created_at                timestamptz default now(),
  unique (from_gate_id, to_gate_id)
);

-- ─────────────────────────────────────────
-- Crowdsource reports (expires automatically)
-- ─────────────────────────────────────────
create table crowdsource_reports (
  id           uuid primary key default uuid_generate_v4(),
  airport_code text not null,
  user_id      uuid references user_profiles(id) on delete set null,
  type         text not null
               check (type in ('queue_long','queue_short','gate_closed','delay','crowded','empty')),
  location     text not null,
  confidence   int  default 1,
  created_at   timestamptz default now(),
  expires_at   timestamptz default (now() + interval '2 hours')
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
create index airports_iata_idx       on airports(iata_code);
create index flights_number_idx      on flights(flight_number);
create index flights_departure_idx   on flights(scheduled_departure);
create index crowdsource_airport_idx on crowdsource_reports(airport_code);
create index crowdsource_expires_idx on crowdsource_reports(expires_at);
create index gates_terminal_idx      on gates(terminal_id);
create index parking_airport_idx     on parking_lots(airport_code);

-- Spatial indexes
create index airports_geom_idx on airports using gist(coordinates);
create index gates_geom_idx    on gates    using gist(coordinates);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table user_profiles      enable row level security;
alter table crowdsource_reports enable row level security;

-- Users see/update only their own profile
create policy "own_profile_select" on user_profiles for select using (auth.uid() = id);
create policy "own_profile_update" on user_profiles for update using (auth.uid() = id);
create policy "own_profile_insert" on user_profiles for insert with check (auth.uid() = id);

-- Crowdsource: anyone can read, authenticated users can insert their own
create policy "reports_select" on crowdsource_reports for select using (true);
create policy "reports_insert" on crowdsource_reports for insert
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- Auto-update timestamps
-- ─────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────
-- Cleanup expired crowdsource reports (call from a cron Edge Function)
-- ─────────────────────────────────────────
create or replace function cleanup_expired_reports()
returns void language sql as $$
  delete from crowdsource_reports where expires_at < now();
$$;

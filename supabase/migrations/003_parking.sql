-- ══════════════════════════════════════════════════════════
-- Migration 003: Parking Zones, Pricing, Availability
-- ══════════════════════════════════════════════════════════

create type parking_facility_type as enum (
  'economy',       -- surface lot, off-site shuttle
  'standard',      -- on-site surface/structure
  'express',       -- close to terminal, quick access
  'covered',       -- covered structure / garage
  'valet',         -- valet drop-off at terminal
  'remote',        -- remote lot with shuttle only
  'free'           -- free short-stay / drop-off
);

create type parking_tier as enum (
  'free',          -- no charge
  'basic',         -- economy pricing
  'premium',       -- standard / express pricing
  'valet'          -- premium valet service
);

-- ─────────────────────────────────────────
-- Parking zones
-- ─────────────────────────────────────────
create table parking_zones (
  id                      uuid             primary key default uuid_generate_v4(),
  airport_id              uuid             references airports(id) on delete cascade,
  airport_code            text             not null,
  -- Identity
  name                    text             not null,
  short_code              text,            -- e.g. "ECO-A", "P4"
  description             text,
  type                    parking_facility_type not null,
  tier                    parking_tier     not null default 'basic',
  -- Location
  coordinates             geometry(Point, 4326),
  address                 text,
  -- Distance from terminal
  primary_terminal_id     uuid             references terminals(id) on delete set null,
  distance_to_terminal_m  int,
  walking_time_min        int,
  shuttle_time_min        int,             -- null if walking only
  shuttle_frequency_min   int,             -- shuttle headway in minutes
  -- Capacity
  total_spaces            int              not null default 0,
  total_disabled_spaces   int              default 0,
  total_ev_spaces         int              default 0,
  total_oversized_spaces  int              default 0,
  -- Live availability (updated by real-time feed)
  available_spaces        int,
  available_disabled      int,
  available_ev            int,
  availability_source     text,            -- 'api', 'sensor', 'manual'
  availability_updated_at timestamptz,
  -- Pricing (base rates — see pricing_tiers for variable rates)
  currency                text             default 'USD',
  rate_per_hour           numeric(10,2),
  rate_per_day            numeric(10,2),
  rate_per_week           numeric(10,2),
  rate_monthly            numeric(10,2),
  is_free                 boolean          default false,
  free_minutes            int,             -- first N minutes free
  max_stay_hours          int,             -- null = unlimited
  -- Features (stored as array of enum-like strings for flexibility)
  features                text[]           default '{}',
  -- Booking
  requires_booking        boolean          default false,
  booking_url             text,
  booking_provider        text,            -- e.g. "SpotHero", "ParkWhiz"
  -- Status
  is_active               boolean          default true,
  is_open_24h             boolean          default true,
  -- {mon: "06:00-23:00", tue: "06:00-23:00", ...}
  operating_hours         jsonb,
  -- Meta
  created_at              timestamptz      default now(),
  updated_at              timestamptz      default now()
);

comment on column parking_zones.features is
  'Array of: ev_charging, covered, shuttle_24h, disabled_spaces, security_cameras, car_wash, cctv, motorcycle';

-- ─────────────────────────────────────────
-- Variable pricing tiers
-- (first 1h free, then $5/hr, daily max $35, etc.)
-- ─────────────────────────────────────────
create table parking_pricing_tiers (
  id               uuid        primary key default uuid_generate_v4(),
  parking_zone_id  uuid        references parking_zones(id) on delete cascade,
  label            text        not null,    -- "First hour", "1–4 hours", "Daily max"
  min_hours        numeric(5,1) not null default 0,
  max_hours        numeric(5,1),            -- null = unbounded ceiling
  rate_per_hour    numeric(10,2),
  flat_rate        numeric(10,2),           -- flat charge for this band
  -- Priority for display ordering
  display_order    int          default 0,
  created_at       timestamptz  default now()
);

-- ─────────────────────────────────────────
-- Availability snapshots (for analytics / trend display)
-- Partition by month in production.
-- ─────────────────────────────────────────
create table parking_availability_snapshots (
  id               uuid        primary key default uuid_generate_v4(),
  parking_zone_id  uuid        references parking_zones(id) on delete cascade,
  airport_code     text        not null,
  available_spaces int         not null,
  total_spaces     int         not null,
  occupancy_pct    numeric(5,2) generated always as
                   (round(100.0 * (1 - available_spaces::numeric / nullif(total_spaces, 0)), 2))
                   stored,
  recorded_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────
create index parking_airport_idx    on parking_zones(airport_code);
create index parking_type_idx       on parking_zones(type);
create index parking_tier_idx       on parking_zones(tier);
create index parking_active_idx     on parking_zones(is_active) where is_active = true;
create index parking_geom_idx       on parking_zones using gist(coordinates);

create index pricing_zone_idx       on parking_pricing_tiers(parking_zone_id);
create index snapshot_zone_idx      on parking_availability_snapshots(parking_zone_id);
create index snapshot_time_idx      on parking_availability_snapshots(recorded_at desc);

-- ─────────────────────────────────────────
-- Auto-update timestamps
-- ─────────────────────────────────────────
create trigger parking_zones_updated_at
  before update on parking_zones
  for each row execute function touch_updated_at();

-- ─────────────────────────────────────────
-- Function: capture snapshot when availability changes
-- ─────────────────────────────────────────
create or replace function snapshot_parking_availability()
returns trigger language plpgsql as $$
begin
  if old.available_spaces is distinct from new.available_spaces
     and new.available_spaces is not null
  then
    insert into parking_availability_snapshots
      (parking_zone_id, airport_code, available_spaces, total_spaces)
    values
      (new.id, new.airport_code, new.available_spaces, new.total_spaces);
  end if;
  return new;
end;
$$;

create trigger parking_availability_snapshot
  after update of available_spaces on parking_zones
  for each row execute function snapshot_parking_availability();

-- ─────────────────────────────────────────
-- View: parking availability summary per airport
-- ─────────────────────────────────────────
create view parking_availability_summary as
select
  airport_code,
  tier,
  count(*)                                                            as zone_count,
  sum(total_spaces)                                                   as total_spaces,
  sum(coalesce(available_spaces, total_spaces))                       as available_spaces,
  round(
    100.0 * sum(coalesce(available_spaces, 0))
          / nullif(sum(total_spaces), 0), 1)                         as availability_pct,
  min(rate_per_day)                                                   as cheapest_day_rate,
  max(rate_per_day)                                                   as priciest_day_rate
from parking_zones
where is_active = true
group by airport_code, tier;

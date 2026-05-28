-- ══════════════════════════════════════════════════════════
-- Seed: Airports, Terminals, Sample POIs, Parking Zones
-- Run after all migrations: supabase db reset (or manually)
-- ══════════════════════════════════════════════════════════

-- ─── Airports ────────────────────────────────────────────
insert into airports (iata_code, icao_code, name, city, country, timezone, is_supported)
values
  ('JFK', 'KJFK', 'John F. Kennedy International', 'New York',    'US', 'America/New_York',    true),
  ('LHR', 'EGLL', 'Heathrow Airport',              'London',      'GB', 'Europe/London',       true),
  ('CDG', 'LFPG', 'Charles de Gaulle Airport',     'Paris',       'FR', 'Europe/Paris',        true),
  ('DXB', 'OMDB', 'Dubai International Airport',   'Dubai',       'AE', 'Asia/Dubai',          true),
  ('LAX', 'KLAX', 'Los Angeles International',     'Los Angeles', 'US', 'America/Los_Angeles', true),
  ('SIN', 'WSSS', 'Singapore Changi Airport',      'Singapore',   'SG', 'Asia/Singapore',      true),
  ('ORD', 'KORD', "O'Hare International",          'Chicago',     'US', 'America/Chicago',     true),
  ('HND', 'RJTT', 'Tokyo Haneda Airport',          'Tokyo',       'JP', 'Asia/Tokyo',          true),
  ('FRA', 'EDDF', 'Frankfurt Airport',             'Frankfurt',   'DE', 'Europe/Berlin',       true),
  ('AMS', 'EHAM', 'Amsterdam Schiphol',            'Amsterdam',   'NL', 'Europe/Amsterdam',    true)
on conflict (iata_code) do nothing;

-- ─── JFK Terminals ───────────────────────────────────────
with jfk as (select id from airports where iata_code = 'JFK')
insert into terminals (airport_id, name, code)
select jfk.id, t.name, t.code from jfk,
(values
  ('Terminal 1', 'T1'),
  ('Terminal 2', 'T2'),
  ('Terminal 4', 'T4'),
  ('Terminal 5', 'T5'),
  ('Terminal 7', 'T7'),
  ('Terminal 8', 'T8')
) as t(name, code)
on conflict do nothing;

-- ─── JFK T4 floors ───────────────────────────────────────
with t4 as (
  select tm.id from terminals tm
  join airports a on a.id = tm.airport_id
  where a.iata_code = 'JFK' and tm.code = 'T4'
)
insert into terminal_floors (terminal_id, level, name)
select t4.id, fl.level, fl.name from t4,
(values (0, 'Arrivals'), (1, 'Departures'), (2, 'Gates B'), (3, 'Gates C')) as fl(level, name)
on conflict do nothing;

-- ─── Sample JFK T4 Gates (as POIs + gates) ───────────────
-- Real deployment would load hundreds of these from GeoJSON
with t4 as (
  select tm.id as terminal_id, a.id as airport_id
  from terminals tm
  join airports a on a.id = tm.airport_id
  where a.iata_code = 'JFK' and tm.code = 'T4'
)
insert into pois (airport_id, terminal_id, name, short_name, type, floor_level, indoor_x, indoor_y)
select
  t4.airport_id,
  t4.terminal_id,
  'Gate ' || g.code,
  g.code,
  'gate',
  2,
  g.x,
  g.y
from t4,
(values
  ('B1',  0.10, 0.20), ('B2',  0.15, 0.20), ('B3',  0.20, 0.20),
  ('B4',  0.25, 0.20), ('B5',  0.30, 0.20), ('B6',  0.35, 0.20),
  ('B10', 0.10, 0.80), ('B11', 0.20, 0.80), ('B12', 0.30, 0.80),
  ('B20', 0.50, 0.20), ('B21', 0.55, 0.20), ('B22', 0.60, 0.20),
  ('C1',  0.70, 0.30), ('C2',  0.75, 0.30), ('C3',  0.80, 0.30)
) as g(code, x, y)
on conflict do nothing;

-- ─── Sample JFK T4 Service POIs ──────────────────────────
with t4 as (
  select tm.id as terminal_id, a.id as airport_id
  from terminals tm
  join airports a on a.id = tm.airport_id
  where a.iata_code = 'JFK' and tm.code = 'T4'
)
insert into pois (airport_id, terminal_id, name, type, floor_level, indoor_x, indoor_y, hours)
select
  t4.airport_id, t4.terminal_id,
  p.name, p.type::poi_type, p.floor, p.x, p.y, p.hours
from t4,
(values
  ('Security Checkpoint A', 'security_checkpoint', 1, 0.25, 0.50, '04:30–23:30'),
  ('Security Checkpoint B', 'security_checkpoint', 1, 0.65, 0.50, '04:30–23:30'),
  ('Customs Hall',          'customs',             0, 0.50, 0.70, '24/7'),
  ('Baggage Claim 4',       'baggage_claim',       0, 0.30, 0.90, '24/7'),
  ('Baggage Claim 5',       'baggage_claim',       0, 0.55, 0.90, '24/7'),
  ('Delta SkyClub',         'lounge',              2, 0.45, 0.15, '05:00–23:00'),
  ('Information Desk',      'information_desk',    1, 0.50, 0.50, '24/7'),
  ('Elevator A',            'elevator',            1, 0.20, 0.50, '24/7'),
  ('Elevator B',            'elevator',            1, 0.70, 0.50, '24/7'),
  ('Restroom Level 2 East', 'restroom',            2, 0.85, 0.40, '24/7'),
  ('Starbucks T4',          'cafe',                1, 0.40, 0.30, '05:00–22:00'),
  ('Hudson News',           'newsstand',           2, 0.25, 0.25, '05:00–22:00'),
  ('ATM Terminal 4',        'atm',                 1, 0.60, 0.30, '24/7'),
  ('Charging Station A',    'charging_station',    2, 0.50, 0.40, '24/7')
) as p(name, type, floor, x, y, hours)
on conflict do nothing;

-- ─── JFK Parking Zones ───────────────────────────────────
with jfk as (select id from airports where iata_code = 'JFK')
insert into parking_zones (
  airport_id, airport_code, name, short_code, type, tier,
  total_spaces, total_disabled_spaces, total_ev_spaces,
  distance_to_terminal_m, walking_time_min, shuttle_time_min, shuttle_frequency_min,
  currency, rate_per_hour, rate_per_day, is_free, features, is_active, is_open_24h
)
select jfk.id, 'JFK', p.name, p.code, p.type::parking_facility_type, p.tier::parking_tier,
       p.total, p.disabled, p.ev,
       p.dist, p.walk_min, p.shuttle_min, p.shuttle_freq,
       'USD', p.rate_hr, p.rate_day, p.is_free,
       p.features, true, true
from jfk,
(values
  ('Economy Lot A',   'ECO-A',    'economy',  'basic',   2000, 40, 0,   800, 12, 8,  15,  4.00, 18.00, false, ARRAY['shuttle_24h','security_cameras']),
  ('Economy Lot B',   'ECO-B',    'economy',  'basic',   1800, 36, 0,   950, 14, 8,  15,  4.00, 16.00, false, ARRAY['shuttle_24h','security_cameras']),
  ('Standard Lot C',  'STD-C',    'standard', 'premium', 1200, 24, 20,  400,  6, null, null, 7.00, 28.00, false, ARRAY['security_cameras','disabled_spaces','ev_charging']),
  ('Express Covered', 'EXP-COV',  'covered',  'premium',  500, 10, 30,  150,  2, null, null,12.00, 48.00, false, ARRAY['covered','ev_charging','security_cameras','cctv']),
  ('Valet Terminal 4','VAL-T4',   'valet',    'valet',    200,  4,  0,   50,  1, null, null,20.00, 60.00, false, ARRAY['covered','security_cameras']),
  ('Cell Phone Lot',  'CELL',     'free',     'free',     300,  6,  0, 1500, 20, 10,  10,  0.00,  0.00, true,  ARRAY['security_cameras'])
) as p(name, code, type, tier, total, disabled, ev, dist, walk_min, shuttle_min, shuttle_freq, rate_hr, rate_day, is_free, features)
on conflict do nothing;

-- ─── Pricing tiers for Economy Lot A ─────────────────────
with eco as (
  select id from parking_zones where airport_code = 'JFK' and short_code = 'ECO-A'
)
insert into parking_pricing_tiers (parking_zone_id, label, min_hours, max_hours, rate_per_hour, flat_rate, display_order)
select eco.id, t.label, t.min_h, t.max_h, t.rate_hr, t.flat, t.ord
from eco,
(values
  ('First hour',   0,  1,  3.00, null, 1),
  ('1–4 hours',    1,  4,  4.00, null, 2),
  ('4–8 hours',    4,  8,  3.50, null, 3),
  ('Daily max',    8, 24,  null, 18.0, 4),
  ('Weekly max',  24, null, null, 80.0, 5)
) as t(label, min_h, max_h, rate_hr, flat, ord)
on conflict do nothing;

-- Set initial availability (simulated)
update parking_zones set
  available_spaces     = round(total_spaces * (0.4 + random() * 0.5))::int,
  available_disabled   = total_disabled_spaces,
  available_ev         = total_ev_spaces,
  availability_source  = 'seed',
  availability_updated_at = now()
where airport_code = 'JFK';

-- ══════════════════════════════════════════════════════════
-- Migration 004: User Crowd Reports & Voting
-- ══════════════════════════════════════════════════════════

create type crowd_report_type as enum (
  -- Queue conditions
  'queue_long',
  'queue_short',
  'queue_closed',
  -- Crowd density
  'crowded',
  'empty',
  -- Gate events
  'gate_delay',
  'gate_closed',
  'gate_changed',
  'gate_open',
  -- Security / border
  'security_slow',
  'security_fast',
  'customs_slow',
  'customs_fast',
  -- Baggage
  'baggage_delayed',
  'baggage_arrived',
  -- Infrastructure
  'elevator_broken',
  'escalator_broken',
  'moving_walkway_off',
  -- Positive
  'helpful_info',
  'clear_path'
);

create type report_location_type as enum (
  'gate',
  'security',
  'customs',
  'passport_control',
  'baggage_claim',
  'lounge',
  'elevator',
  'escalator',
  'terminal',
  'parking',
  'poi',
  'general'
);

-- ─────────────────────────────────────────
-- Crowd reports (core table)
-- ─────────────────────────────────────────
create table crowd_reports (
  id                  uuid                 primary key default uuid_generate_v4(),
  -- Reporter
  user_id             uuid                 references user_profiles(id) on delete set null,
  is_anonymous        boolean              default false,
  -- Location context
  airport_code        text                 not null,
  airport_id          uuid                 references airports(id) on delete set null,
  terminal_id         uuid                 references terminals(id) on delete set null,
  location_type       report_location_type not null,
  -- Polymorphic FK: resolved using location_type
  -- Points to: gates.id, pois.id, or parking_zones.id
  location_id         uuid,
  location_label      text                 not null,   -- "Gate B12", "Security Hall A"
  -- GPS snapshot at time of report (for heat-map overlays)
  coordinates         geometry(Point, 4326),
  -- Report payload
  type                crowd_report_type    not null,
  severity            smallint             not null default 3
                      check (severity between 1 and 5),
  -- 1=minor, 3=moderate, 5=severe
  description         text                 check (char_length(description) <= 280),
  -- Social validation
  upvotes             int                  not null default 0,
  downvotes           int                  not null default 0,
  is_verified         boolean              default false,   -- admin/staff confirmed
  -- Lifecycle
  created_at          timestamptz          default now(),
  expires_at          timestamptz          default (now() + interval '2 hours'),
  is_active           boolean              default true     -- soft delete
);

comment on column crowd_reports.severity is '1=minor inconvenience, 3=notable, 5=severe disruption';
comment on column crowd_reports.location_id is 'FK into gates, pois, or parking_zones resolved by location_type';

-- ─────────────────────────────────────────
-- Report votes (one vote per user per report)
-- ─────────────────────────────────────────
create table crowd_report_votes (
  id          uuid        primary key default uuid_generate_v4(),
  report_id   uuid        references crowd_reports(id) on delete cascade,
  user_id     uuid        references user_profiles(id) on delete cascade,
  vote        smallint    not null check (vote in (1, -1)),  -- 1 = helpful, -1 = not helpful
  created_at  timestamptz default now(),
  unique (report_id, user_id)
);

-- ─────────────────────────────────────────
-- Aggregated crowd signal per location
-- Materialized view — refresh every ~30 sec via Edge Function
-- ─────────────────────────────────────────
create materialized view crowd_signal_summary as
select
  airport_code,
  terminal_id,
  location_type,
  location_id,
  location_label,
  count(*)                                     as report_count,
  avg(severity)::numeric(3,1)                  as avg_severity,
  -- Most common report type at this location
  mode() within group (order by type::text)    as dominant_type,
  -- Separate counts for positive vs negative signals
  count(*) filter (where type in ('queue_short','empty','security_fast','customs_fast',
                                   'baggage_arrived','gate_open','helpful_info','clear_path'))
                                               as positive_count,
  count(*) filter (where type in ('queue_long','crowded','security_slow','customs_slow',
                                   'baggage_delayed','gate_delay','gate_closed',
                                   'elevator_broken','escalator_broken'))
                                               as negative_count,
  sum(upvotes)                                 as total_upvotes,
  bool_or(is_verified)                         as has_verified_report,
  max(created_at)                              as latest_report_at,
  min(expires_at)                              as earliest_expiry
from crowd_reports
where is_active = true
  and expires_at > now()
group by airport_code, terminal_id, location_type, location_id, location_label;

create unique index crowd_signal_summary_uniq
  on crowd_signal_summary (
    airport_code,
    location_type,
    coalesce(location_id::text, '__null__'),
    location_label
  );

create index crowd_signal_airport_idx on crowd_signal_summary(airport_code);

-- ─────────────────────────────────────────
-- Indexes on crowd_reports
-- ─────────────────────────────────────────
create index cr_airport_idx    on crowd_reports(airport_code);
create index cr_location_idx   on crowd_reports(location_type, location_id);
create index cr_user_idx       on crowd_reports(user_id);
create index cr_active_idx     on crowd_reports(is_active, expires_at)
                                where is_active = true;
create index cr_geom_idx       on crowd_reports using gist(coordinates);
create index cr_created_idx    on crowd_reports(created_at desc);

-- ─────────────────────────────────────────
-- RLS policies
-- ─────────────────────────────────────────
alter table crowd_reports      enable row level security;
alter table crowd_report_votes enable row level security;

-- Anyone can read active, non-expired reports
create policy "crowd_reports_select" on crowd_reports
  for select using (is_active = true and expires_at > now());

-- Authenticated users can insert their own reports
create policy "crowd_reports_insert" on crowd_reports
  for insert with check (
    auth.uid() = user_id
    or is_anonymous = true
  );

-- Users can soft-delete their own reports
create policy "crowd_reports_update_own" on crowd_reports
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone can read votes
create policy "votes_select" on crowd_report_votes
  for select using (true);

-- Authenticated users manage their own votes
create policy "votes_insert" on crowd_report_votes
  for insert with check (auth.uid() = user_id);

create policy "votes_update" on crowd_report_votes
  for update using (auth.uid() = user_id);

create policy "votes_delete" on crowd_report_votes
  for delete using (auth.uid() = user_id);

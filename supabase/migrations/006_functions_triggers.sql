-- ══════════════════════════════════════════════════════════
-- Migration 006: Business Logic Functions & Triggers
-- ══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. Connection risk calculator
-- ─────────────────────────────────────────
create or replace function calculate_connection_risk(
  p_inbound_arrival    timestamptz,
  p_outbound_departure timestamptz,
  p_walking_time_min   int
) returns connection_risk
language plpgsql immutable as $$
declare
  v_total_min  int;
  v_buffer_min int;
begin
  v_total_min  := extract(epoch from (p_outbound_departure - p_inbound_arrival))::int / 60;
  v_buffer_min := v_total_min - coalesce(p_walking_time_min, 15);

  return case
    when v_total_min  <= 0 then 'impossible'
    when v_buffer_min <  0 then 'impossible'
    when v_buffer_min < 10 then 'at_risk'
    when v_buffer_min < 25 then 'tight'
    else                        'safe'
  end;
end;
$$;

-- ─────────────────────────────────────────
-- 2. Walking time lookup (from navigation graph)
-- ─────────────────────────────────────────
create or replace function get_walking_time(
  p_from_poi_id uuid,
  p_to_poi_id   uuid,
  p_mode        text default 'walking'  -- 'walking' | 'running' | 'wheelchair'
) returns int
language sql stable as $$
  select case p_mode
    when 'running'    then coalesce(run_seconds,          round(walk_seconds * 0.56)::int)
    when 'wheelchair' then coalesce(wheelchair_seconds,   round(walk_seconds * 1.43)::int)
    else                   walk_seconds
  end
  from navigation_edges
  where from_poi_id = p_from_poi_id
    and to_poi_id   = p_to_poi_id
  limit 1;
$$;

-- ─────────────────────────────────────────
-- 3. Crowd signal aggregation per location
-- ─────────────────────────────────────────
create or replace function get_crowd_signals(
  p_airport_code  text,
  p_location_type text  default null,
  p_location_id   uuid  default null,
  p_max_age_min   int   default 120
) returns table (
  location_label  text,
  location_type   text,
  dominant_type   text,
  avg_severity    numeric,
  report_count    bigint,
  positive_count  bigint,
  negative_count  bigint,
  has_verified    boolean,
  latest_at       timestamptz
)
language sql stable as $$
  select
    cr.location_label,
    cr.location_type::text,
    mode() within group (order by cr.type::text) as dominant_type,
    round(avg(cr.severity)::numeric, 1)           as avg_severity,
    count(*)                                      as report_count,
    count(*) filter (where cr.type in (
      'queue_short','empty','security_fast','customs_fast',
      'baggage_arrived','gate_open','helpful_info','clear_path'))  as positive_count,
    count(*) filter (where cr.type in (
      'queue_long','crowded','security_slow','customs_slow',
      'baggage_delayed','gate_delay','gate_closed',
      'elevator_broken','escalator_broken'))                       as negative_count,
    bool_or(cr.is_verified)                       as has_verified,
    max(cr.created_at)                            as latest_at
  from crowd_reports cr
  where cr.airport_code = p_airport_code
    and cr.is_active    = true
    and cr.expires_at   > now()
    and cr.created_at   > now() - (p_max_age_min * interval '1 minute')
    and (p_location_type is null or cr.location_type::text = p_location_type)
    and (p_location_id   is null or cr.location_id = p_location_id)
  group by cr.location_label, cr.location_type
  order by report_count desc, latest_at desc;
$$;

-- ─────────────────────────────────────────
-- 4. Atomic vote handler (upsert + aggregate)
-- ─────────────────────────────────────────
create or replace function vote_on_report(
  p_report_id uuid,
  p_user_id   uuid,
  p_vote      smallint   -- 1 or -1
) returns void
language plpgsql security definer as $$
begin
  -- Verify report is active and user exists
  if not exists (
    select 1 from crowd_reports
    where id = p_report_id and is_active = true and expires_at > now()
  ) then
    raise exception 'Report not found or expired';
  end if;

  -- Upsert vote
  insert into crowd_report_votes (report_id, user_id, vote)
  values (p_report_id, p_user_id, p_vote)
  on conflict (report_id, user_id)
  do update set vote = excluded.vote;

  -- Update aggregated counts
  update crowd_reports set
    upvotes   = (select count(*) from crowd_report_votes
                 where report_id = p_report_id and vote = 1),
    downvotes = (select count(*) from crowd_report_votes
                 where report_id = p_report_id and vote = -1)
  where id = p_report_id;
end;
$$;

-- ─────────────────────────────────────────
-- 5. Sync connection risk when flights change
-- ─────────────────────────────────────────
create or replace function sync_connection_risk()
returns trigger language plpgsql as $$
begin
  -- Update all active connections that reference this flight
  update user_connections uc
  set
    connection_time_min = (
      extract(epoch from (
        coalesce(ob.estimated_departure, ob.scheduled_departure) -
        coalesce(ib.estimated_arrival,   ib.scheduled_arrival)
      )) / 60
    )::int,
    risk_level = calculate_connection_risk(
      coalesce(ib.estimated_arrival,    ib.scheduled_arrival),
      coalesce(ob.estimated_departure,  ob.scheduled_departure),
      coalesce(uc.walking_time_min, 15)
    ),
    updated_at = now()
  from flights ib
  join flights ob on ob.id = uc.outbound_flight_id
  where ib.id = uc.inbound_flight_id
    and (ib.id = new.id or ob.id = new.id)
    and uc.is_active = true;

  return new;
end;
$$;

create trigger flights_sync_connections
  after update of estimated_departure, estimated_arrival, actual_arrival, status
  on flights
  for each row execute function sync_connection_risk();

-- ─────────────────────────────────────────
-- 6. Record every significant flight change
-- ─────────────────────────────────────────
create or replace function record_flight_change()
returns trigger language plpgsql as $$
begin
  -- Gate change
  if old.departure_gate_code is distinct from new.departure_gate_code then
    insert into flight_changes (flight_id, change_type, previous_value, new_value)
    values (new.id, 'gate', old.departure_gate_code, new.departure_gate_code);
  end if;
  -- Terminal change
  if old.departure_terminal is distinct from new.departure_terminal then
    insert into flight_changes (flight_id, change_type, previous_value, new_value)
    values (new.id, 'terminal', old.departure_terminal, new.departure_terminal);
  end if;
  -- Status change
  if old.status is distinct from new.status then
    insert into flight_changes (flight_id, change_type, previous_value, new_value)
    values (new.id, 'status', old.status::text, new.status::text);
  end if;
  -- Departure delay
  if old.departure_delay_min is distinct from new.departure_delay_min then
    insert into flight_changes (flight_id, change_type, previous_value, new_value)
    values (new.id, 'departure_delay',
            old.departure_delay_min::text, new.departure_delay_min::text);
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger flights_record_changes
  before update on flights
  for each row execute function record_flight_change();

-- ─────────────────────────────────────────
-- 7. Refresh materialized view (called by Edge Function on cron)
-- ─────────────────────────────────────────
create or replace function refresh_crowd_signals()
returns void language sql as $$
  refresh materialized view concurrently crowd_signal_summary;
$$;

-- ─────────────────────────────────────────
-- 8. Cleanup jobs (called by scheduled Edge Function)
-- ─────────────────────────────────────────
create or replace function cleanup_expired_data()
returns jsonb language plpgsql as $$
declare
  v_reports_deleted    int;
  v_snapshots_deleted  int;
begin
  -- Soft-expire crowd reports past their expiry
  update crowd_reports set is_active = false
  where expires_at < now() and is_active = true;
  get diagnostics v_reports_deleted = row_count;

  -- Delete parking snapshots older than 30 days (keep recent trend data)
  delete from parking_availability_snapshots
  where recorded_at < now() - interval '30 days';
  get diagnostics v_snapshots_deleted = row_count;

  return jsonb_build_object(
    'reports_expired',    v_reports_deleted,
    'snapshots_deleted',  v_snapshots_deleted,
    'ran_at',             now()
  );
end;
$$;

-- ─────────────────────────────────────────
-- 9. Parking availability calculator
-- ─────────────────────────────────────────
create or replace function get_parking_options(
  p_airport_code text,
  p_tier         text    default null,  -- 'free','basic','premium','valet'
  p_only_available boolean default false
) returns table (
  id                  uuid,
  name                text,
  short_code          text,
  type                text,
  tier                text,
  available_spaces    int,
  occupancy_pct       numeric,
  rate_per_hour       numeric,
  rate_per_day        numeric,
  walking_time_min    int,
  features            text[],
  is_full             boolean
)
language sql stable as $$
  select
    pz.id,
    pz.name,
    pz.short_code,
    pz.type::text,
    pz.tier::text,
    pz.available_spaces,
    round(100.0 * (1 - pz.available_spaces::numeric / nullif(pz.total_spaces, 0)), 1) as occupancy_pct,
    pz.rate_per_hour,
    pz.rate_per_day,
    pz.walking_time_min,
    pz.features,
    coalesce(pz.available_spaces, 1) = 0 as is_full
  from parking_zones pz
  where pz.airport_code = p_airport_code
    and pz.is_active    = true
    and (p_tier is null or pz.tier::text = p_tier)
    and (not p_only_available or coalesce(pz.available_spaces, 1) > 0)
  order by pz.walking_time_min asc, pz.rate_per_day asc;
$$;

// Supabase Edge Function — syncs flight data from AviationStack into the `flights` table.
// Deploy: supabase functions deploy flight-sync
// Trigger: scheduled via pg_cron or Supabase Dashboard every 2 minutes.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const AVIATION_KEY = Deno.env.get('AVIATION_STACK_KEY')!;

interface RawFlight {
  flight: { iata: string };
  airline: { name: string; iata: string };
  departure: { iata: string; terminal: string; gate: string; scheduled: string; estimated: string; actual: string; delay: number };
  arrival:   { iata: string; terminal: string; gate: string; scheduled: string; estimated: string; actual: string };
  flight_status: string;
}

Deno.serve(async () => {
  // Fetch all flight IDs currently tracked by users
  const { data: profiles } = await supabase.from('user_profiles').select('saved_flights');
  const flightIds: string[] = [];
  for (const p of profiles ?? []) {
    for (const id of p.saved_flights ?? []) flightIds.push(id);
  }

  const uniqueNumbers = [...new Set(flightIds.map((id) => id.split('_')[0]))];

  let synced = 0;
  for (const number of uniqueNumbers) {
    try {
      const res  = await fetch(`https://api.aviationstack.com/v1/flights?access_key=${AVIATION_KEY}&flight_iata=${number}`);
      const json = await res.json();
      const raw: RawFlight = json.data?.[0];
      if (!raw) continue;

      await supabase.from('flights').upsert({
        id: `${raw.flight.iata}_${raw.departure.scheduled}`,
        flight_number:       raw.flight.iata,
        airline:             raw.airline.name,
        airline_code:        raw.airline.iata,
        origin_code:         raw.departure.iata,
        destination_code:    raw.arrival.iata,
        scheduled_departure: raw.departure.scheduled,
        estimated_departure: raw.departure.estimated || null,
        actual_departure:    raw.departure.actual    || null,
        scheduled_arrival:   raw.arrival.scheduled,
        estimated_arrival:   raw.arrival.estimated  || null,
        actual_arrival:      raw.arrival.actual      || null,
        gate:                raw.departure.gate     || null,
        terminal:            raw.departure.terminal || null,
        status:              raw.flight_status,
        delay_minutes:       raw.departure.delay ?? 0,
        last_synced_at:      new Date().toISOString(),
      });
      synced++;
    } catch (e) {
      console.error(`Failed to sync ${number}:`, e);
    }
  }

  return new Response(JSON.stringify({ synced, total: uniqueNumbers.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

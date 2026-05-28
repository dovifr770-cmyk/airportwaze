#!/usr/bin/env npx tsx
// ══════════════════════════════════════════════════════════
// Supabase Dev Seeder
// ──────────────────────────────────────────────────────────
// Seeds the database with realistic mock data so you can see
// the app fully populated with real Supabase rows.
//
// Run:
//   npx tsx scripts/seed-supabase.ts
//
// Requirements:
//   npm install -D tsx
//   EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
//   must be set in .env (or inline below for quick testing).
// ══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const SUPABASE_KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ───────────────────────────────────────────────

const NOW     = new Date();
const inMin   = (m: number) => new Date(NOW.getTime() + m * 60_000).toISOString();
const inHours = (h: number) => new Date(NOW.getTime() + h * 3_600_000).toISOString();
const agoMin  = (m: number) => new Date(NOW.getTime() - m * 60_000).toISOString();

function ok(label: string, data: any, error: any) {
  if (error) { console.error(`  ❌ ${label}:`, error.message); return false; }
  console.log(`  ✅ ${label}:`, Array.isArray(data) ? `${data.length} rows` : 'ok');
  return true;
}

// ══════════════════════════════════════════════════════════
// SEED FUNCTIONS
// ══════════════════════════════════════════════════════════

async function seedFlights() {
  console.log('\n✈️  Seeding flights…');

  const flights = [
    // JFK connection — tight
    {
      flight_number: 'UA 123',
      airline: 'United Airlines',
      airline_code: 'UA',
      origin_code: 'LAX', origin_name: 'Los Angeles Intl',   origin_city: 'Los Angeles', origin_country: 'US', origin_timezone: 'America/Los_Angeles',
      dest_code:   'JFK', dest_name:   'John F. Kennedy Intl', dest_city:   'New York',   dest_country:   'US', dest_timezone:   'America/New_York',
      departure_terminal: '7',   departure_gate_code: 'B14',
      scheduled_departure: inHours(-5.5),
      scheduled_arrival:   inMin(-30),
      estimated_arrival:   inMin(-20),
      arrival_terminal:   '4',   arrival_gate_code:   'B12',
      departure_delay_minutes: 0, arrival_delay_minutes: 0,
      status: 'arriving', data_source: 'seed',
    },
    {
      flight_number: 'DL 456',
      airline: 'Delta Air Lines',
      airline_code: 'DL',
      origin_code: 'JFK', origin_name: 'John F. Kennedy Intl', origin_city: 'New York', origin_country: 'US', origin_timezone: 'America/New_York',
      dest_code:   'LHR', dest_name:   'Heathrow Airport',     dest_city:   'London',   dest_country:   'GB', dest_timezone:   'Europe/London',
      departure_terminal: '4',   departure_gate_code: 'C3',
      scheduled_departure: inHours(1.5),
      scheduled_arrival:   inHours(8.5),
      arrival_terminal:   '3',   arrival_gate_code:   'A14',
      departure_delay_minutes: 0, arrival_delay_minutes: 0,
      status: 'scheduled', data_source: 'seed',
    },
    // ATL connection — safe
    {
      flight_number: 'AA 200',
      airline: 'American Airlines',
      airline_code: 'AA',
      origin_code: 'ORD', origin_name: "O'Hare Intl",         origin_city: 'Chicago',  origin_country: 'US', origin_timezone: 'America/Chicago',
      dest_code:   'ATL', dest_name:   'Hartsfield-Jackson',   dest_city:   'Atlanta',  dest_country:   'US', dest_timezone:   'America/New_York',
      departure_terminal: '3',  departure_gate_code: 'H2',
      scheduled_departure: inHours(-3),
      scheduled_arrival:   inMin(-15),
      estimated_arrival:   inMin(-10),
      arrival_terminal:   'S',  arrival_gate_code: 'S4',
      departure_delay_minutes: 0, arrival_delay_minutes: 0,
      status: 'landed', data_source: 'seed',
    },
    {
      flight_number: 'B6 300',
      airline: 'JetBlue Airways',
      airline_code: 'B6',
      origin_code: 'ATL', origin_name: 'Hartsfield-Jackson',  origin_city: 'Atlanta', origin_country: 'US', origin_timezone: 'America/New_York',
      dest_code:   'BOS', dest_name:   'Logan International',  dest_city:   'Boston',  dest_country:   'US', dest_timezone:   'America/New_York',
      departure_terminal: 'S',  departure_gate_code: 'S22',
      scheduled_departure: inHours(2),
      scheduled_arrival:   inHours(4),
      arrival_terminal:   'C',  arrival_gate_code: 'C19',
      departure_delay_minutes: 0, arrival_delay_minutes: 0,
      status: 'scheduled', data_source: 'seed',
    },
    // DEN connection — at_risk (delayed inbound)
    {
      flight_number: 'UA 500',
      airline: 'United Airlines',
      airline_code: 'UA',
      origin_code: 'SFO', origin_name: 'San Francisco Intl',  origin_city: 'San Francisco', origin_country: 'US', origin_timezone: 'America/Los_Angeles',
      dest_code:   'DEN', dest_name:   'Denver International', dest_city:   'Denver',         dest_country:   'US', dest_timezone:   'America/Denver',
      departure_terminal: '3',   departure_gate_code: 'F11',
      scheduled_departure: inHours(-2.5),
      scheduled_arrival:   inMin(5),
      estimated_arrival:   inMin(22),
      arrival_terminal:   'B',   arrival_gate_code: 'B38',
      departure_delay_minutes: 17, arrival_delay_minutes: 17,
      status: 'delayed', data_source: 'seed',
    },
    {
      flight_number: 'UA 600',
      airline: 'United Airlines',
      airline_code: 'UA',
      origin_code: 'DEN', origin_name: 'Denver International', origin_city: 'Denver', origin_country: 'US', origin_timezone: 'America/Denver',
      dest_code:   'MIA', dest_name:   'Miami International',  dest_city:   'Miami',  dest_country:   'US', dest_timezone:   'America/New_York',
      departure_terminal: 'B',  departure_gate_code: 'B54',
      scheduled_departure: inMin(47),
      scheduled_arrival:   inHours(4.8),
      arrival_terminal:   'D',  arrival_gate_code: 'D31',
      departure_delay_minutes: 0, arrival_delay_minutes: 0,
      status: 'scheduled', data_source: 'seed',
    },
  ];

  const { data, error } = await sb.from('flights').upsert(flights, { onConflict: 'flight_number' }).select();
  ok('flights', data, error);
}

async function seedCrowdReports() {
  console.log('\n📢  Seeding crowd reports…');

  const reports = [
    {
      is_anonymous:   true,
      airport_code:   'JFK',
      location_type:  'security',
      location_label: 'Security Checkpoint B (Pre-check + General)',
      type:           'security_slow',
      severity:       4,
      expires_at:     inHours(1),
      is_active:      true,
    },
    {
      is_anonymous:   false,
      airport_code:   'JFK',
      location_type:  'gate',
      location_label: 'Gate B12 boarding area',
      type:           'crowded',
      severity:       3,
      expires_at:     inHours(1),
      is_active:      true,
    },
    {
      is_anonymous:   true,
      airport_code:   'JFK',
      location_type:  'passport_control',
      location_label: 'T4 Customs & Border Protection Hall',
      type:           'customs_slow',
      severity:       5,
      expires_at:     inHours(2),
      is_active:      true,
    },
    {
      is_anonymous:   true,
      airport_code:   'JFK',
      location_type:  'elevator',
      location_label: 'Elevator A — Central Hall (B→C connector)',
      type:           'elevator_broken',
      severity:       3,
      expires_at:     inHours(3),
      is_active:      true,
    },
    {
      is_anonymous:   false,
      airport_code:   'JFK',
      location_type:  'gate',
      location_label: 'Gate C3 area',
      type:           'clear_path',
      severity:       1,
      expires_at:     inHours(1),
      is_active:      true,
    },
    // ATL reports
    {
      is_anonymous:   true,
      airport_code:   'ATL',
      location_type:  'security',
      location_label: 'Security — Concourse S South',
      type:           'queue_long',
      severity:       3,
      expires_at:     inHours(1),
      is_active:      true,
    },
  ];

  const { data, error } = await sb.from('crowd_reports').insert(reports).select();
  ok('crowd_reports', data, error);
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════

async function main() {
  console.log('🌱  AirportWaze dev seeder starting…');
  console.log(`   URL: ${SUPABASE_URL.slice(0, 40)}…`);

  await seedFlights();
  await seedCrowdReports();

  console.log('\n🎉  Done! Refresh the app to see live data.\n');
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});

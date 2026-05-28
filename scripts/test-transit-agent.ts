#!/usr/bin/env npx tsx
// Quick smoke test for the Terminal Transit Agent engine.
// Run: npx tsx scripts/test-transit-agent.ts

import { runTerminalTransitAgent } from '../src/services/navigation/terminalTransitAgent';

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';
const WARN = '\x1b[33m⚠️\x1b[0m';

function check(label: string, pass: boolean, detail?: string) {
  console.log(`  ${pass ? PASS : FAIL} ${label}${detail ? '  →  ' + detail : ''}`);
  if (!pass) process.exitCode = 1;
}

console.log('\n🛫  Terminal Transit Agent — Smoke Tests\n');

// ── Test 1: JFK T4 → T8, int'l → int'l ──────────────────
console.log('1. JFK T4 → T8  (international → international)');
const r1 = runTerminalTransitAgent({
  airportCode: 'JFK', fromTerminal: 'T4', toTerminal: 'T8',
  passengerStatus: 'international_to_international', connectionWindowMinutes: 90,
});
check('isFeasible = true (physical paths exist)', r1.isFeasible === true);
check('fastest route exists', !!r1.routes.find(r => r.id === 'fastest' && r.steps.length > 0));
check('fastest route CRITICAL (all paths landside)', r1.routes.find(r => r.id === 'fastest')?.overallRisk === 'critical',
      `got: ${r1.routes.find(r => r.id === 'fastest')?.overallRisk}`);
check('airside_only route NOT feasible (no airside T4→T8)', r1.routes.find(r => r.id === 'airside_only')?.isFeasible === false);
console.log(`   fastest: ${r1.routes.find(r => r.id === 'fastest')?.totalMinutes}min via ${r1.routes.find(r => r.id === 'fastest')?.steps.map(s => s.label).join(' → ')}`);

// ── Test 2: ATL T → F, domestic → domestic ────────────────
console.log('\n2. ATL T → F  (domestic → domestic)');
const r2 = runTerminalTransitAgent({
  airportCode: 'ATL', fromTerminal: 'T', toTerminal: 'F',
  passengerStatus: 'domestic_to_domestic',
});
check('isFeasible = true', r2.isFeasible === true);
check('route is fully airside', r2.recommendedRoute?.isAirsideOnly === true,
      `got: ${r2.recommendedRoute?.isAirsideOnly}`);
check('overall risk = none', r2.recommendedRoute?.overallRisk === 'none',
      `got: ${r2.recommendedRoute?.overallRisk}`);
check('blockers empty', r2.blockers.length === 0, `${r2.blockers.length} blockers`);
console.log(`   route: ${r2.recommendedRoute?.steps.map(s => s.fromTerminal+'→'+s.toTerminal).join(' ')} | ${r2.recommendedRoute?.totalMinutes}min`);

// ── Test 3: LHR T5 → T4, int'l → int'l ──────────────────
console.log('\n3. LHR T5 → T4  (international → international)');
const r3 = runTerminalTransitAgent({
  airportCode: 'LHR', fromTerminal: 'T5', toTerminal: 'T4',
  passengerStatus: 'international_to_international',
});
check('isFeasible = true (landside routes exist)', r3.isFeasible === true);
check('fastest route CRITICAL (exits int\'l zone)', r3.routes.find(r => r.id === 'fastest')?.overallRisk === 'critical',
      `got: ${r3.routes.find(r => r.id === 'fastest')?.overallRisk}`);
check('airside_only NOT feasible (T5 has no direct airside to T4)', r3.routes.find(r => r.id === 'airside_only')?.isFeasible === false);
console.log(`   fastest: ${r3.routes.find(r => r.id === 'fastest')?.totalMinutes}min`);

// ── Test 4: DEN A → C, domestic → domestic ───────────────
console.log('\n4. DEN A → C  (domestic → domestic, via train through M)');
const r4 = runTerminalTransitAgent({
  airportCode: 'DEN', fromTerminal: 'A', toTerminal: 'C',
  passengerStatus: 'domestic_to_domestic',
});
check('isFeasible = true', r4.isFeasible === true);
check('airside route (full DEN is airside)', r4.recommendedRoute?.isAirsideOnly === true);
check('risk = none', r4.recommendedRoute?.overallRisk === 'none');
console.log(`   ${r4.recommendedRoute?.steps.length} steps, ${r4.recommendedRoute?.totalMinutes}min total`);

// ── Test 5: Same terminal shortcut ───────────────────────
console.log('\n5. JFK T4 → T4  (same terminal)');
const r5 = runTerminalTransitAgent({
  airportCode: 'JFK', fromTerminal: 'T4', toTerminal: 'T4',
  passengerStatus: 'domestic_to_domestic',
});
check('sameTerminal = true', r5.sameTerminal === true);
check('routes array empty', r5.routes.length === 0);

// ── Test 6: Unknown airport ───────────────────────────────
console.log('\n6. SFO A → G  (no graph data)');
const r6 = runTerminalTransitAgent({
  airportCode: 'SFO', fromTerminal: 'A', toTerminal: 'G',
  passengerStatus: 'domestic_to_domestic',
});
check('noDataAvailable = true', r6.noDataAvailable === true);

// ── Test 7: ORD T3 → T5, int'l → int'l ──────────────────
console.log('\n7. ORD T3 → T5  (international → international)');
const r7 = runTerminalTransitAgent({
  airportCode: 'ORD', fromTerminal: 'T3', toTerminal: 'T5',
  passengerStatus: 'international_to_international',
});
check('isFeasible = true', r7.isFeasible === true);
check('fastest route CRITICAL (landside)', r7.routes.find(r => r.id === 'fastest')?.overallRisk === 'critical');
console.log(`   fastest: ${r7.routes.find(r => r.id === 'fastest')?.totalMinutes}min`);

// ── Test 8: Tight window blocker ─────────────────────────
console.log('\n8. JFK T4 → T8  tight connection window (25 min)');
const r8 = runTerminalTransitAgent({
  airportCode: 'JFK', fromTerminal: 'T4', toTerminal: 'T8',
  passengerStatus: 'domestic_to_domestic', connectionWindowMinutes: 25,
});
check('TIGHT_WINDOW blocker present', r8.blockers.some(b => b.code === 'TIGHT_WINDOW'),
      r8.blockers.map(b=>b.code).join(', ') || 'none');

console.log('\n');

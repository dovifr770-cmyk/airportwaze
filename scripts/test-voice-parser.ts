#!/usr/bin/env npx tsx
// Smoke test for the Voice Command Parser NLP engine.
// Run: npx tsx scripts/test-voice-parser.ts

import { parseVoiceCommand } from '../src/services/voice/voiceCommandParser';

const PASS = '\x1b[32m✅\x1b[0m';
const FAIL = '\x1b[31m❌\x1b[0m';

function check(label: string, pass: boolean, detail?: string) {
  console.log(`  ${pass ? PASS : FAIL} ${label}${detail ? '  →  ' + detail : ''}`);
  if (!pass) process.exitCode = 1;
}

console.log('\n🎙️  Voice Command Parser — Smoke Tests\n');

// ── English intents ───────────────────────────────────────────

console.log('── English ──────────────────────────────────────────────');

const n1 = parseVoiceCommand('Take me to gate C4');
check('NAVIGATE_TO_GATE: "Take me to gate C4"', n1.intent === 'NAVIGATE_TO_GATE');
check('  → gate entity = C4', n1.entities.gate === 'C4');

const n2 = parseVoiceCommand('Navigate to gate B12 please');
check('NAVIGATE_TO_GATE: "Navigate to gate B12 please"', n2.intent === 'NAVIGATE_TO_GATE');
check('  → gate entity = B12', n2.entities.gate === 'B12');

const n3 = parseVoiceCommand('How do I get to gate A1');
check('NAVIGATE_TO_GATE: "How do I get to gate A1"', n3.intent === 'NAVIGATE_TO_GATE');

const s1 = parseVoiceCommand('Report long line at security');
check('REPORT_SECURITY: "Report long line at security"', s1.intent === 'REPORT_SECURITY');
check('  → reportType = security_slow', s1.entities.reportType === 'security_slow');

const s2 = parseVoiceCommand('Security checkpoint is very long');
check('REPORT_SECURITY: "Security checkpoint is very long"', s2.intent === 'REPORT_SECURITY');

const e1 = parseVoiceCommand('The elevator is out of service');
check('REPORT_ELEVATOR: "The elevator is out of service"', e1.intent === 'REPORT_ELEVATOR');
check('  → reportType = elevator_broken', e1.entities.reportType === 'elevator_broken');

const c1 = parseVoiceCommand('Very crowded at gate area');
check('REPORT_CROWD: "Very crowded at gate area"', c1.intent === 'REPORT_CROWD');

const cl1 = parseVoiceCommand('All clear here no issues');
check('REPORT_CLEAR: "All clear here no issues"', cl1.intent === 'REPORT_CLEAR');
check('  → reportType = clear_path', cl1.entities.reportType === 'clear_path');

const r1 = parseVoiceCommand('Where is the nearest restroom');
check('FIND_RESTROOM: "Where is the nearest restroom"', r1.intent === 'FIND_RESTROOM');

const f1 = parseVoiceCommand('Where can I eat something');
check('FIND_FOOD: "Where can I eat something"', f1.intent === 'FIND_FOOD');

const l1 = parseVoiceCommand('Find the lounge');
check('FIND_LOUNGE: "Find the lounge"', l1.intent === 'FIND_LOUNGE');

const g1 = parseVoiceCommand('Where is gate B38');
check('FIND_GATE: "Where is gate B38"', g1.intent === 'FIND_GATE');
check('  → gate = B38', g1.entities.gate === 'B38');

const fl1 = parseVoiceCommand('What is the status of flight UA 123');
check('CHECK_FLIGHT: "What is the status of flight UA 123"', fl1.intent === 'CHECK_FLIGHT');
check('  → flightNumber = UA 123', fl1.entities.flightNumber === 'UA 123');

const ca1 = parseVoiceCommand('Cancel never mind');
check('CANCEL: "Cancel never mind"', ca1.intent === 'CANCEL');

const u1 = parseVoiceCommand('blah blah something random xyz');
check('UNKNOWN: unrecognized utterance', u1.intent === 'UNKNOWN');
check('  → confidence = 0', u1.confidence === 0);

// ── Hebrew intents ────────────────────────────────────────────

console.log('\n── Hebrew (עברית) ────────────────────────────────────────');

const hn1 = parseVoiceCommand('קח אותי לשער C4');
check('NAVIGATE_TO_GATE (HE): "קח אותי לשער C4"', hn1.intent === 'NAVIGATE_TO_GATE');
check('  → gate = C4', hn1.entities.gate === 'C4');

const hs1 = parseVoiceCommand('תור ארוך בביטחון');
check('REPORT_SECURITY (HE): "תור ארוך בביטחון"', hs1.intent === 'REPORT_SECURITY');

const hr1 = parseVoiceCommand('איפה שירותים');
check('FIND_RESTROOM (HE): "איפה שירותים"', hr1.intent === 'FIND_RESTROOM');

const hca1 = parseVoiceCommand('ביטול');
check('CANCEL (HE): "ביטול"', hca1.intent === 'CANCEL');

// ── Spanish intents ───────────────────────────────────────────

console.log('\n── Spanish (Español) ─────────────────────────────────────');

const es1 = parseVoiceCommand('Llévame a la puerta C4');
check('NAVIGATE_TO_GATE (ES): "Llévame a la puerta C4"', es1.intent === 'NAVIGATE_TO_GATE');
check('  → gate = C4', es1.entities.gate === 'C4');

const ess1 = parseVoiceCommand('Hay una fila larga en seguridad');
check('REPORT_SECURITY (ES): "Hay una fila larga en seguridad"', ess1.intent === 'REPORT_SECURITY');

const esr1 = parseVoiceCommand('Dónde están los baños');
check('FIND_RESTROOM (ES): "Dónde están los baños"', esr1.intent === 'FIND_RESTROOM');

const esca = parseVoiceCommand('cancelar');
check('CANCEL (ES): "cancelar"', esca.intent === 'CANCEL');

// ── Priority: CANCEL over NAVIGATE ───────────────────────────

console.log('\n── Priority & edge cases ─────────────────────────────────');

const prio1 = parseVoiceCommand('cancel take me to gate B5');
check('CANCEL wins over NAVIGATE when said first', prio1.intent === 'CANCEL');

const edge1 = parseVoiceCommand('');
check('Empty string → UNKNOWN', edge1.intent === 'UNKNOWN');

const edge2 = parseVoiceCommand('  ');
check('Whitespace-only → UNKNOWN', edge2.intent === 'UNKNOWN');

console.log('\n');

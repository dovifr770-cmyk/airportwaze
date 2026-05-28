// ═══════════════════════════════════════════════════════════
// Voice Command Parser — language-aware NLP intent extractor
//
// Pure function, zero dependencies.
// Supports EN · HE (RTL) · ES patterns via regex.
// Priority order: CANCEL first, then specific intents,
// UNKNOWN if nothing matches.
// ═══════════════════════════════════════════════════════════

import type {
  VoiceCommand,
  VoiceIntent,
  VoiceEntities,
} from '../../types/models/voice';

// ── Text normalisation ────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:'"]/g, ' ')  // strip punctuation
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

// ── Entity extractors ─────────────────────────────────────────

// "gate C4", "שער B12", "puerta A1"  — captures code like "C4", "B12"
const GATE_WORD_RE =
  /(?:gate|שער|puerta|gate\s+number|porte)\s+([A-Z]\d{1,3}|\d{1,3}[A-Z]?)/i;
// bare code without the word "gate" — only if preceded by "to" / "at" / "near"
const GATE_BARE_RE =
  /(?:to|at|near|finding|find)\s+([A-Z]\d{1,3})/i;
// Flight number: "UA 123", "UA123", "DL456"
const FLIGHT_RE = /\b([A-Z]{2})\s*(\d{3,4})\b/i;
// Terminal: "T4", "terminal 4", "terminal T4"
const TERMINAL_RE = /(?:terminal\s+)?T(\d+)\b/i;

function extractGate(text: string): string | undefined {
  const m = text.match(GATE_WORD_RE) ?? text.match(GATE_BARE_RE);
  return m ? m[1].toUpperCase() : undefined;
}

function extractTerminal(text: string): string | undefined {
  const m = text.match(TERMINAL_RE);
  return m ? `T${m[1]}` : undefined;
}

function extractFlight(text: string): string | undefined {
  const m = text.match(FLIGHT_RE);
  return m ? `${m[1].toUpperCase()} ${m[2]}` : undefined;
}

// ── Intent pattern registry ───────────────────────────────────

interface IntentRule {
  intent: VoiceIntent;
  confidence: number;
  /** Returns true if ANY matcher fires */
  matchers: Array<(t: string) => boolean>;
}

const INTENT_RULES: IntentRule[] = [
  // ── CANCEL — highest priority ────────────────────────────────
  {
    intent: 'CANCEL',
    confidence: 0.95,
    matchers: [
      // EN: word boundaries work fine with ASCII
      t => /\b(cancel|never ?mind|stop|dismiss|abort|quit|exit)\b/.test(t),
      // HE: \b fails on non-ASCII — match anywhere in normalized string
      t => /(ביטול|בטל|עצור|צא|יציאה)/.test(t),
      // ES
      t => /\b(cancelar|parar|salir|detener|olvida)\b/.test(t),
    ],
  },

  // ── NAVIGATE_TO_GATE ─────────────────────────────────────────
  {
    intent: 'NAVIGATE_TO_GATE',
    confidence: 0.90,
    matchers: [
      // EN: "take me to gate C4", "navigate / go / route / get me to gate B12"
      t => /(?:take me|navigate|go|route|get me|head|directions?)\s+to\s+(?:gate|terminal)\s*[a-z]?\d/i.test(t),
      // EN: "how do I get to gate X"
      t => /how\s+(?:do\s+i|to)\s+get\s+to\s+(?:gate|terminal)/i.test(t),
      // HE: "קח אותי לשער X" / "נווט לשער X" / "איך מגיעים לשער X"
      t => /(?:קח\s+אותי|נווט|לך|מסלול|נתב)\s+ל(?:שער|טרמינל)/i.test(t),
      t => /איך\s+מגיע(?:ים)?\s+לשער/i.test(t),
      // ES: "llévame a la puerta X" / "navegar / ir a la puerta X"
      t => /(?:ll[eé]vame|navegar|ir|dirigirme)\s+a\s+(?:la\s+)?(?:puerta|terminal)/i.test(t),
      t => /c[oó]mo\s+(?:llego|voy)\s+a\s+(?:la\s+)?puerta/i.test(t),
    ],
  },

  // ── REPORT_SECURITY ──────────────────────────────────────────
  {
    intent: 'REPORT_SECURITY',
    confidence: 0.87,
    matchers: [
      t => /(?:long|slow|crowded|bad|massive)\s+(?:line|queue|wait)\s+(?:at\s+)?security/i.test(t),
      t => /security\s+(?:line|queue|wait|checkpoint)\s+(?:is\s+)?(?:very\s+)?(?:long|slow|busy|packed)/i.test(t),
      t => /report\s+(?:a\s+)?(?:long\s+)?(?:line|queue|wait)\s+(?:at\s+)?security/i.test(t),
      // HE
      t => /(?:תור\s+ארוך|עומס|עצור)\s+(?:ב)?ביטחון/i.test(t),
      t => /ביקורת\s+(?:ביטחון|דרכונים)\s+(?:ארוך|איטי|עמוסה?)/i.test(t),
      // ES
      t => /(?:fila|cola)\s+larga?\s+(?:en\s+)?(?:seguridad|control)/i.test(t),
      t => /seguridad\s+(?:est[aá]\s+)?(?:muy\s+)?(?:lenta?|congestionada?|larga?)/i.test(t),
    ],
  },

  // ── REPORT_ELEVATOR ──────────────────────────────────────────
  {
    intent: 'REPORT_ELEVATOR',
    confidence: 0.90,
    matchers: [
      t => /(?:elevator|escalator|lift)\s+(?:is\s+)?(?:broken|out\s+of\s+service|not\s+working|down)/i.test(t),
      t => /(?:broken|report)\s+(?:elevator|escalator|lift)/i.test(t),
      // HE
      t => /(?:מעלית|אסקלטור)\s+(?:מקולקל(?:ת)?|לא\s+עובד(?:ת)?|מושבת)/i.test(t),
      // ES
      t => /(?:ascensor|escalera\s+mec[aá]nica)\s+(?:est[aá]\s+)?(?:roto|fuera\s+de\s+servicio|no\s+funciona)/i.test(t),
    ],
  },

  // ── REPORT_CROWD ─────────────────────────────────────────────
  {
    intent: 'REPORT_CROWD',
    confidence: 0.82,
    matchers: [
      t => /(?:report\s+)?(?:very\s+)?(?:crowded|packed|full|busy)\s+(?:at|near|by)?\s*(?:gate|terminal)?/i.test(t),
      t => /(?:gate\s+area|terminal|waiting\s+area)\s+(?:is\s+)?(?:very\s+)?(?:crowded|packed|full)/i.test(t),
      // HE
      t => /(?:מלא|עמוס|צפוף)\s+(?:ב)?(?:שער|טרמינל|אזור)/i.test(t),
      // ES
      t => /(?:est[aá]\s+)?(?:muy\s+)?(?:lleno|abarrotado|congestionado)\s+(?:en|cerca\s+de)?\s*(?:puerta|terminal)?/i.test(t),
    ],
  },

  // ── REPORT_CLEAR ─────────────────────────────────────────────
  {
    intent: 'REPORT_CLEAR',
    confidence: 0.85,
    matchers: [
      t => /(?:all\s+clear|clear\s+path|no\s+issues?|everything\s+(?:is\s+)?(?:clear|fine|ok(?:ay)?))/i.test(t),
      t => /report\s+(?:all\s+)?clear/i.test(t),
      // HE
      t => /(?:הכל\s+(?:בסדר|נקי|פנוי)|נתיב\s+פנוי)/i.test(t),
      // ES
      t => /(?:todo\s+(?:est[aá]\s+)?(?:bien|despejado|claro)|sin\s+problemas|camino\s+libre)/i.test(t),
    ],
  },

  // ── FIND_RESTROOM ─────────────────────────────────────────────
  {
    intent: 'FIND_RESTROOM',
    confidence: 0.88,
    matchers: [
      t => /(?:where\s+(?:is|are)|find|nearest|locate)\s+(?:the\s+)?(?:restroom|bathroom|toilet|wc|lavatory|washroom)/i.test(t),
      t => /(?:need|looking\s+for|i\s+need)\s+(?:a\s+)?(?:restroom|bathroom|toilet|wc)/i.test(t),
      // HE
      t => /(?:איפה|מצא|הקרוב\s+ביותר)\s+(?:שירותים|שרותים)/i.test(t),
      t => /אני\s+צריכ(?:ה|)\s+שירותים/i.test(t),
      // ES
      t => /(?:d[oó]nde\s+(?:est[aá]n?|hay)|encontrar|buscar)\s+(?:los?\s+)?(?:ba[nñ]os?|servicios|aseos)/i.test(t),
    ],
  },

  // ── FIND_FOOD ─────────────────────────────────────────────────
  {
    intent: 'FIND_FOOD',
    confidence: 0.85,
    matchers: [
      t => /(?:where\s+can\s+i\s+eat|find\s+food|find\s+restaurant|grab\s+a\s+bite)/i.test(t),
      t => /(?:hungry|food\s+near|restaurants?\s+(?:nearby|close|near))/i.test(t),
      t => /(?:find|looking\s+for)\s+(?:something\s+to\s+eat|a\s+restaurant|a\s+caf[eé]|coffee)/i.test(t),
      // HE
      t => /(?:איפה|מצא)\s+(?:אוכל|מסעדה|קפה)/i.test(t),
      t => /(?:רעב|רעבה|אני\s+רוצה\s+לאכול)/i.test(t),
      // ES
      t => /(?:d[oó]nde\s+(?:puedo\s+comer|hay\s+comida)|encontrar\s+(?:comida|restaurante|caf[eé]))/i.test(t),
    ],
  },

  // ── FIND_LOUNGE ───────────────────────────────────────────────
  {
    intent: 'FIND_LOUNGE',
    confidence: 0.87,
    matchers: [
      t => /(?:where\s+is|find|locate)\s+(?:the\s+)?(?:lounge|club|vip|business\s+class\s+lounge)/i.test(t),
      t => /(?:priority\s+pass|united\s+club|delta\s+sky|admirals\s+club|sky\s+club)/i.test(t),
      // HE
      t => /(?:איפה|מצא)\s+(?:טרקלין|לאונג)/i.test(t),
      // ES
      t => /(?:d[oó]nde\s+(?:est[aá]|hay)|encontrar)\s+(?:el\s+)?(?:sal[oó]n\s+vip|sala\s+premium|lounge)/i.test(t),
    ],
  },

  // ── FIND_GATE — lower priority than NAVIGATE ──────────────────
  {
    intent: 'FIND_GATE',
    confidence: 0.80,
    matchers: [
      t => /(?:where\s+is|find|locate)\s+gate\s+[a-z]?\d/i.test(t),
      // HE
      t => /(?:איפה\s+שער|מצא\s+שער)\s+[a-z]?\d/i.test(t),
      // ES
      t => /(?:d[oó]nde\s+est[aá]|encontrar)\s+(?:la\s+)?puerta\s+[a-z]?\d/i.test(t),
    ],
  },

  // ── CHECK_FLIGHT ──────────────────────────────────────────────
  {
    intent: 'CHECK_FLIGHT',
    confidence: 0.85,
    matchers: [
      // EN: "what is the status of flight UA 123" / "check flight UA 123"
      // Use [\s\S]{0,20} to allow "of flight" between status and the code
      t => /(?:what(?:'s|\s+is)\s+the\s+status|check\s+(?:my\s+)?flight|flight\s+status)[\s\S]{0,20}[a-z]{2}\s*\d{3,4}/i.test(t),
      t => /flight\s+[a-z]{2}\s*\d{3,4}\s+(?:on\s+time|delayed|cancelled|status)/i.test(t),
      // HE
      t => /(?:מה\s+הסטטוס|סטטוס\s+טיסה)[\s\S]{0,15}[a-z]{2}\s*\d{3,4}/i.test(t),
      // ES
      t => /(?:cu[aá]l\s+es\s+el\s+estado|verificar)[\s\S]{0,15}[a-z]{2}\s*\d{3,4}/i.test(t),
    ],
  },
];

// ── Entity extraction per intent ──────────────────────────────

function extractEntities(intent: VoiceIntent, text: string): VoiceEntities {
  switch (intent) {
    case 'NAVIGATE_TO_GATE':
    case 'FIND_GATE': {
      const gate     = extractGate(text);
      const terminal = extractTerminal(text);
      return {
        ...(gate     ? { gate }     : {}),
        ...(terminal ? { terminal } : {}),
      };
    }
    case 'REPORT_SECURITY':
      return { reportType: 'security_slow', locationLabel: 'Security checkpoint' };
    case 'REPORT_ELEVATOR':
      return { reportType: 'elevator_broken', locationLabel: 'Elevator / Escalator' };
    case 'REPORT_CROWD': {
      const gate = extractGate(text);
      return {
        reportType: 'crowded',
        locationLabel: gate ? `Gate ${gate} area` : 'Gate area',
        ...(gate ? { gate } : {}),
      };
    }
    case 'REPORT_CLEAR':
      return { reportType: 'clear_path' };
    case 'CHECK_FLIGHT': {
      const flightNumber = extractFlight(text);
      return flightNumber ? { flightNumber } : {};
    }
    default:
      return {};
  }
}

// ── Public API ────────────────────────────────────────────────

export function parseVoiceCommand(raw: string): VoiceCommand {
  const text = normalize(raw);

  for (const rule of INTENT_RULES) {
    if (rule.matchers.some(m => m(text))) {
      return {
        intent:     rule.intent,
        raw,
        confidence: rule.confidence,
        entities:   extractEntities(rule.intent, text),
      };
    }
  }

  return { intent: 'UNKNOWN', raw, confidence: 0, entities: {} };
}

// ─── Smart Connection Agent ────────────────────────────────────────────────────
// Core intelligence for guiding passengers through airport connections.
//
// Given an inbound + outbound flight and the available minutes between them,
// this agent builds a fully structured route plan with:
//   - Step-by-step navigation (deplane → customs → transfer → security → gate)
//   - Risk assessment (CRITICAL / TIGHT / COMFORTABLE / RELAXED / PLENTY)
//   - Smart recommendations (lounge, coffee, food) based on free time after walking
//   - Airport-specific intelligence for 14 major airports
//
// i18n NOTE: Every user-visible string (titles, subtitles, reasons, alerts, tips)
// is tagged with a comment indicating the translation key it would map to in a
// full i18n implementation. Example:
//   // i18n: 'steps.deplane.title'
//   // i18n: 'steps.transfer.subtitle.airtrain'
// The `buildSmartConnectionPlan` function accepts a `locale` param (reserved for
// future use) so that all downstream callers are i18n-aware by design.

import {
  AIRPORT_REGISTRY,
  lookupTerminal,
  getTransferTime,
  getAirlineCode,
  AIRLINE_NAMES,
  type TerminalInfo,
  type AirportData,
} from '../../data/airportTerminals';

import {
  type AirportRecommendation,
  getRecommendationsForTerminal,
  getBestLounge,
  getBestFood,
} from './airportRecommendations';

// ─── Public Types ─────────────────────────────────────────────────────────────

/** Risk level for the entire connection, based on available time vs. walking time. */
export type ConnectionRisk = 'CRITICAL' | 'TIGHT' | 'COMFORTABLE' | 'RELAXED' | 'PLENTY';

/** Transfer mode for a between-terminal step. */
export type TransferMode = 'airtrain' | 'skytrain' | 'monorail' | 'bus' | 'walk' | 'underground';

/** A single step in the connection route. */
export interface RouteStep {
  /** Stable unique id, e.g. 'step-deplane', 'step-transfer', 'step-gate' */
  id: string;
  /** Category of step — drives icon and colour in the UI. */
  type: 'deplane' | 'customs' | 'transfer' | 'security' | 'walk' | 'gate' | 'board';
  /** Emoji or SF Symbol name. */
  icon: string;
  /** Short headline (1 line). i18n key = `steps.${type}.title` */
  title: string;
  /** Supporting detail (1–2 lines). i18n key = `steps.${type}.subtitle` */
  subtitle: string;
  /** How long this step takes, in minutes. */
  durationMinutes: number;
  /** Urgency influences colour and pulse animation in UI. */
  urgency: 'low' | 'medium' | 'high';
  /** True when this step moves the passenger between terminals. */
  isTransfer: boolean;
  /** Only present when isTransfer = true. */
  transferMode?: TransferMode;
}

/** A curated recommendation surfaced from the airport recommendations database. */
export interface SmartRecommendation {
  /** Stable unique id from the recommendations database. */
  id: string;
  type: 'lounge' | 'coffee' | 'food' | 'rest' | 'shop' | 'wifi';
  name: string;
  /** Human-readable location within the terminal. */
  location: string;
  /** Minimum useful minutes to spend here. */
  timeNeeded: number;
  /** Why this is recommended at this point in the journey. */
  reason: string;
  /** Aggregate rating 1–5. */
  rating: number;
  tags: string[];
}

/** Lounge summary surfaced into the top-level plan. */
export interface LoungeInfo {
  name: string;
  location: string;
  accessRequirement: string | null;
  rating: number;
  timeNeeded: number;
}

/** Food/coffee summary surfaced into the top-level plan. */
export interface FoodSuggestion {
  name: string;
  location: string;
  type: 'food' | 'coffee';
  rating: number;
  timeNeeded: number;
  reason: string;
}

/** The complete, structured output of the Smart Connection Agent. */
export interface SmartRoutePlan {
  // ── Meta ──────────────────────────────────────────────────────────────────
  airportCode: string;
  inboundFlight: string;
  outboundFlight: string;
  inboundTerminal: string;
  outboundTerminal: string;
  isInternationalArrival: boolean;
  generatedAt: number; // Unix ms

  // ── Risk ──────────────────────────────────────────────────────────────────
  connectionRisk: ConnectionRisk;
  /** Hex colour for risk badge. */
  riskColor: string;
  /** Short risk label for display. i18n key = `risk.${connectionRisk}.label` */
  riskLabel: string;
  /** One-line description of the risk. i18n key = `risk.${connectionRisk}.description` */
  riskDescription: string;

  // ── Timing ────────────────────────────────────────────────────────────────
  /** Total walking / transit minutes (all RouteSteps combined). */
  totalWalkMinutes: number;
  /** Minutes left over after walking — this drives recommendations. */
  freeMinutes: number;
  /** Input: total time between landing and departure. */
  availableMinutes: number;

  // ── Route ─────────────────────────────────────────────────────────────────
  steps: RouteStep[];

  // ── Recommendations ───────────────────────────────────────────────────────
  recommendations: SmartRecommendation[];
  loungeSuggestion: LoungeInfo | null;
  foodSuggestion: FoodSuggestion | null;

  // ── Contextual Intelligence ───────────────────────────────────────────────
  /** Urgent, time-sensitive warnings. */
  alerts: string[];
  /** General tips for the specific airport/terminal combo. */
  tips: string[];
}

// ─── Risk thresholds ──────────────────────────────────────────────────────────

interface RiskThreshold {
  risk: ConnectionRisk;
  color: string;
  label: string;
  description: string; // i18n key: `risk.${risk}.description`
}

const RISK_THRESHOLDS: RiskThreshold[] = [
  // Order matters — first match wins
  { risk: 'CRITICAL',    color: '#DC2626', label: 'Critical',    description: 'Very tight — walk directly to your gate without stopping.' },
  { risk: 'TIGHT',       color: '#F97316', label: 'Tight',       description: 'Feasible, but keep moving — no stops unless necessary.' },
  { risk: 'COMFORTABLE', color: '#F59E0B', label: 'Comfortable', description: 'Enough time for a quick coffee or snack along the way.' },
  { risk: 'RELAXED',     color: '#22C55E', label: 'Relaxed',     description: 'Good time to grab a meal or visit a lounge.' },
  { risk: 'PLENTY',      color: '#3B82F6', label: 'Plenty',      description: 'Enjoy the full lounge experience — explore, rest, and relax.' },
];

function assessRisk(availableMinutes: number): RiskThreshold {
  if (availableMinutes < 30)  return RISK_THRESHOLDS[0]; // CRITICAL
  if (availableMinutes < 60)  return RISK_THRESHOLDS[1]; // TIGHT
  if (availableMinutes < 90)  return RISK_THRESHOLDS[2]; // COMFORTABLE
  if (availableMinutes < 150) return RISK_THRESHOLDS[3]; // RELAXED
  return RISK_THRESHOLDS[4];                              // PLENTY
}

// ─── Airport-specific transfer intelligence ───────────────────────────────────
//
// Each airport has unique physical infrastructure for moving between terminals.
// This section encodes that knowledge so the agent can produce accurate step
// titles and transfer modes rather than generic "take a bus" instructions.

interface TransferIntel {
  /** Human-readable system name. i18n key: `transfer.${airportCode}.name` */
  systemName: string;
  mode: TransferMode;
  /** Extra minutes added on top of the data file's transfer time (boarding/wait buffer). */
  bufferMinutes: number;
  /** Short operational note. i18n key: `transfer.${airportCode}.note` */
  operationalNote: string;
  /** Does this transfer require re-clearing security? */
  requiresReSecurity: boolean;
}

/**
 * Returns transfer intelligence for a given airport and terminal pair.
 * Encodes the specific transport system used (AirTrain, Skytrain, monorail, etc.)
 */
function getTransferIntel(
  airportCode: string,
  fromTerminal: string,
  toTerminal: string,
): TransferIntel {
  // ── JFK — AirTrain ────────────────────────────────────────────────────────
  if (airportCode === 'JFK') {
    return {
      systemName: 'AirTrain JFK',
      mode: 'airtrain',
      bufferMinutes: 5, // walk to station + wait
      operationalNote: 'Free AirTrain connects all terminals. Runs every 4–8 min. Board at designated station in your terminal.',
      requiresReSecurity: true, // JFK terminals are not airside-connected via AirTrain
    };
  }

  // ── SIN — Skytrain (T1/T2/T3) or Bus (T4) ────────────────────────────────
  if (airportCode === 'SIN') {
    const involveT4 = fromTerminal === '4' || toTerminal === '4';
    if (involveT4) {
      return {
        systemName: 'Changi T4 Shuttle Bus',
        mode: 'bus',
        bufferMinutes: 5,
        operationalNote: 'T4 is not connected airside to T1/T2/T3. Take the free inter-terminal shuttle. Follow TRANSFER signs on arrival.',
        requiresReSecurity: true,
      };
    }
    return {
      systemName: 'Changi Skytrain',
      mode: 'skytrain',
      bufferMinutes: 3, // walk to station
      operationalNote: 'Free Skytrain between T1, T2 and T3. Runs every 3–5 min, 24 hours. No security re-check needed.',
      requiresReSecurity: false,
    };
  }

  // ── FRA — SkyLine Monorail ────────────────────────────────────────────────
  if (airportCode === 'FRA') {
    return {
      systemName: 'FRA SkyLine Monorail',
      mode: 'monorail',
      bufferMinutes: 5,
      operationalNote: 'Free airside SkyLine connects T1 ↔ T2. Runs every 2 min. Journey is 3 min. No security re-check for airside connection.',
      requiresReSecurity: false,
    };
  }

  // ── CDG — CDGval Automated Shuttle ───────────────────────────────────────
  if (airportCode === 'CDG') {
    const is2GInvolved = fromTerminal === '2G' || toTerminal === '2G';
    return {
      systemName: 'CDGval Shuttle',
      mode: 'underground',
      bufferMinutes: is2GInvolved ? 8 : 5,
      operationalNote: is2GInvolved
        ? 'Hall 2G is a satellite. CDGval to/from 2G adds ~15 min total. Follow yellow CORRESPONDANCES signs.'
        : 'CDGval automated people mover connects T1, T2 halls, and T3. Free, runs frequently. Follow yellow CORRESPONDANCES signs.',
      requiresReSecurity: false,
    };
  }

  // ── ATL — Plane Train ─────────────────────────────────────────────────────
  if (airportCode === 'ATL') {
    return {
      systemName: 'ATL Plane Train',
      mode: 'underground',
      bufferMinutes: 3,
      operationalNote: 'Underground automated Plane Train connects all concourses. Free, runs every 2 min, 24 hours. Fastest way between concourses.',
      requiresReSecurity: false,
    };
  }

  // ── DFW — Skylink (A–D) or Bus (E) ───────────────────────────────────────
  if (airportCode === 'DFW') {
    const involvesE = fromTerminal === 'E' || toTerminal === 'E';
    if (involvesE) {
      return {
        systemName: 'DFW Terminal E Shuttle',
        mode: 'bus',
        bufferMinutes: 8,
        operationalNote: 'Terminal E is not on the Skylink. Take the free shuttle bus. Re-security required at destination terminal.',
        requiresReSecurity: true,
      };
    }
    return {
      systemName: 'DFW Skylink',
      mode: 'airtrain', // elevated people mover — closest category
      bufferMinutes: 4,
      operationalNote: 'Free airside Skylink connects Terminals A–D. Runs 24h. No security re-check. Watch the direction — going the wrong way adds time.',
      requiresReSecurity: false,
    };
  }

  // ── DXB — Inter-terminal Bus (T1 ↔ T2 ↔ T3) ─────────────────────────────
  if (airportCode === 'DXB') {
    return {
      systemName: 'DXB Inter-Terminal Bus',
      mode: 'bus',
      bufferMinutes: 5,
      operationalNote: 'Free inter-terminal bus. DXB terminals are NOT airside-connected — you must go through immigration, take the bus, and re-clear security.',
      requiresReSecurity: true,
    };
  }

  // ── LHR — Inter-terminal Train ────────────────────────────────────────────
  if (airportCode === 'LHR') {
    // T5 satellites B/C — internal automated train (not truly a terminal transfer)
    const t5Satellite = (fromTerminal === '5' && (toTerminal === '5B' || toTerminal === '5C'));
    if (t5Satellite) {
      return {
        systemName: 'T5 Satellite Train',
        mode: 'underground',
        bufferMinutes: 2,
        operationalNote: 'Automated train within T5 to Satellites B and C. Runs frequently. Add 8 min for T5B/C gates.',
        requiresReSecurity: false,
      };
    }
    return {
      systemName: 'LHR Inter-Terminal Train',
      mode: 'underground',
      bufferMinutes: 5,
      operationalNote: 'Free Heathrow Express inter-terminal service connects T2, T3, T4, T5. Re-security required when changing terminals.',
      requiresReSecurity: true,
    };
  }

  // ── NRT — Shuttle Bus ─────────────────────────────────────────────────────
  if (airportCode === 'NRT') {
    const involvesT3 = fromTerminal === '3' || toTerminal === '3';
    return {
      systemName: involvesT3 ? 'NRT T3 Shuttle Bus' : 'NRT Inter-Terminal Shuttle',
      mode: 'bus',
      bufferMinutes: 5,
      operationalNote: involvesT3
        ? 'T3 is significantly farther — 20 min bus from T2. Allow ample time for this transfer.'
        : 'Free shuttle bus between T1 and T2 every 5–10 min. 10 min journey. Re-security required at destination.',
      requiresReSecurity: true,
    };
  }

  // ── AMS — Walking (single terminal) ──────────────────────────────────────
  if (airportCode === 'AMS') {
    return {
      systemName: 'Walk (Moving Walkways)',
      mode: 'walk',
      bufferMinutes: 2,
      operationalNote: 'Schiphol is a single terminal — all piers connected by corridors and moving walkways. No bus or train needed.',
      requiresReSecurity: false,
    };
  }

  // ── IST — Walking (single mega-terminal) ─────────────────────────────────
  if (airportCode === 'IST') {
    return {
      systemName: 'Walk (Moving Walkways)',
      mode: 'walk',
      bufferMinutes: 3,
      operationalNote: 'Istanbul Airport is a single massive terminal. All piers connected by corridors and moving walkways. Allow extra time for the distance.',
      requiresReSecurity: false,
    };
  }

  // ── HKG — APM (Automated People Mover) ────────────────────────────────────
  if (airportCode === 'HKG') {
    return {
      systemName: 'HKG APM (People Mover)',
      mode: 'underground',
      bufferMinutes: 3,
      operationalNote: 'Free automated people mover between main terminal and north satellite. 3 min ride, 24h service.',
      requiresReSecurity: false,
    };
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  return {
    systemName: 'Airport Shuttle / Transit',
    mode: 'bus',
    bufferMinutes: 5,
    operationalNote: 'Follow TRANSFER or CONNECTIONS signs in the terminal.',
    requiresReSecurity: true,
  };
}

// ─── Step builders ────────────────────────────────────────────────────────────

function buildDeplaneStep(
  flightNumber: string,
  terminal: TerminalInfo,
  airlineName: string,
): RouteStep {
  return {
    id: 'step-deplane',
    type: 'deplane',
    icon: '✈️',
    // i18n: 'steps.deplane.title'
    title: `Exit ${terminal.terminalFull}`,
    // i18n: 'steps.deplane.subtitle' (params: airlineName, flightNumber)
    subtitle: `${airlineName} ${flightNumber} has landed. Collect carry-on and deplane.`,
    durationMinutes: 5,
    urgency: 'low',
    isTransfer: false,
  };
}

function buildCustomsStep(
  isInternational: boolean,
  airportCode: string,
  urgency: RouteStep['urgency'],
): RouteStep {
  // Airport-specific customs notes
  // i18n: these notes would all be translation keys
  const customsNotes: Record<string, string> = {
    US: 'US Customs (CBP). Have passport, ESTA/visa, and customs form ready. Global Entry kiosks available.',
    DXB: 'UAE Border Control. Follow ARRIVALS → TRANSFER signs. Transit passengers may stay airside.',
    SIN: 'Singapore ICA. Fast and efficient — typically under 10 min for transfer pax.',
    CDG: 'French PAF. Schengen travellers use fast lane. Non-Schengen can be slower.',
    FRA: 'German Federal Police (Bundespolizei). Schengen travellers use fast lane.',
    LHR: 'UK Border Force. E-gate for eligible passports. Non-UK queues can be slow.',
    NRT: 'Japan Immigration. Thorough — allow 20–25 min at peak times.',
    HKG: 'Hong Kong Immigration. Usually very fast — under 10 min for most.',
    AMS: 'Dutch Marechaussee. Schengen fast lane available.',
    IST: 'Turkish National Police. Transit passengers can remain airside.',
    ATL: 'US CBP. Collect bags, clear customs, re-check for domestic connection.',
    DFW: 'US CBP. Global Entry kiosks at Terminal D. Bags must be collected and re-checked.',
  };

  const usAirports = ['JFK', 'LAX', 'ORD', 'ATL', 'DFW'];
  const countryNote = usAirports.includes(airportCode)
    ? customsNotes['US']
    : customsNotes[airportCode] ?? 'Follow ARRIVALS or TRANSFER signs to passport control.';

  if (!isInternational) {
    return {
      id: 'step-arrivals',
      type: 'customs',
      icon: '🚶',
      // i18n: 'steps.arrivals.title'
      title: 'Follow Connections Signs',
      // i18n: 'steps.arrivals.domestic.subtitle'
      subtitle: 'Domestic arrival — follow CONNECTIONS or TRANSFERS signs to departure area.',
      durationMinutes: 5,
      urgency: 'low',
      isTransfer: false,
    };
  }

  return {
    id: 'step-customs',
    type: 'customs',
    icon: '🛃',
    // i18n: 'steps.customs.title'
    title: 'Immigration & Customs',
    // i18n: 'steps.customs.subtitle' (param: countryNote)
    subtitle: countryNote,
    durationMinutes: urgency === 'high' ? 25 : urgency === 'medium' ? 20 : 15,
    urgency,
    isTransfer: false,
  };
}

function buildTransferStep(
  fromTerminal: TerminalInfo,
  toTerminal: TerminalInfo,
  intel: TransferIntel,
  dataTransferMinutes: number,
): RouteStep {
  const totalMinutes = dataTransferMinutes + intel.bufferMinutes;
  return {
    id: 'step-transfer',
    type: 'transfer',
    icon: transferModeIcon(intel.mode),
    // i18n: 'steps.transfer.title' (param: systemName)
    title: `Take ${intel.systemName}`,
    // i18n: 'steps.transfer.subtitle' (params: fromTerminal, toTerminal, operationalNote)
    subtitle: `${fromTerminal.terminalFull} → ${toTerminal.terminalFull}. ${intel.operationalNote}`,
    durationMinutes: totalMinutes,
    urgency: 'medium',
    isTransfer: true,
    transferMode: intel.mode,
  };
}

function buildReSecurityStep(urgency: RouteStep['urgency']): RouteStep {
  return {
    id: 'step-re-security',
    type: 'security',
    icon: '🔐',
    // i18n: 'steps.security.title'
    title: 'Re-enter Security',
    // i18n: 'steps.security.subtitle'
    subtitle: 'Have boarding pass and ID/passport ready. Remove liquids and electronics.',
    durationMinutes: urgency === 'high' ? 20 : 12,
    urgency,
    isTransfer: false,
  };
}

function buildWalkToGateStep(
  outboundTerminal: TerminalInfo,
  outboundFlight: string,
  outboundAirlineName: string,
): RouteStep {
  return {
    id: 'step-walk-gate',
    type: 'walk',
    icon: '🚶',
    // i18n: 'steps.walk.title'
    title: 'Walk to Departure Gate',
    // i18n: 'steps.walk.subtitle' (params: terminal, gatePrefix, walkMinutes)
    subtitle: `${outboundTerminal.terminalFull} · Gates ${outboundTerminal.gatePrefix || '—'} · ~${outboundTerminal.walkMinutesFromSecurity} min walk from security.`,
    durationMinutes: outboundTerminal.walkMinutesFromSecurity,
    urgency: 'low',
    isTransfer: false,
  };
}

function buildGateStep(
  outboundFlight: string,
  outboundTerminal: TerminalInfo,
  airlineName: string,
  urgency: RouteStep['urgency'],
): RouteStep {
  return {
    id: 'step-gate',
    type: 'gate',
    icon: '📋',
    // i18n: 'steps.gate.title'
    title: 'Arrive at Gate',
    // i18n: 'steps.gate.subtitle' (params: terminal, gatePrefix)
    subtitle: `Check departures board for gate number. Gates: ${outboundTerminal.gatePrefix || 'see boarding pass'}.`,
    durationMinutes: 0,
    urgency,
    isTransfer: false,
  };
}

function buildBoardStep(outboundFlight: string, airlineName: string): RouteStep {
  return {
    id: 'step-board',
    type: 'board',
    icon: '🛫',
    // i18n: 'steps.board.title' (params: airlineName, flightNumber)
    title: `Board ${airlineName} ${outboundFlight}`,
    // i18n: 'steps.board.subtitle'
    subtitle: 'Present boarding pass and passport at the gate. Enjoy your flight!',
    durationMinutes: 0,
    urgency: 'low',
    isTransfer: false,
  };
}

function transferModeIcon(mode: TransferMode): string {
  const icons: Record<TransferMode, string> = {
    airtrain:   '🚄',
    skytrain:   '🚟',
    monorail:   '🚝',
    bus:        '🚌',
    walk:       '🚶',
    underground:'🚇',
  };
  return icons[mode];
}

// ─── Alert and tip generation ─────────────────────────────────────────────────

function buildAlerts(
  risk: ConnectionRisk,
  isInternational: boolean,
  airportCode: string,
  fromTerminal: TerminalInfo,
  toTerminal: TerminalInfo,
  availableMinutes: number,
  intel: TransferIntel | null,
): string[] {
  const alerts: string[] = [];

  // ── Risk-level alerts ──────────────────────────────────────────────────────
  // i18n: 'alerts.critical'
  if (risk === 'CRITICAL') {
    alerts.push('CRITICAL: Do NOT stop for food, shopping, or lounges. Walk directly to your gate now.');
  }
  // i18n: 'alerts.tight'
  if (risk === 'TIGHT') {
    alerts.push('Tight connection — skip non-essential stops. Head directly to your departure gate.');
  }

  // ── International arrival alerts ────────────────────────────────────────
  if (isInternational) {
    const usAirports = ['JFK', 'LAX', 'ORD', 'ATL', 'DFW'];
    if (usAirports.includes(airportCode)) {
      // i18n: 'alerts.us.customs'
      alerts.push('US arrival: You MUST collect bags, clear CBP customs, re-check bags, and go through domestic security. Add 45–75 min for this process.');
    }
    if (airportCode === 'DXB' && fromTerminal.terminal !== toTerminal.terminal) {
      // i18n: 'alerts.dxb.resecurity'
      alerts.push('DXB inter-terminal transfer REQUIRES full re-security screening. No airside walk between T1 and T3.');
    }
    if (airportCode === 'NRT') {
      // i18n: 'alerts.nrt.customs'
      alerts.push('Japan Immigration can be very thorough. Non-Japanese passport holders should allow 20–25 min at peak times.');
    }
  }

  // ── Schengen zone alerts ─────────────────────────────────────────────────
  const schengenAirports = ['AMS', 'FRA', 'CDG'];
  if (schengenAirports.includes(airportCode) && isInternational) {
    // i18n: 'alerts.schengen.zone'
    alerts.push('Check Schengen vs non-Schengen zone: your arrival and departure security areas may differ. Follow the colour-coded TRANSFER signs.');
  }
  // AMS-specific: non-Schengen departure
  if (airportCode === 'AMS') {
    // i18n: 'alerts.ams.pier'
    alerts.push('AMS: Schengen flights use Piers B/C/D. Non-Schengen use Piers D/E/F/G/H. Verify your departure pier to avoid wrong security lane.');
  }

  // ── CDG-specific ──────────────────────────────────────────────────────────
  if (airportCode === 'CDG') {
    // i18n: 'alerts.cdg.slow'
    alerts.push('CDG is notorious for slow connections. Minimum 90 min strongly recommended. Check your hall letter (2A–2G) on boarding pass.');
    if (toTerminal.terminal === '2G' || fromTerminal.terminal === '2G') {
      // i18n: 'alerts.cdg.2g'
      alerts.push('Hall 2G is a satellite accessible only via CDGval shuttle. Add 15 min extra for 2G gates.');
    }
  }

  // ── LHR T5 satellites ──────────────────────────────────────────────────
  if (airportCode === 'LHR' && toTerminal.terminal === '5') {
    // i18n: 'alerts.lhr.t5.satellites'
    alerts.push('LHR T5: Gates in Satellites B and C require an automated train from the main T5 building. Add 8 min if your gate is B or C.');
  }

  // ── FRA concourse B long walk ─────────────────────────────────────────
  if (airportCode === 'FRA' && toTerminal.terminal === '1') {
    // i18n: 'alerts.fra.concourse_b'
    alerts.push('FRA Concourse B can be up to 25 min end-to-end. Start walking immediately once past security.');
  }

  // ── Very available time → consider early arrival ───────────────────────
  if (availableMinutes > 240) {
    // i18n: 'alerts.very_long.layover'
    alerts.push('Long layover: consider checking any city tour or hotel facilities. Some airports (IST, SIN, HKG) offer free layover programmes.');
  }

  return alerts;
}

function buildTips(
  airportCode: string,
  outboundTerminal: TerminalInfo,
  risk: ConnectionRisk,
): string[] {
  const tips: string[] = [];

  // Pull the best tips from the terminal's own tip array (max 3)
  // i18n: these are already plain strings in the data — would be replaced with translation keys
  const terminalTips = outboundTerminal.tips.slice(0, 3);
  tips.push(...terminalTips);

  // Airport-wide wisdom tips
  // i18n: 'tips.${airportCode}.general'
  const airportTips: Partial<Record<string, string>> = {
    JFK: 'JFK AirTrain is free between terminals. T5 (JetBlue) has the best food at JFK.',
    DXB: 'Dubai Duty Free is post-security — world\'s largest. Budget 20 min if you want to browse.',
    CDG: 'Always verify your exact hall letter (2A–2G). Distances within Terminal 2 are significant.',
    SIN: 'Changi offers a free Singapore Heritage Tour for transits over 5.5 hrs. Jewel (T1/T3) has the indoor waterfall.',
    AMS: 'Single terminal — no inter-terminal bus needed. Visit the free Rijksmuseum mini-exhibit airside.',
    FRA: 'Lufthansa First Class Terminal is a separate private building — limo pickup for F pax only.',
    ATL: 'Plane Train runs underground every 2 min, free. Fastest way across all concourses.',
    DFW: 'Skylink loops around A–D. Go the right direction — the wrong way adds 15 min.',
    LHR: 'T5 is BA\'s hub and is exceptionally well-designed. Duty-free Harrods is excellent for UK gifts.',
    NRT: 'Japanese duty-free (Kit-Kat varieties, cosmetics, whisky) is world-class — pick up on the way to gate.',
    IST: 'Turkish Airlines Lounge at Pier E is the world\'s largest airport lounge. Even 45 min is worth a visit.',
    HKG: 'Cathay Pacific\'s The Wing and The Pier lounges are among the finest in the world.',
    ORD: "Try Chicago deep-dish pizza or Publican Tavern in T3 if you have 30+ min free.",
    LAX: 'TBIT connects airside to T4–T7. Star Alliance Lounge has a rooftop terrace.',
  };

  const airportTip = airportTips[airportCode];
  if (airportTip) tips.push(airportTip);

  // Risk-specific general tips
  if (risk === 'COMFORTABLE' || risk === 'RELAXED') {
    // i18n: 'tips.general.lounge_hint'
    tips.push('Check if your credit card or airline status grants lounge access — even a 30-min visit beats sitting at the gate.');
  }
  if (risk === 'PLENTY') {
    // i18n: 'tips.general.explore'
    tips.push('You have plenty of time. Consider visiting the airport\'s signature attraction, if it has one.');
  }

  // Always surface the WiFi tip
  // i18n: 'tips.general.wifi'
  tips.push('Download your boarding pass to Apple Wallet / Google Pay now — avoid hunting for signal near the gate.');

  return [...new Set(tips)]; // deduplicate
}

// ─── Recommendation mapping ───────────────────────────────────────────────────

function mapToSmartRecommendation(rec: AirportRecommendation): SmartRecommendation {
  return {
    id: rec.id,
    type: rec.type as SmartRecommendation['type'],
    name: rec.name,
    location: rec.location,
    timeNeeded: rec.timeNeeded,
    reason: rec.reason,
    rating: rec.rating,
    tags: rec.tags,
  };
}

/**
 * Selects recommendations appropriate for the available free time and risk level.
 * CRITICAL/TIGHT → no recommendations (move to gate)
 * COMFORTABLE     → quick coffee only
 * RELAXED         → lounge or sit-down meal
 * PLENTY          → full lounge + food + explore
 */
function selectRecommendations(
  airportCode: string,
  terminalCode: string,
  freeMinutes: number,
  risk: ConnectionRisk,
): SmartRecommendation[] {
  if (risk === 'CRITICAL' || risk === 'TIGHT') return [];

  const recs = getRecommendationsForTerminal(airportCode, terminalCode);
  const selected: SmartRecommendation[] = [];

  if (risk === 'COMFORTABLE') {
    // Only suggest a quick coffee (15–25 min free)
    const coffee = recs
      .filter((r) => r.type === 'coffee' && r.freeMinutesNeeded <= freeMinutes)
      .sort((a, b) => b.rating - a.rating)[0];
    if (coffee) selected.push(mapToSmartRecommendation(coffee));
    return selected;
  }

  if (risk === 'RELAXED') {
    // Suggest lounge OR sit-down meal
    const lounge = recs
      .filter((r) => r.type === 'lounge' && r.freeMinutesNeeded <= freeMinutes)
      .sort((a, b) => b.rating - a.rating)[0];
    const food = recs
      .filter((r) => r.type === 'food' && r.freeMinutesNeeded <= freeMinutes)
      .sort((a, b) => b.rating - a.rating)[0];

    if (lounge) selected.push(mapToSmartRecommendation(lounge));
    if (food) selected.push(mapToSmartRecommendation(food));
    return selected.slice(0, 2);
  }

  // PLENTY — full selection
  const lounges = recs
    .filter((r) => r.type === 'lounge' && r.freeMinutesNeeded <= freeMinutes)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);

  const food = recs
    .filter((r) => (r.type === 'food' || r.type === 'coffee') && r.freeMinutesNeeded <= freeMinutes)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2);

  const rest = recs
    .filter((r) => r.type === 'rest' && r.freeMinutesNeeded <= freeMinutes)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 1);

  const shop = recs
    .filter((r) => r.type === 'shop' && r.freeMinutesNeeded <= freeMinutes)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 1);

  selected.push(
    ...lounges.map(mapToSmartRecommendation),
    ...food.map(mapToSmartRecommendation),
    ...rest.map(mapToSmartRecommendation),
    ...shop.map(mapToSmartRecommendation),
  );

  return selected;
}

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function stepUrgency(risk: ConnectionRisk): RouteStep['urgency'] {
  if (risk === 'CRITICAL') return 'high';
  if (risk === 'TIGHT')    return 'medium';
  return 'low';
}

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Builds a fully structured Smart Connection Plan for a passenger who has landed
 * and needs to connect to another flight at the same airport.
 *
 * @param inboundFlight          Flight number of the arriving flight (e.g. 'EK203')
 * @param outboundFlight         Flight number of the departing flight (e.g. 'QF11')
 * @param airportCode            IATA airport code (e.g. 'DXB', 'SIN', 'JFK')
 * @param availableMinutes       Total minutes between scheduled landing and departure
 * @param isInternationalArrival Whether the inbound flight crosses an international border
 * @param _locale                Reserved for future i18n — pass 'en' for now
 *
 * @returns A fully resolved SmartRoutePlan, guaranteed to be non-null.
 */
export async function buildSmartConnectionPlan(
  inboundFlight: string,
  outboundFlight: string,
  airportCode: string,
  availableMinutes: number,
  isInternationalArrival: boolean,
  _locale: string = 'en', // i18n: reserved — will drive t() calls in future
): Promise<SmartRoutePlan> {
  const code = airportCode.toUpperCase().trim();
  const airport: AirportData | undefined = AIRPORT_REGISTRY[code];

  // ── Resolve terminals ─────────────────────────────────────────────────────
  const inboundTerminalInfo: TerminalInfo =
    lookupTerminal(inboundFlight, code) ??
    (airport?.defaultTerminal ?? FALLBACK_TERMINAL);

  const outboundTerminalInfo: TerminalInfo =
    lookupTerminal(outboundFlight, code) ??
    (airport?.defaultTerminal ?? FALLBACK_TERMINAL);

  const inboundAirlineCode  = getAirlineCode(inboundFlight)  ?? inboundFlight.slice(0, 2).toUpperCase();
  const outboundAirlineCode = getAirlineCode(outboundFlight) ?? outboundFlight.slice(0, 2).toUpperCase();
  const inboundAirlineName  = AIRLINE_NAMES[inboundAirlineCode]  ?? `${inboundAirlineCode} Airlines`;
  const outboundAirlineName = AIRLINE_NAMES[outboundAirlineCode] ?? `${outboundAirlineCode} Airlines`;

  const sameTerminal = inboundTerminalInfo.terminal === outboundTerminalInfo.terminal;

  // ── Raw data transfer time from the database ──────────────────────────────
  const rawTransferMinutes = sameTerminal
    ? 0
    : getTransferTime(code, inboundTerminalInfo.terminal, outboundTerminalInfo.terminal);

  // ── Airport-specific transfer intel ───────────────────────────────────────
  const transferIntel: TransferIntel | null = sameTerminal
    ? null
    : getTransferIntel(code, inboundTerminalInfo.terminal, outboundTerminalInfo.terminal);

  // ── Build route steps ─────────────────────────────────────────────────────
  // Risk assessment is based on available time vs. estimated total walk time.
  // We compute a preliminary risk here, then refine after summing step durations.

  const customsDuration = isInternationalArrival ? 20 : 5;
  const transferDuration = transferIntel
    ? rawTransferMinutes + transferIntel.bufferMinutes
    : 0;
  const reSecurityDuration = (!sameTerminal && transferIntel?.requiresReSecurity) ? 12 : 0;
  const walkToGateDuration = outboundTerminalInfo.walkMinutesFromSecurity;

  const estimatedWalkTotal =
    5 + // deplane
    customsDuration +
    (sameTerminal ? 0 : 5) + // exit arriving terminal
    transferDuration +
    reSecurityDuration +
    walkToGateDuration;

  const riskThreshold = assessRisk(availableMinutes);
  const stepUrgencyLevel = stepUrgency(riskThreshold.risk);

  // ── Compose steps array ────────────────────────────────────────────────────
  const steps: RouteStep[] = [];

  // 1. Deplane
  steps.push(buildDeplaneStep(inboundFlight, inboundTerminalInfo, inboundAirlineName));

  // 2. Customs / arrivals
  steps.push(buildCustomsStep(isInternationalArrival, code, stepUrgencyLevel));

  // 3. Transfer (if different terminals)
  if (!sameTerminal && transferIntel) {
    steps.push(buildTransferStep(
      inboundTerminalInfo,
      outboundTerminalInfo,
      transferIntel,
      rawTransferMinutes,
    ));

    // 3b. Re-security (if required by the transfer)
    if (transferIntel.requiresReSecurity) {
      steps.push(buildReSecurityStep(stepUrgencyLevel));
    }
  }

  // 4. Walk to gate
  steps.push(buildWalkToGateStep(outboundTerminalInfo, outboundFlight, outboundAirlineName));

  // 5. Arrive at gate
  steps.push(buildGateStep(outboundFlight, outboundTerminalInfo, outboundAirlineName, stepUrgencyLevel));

  // 6. Board
  steps.push(buildBoardStep(outboundFlight, outboundAirlineName));

  // ── Compute actual totals ─────────────────────────────────────────────────
  const totalWalkMinutes = steps.reduce((sum, s) => sum + s.durationMinutes, 0);
  const freeMinutes = Math.max(0, availableMinutes - totalWalkMinutes);

  // Re-assess risk based on available time (the risk label is for the overall connection)
  // We keep the threshold based on availableMinutes (the overall risk level),
  // not freeMinutes, because the connection risk should reflect total time pressure.
  const finalRisk = riskThreshold.risk;

  // ── Recommendations ───────────────────────────────────────────────────────
  const smartRecs = selectRecommendations(code, outboundTerminalInfo.terminal, freeMinutes, finalRisk);

  // Top-level lounge and food suggestions (extracted for easy UI access)
  const loungeRec = getBestLounge(code, outboundTerminalInfo.terminal, freeMinutes);
  const foodRec   = getBestFood(code, outboundTerminalInfo.terminal, freeMinutes, freeMinutes >= 30);

  const loungeSuggestion: LoungeInfo | null = (loungeRec && finalRisk !== 'CRITICAL' && finalRisk !== 'TIGHT')
    ? {
        name: loungeRec.name,
        location: loungeRec.location,
        accessRequirement: loungeRec.accessRequirement ?? null,
        rating: loungeRec.rating,
        timeNeeded: loungeRec.timeNeeded,
      }
    : null;

  const foodSuggestion: FoodSuggestion | null = (foodRec && finalRisk !== 'CRITICAL')
    ? {
        name: foodRec.name,
        location: foodRec.location,
        type: (foodRec.type === 'food' ? 'food' : 'coffee') as FoodSuggestion['type'],
        rating: foodRec.rating,
        timeNeeded: foodRec.timeNeeded,
        reason: foodRec.reason,
      }
    : null;

  // ── Alerts and tips ───────────────────────────────────────────────────────
  const alerts = buildAlerts(
    finalRisk,
    isInternationalArrival,
    code,
    inboundTerminalInfo,
    outboundTerminalInfo,
    availableMinutes,
    transferIntel,
  );

  const tips = buildTips(code, outboundTerminalInfo, finalRisk);

  // ── Assemble final plan ───────────────────────────────────────────────────
  const plan: SmartRoutePlan = {
    // Meta
    airportCode: code,
    inboundFlight: inboundFlight.trim().toUpperCase(),
    outboundFlight: outboundFlight.trim().toUpperCase(),
    inboundTerminal: inboundTerminalInfo.terminal,
    outboundTerminal: outboundTerminalInfo.terminal,
    isInternationalArrival,
    generatedAt: Date.now(),

    // Risk
    connectionRisk: finalRisk,
    riskColor: riskThreshold.color,
    riskLabel: riskThreshold.label,
    riskDescription: riskThreshold.description,

    // Timing
    totalWalkMinutes,
    freeMinutes,
    availableMinutes,

    // Route
    steps,

    // Recommendations
    recommendations: smartRecs,
    loungeSuggestion,
    foodSuggestion,

    // Intelligence
    alerts,
    tips,
  };

  return plan;
}

// ─── Utilities exported for UI / testing ─────────────────────────────────────

/**
 * Returns a human-readable summary of the free time after walking.
 * Used for the "You have X minutes free" headline in the UI.
 * i18n key: 'plan.freeTime.summary'
 */
export function formatFreeTime(freeMinutes: number): string {
  if (freeMinutes <= 0) return 'No free time — walk directly to gate';
  if (freeMinutes < 15) return `${freeMinutes} min — quick stop only if right at gate`;
  if (freeMinutes < 30) return `${freeMinutes} min free — grab a coffee`;
  if (freeMinutes < 60) return `${freeMinutes} min free — sit-down meal or lounge visit`;
  const hours   = Math.floor(freeMinutes / 60);
  const minutes = freeMinutes % 60;
  const hourStr = hours === 1 ? '1 hour' : `${hours} hours`;
  return minutes > 0
    ? `${hourStr} ${minutes} min free — relax and enjoy the lounge`
    : `${hourStr} free — full lounge experience`;
}

/**
 * Returns a concise recommendation headline based on risk and free time.
 * i18n key: 'plan.recommendation.headline'
 */
export function getRecommendationHeadline(risk: ConnectionRisk, freeMinutes: number): string {
  switch (risk) {
    case 'CRITICAL': return 'Walk directly to your gate — no stops';
    case 'TIGHT':    return 'Head to gate now — skip non-essential stops';
    case 'COMFORTABLE':
      return freeMinutes >= 20
        ? 'Quick coffee stop recommended'
        : 'Grab a drink near security if available';
    case 'RELAXED':
      return freeMinutes >= 45
        ? 'Time for a proper meal or a lounge visit'
        : 'Grab a meal near your departure gate';
    case 'PLENTY':
      return 'Enjoy the full lounge experience — you have time to relax';
  }
}

/**
 * Returns the icon for a given risk level.
 * Used alongside riskColor for the risk badge in the UI.
 */
export function riskIcon(risk: ConnectionRisk): string {
  const icons: Record<ConnectionRisk, string> = {
    CRITICAL:    '🔴',
    TIGHT:       '🟠',
    COMFORTABLE: '🟡',
    RELAXED:     '🟢',
    PLENTY:      '🔵',
  };
  return icons[risk];
}

// ─── Private constants ────────────────────────────────────────────────────────

/** Used when an airport is not in our database. */
const FALLBACK_TERMINAL: TerminalInfo = {
  terminal: '?',
  terminalFull: 'Terminal — check boarding pass',
  gatePrefix: '',
  walkMinutesFromSecurity: 10,
  amenities: [],
  tips: ['Check your boarding pass for terminal and gate information.'],
};

// ─── Flight Info Service ──────────────────────────────────────────────────────
// Resolves flight number → terminal + gate info.
// Uses our pre-built airline-terminal database (no scraping needed).
// Structured to easily plug in a real aviation API later.

import {
  lookupTerminal,
  getAirlineCode,
  getTransferTime,
  AIRLINE_NAMES,
  type TerminalInfo,
} from '../../data/airportTerminals';

export interface ResolvedFlight {
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  airport: string;
  terminal: TerminalInfo;
  estimatedGate: string | null;     // null until real API connected
  walkMinutesToGate: number;
  tips: string[];
  resolvedFrom: 'database' | 'api' | 'unknown';
}

export interface ConnectionPlan {
  inbound:  ResolvedFlight;
  outbound: ResolvedFlight;
  sameTerminal: boolean;
  terminalTransferMinutes: number;
  totalMinutesNeeded: number; // walk in + transfer + walk to gate
  tips: string[];
}

// ── Single flight resolution ─────────────────────────────────────────────────

export async function resolveFlight(
  flightNumber: string,
  airportCode: string
): Promise<ResolvedFlight> {
  const normalized = flightNumber.trim().toUpperCase().replace(/\s+/g, '');
  const airlineCode = getAirlineCode(normalized) ?? normalized.slice(0, 2);
  const airlineName = AIRLINE_NAMES[airlineCode] ?? `${airlineCode} Airlines`;

  const terminal = lookupTerminal(normalized, airportCode);

  if (!terminal) {
    // Fallback for unknown airports/airlines
    return {
      flightNumber: normalized,
      airlineCode,
      airlineName,
      airport: airportCode.toUpperCase(),
      terminal: {
        terminal: '?',
        terminalFull: 'Terminal unknown — check your boarding pass',
        gatePrefix: '',
        walkMinutesFromSecurity: 10,
        amenities: [],
        tips: ['Check your boarding pass or the airport departures board for your terminal'],
      },
      estimatedGate: null,
      walkMinutesToGate: 10,
      tips: ['Check your boarding pass or departures board for terminal info'],
      resolvedFrom: 'unknown',
    };
  }

  return {
    flightNumber: normalized,
    airlineCode,
    airlineName,
    airport: airportCode.toUpperCase(),
    terminal,
    estimatedGate: null, // Real API would provide this
    walkMinutesToGate: terminal.walkMinutesFromSecurity,
    tips: terminal.tips,
    resolvedFrom: 'database',
  };
}

// ── Connection plan (two flights at same airport) ────────────────────────────

export async function buildConnectionPlan(
  inboundFlightNumber:  string,
  outboundFlightNumber: string,
  airportCode:          string
): Promise<ConnectionPlan> {
  const [inbound, outbound] = await Promise.all([
    resolveFlight(inboundFlightNumber,  airportCode),
    resolveFlight(outboundFlightNumber, airportCode),
  ]);

  const sameTerminal = inbound.terminal.terminal === outbound.terminal.terminal;

  const transferMinutes = sameTerminal ? 0 : getTransferTime(
    airportCode,
    inbound.terminal.terminal,
    outbound.terminal.terminal,
  );

  // Total minimum time needed:
  // walk to exit arriving terminal + transfer (if needed) + walk to departure gate
  const totalMinutesNeeded =
    (sameTerminal ? 5 : inbound.terminal.walkMinutesFromSecurity + transferMinutes) +
    outbound.walkMinutesToGate;

  const connectionTips: string[] = [];

  if (!sameTerminal) {
    connectionTips.push(
      `You need to transfer from ${inbound.terminal.terminalFull} to ${outbound.terminal.terminalFull} — allow ${transferMinutes} min for the AirTrain/shuttle.`
    );
  }
  if (outbound.terminal.tips.length > 0) {
    connectionTips.push(...outbound.terminal.tips.slice(0, 2));
  }
  if (totalMinutesNeeded > 45) {
    connectionTips.push('This connection requires significant walking — wear comfortable shoes!');
  }

  return {
    inbound,
    outbound,
    sameTerminal,
    terminalTransferMinutes: transferMinutes,
    totalMinutesNeeded,
    tips: connectionTips,
  };
}

// ── Route steps generator ─────────────────────────────────────────────────────

export interface RouteStep {
  icon: string;
  instruction: string;
  detail: string;
  minutes: number;
  highlight?: 'warning' | 'info' | 'success';
}

export function buildRouteSteps(plan: ConnectionPlan): RouteStep[] {
  const steps: RouteStep[] = [];

  // Step 1: Deplane
  steps.push({
    icon: '✈️',
    instruction: `Deplane at ${plan.inbound.terminal.terminalFull}`,
    detail: `${plan.inbound.airlineName} flight ${plan.inbound.flightNumber}`,
    minutes: 0,
  });

  // Step 2: Clear customs/security if international
  steps.push({
    icon: '🛃',
    instruction: 'Follow signs to arrivals / connections',
    detail: 'If arriving internationally, clear customs and re-check bags',
    minutes: plan.sameTerminal ? 5 : 8,
    highlight: 'info',
  });

  // Step 3: Terminal transfer (if needed)
  if (!plan.sameTerminal) {
    steps.push({
      icon: '🚌',
      instruction: `Transfer to ${plan.outbound.terminal.terminalFull}`,
      detail: `Take AirTrain/shuttle — approximately ${plan.terminalTransferMinutes} min`,
      minutes: plan.terminalTransferMinutes,
      highlight: 'warning',
    });

    // Re-security
    steps.push({
      icon: '🔐',
      instruction: 'Re-enter security at departure terminal',
      detail: 'Have your boarding pass and ID ready',
      minutes: 10,
      highlight: 'warning',
    });
  }

  // Step 4: Walk to gate
  steps.push({
    icon: '🚶',
    instruction: `Walk to your departure gate`,
    detail: `${plan.outbound.terminal.terminalFull} · Gates ${plan.outbound.terminal.gatePrefix || 'see boarding pass'}`,
    minutes: plan.outbound.walkMinutesToGate,
  });

  // Step 5: Gate
  steps.push({
    icon: '🛫',
    instruction: `Board ${plan.outbound.airlineName} flight ${plan.outbound.flightNumber}`,
    detail: 'Check departures board for your gate number',
    minutes: 0,
    highlight: 'success',
  });

  return steps;
}

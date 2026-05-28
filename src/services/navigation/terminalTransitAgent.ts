// ══════════════════════════════════════════════════════════
// Terminal Transit Agent
// ──────────────────────────────────────────────────────────
// Evaluates the physical & legal feasibility of moving
// between two airport terminals, then produces up to three
// optimised route options (fastest / least-walking / airside-
// only) ranked by risk for the given passenger status.
// ══════════════════════════════════════════════════════════

import { getTerminalGraph } from '../../data/terminalGraphs';
import {
  RISK_RANK,
  TRANSPORT_ICON,
  maxRisk,
  type PassengerStatus,
  type TerminalEdge,
  type TerminalGraph,
  type TransferType,
  type TransitFeasibilityResult,
  type TransitFeasibilityStatus,
  type ItineraryStep,
  type TransitOptimisation,
  type TransitQueryInput,
  type TransitAgentResult,
  type TransitRoute,
  type TransitRiskLevel,
  type TransitStep,
  type TransitWarning,
} from '../../types/models/terminalTransit';
import type { CrowdDelay } from './crowdDelayEngine';

// ── Dijkstra (adapted for TerminalEdge weights) ───────────

type AdjEntry = { to: string; edge: TerminalEdge };
type AdjList  = Map<string, AdjEntry[]>;

function buildAdj(graph: TerminalGraph, filter?: (e: TerminalEdge) => boolean): AdjList {
  const adj: AdjList = new Map(graph.terminals.map((t) => [t, []]));

  for (const edge of graph.edges) {
    if (!edge.isOperational) continue;
    if (filter && !filter(edge)) continue;

    // Add forward direction
    if (!adj.has(edge.fromTerminal)) adj.set(edge.fromTerminal, []);
    adj.get(edge.fromTerminal)!.push({ to: edge.toTerminal, edge });

    // Add reverse direction if bidirectional
    if (edge.bidirectional) {
      if (!adj.has(edge.toTerminal)) adj.set(edge.toTerminal, []);
      adj.get(edge.toTerminal)!.push({ to: edge.fromTerminal, edge });
    }
  }
  return adj;
}

/** Returns the ordered list of edges forming the cheapest path, or null. */
function dijkstra(
  adj:    AdjList,
  from:   string,
  to:     string,
  weight: (e: TerminalEdge) => number,
): TerminalEdge[] | null {
  if (from === to) return [];

  const dist  = new Map<string, number>();
  const prev  = new Map<string, { via: string; edge: TerminalEdge } | null>();
  const queue: Array<{ id: string; d: number }> = [];

  for (const id of adj.keys()) { dist.set(id, Infinity); prev.set(id, null); }
  dist.set(from, 0);
  queue.push({ id: from, d: 0 });

  const visited = new Set<string>();

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id: cur } = queue.shift()!;

    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === to) break;

    for (const { to: nb, edge } of adj.get(cur) ?? []) {
      if (visited.has(nb)) continue;
      const nd = dist.get(cur)! + weight(edge);
      if (nd < (dist.get(nb) ?? Infinity)) {
        dist.set(nb, nd);
        prev.set(nb, { via: cur, edge });
        queue.push({ id: nb, d: nd });
      }
    }
  }

  if ((dist.get(to) ?? Infinity) === Infinity) return null;

  // Reconstruct
  const edges: TerminalEdge[] = [];
  let cur: string | null = to;
  while (cur !== null) {
    const p = prev.get(cur);
    if (p) { edges.unshift(p.edge); cur = p.via; }
    else    { cur = null; }
  }
  return edges;
}

// ── Warning generation ────────────────────────────────────

/** Maps one edge + passenger status → zero or more warnings. */
function warningsForEdge(edge: TerminalEdge, status: PassengerStatus): TransitWarning[] {
  const ws: TransitWarning[] = [];

  // ── Landside exit implications per status ─────────────
  if (edge.routeType === 'landside' || edge.routeType === 'mixed') {
    if (status === 'international_to_international') {
      ws.push({
        code:   'LANDSIDE_INT_INT',
        level:  'critical',
        title:  'Immigration Clearance Required',
        detail: 'This route exits the international transit zone. You must clear full immigration and customs — and may need an entry visa for this country. Many nationalities are NOT permitted to transit landside without a visa.',
      });
    }
    if (status === 'domestic_to_domestic' || status === 'domestic_to_international') {
      ws.push({
        code:   'SECURITY_RECHECK',
        level:  'medium',
        title:  'Security Re-screening Required',
        detail: 'You will exit the sterile area and must clear airport security screening again at the destination terminal.',
      });
    }
  }

  // ── Restriction-specific warnings ─────────────────────
  for (const r of edge.restrictions) {
    switch (r) {
      case 'requires_transit_visa':
        if (status === 'international_to_international' || status === 'international_to_domestic') {
          ws.push({
            code:   'TRANSIT_VISA',
            level:  'high',
            title:  'Transit Visa May Be Required',
            detail: 'Some passport holders need a transit visa for landside transfer at this airport. Verify entry requirements for your nationality before travel.',
          });
        }
        break;

      case 'requires_visa_or_entry':
        ws.push({
          code:   'ENTRY_VISA',
          level:  'critical',
          title:  'Country Entry Visa Required',
          detail: 'This route enters the public zone, which legally constitutes entering the country. You must hold valid entry authorization.',
        });
        break;

      case 'requires_border_crossing':
        ws.push({
          code:   'BORDER',
          level:  'critical',
          title:  'International Border Crossing',
          detail: 'This route crosses an international border. Full customs and immigration processing applies.',
        });
        break;

      case 'requires_immigration_clearance':
        if (status === 'international_to_domestic') {
          ws.push({
            code:   'IMMIGRATION_CLEAR',
            level:  'high',
            title:  'Immigration Clearance Required',
            detail: 'As an arriving international passenger you must clear immigration and customs before your domestic connection. Allow 30–60 min for this process.',
          });
        } else if (status === 'international_to_international') {
          ws.push({
            code:   'IMMIGRATION_CLEAR',
            level:  'critical',
            title:  'Immigration Clearance Required',
            detail: 'Clearing immigration as a connecting international passenger may require an entry visa and will cost 45–90 min.',
          });
        }
        break;

      case 'requires_customs_clearance':
        ws.push({
          code:   'CUSTOMS',
          level:  'high',
          title:  'Customs Clearance Required',
          detail: 'You must collect your checked baggage, clear customs, and re-check bags for the onward flight. Allow at least 30 min.',
        });
        break;

      case 'requires_security_recheck':
        // Only add if not already added by the landside logic above
        if (!ws.some((w) => w.code === 'SECURITY_RECHECK')) {
          ws.push({
            code:   'SECURITY_RECHECK',
            level:  'medium',
            title:  'Security Re-screening Required',
            detail: 'You will exit the secure area and must pass through security screening again at the destination terminal.',
          });
        }
        break;

      case 'closed_overnight':
        ws.push({
          code:   'CLOSED_OVERNIGHT',
          level:  'high',
          title:  'Service Closed Overnight',
          detail: edge.operatingHours
            ? `This route operates ${edge.operatingHours.open}–${edge.operatingHours.close} local time only. Verify it will be available for your travel time.`
            : 'This route may not operate during late-night hours.',
        });
        break;

      case 'ticketed_passengers_only':
        ws.push({
          code:   'TICKETED_ONLY',
          level:  'low',
          title:  'Ticketed Passengers Only',
          detail: 'You must present a valid boarding pass to access this route.',
        });
        break;
    }
  }

  // Deduplicate by code — keep highest-risk version
  const seen = new Map<string, TransitWarning>();
  for (const w of ws) {
    const existing = seen.get(w.code);
    if (!existing || RISK_RANK[w.level] > RISK_RANK[existing.level]) {
      seen.set(w.code, w);
    }
  }
  return [...seen.values()];
}

function mergeWarnings(all: TransitWarning[]): TransitWarning[] {
  const seen = new Map<string, TransitWarning>();
  for (const w of all) {
    const e = seen.get(w.code);
    if (!e || RISK_RANK[w.level] > RISK_RANK[e.level]) seen.set(w.code, w);
  }
  return [...seen.values()].sort((a, b) => RISK_RANK[b.level] - RISK_RANK[a.level]);
}

function edgesToRisk(edges: TerminalEdge[], status: PassengerStatus): TransitRiskLevel {
  let risk: TransitRiskLevel = 'none';
  for (const e of edges) {
    for (const w of warningsForEdge(e, status)) {
      risk = maxRisk(risk, w.level);
    }
  }
  return risk;
}

// ── Build a TransitRoute from a list of edges ─────────────

function buildRoute(
  id:     TransitOptimisation,
  edges:  TerminalEdge[],
  from:   string,
  status: PassengerStatus,
): TransitRoute {
  if (edges.length === 0) {
    return {
      id, optimisation: id,
      totalMinutes: 0, totalWalkingMetres: 0,
      isAirsideOnly: true, steps: [],
      overallRisk: 'none', warnings: [], isFeasible: true,
    };
  }

  const steps: TransitStep[] = [];
  let prev = from;

  for (let i = 0; i < edges.length; i++) {
    const e   = edges[i];
    const dir = e.fromTerminal === prev
      ? { from: e.fromTerminal, to: e.toTerminal }
      : { from: e.toTerminal,   to: e.fromTerminal };

    const warnings = warningsForEdge(e, status);

    steps.push({
      stepNumber:      i + 1,
      fromTerminal:    dir.from,
      toTerminal:      dir.to,
      transportMode:   e.transportMode,
      routeType:       e.routeType,
      label:           e.label,
      instruction:     buildInstruction(e, dir.from, dir.to),
      durationMinutes: e.averageMinutes,
      frequencyMinutes:e.frequencyMinutes,
      walkingMetres:   e.walkingMetres,
      notes:           e.notes,
      warnings,
    });

    prev = dir.to;
  }

  const allWarnings  = mergeWarnings(steps.flatMap((s) => s.warnings));
  const overallRisk  = allWarnings.reduce<TransitRiskLevel>(
    (acc, w) => maxRisk(acc, w.level), 'none',
  );
  const isAirsideOnly = edges.every((e) => e.routeType === 'airside');
  const isFeasible    = overallRisk !== 'critical';   // critical = legally impossible for status

  return {
    id,
    optimisation:     id,
    totalMinutes:     edges.reduce((s, e) => s + e.averageMinutes, 0),
    totalWalkingMetres: edges.reduce((s, e) => s + e.walkingMetres, 0),
    isAirsideOnly,
    steps,
    overallRisk,
    warnings:         allWarnings,
    isFeasible,
  };
}

function buildInstruction(edge: TerminalEdge, from: string, to: string): string {
  switch (edge.transportMode) {
    case 'walking':
      return `Walk via ${edge.label} from Terminal ${from} to Terminal ${to} (~${edge.walkingMetres} m, ${edge.averageMinutes} min).`;
    case 'train':
    case 'automated_people_mover':
    case 'monorail': {
      const freq = edge.frequencyMinutes
        ? `, runs every ${edge.frequencyMinutes} min`
        : '';
      return `Take the ${edge.label}${freq} — ${edge.averageMinutes} min ride to Terminal ${to}.`;
    }
    case 'shuttle_bus':
    case 'bus': {
      const freq = edge.frequencyMinutes
        ? `, every ${edge.frequencyMinutes} min`
        : '';
      return `Board the ${edge.label}${freq} — ${edge.averageMinutes} min to Terminal ${to}.`;
    }
  }
}

// ── Null route (airside-only unavailable) ─────────────────

function infeasibleRoute(id: TransitOptimisation): TransitRoute {
  return {
    id, optimisation: id,
    totalMinutes: 0, totalWalkingMetres: 0,
    isAirsideOnly: id === 'airside_only',
    steps: [],
    overallRisk: 'critical',
    warnings: [{
      code:   'NO_PATH',
      level:  'critical',
      title:  'No Route Available',
      detail: 'No physical path exists for this optimisation strategy between these terminals.',
    }],
    isFeasible: false,
  };
}

// ══════════════════════════════════════════════════════════
// Public entry-point
// ══════════════════════════════════════════════════════════

export function runTerminalTransitAgent(query: TransitQueryInput): TransitAgentResult {
  const { airportCode, fromTerminal, toTerminal, passengerStatus, connectionWindowMinutes } = query;

  // 1. Same-terminal shortcut
  if (fromTerminal === toTerminal) {
    return {
      query, sameTerminal: true, noDataAvailable: false,
      isFeasible: true, blockers: [], routes: [],
      recommendedRoute: null, bufferImpactMinutes: 0,
    };
  }

  // 2. Graph lookup
  const graph = getTerminalGraph(airportCode);
  if (!graph) {
    return {
      query, sameTerminal: false, noDataAvailable: true,
      isFeasible: false, blockers: [{
        code: 'NO_GRAPH',
        level: 'high',
        title: 'No routing data for this airport',
        detail: 'Terminal connectivity data is not yet available. Allow extra time and check with airline staff.',
      }],
      routes: [], recommendedRoute: null, bufferImpactMinutes: 0,
    };
  }

  // 3. Build three adjacency lists (one per optimisation strategy)
  const adjAll      = buildAdj(graph);
  const adjAirside  = buildAdj(graph, (e) => e.routeType === 'airside');
  const adjLowWalk  = buildAdj(graph);   // same as all; we just change the weight

  // 4. Run Dijkstra for each strategy
  const edgesFastest  = dijkstra(adjAll,     fromTerminal, toTerminal, (e) => e.averageMinutes);
  const edgesAirside  = dijkstra(adjAirside, fromTerminal, toTerminal, (e) => e.averageMinutes);
  const edgesLowWalk  = dijkstra(adjLowWalk, fromTerminal, toTerminal, (e) => e.walkingMetres + e.averageMinutes * 0.5);

  // 5. If no path at all → truly infeasible
  if (!edgesFastest) {
    return {
      query, sameTerminal: false, noDataAvailable: false,
      isFeasible: false,
      blockers: [{
        code:   'NO_PATH_ANY',
        level:  'critical',
        title:  'Transit Impossible',
        detail: `No physical route was found between Terminal ${fromTerminal} and Terminal ${toTerminal} at ${airportCode}. Contact airline or airport staff immediately.`,
      }],
      routes: [], recommendedRoute: null, bufferImpactMinutes: 0,
    };
  }

  // 6. Build routes
  const routeFastest: TransitRoute   = buildRoute('fastest',      edgesFastest, fromTerminal, passengerStatus);
  const routeAirside: TransitRoute   = edgesAirside
    ? buildRoute('airside_only', edgesAirside, fromTerminal, passengerStatus)
    : infeasibleRoute('airside_only');
  const routeLowWalk: TransitRoute   = edgesLowWalk
    ? buildRoute('least_walking', edgesLowWalk, fromTerminal, passengerStatus)
    : infeasibleRoute('least_walking');

  const routes = [routeFastest, routeAirside, routeLowWalk];

  // 7. Choose recommended route
  //    Prefer airside if available and not critical; else fastest; else any
  let recommendedRoute: TransitRoute =
    (routeAirside.isFeasible && routeAirside.steps.length > 0) ? routeAirside
    : routeFastest.isFeasible ? routeFastest
    : routeLowWalk.isFeasible ? routeLowWalk
    : routeFastest;

  // 8. Cross-route blockers (apply to ALL routes)
  const blockers: TransitWarning[] = [];
  if (!routeAirside.isFeasible && !routeFastest.isFeasible) {
    blockers.push({
      code:   'ALL_PATHS_CRITICAL',
      level:  'critical',
      title:  'Transit May Be Impossible Without Visa',
      detail: `All available routes between Terminal ${fromTerminal} and Terminal ${toTerminal} at ${airportCode} require exiting the international transit zone. As an ${passengerStatus.replace(/_/g, '-')} passenger you may need an entry visa or may not be permitted to transit at all. Contact your airline immediately.`,
    });
  }

  // 9. Connection-window pressure warning
  const best = recommendedRoute.totalMinutes;
  let bufferImpactMinutes = 0;
  if (connectionWindowMinutes && best > 0) {
    const pct = best / connectionWindowMinutes;
    if (pct >= 0.80) {
      bufferImpactMinutes = best;
      blockers.push({
        code:   'TIGHT_WINDOW',
        level:  pct >= 1 ? 'critical' : 'high',
        title:  pct >= 1
          ? 'Connection Likely Missed'
          : 'Very Tight Connection — Transit takes most of your buffer',
        detail: `The fastest terminal transit takes ~${best} min, but your total connection window is only ${connectionWindowMinutes} min. This leaves almost no time for aircraft deboarding, walking to the gate, or delays.`,
      });
    }
  }

  return {
    query,
    sameTerminal:        false,
    noDataAvailable:     false,
    isFeasible:          true,
    blockers:            mergeWarnings(blockers),
    routes,
    recommendedRoute,
    bufferImpactMinutes,
  };
}

// ══════════════════════════════════════════════════════════
// computeTransitFeasibility
// ──────────────────────────────────────────────────────────
// Simpler, time-budget–oriented layer for the route screen.
//
// Formula:
//   total = baseDuration
//         + (requiresImmigration ? 45 : 0)
//         + (isLandside ? 20 : 0)
//         + activeCrowdDelay
//
// feasibilityStatus:
//   safe     → bufferLeft ≥ 20 min
//   warning  → 0 ≤ bufferLeft < 20 min
//   critical → bufferLeft < 0  (total exceeds window)
// ══════════════════════════════════════════════════════════

const IMMIGRATION_PENALTY_MIN = 45; // realistic clearance time
const LANDSIDE_RECHECK_MIN    = 20; // security re-screening at destination

function transferTypeToStatus(t: TransferType): PassengerStatus {
  if (t === 'intl_to_intl') return 'international_to_international';
  if (t === 'intl_to_dom')  return 'international_to_domestic';
  return 'domestic_to_domestic';
}

/** Pick security/customs crowd delay that would apply at destination terminal */
function extractTransitCrowdDelay(delays: CrowdDelay[]): number {
  const relevant = delays.filter(
    (d) =>
      !d.isPositive &&
      (d.locationType === 'security' ||
        d.locationType === 'passport_control' ||
        d.locationType === 'customs'),
  );
  if (!relevant.length) return 0;
  // Worst signal full weight; each additional at 50 % (diminishing returns)
  return Math.round(
    relevant.reduce((total, d, i) => total + (i === 0 ? d.delayMinutes : d.delayMinutes * 0.5), 0),
  );
}

/**
 * Compute a real-time feasibility assessment for crossing between terminals.
 *
 * @param crowdDelays  Live delays from useCrowdReports().delays — pass [] when unavailable
 * @returns            null when same terminal or no graph data
 */
export function computeTransitFeasibility(
  airportCode:         string,
  fromTerminal:        string,
  toTerminal:          string,
  connectionWindowMin: number,
  transferType:        TransferType,
  crowdDelays:         CrowdDelay[],
): TransitFeasibilityResult | null {
  if (fromTerminal === toTerminal) return null;

  const graph = getTerminalGraph(airportCode);
  if (!graph) return null;

  // ── 1. Find fastest physical route ───────────────────────
  const adj      = buildAdj(graph);
  const edges    = dijkstra(adj, fromTerminal, toTerminal, (e) => e.averageMinutes);
  if (!edges || edges.length === 0) return null;

  const baseDurationMin = edges.reduce((s, e) => s + e.averageMinutes, 0);

  // ── 2. Determine if this route is landside ────────────────
  const isLandside = edges.some(
    (e) => e.routeType === 'landside' || e.routeType === 'mixed',
  );

  // ── 3. Determine immigration requirement ─────────────────
  // intl→dom always clears immigration.
  // intl→intl only if the route exits the sterile zone.
  const requiresImmigration =
    transferType === 'intl_to_dom' ||
    (transferType === 'intl_to_intl' && isLandside);

  // ── 4. Live crowd delay ───────────────────────────────────
  const crowdDelayMin = extractTransitCrowdDelay(crowdDelays);

  // ── 5. Apply formula ──────────────────────────────────────
  const immigrationPenaltyMin = requiresImmigration ? IMMIGRATION_PENALTY_MIN : 0;
  const landsidePenaltyMin    = isLandside && !requiresImmigration ? LANDSIDE_RECHECK_MIN : 0;
  const totalEstimatedTimeMin =
    baseDurationMin + immigrationPenaltyMin + landsidePenaltyMin + crowdDelayMin;

  const bufferTimeLeft = connectionWindowMin - totalEstimatedTimeMin;

  // ── 6. Status verdict ─────────────────────────────────────
  const feasibilityStatus: TransitFeasibilityStatus =
    bufferTimeLeft < 0  ? 'critical' :
    bufferTimeLeft < 20 ? 'warning'  : 'safe';

  // ── 7. Build itinerary ────────────────────────────────────
  const itinerary: ItineraryStep[] = [];
  let step = 1;
  let prevTerminal = fromTerminal;

  // Physical transit steps (one per edge)
  for (const edge of edges) {
    const dir =
      edge.fromTerminal === prevTerminal
        ? { from: edge.fromTerminal, to: edge.toTerminal }
        : { from: edge.toTerminal,   to: edge.fromTerminal };

    const icon = TRANSPORT_ICON[edge.transportMode];
    const freq  = edge.frequencyMinutes
      ? `, every ${edge.frequencyMinutes} min`
      : '';

    itinerary.push({
      stepNumber:  step++,
      icon,
      label:       edge.label,
      description: buildInstruction(edge, dir.from, dir.to),
      durationMin: edge.averageMinutes,
      isPenalty:   false,
    });

    prevTerminal = dir.to;
  }

  // Security recheck penalty row (landside, no immigration)
  if (landsidePenaltyMin > 0) {
    itinerary.push({
      stepNumber:  step++,
      icon:        '🔒',
      label:       'Security Re-screening',
      description: `You exit the sterile zone and must clear security again at Terminal ${toTerminal}. Allow ~${landsidePenaltyMin} min.`,
      durationMin: landsidePenaltyMin,
      isPenalty:   true,
      penaltyLevel:'warning',
    });
  }

  // Immigration clearance penalty row
  if (immigrationPenaltyMin > 0) {
    itinerary.push({
      stepNumber:  step++,
      icon:        '🛂',
      label:       'Immigration Clearance',
      description: transferType === 'intl_to_dom'
        ? `Clear immigration and customs as an arriving international passenger. Allow ~${immigrationPenaltyMin} min.`
        : `This route exits the international transit zone — full immigration clearance required. Allow ~${immigrationPenaltyMin} min. Entry authorization may be needed.`,
      durationMin: immigrationPenaltyMin,
      isPenalty:   true,
      penaltyLevel:'critical',
    });
  }

  // Live crowd delay row
  if (crowdDelayMin > 0) {
    itinerary.push({
      stepNumber:  step++,
      icon:        '🔴',
      label:       'Live Crowd Delay',
      description: `Current crowd reports indicate +${crowdDelayMin} min delay at security/passport control.`,
      durationMin: crowdDelayMin,
      isPenalty:   true,
      penaltyLevel:'warning',
    });
  }

  return {
    airportCode,
    fromTerminal,
    toTerminal,
    connectionWindowMin,
    transferType,
    baseDurationMin,
    immigrationPenaltyMin,
    landsidePenaltyMin,
    crowdDelayMin,
    totalEstimatedTimeMin,
    bufferTimeLeft,
    feasibilityStatus,
    requiresImmigration,
    isLandside,
    itinerary,
  };
}

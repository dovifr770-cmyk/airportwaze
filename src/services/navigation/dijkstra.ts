// ══════════════════════════════════════════════════════════
// Dijkstra shortest-path for the airport navigation graph.
// Runs client-side on the pre-fetched edge list.
// Airport graphs are small (< 500 nodes) so a sorted-array
// priority queue is fast enough and avoids extra deps.
// ══════════════════════════════════════════════════════════

export interface GraphEdge {
  id:     string;
  fromId: string;
  toId:   string;
  weight: number;   // seconds (already mode-adjusted)
}

export interface DijkstraResult {
  /** Ordered edge IDs forming the shortest path */
  edgeIds:      string[];
  /** Total path weight (seconds) */
  totalSeconds: number;
}

export function runDijkstra(
  edges:   GraphEdge[],
  startId: string,
  endId:   string,
): DijkstraResult | null {
  if (startId === endId) return { edgeIds: [], totalSeconds: 0 };

  // Build adjacency list
  const adj = new Map<string, Array<{ toId: string; edgeId: string; weight: number }>>();
  const allNodes = new Set<string>();

  for (const e of edges) {
    allNodes.add(e.fromId);
    allNodes.add(e.toId);
    if (!adj.has(e.fromId)) adj.set(e.fromId, []);
    adj.get(e.fromId)!.push({ toId: e.toId, edgeId: e.id, weight: e.weight });
  }

  // Distance and predecessor maps
  const dist = new Map<string, number>();
  const prev = new Map<string, { fromId: string; edgeId: string } | null>();
  for (const id of allNodes) { dist.set(id, Infinity); prev.set(id, null); }
  dist.set(startId, 0);

  // Priority queue — sorted array (fine for < 500 nodes)
  const pq: Array<{ id: string; d: number }> = [{ id: startId, d: 0 }];
  const visited = new Set<string>();

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const { id: cur } = pq.shift()!;

    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === endId) break;

    for (const nb of adj.get(cur) ?? []) {
      if (visited.has(nb.toId)) continue;
      const newDist = dist.get(cur)! + nb.weight;
      if (newDist < (dist.get(nb.toId) ?? Infinity)) {
        dist.set(nb.toId, newDist);
        prev.set(nb.toId, { fromId: cur, edgeId: nb.edgeId });
        pq.push({ id: nb.toId, d: newDist });
      }
    }
  }

  const totalSeconds = dist.get(endId);
  if (!totalSeconds || totalSeconds === Infinity) return null;

  // Reconstruct ordered edge list
  const edgeIds: string[] = [];
  let cur: string | null = endId;
  while (cur !== null) {
    const p = prev.get(cur);
    if (p) { edgeIds.unshift(p.edgeId); cur = p.fromId; }
    else cur = null;
  }

  return { edgeIds, totalSeconds };
}

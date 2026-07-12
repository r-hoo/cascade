// ── Scenario 1 layout (hardcoded, unchanged) ─────────────────────

export const R_NODE   = 36
export const VIEWBOX  = '0 0 680 410'

export const S1_NODES = [
  { id: 'rainfall',        label: 'Rainfall',       x: 110, y: 75  },
  { id: 'reservoir_level', label: 'Reservoir',      x: 110, y: 225 },
  { id: 'extraction_rate', label: 'Extraction',     x: 390, y: 150 },
  { id: 'treated_output',  label: 'Treated Output', x: 390, y: 295 },
  { id: 'demand',          label: 'Demand',         x: 575, y: 205 },
  { id: 'supply_deficit',  label: 'Supply Deficit', x: 575, y: 340 },
]

export const S1_EDGES = [
  { from: 'rainfall',        to: 'reservoir_level', polarity: '+', curve: null           },
  { from: 'extraction_rate', to: 'reservoir_level', polarity: '-', curve: [240, 260]     },
  { from: 'reservoir_level', to: 'extraction_rate', polarity: '+', curve: [240, 55],
    isLoop: true, loopLabel: 'B1' },
  { from: 'extraction_rate', to: 'treated_output',  polarity: '+', curve: null           },
  { from: 'treated_output',  to: 'supply_deficit',  polarity: '-', curve: null           },
  { from: 'demand',          to: 'supply_deficit',  polarity: '+', curve: null           },
]

// ── Layout resolver ──────────────────────────────────────────────

/**
 * Returns { nodes, edges, nodeMap } for a given scenario.
 * For Scenario 2 (and future scenarios) the layout is embedded
 * in the scenario JSON's `diagram` key.
 */
export function getLayout(scenario) {
  if (!scenario) return buildLayout(S1_NODES, S1_EDGES)

  if (scenario.id === 'scenario_1' || !scenario.diagram) {
    return buildLayout(S1_NODES, S1_EDGES)
  }

  // Scenario 2+: layout comes from scenario JSON
  const { nodes, edges } = scenario.diagram
  return buildLayout(nodes, edges)
}

function buildLayout(nodes, edges) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
  return { nodes, edges, nodeMap }
}

// ── Edge geometry (shared) ───────────────────────────────────────

export function computeEdge(edge, nodeMap) {
  const f = nodeMap[edge.from]
  const t = nodeMap[edge.to]
  if (!f || !t) return { path: '', mx: 0, my: 0 }

  if (!edge.curve) {
    const dx = t.x - f.x, dy = t.y - f.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / dist, uy = dy / dist
    const sx = f.x + ux * R_NODE, sy = f.y + uy * R_NODE
    const ex = t.x - ux * R_NODE, ey = t.y - uy * R_NODE
    return {
      path: `M ${sx} ${sy} L ${ex} ${ey}`,
      mx: (sx + ex) / 2,
      my: (sy + ey) / 2,
    }
  }

  const [cx, cy] = edge.curve
  const dsx = cx - f.x, dsy = cy - f.y
  const ds  = Math.sqrt(dsx * dsx + dsy * dsy)
  const sx  = f.x + (dsx / ds) * R_NODE
  const sy  = f.y + (dsy / ds) * R_NODE

  const dex = cx - t.x, dey = cy - t.y
  const de  = Math.sqrt(dex * dex + dey * dey)
  const ex  = t.x + (dex / de) * R_NODE
  const ey  = t.y + (dey / de) * R_NODE

  const mx = 0.25 * sx + 0.5 * cx + 0.25 * ex
  const my = 0.25 * sy + 0.5 * cy + 0.25 * ey

  return { path: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`, mx, my }
}

// Keep legacy exports so existing imports don't break
export const NODES    = S1_NODES
export const DIAGRAM_EDGES = S1_EDGES
export const nodeMap  = Object.fromEntries(S1_NODES.map(n => [n.id, n]))
export { R_NODE as R }
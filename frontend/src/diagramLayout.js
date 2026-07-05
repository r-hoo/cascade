export const R        = 36           // node circle radius (px)
export const VIEWBOX  = '0 0 680 410'

export const NODES = [
  { id: 'rainfall',        label: 'Rainfall',       x: 110, y: 75  },
  { id: 'reservoir_level', label: 'Reservoir',      x: 110, y: 225 },
  { id: 'extraction_rate', label: 'Extraction',     x: 390, y: 150 },
  { id: 'treated_output',  label: 'Treated Output', x: 390, y: 295 },
  { id: 'demand',          label: 'Demand',         x: 575, y: 205 },
  { id: 'supply_deficit',  label: 'Supply Deficit', x: 575, y: 340 },
]

export const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]))

// Edges shown in the read-only SystemDiagram during gameplay.
// curve: [cx, cy] for quadratic bezier control point, or null for straight.
// isLoop: true marks the B1 feedback edge for special visual treatment.
export const DIAGRAM_EDGES = [
  { from: 'rainfall',        to: 'reservoir_level', polarity: '+', curve: null              },
  { from: 'extraction_rate', to: 'reservoir_level', polarity: '-', curve: [240, 260]        },
  { from: 'reservoir_level', to: 'extraction_rate', polarity: '+', curve: [240, 55], isLoop: true },
  { from: 'extraction_rate', to: 'treated_output',  polarity: '+', curve: null              },
  { from: 'treated_output',  to: 'supply_deficit',  polarity: '-', curve: null              },
  { from: 'demand',          to: 'supply_deficit',  polarity: '+', curve: null              },
]

/**
 * Compute SVG path geometry for an edge.
 * Returns { path, mx, my } where mx/my is the midpoint
 * (used to position polarity labels).
 */
export function computeEdge(edge) {
  const f = nodeMap[edge.from]
  const t = nodeMap[edge.to]
  if (!f || !t) return { path: '', mx: 0, my: 0 }

  if (!edge.curve) {
    // Straight line: trim start/end by node radius
    const dx = t.x - f.x, dy = t.y - f.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / dist, uy = dy / dist
    const sx = f.x + ux * R, sy = f.y + uy * R
    const ex = t.x - ux * R, ey = t.y - uy * R
    return {
      path: `M ${sx} ${sy} L ${ex} ${ey}`,
      mx: (sx + ex) / 2,
      my: (sy + ey) / 2,
    }
  }

  // Quadratic bezier: trim start toward control point, end toward control point
  const [cx, cy] = edge.curve

  const dsx = cx - f.x, dsy = cy - f.y
  const ds  = Math.sqrt(dsx * dsx + dsy * dsy)
  const sx  = f.x + (dsx / ds) * R
  const sy  = f.y + (dsy / ds) * R

  const dex = cx - t.x, dey = cy - t.y
  const de  = Math.sqrt(dex * dex + dey * dey)
  const ex  = t.x + (dex / de) * R
  const ey  = t.y + (dey / de) * R

  // Bezier midpoint at t=0.5
  const mx = 0.25 * sx + 0.5 * cx + 0.25 * ex
  const my = 0.25 * sy + 0.5 * cy + 0.25 * ey

  return {
    path: `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`,
    mx, my,
  }
}
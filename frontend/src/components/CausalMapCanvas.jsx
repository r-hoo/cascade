import { useState } from 'react'
import { NODES, computeEdge, R, VIEWBOX, nodeMap } from '../diagramLayout'

const C = {
  prePlaced: '#6b7280',
  positive:  '#22c55e',
  negative:  '#ef4444',
  selected:  '#4a9eff',
  pending:   '#8b5cf6',
}

export default function CausalMapCanvas({ prePlacedEdges = [], onChange }) {
  const [source,      setSource]      = useState(null)   // node id of first click
  const [pendingEdge, setPendingEdge] = useState(null)   // {from, to} awaiting polarity
  const [placed,      setPlaced]      = useState([])     // [{from,to,polarity}]

  function handleNodeClick(id) {
    if (pendingEdge) return                              // polarity picker is open
    if (!source) {
      setSource(id)
      return
    }
    if (source === id) { setSource(null); return }      // deselect

    // Prevent duplicate edges
    const duplicate =
      placed.some(e => e.from === source && e.to === id) ||
      prePlacedEdges.some(e => e.from === source && e.to === id)
    if (!duplicate) setPendingEdge({ from: source, to: id })
    setSource(null)
  }

  function commitEdge(polarity) {
    if (!pendingEdge) return
    const next = [...placed, { ...pendingEdge, polarity }]
    setPlaced(next)
    onChange?.(next)
    setPendingEdge(null)
  }

  function removeEdge(i) {
    const next = placed.filter((_, idx) => idx !== i)
    setPlaced(next)
    onChange?.(next)
  }

  function edgeGeom(edge) {
    return computeEdge({ ...edge, curve: null })
  }

  // Dashed preview line from pending source → target
  function pendingPath() {
    if (!pendingEdge) return ''
    const f = nodeMap[pendingEdge.from], t = nodeMap[pendingEdge.to]
    if (!f || !t) return ''
    const dx = t.x - f.x, dy = t.y - f.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const ux = dx / dist, uy = dy / dist
    return `M ${f.x + ux*R} ${f.y + uy*R} L ${t.x - ux*R} ${t.y - uy*R}`
  }

  return (
    <div className="causal-map-container">
      <div className="causal-map-instructions">
        {source
          ? `"${nodeMap[source]?.label}" selected — click a target node`
          : 'Click a node to start an edge, then click another node as the target.'}
      </div>

      <svg viewBox={VIEWBOX} className="diagram-svg causal-map-svg">
        <defs>
          {[['pos', C.positive], ['neg', C.negative], ['pre', C.prePlaced]].map(([id, col]) => (
            <marker key={id} id={`cm-${id}`}
                    markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0,8 3,0 6" fill={col} />
            </marker>
          ))}
        </defs>

        {/* Pre-placed edges */}
        {prePlacedEdges.map((e, i) => {
          const g = edgeGeom(e)
          return (
            <g key={`pre-${i}`}>
              <path d={g.path} stroke={C.prePlaced} strokeWidth={1.5}
                    fill="none" markerEnd="url(#cm-pre)" />
              <text x={g.mx} y={g.my - 7} textAnchor="middle"
                    className="edge-label" fill={C.prePlaced}>
                {e.polarity} (given)
              </text>
            </g>
          )
        })}

        {/* Player-placed edges */}
        {placed.map((e, i) => {
          const g   = edgeGeom(e)
          const col = e.polarity === '+' ? C.positive : C.negative
          const mid = e.polarity === '+' ? 'cm-pos' : 'cm-neg'
          return (
            <g key={`p-${i}`} style={{ cursor: 'pointer' }} onClick={() => removeEdge(i)}>
              <path d={g.path} stroke={col} strokeWidth={2}
                    fill="none" markerEnd={`url(#${mid})`} />
              <text x={g.mx} y={g.my - 7} textAnchor="middle"
                    className="edge-label" fill={col}>{e.polarity}</text>
              <text x={g.mx} y={g.my + 10} textAnchor="middle"
                    className="edge-remove-hint">✕</text>
            </g>
          )
        })}

        {/* Pending dashed preview */}
        {pendingEdge && (
          <path d={pendingPath()} stroke={C.pending} strokeWidth={1.5}
                strokeDasharray="5 3" fill="none" />
        )}

        {/* Nodes */}
        {NODES.map(n => {
          const isSrc  = source === n.id
          const isPend = pendingEdge &&
            (pendingEdge.from === n.id || pendingEdge.to === n.id)
          return (
            <g key={n.id} style={{ cursor: 'pointer' }}
               onClick={() => handleNodeClick(n.id)}>
              <circle cx={n.x} cy={n.y} r={R}
                fill={isSrc ? C.selected : isPend ? C.pending : 'var(--node-default)'}
                stroke={isSrc ? C.selected : 'var(--node-stroke)'}
                strokeWidth={isSrc ? 3 : 2} />
              <text x={n.x} y={n.y + 5}
                    textAnchor="middle" className="node-label-center">
                {n.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Polarity picker */}
      {pendingEdge && (
        <div className="polarity-picker">
          <span>
            <strong>{nodeMap[pendingEdge.from]?.label}</strong>
            {' → '}
            <strong>{nodeMap[pendingEdge.to]?.label}</strong>
          </span>
          <span>Relationship:</span>
          <button className="btn btn-success" onClick={() => commitEdge('+')}>
            + Positive (increases)
          </button>
          <button className="btn btn-danger"  onClick={() => commitEdge('-')}>
            − Negative (decreases)
          </button>
          <button className="btn btn-ghost"   onClick={() => setPendingEdge(null)}>
            Cancel
          </button>
        </div>
      )}

      <p className="causal-map-tip">
        Click any placed edge (green/red) to remove it. Gray edges are provided.
      </p>
    </div>
  )
}
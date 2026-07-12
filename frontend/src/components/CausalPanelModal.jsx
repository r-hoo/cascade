import { getLayout, computeEdge, R_NODE, VIEWBOX } from '../diagramLayout'

function nodeColor(id) {
  const colors = {
    reservoir_level: '#1e3a5f',
    extraction_rate: '#1e3a2a',
    rainfall:        '#1e2a3a',
  }
  return colors[id] ?? 'var(--node-default)'
}

const ANNOTATIONS = [
  {
    label: 'B1 — Balancing Feedback Loop',
    color: 'var(--color-accent)',
    desc:  'Reservoir Level constrains sustainable Extraction Rate. Players who ignore this loop over-extract during drought and breach the minimum safe level.',
  },
  {
    label: 'Extraction Rate → Reservoir Level (−)',
    color: 'var(--color-danger)',
    desc:  'Every MG extracted reduces the reservoir stock. With low rainfall this drain compounds across days — the effect is cumulative, not just for today.',
  },
  {
    label: 'Rainfall → Reservoir Level (+) with delay',
    color: 'var(--color-success)',
    desc:  "Today's rainfall replenishes tomorrow's reservoir level, not today's. Decisions must account for this one-step lag when anticipating drought.",
  },
]

export default function CausalPanelModal({ gameState, scenario, onClose }) {
  const { nodes, edges, nodeMap } = getLayout(scenario)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <div className="modal-title">System Causal Structure</div>
            <div className="modal-subtitle">
              Use this diagram to reason about how your extraction decisions
              ripple through the system over time.
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <svg viewBox={VIEWBOX} className="modal-diagram-svg">
            <defs>
              <marker id="m-arr-pos" markerWidth="8" markerHeight="6"
                      refX="7" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill="var(--color-success)" />
              </marker>
              <marker id="m-arr-neg" markerWidth="8" markerHeight="6"
                      refX="7" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill="var(--color-danger)" />
              </marker>
              <marker id="m-arr-blue" markerWidth="8" markerHeight="6"
                      refX="7" refY="3" orient="auto">
                <polygon points="0 0,8 3,0 6" fill="var(--color-accent)" />
              </marker>
            </defs>

            {edges.map((edge, i) => {
              const geo      = computeEdge(edge, nodeMap)
              const isLoop   = edge.isLoop
              const color    = isLoop
                ? 'var(--color-accent)'
                : edge.polarity === '+'
                  ? 'var(--color-success)'
                  : 'var(--color-danger)'
              const markerId = isLoop
                ? 'm-arr-blue'
                : edge.polarity === '+' ? 'm-arr-pos' : 'm-arr-neg'

              return (
                <g key={i}>
                  <path
                    d={geo.path}
                    stroke={color}
                    strokeWidth={isLoop ? 2.5 : 1.8}
                    fill="none"
                    opacity={0.85}
                    strokeDasharray={isLoop ? '6 3' : undefined}
                    markerEnd={`url(#${markerId})`}
                  />
                  <text
                    x={geo.mx} y={geo.my - 7}
                    textAnchor="middle"
                    className="edge-label"
                    fill={color}
                  >
                    {edge.polarity}
                  </text>
                  {isLoop && edge.loopLabel && (
                    <text
                      x={geo.mx} y={geo.my + 14}
                      textAnchor="middle"
                      className="loop-label"
                      fill="var(--color-accent)"
                    >
                      {edge.loopLabel}
                    </text>
                  )}
                </g>
              )
            })}

            {nodes.map(node => {
              const isReservoir = node.id === 'reservoir_level'
              const nodeR       = isReservoir ? R_NODE + 4 : R_NODE

              return (
                <g key={node.id}>
                  <circle
                    cx={node.x} cy={node.y} r={nodeR}
                    fill={nodeColor(node.id)}
                    stroke={isReservoir ? 'var(--color-accent)' : 'var(--node-stroke)'}
                    strokeWidth={isReservoir ? 2.5 : 1.5}
                  />
                  {isReservoir && gameState && (
                    <text
                      x={node.x} y={node.y + 5}
                      textAnchor="middle"
                      className="reservoir-pct"
                    >
                      {Math.round(
                        (gameState.reservoir_mgd /
                          (scenario?.parameters?.reservoir_max_mgd ?? 100)) * 100
                      )}%
                    </text>
                  )}
                  <text
                    x={node.x} y={node.y + nodeR + 16}
                    textAnchor="middle"
                    className="node-label"
                  >
                    {node.label}
                  </text>
                </g>
              )
            })}
          </svg>

          <div className="modal-annotations">
            {ANNOTATIONS.map(({ label, color, desc }) => (
              <div key={label} className="ann-item">
                <div className="ann-label-row" style={{ color }}>{label}</div>
                <div className="ann-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
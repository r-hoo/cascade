import { NODES, DIAGRAM_EDGES, computeEdge, R, VIEWBOX } from '../diagramLayout'

// Map stat IDs (from StatsPanel hover) to node IDs to highlight
const STAT_TO_NODE = {
  rainfall:     ['rainfall'],
  reservoir:    ['reservoir_level'],
  demand:       ['demand'],
  treated_output: ['treated_output', 'extraction_rate'],
  supply_deficit: ['supply_deficit'],
}

function nodeColor(id, gameState, scenario) {
  if (id !== 'reservoir_level' || !gameState) return 'var(--node-default)'
  const r    = gameState.reservoir_mgd
  const rMin = scenario?.parameters?.reservoir_min_mgd ?? 20
  if (r < rMin) return 'var(--color-danger)'
  if (r < 35)   return 'var(--color-warning)'
  return 'var(--node-default)'
}

export default function SystemDiagram({ gameState, scenario, highlightedStats = [] }) {
  const highlighted = new Set(
    highlightedStats.flatMap(s => STAT_TO_NODE[s] ?? [])
  )

  return (
    <div className="system-diagram">
      <h3 className="panel-title">System Structure</h3>
      <svg viewBox={VIEWBOX} className="diagram-svg">
        <defs>
          <marker id="arr-pos" markerWidth="8" markerHeight="6"
                  refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="var(--color-success)" />
          </marker>
          <marker id="arr-neg" markerWidth="8" markerHeight="6"
                  refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="var(--color-danger)" />
          </marker>
        </defs>

        {/* Edges beneath nodes */}
        {DIAGRAM_EDGES.map((edge, i) => {
          const geo   = computeEdge(edge)
          const color = edge.polarity === '+' ? 'var(--color-success)' : 'var(--color-danger)'
          return (
            <g key={i}>
              <path d={geo.path}
                    stroke={color} strokeWidth={1.5} fill="none" opacity={0.7}
                    strokeDasharray={edge.isLoop ? '5 3' : undefined}
                    markerEnd={`url(#arr-${edge.polarity === '+' ? 'pos' : 'neg'})`} />
              <text x={geo.mx} y={geo.my - 6}
                    textAnchor="middle" className="edge-label" fill={color}>
                {edge.polarity}
              </text>
              {edge.isLoop && (
                <text x={geo.mx} y={geo.my + 12}
                      textAnchor="middle" className="loop-label">B1</text>
              )}
            </g>
          )
        })}

        {/* Nodes */}
        {NODES.map(node => {
          const fill = highlighted.has(node.id)
            ? 'var(--color-accent)'
            : nodeColor(node.id, gameState, scenario)
          return (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={R}
                      fill={fill} stroke="var(--node-stroke)" strokeWidth={2} />
              {/* Reservoir shows live percentage */}
              {node.id === 'reservoir_level' && gameState && (
                <text x={node.x} y={node.y + 5}
                      textAnchor="middle" className="reservoir-pct">
                  {Math.round((gameState.reservoir_mgd /
                    (scenario?.parameters?.reservoir_max_mgd ?? 100)) * 100)}%
                </text>
              )}
              <text x={node.x} y={node.y + R + 15}
                    textAnchor="middle" className="node-label">
                {node.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
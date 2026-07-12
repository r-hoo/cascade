import { getLayout, computeEdge, R_NODE, VIEWBOX } from '../diagramLayout'

const STAT_TO_NODE = {
  rainfall:       ['rainfall'],
  reservoir:      ['reservoir_level'],
  demand:         ['demand'],
  zone_b_demand:  ['zone_b_demand'],
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

function zoneBColor(id, gameState) {
  if (id !== 'zone_b_demand' || !gameState?.zone_b_demand_mgd) return 'var(--node-default)'
  const pct = gameState.zone_b_demand_mgd / 3.0
  if (pct > 0.8) return '#3a1e1e'
  if (pct > 0.5) return '#2a1e1e'
  return 'var(--node-default)'
}

export default function SystemDiagram({ gameState, scenario, highlightedStats = [] }) {
  const { nodes, edges, nodeMap } = getLayout(scenario)

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
          <marker id="arr-loop" markerWidth="8" markerHeight="6"
                  refX="7" refY="3" orient="auto">
            <polygon points="0 0,8 3,0 6" fill="var(--color-accent)" />
          </marker>
        </defs>

        {edges.map((edge, i) => {
          const geo      = computeEdge(edge, nodeMap)
          const isLoop   = edge.isLoop
          const color    = isLoop ? 'var(--color-accent)'
            : edge.polarity === '+' ? 'var(--color-success)'
            : 'var(--color-danger)'
          const markerId = isLoop ? 'arr-loop'
            : edge.polarity === '+' ? 'arr-pos' : 'arr-neg'

          return (
            <g key={i}>
              <path d={geo.path}
                    stroke={color} strokeWidth={isLoop ? 2 : 1.5}
                    fill="none" opacity={0.8}
                    strokeDasharray={isLoop ? '5 3' : undefined}
                    markerEnd={`url(#${markerId})`} />
              <text x={geo.mx} y={geo.my - 6}
                    textAnchor="middle" className="edge-label" fill={color}>
                {edge.polarity}
              </text>
              {isLoop && edge.loopLabel && (
                <text x={geo.mx} y={geo.my + 12}
                      textAnchor="middle" className="loop-label">
                  {edge.loopLabel}
                </text>
              )}
            </g>
          )
        })}

        {nodes.map(node => {
          const isHighlighted = highlighted.has(node.id)
          const isReservoir   = node.id === 'reservoir_level'
          const isZoneB       = node.id === 'zone_b_demand'
          const fill = isHighlighted ? 'var(--color-accent)'
            : isZoneB ? zoneBColor(node.id, gameState)
            : nodeColor(node.id, gameState, scenario)

          return (
            <g key={node.id}>
              <circle cx={node.x} cy={node.y} r={R_NODE}
                      fill={fill} stroke="var(--node-stroke)" strokeWidth={2} />
              {isReservoir && gameState && (
                <text x={node.x} y={node.y + 5}
                      textAnchor="middle" className="reservoir-pct">
                  {Math.round((gameState.reservoir_mgd /
                    (scenario?.parameters?.reservoir_max_mgd ?? 100)) * 100)}%
                </text>
              )}
              {isZoneB && gameState?.zone_b_demand_mgd && (
                <text x={node.x} y={node.y + 5}
                      textAnchor="middle" className="reservoir-pct">
                  {gameState.zone_b_demand_mgd.toFixed(1)}
                </text>
              )}
              <text x={node.x} y={node.y + R_NODE + 15}
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
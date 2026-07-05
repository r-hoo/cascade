export default function StatsPanel({ gameState, node, scenario, onStatView }) {
  if (!gameState || !node || !scenario) return null

  const p         = scenario.parameters ?? {}
  const reservoir = gameState.reservoir_mgd
  const rMax      = p.reservoir_max_mgd ?? 100
  const rMin      = p.reservoir_min_mgd ?? 20
  const rPct      = Math.round((reservoir / rMax) * 100)
  const rStatus   = reservoir < rMin ? 'critical' : reservoir < 35 ? 'warning' : 'normal'

  function Row({ id, label, value, unit }) {
    return (
      <div className="stat-row"
           onMouseEnter={() => onStatView?.(id)}
           onClick={() => onStatView?.(id)}>
        <span className="stat-label">{label}</span>
        <span className="stat-value">
          {value} <span className="stat-unit">{unit}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="stats-panel">
      <h3 className="panel-title">System Status</h3>

      {/* Reservoir bar */}
      <div className="reservoir-bar-container">
        <div className="reservoir-bar-label">
          <span>Reservoir Level</span>
          <span className={`reservoir-status ${rStatus}`}>
            {reservoir.toFixed(1)} MG ({rPct}%)
          </span>
        </div>
        <div className="reservoir-bar-track">
          <div className={`reservoir-bar-fill ${rStatus}`}
               style={{ width: `${rPct}%` }} />
          <div className="reservoir-bar-min-marker"
               style={{ left: `${(rMin / rMax) * 100}%` }}
               title={`Min safe: ${rMin} MG`} />
        </div>
      </div>

      {/* Stats rows — hovering logs a VIEW_STAT event */}
      <div className="stats-list">
        <Row id="rainfall"      label="Today's Rainfall"   value={node.rainfall_mgd.toFixed(1)} unit="MG" />
        <Row id="demand"        label="Daily Demand"        value={p.daily_demand_mgd?.toFixed(1)} unit="MG" />
      </div>

      <p className="stats-note">
        Treated output = extraction × {p.treatment_efficiency} efficiency.
        Deficit = demand − treated output.
      </p>
    </div>
  )
}
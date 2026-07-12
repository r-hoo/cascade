export default function StatsPanel({ gameState, node, scenario, onStatView, onStatHover }) {
  if (!gameState || !node || !scenario) return null

  const p         = scenario.parameters ?? {}
  const reservoir = gameState.reservoir_mgd
  const rMax      = p.reservoir_max_mgd ?? 100
  const rMin      = p.reservoir_min_mgd ?? 20
  const rPct      = Math.round((reservoir / rMax) * 100)
  const rStatus   = reservoir < rMin ? 'critical'
                  : reservoir < 35   ? 'warning'
                  : 'normal'

  const isS2       = scenario.id === 'scenario_2'
  const zoneBDemand = gameState.zone_b_demand_mgd
  const zoneADemand = p.zone_a_demand_mgd
  const totalDemand = isS2
    ? (zoneADemand ?? 0) + (zoneBDemand ?? 0)
    : p.daily_demand_mgd

  function Row({ id, label, value, unit, sublabel }) {
    return (
      <div
        className="stat-row"
        onMouseEnter={() => {
          onStatHover?.(id)
          onStatView?.(id)
        }}
        onMouseLeave={() => onStatHover?.(null)}
        onClick={() => {
          onStatHover?.(id)
          onStatView?.(id)
        }}
      >
        <span className="stat-label">
          {label}
          {sublabel && <span className="stat-sublabel"> {sublabel}</span>}
        </span>
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
          <div
            className={`reservoir-bar-fill ${rStatus}`}
            style={{ width: `${rPct}%` }}
          />
          <div
            className="reservoir-bar-min-marker"
            style={{ left: `${(rMin / rMax) * 100}%` }}
            title={`Min safe: ${rMin} MG`}
          />
        </div>
      </div>

      {/* Zone B demand bar (Scenario 2 only) */}
      {isS2 && zoneBDemand !== undefined && (
        <div className="reservoir-bar-container">
          <div className="reservoir-bar-label">
            <span>Zone B Demand</span>
            <span className={`reservoir-status ${zoneBDemand >= 2.5 ? 'warning' : 'normal'}`}>
              {zoneBDemand.toFixed(1)} MG/day
            </span>
          </div>
          <div className="reservoir-bar-track">
            <div
              className={`reservoir-bar-fill ${zoneBDemand >= 2.5 ? 'warning' : 'normal'}`}
              style={{ width: `${(zoneBDemand / (p.zone_b_demand_max_mgd ?? 3.0)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stat rows */}
      <div className="stats-list">
        <Row
          id="rainfall"
          label="Today's Rainfall"
          value={node.rainfall_mgd.toFixed(1)}
          unit="MG"
        />
        {isS2 ? (
          <>
            <Row
              id="zone_a_demand"
              label="Zone A Demand"
              sublabel="(fixed)"
              value={(zoneADemand ?? 0).toFixed(1)}
              unit="MG/day"
            />
            <Row
              id="zone_b_demand"
              label="Zone B Demand"
              sublabel="(grows if supplied)"
              value={(zoneBDemand ?? 0).toFixed(1)}
              unit="MG/day"
            />
            <Row
              id="total_demand"
              label="Total Demand"
              value={(totalDemand ?? 0).toFixed(1)}
              unit="MG/day"
            />
          </>
        ) : (
          <Row
            id="demand"
            label="Daily Demand"
            value={(p.daily_demand_mgd ?? 0).toFixed(1)}
            unit="MG/day"
          />
        )}
      </div>

      <p className="stats-note">
        Treated output = extraction × {p.treatment_efficiency} efficiency.
        {isS2
          ? ' Zone A is supplied first. Zone B demand grows the next day if fully supplied.'
          : ' Deficit = demand − treated output.'}
      </p>
    </div>
  )
}
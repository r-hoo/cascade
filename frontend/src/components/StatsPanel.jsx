export default function StatsPanel({ gameState, node, scenario, onStatView, onStatHover }) {
  if (!gameState || !node || !scenario) return null

  const p         = scenario.parameters ?? {}
  const sid       = scenario.id
  const isS2      = sid === 'scenario_2'
  const isS3      = sid === 'scenario_3'

  const reservoir = gameState.reservoir_mgd
  const rMax      = p.reservoir_max_mgd ?? 100
  const rMin      = p.reservoir_min_mgd ?? 20
  const rPct      = Math.round((reservoir / rMax) * 100)
  const rStatus   = reservoir < rMin ? 'critical'
                  : reservoir < 35   ? 'warning'
                  : 'normal'

  const zoneBDemand = gameState.zone_b_demand_mgd
  const zoneADemand = p.zone_a_demand_mgd
  const totalDemand = isS2
    ? (zoneADemand ?? 0) + (zoneBDemand ?? 0)
    : isS3
      ? (zoneADemand ?? 0) + (p.zone_c_demand_mgd ?? 0) + (zoneBDemand ?? 0)
      : p.daily_demand_mgd

  // S3 aquifer
  const aquifer     = gameState.aquifer_mgd
  const aMax        = p.aquifer_max_mgd    ?? 50
  const aStress     = p.aquifer_stress_threshold ?? 10
  const aDraw       = p.aquifer_draw_threshold   ?? 30
  const aPct        = aquifer != null ? Math.round((aquifer / aMax) * 100) : 0
  const aStatus     = aquifer != null
    ? aquifer < aStress ? 'critical'
    : aquifer < aDraw   ? 'warning'
    : 'normal'
    : 'normal'

  // S3 Zone C
  const zcCritical  = gameState.zone_c_critical
  const zcConsec    = gameState.zone_c_consecutive_deficit ?? 0

  function Row({ id, label, value, unit, sublabel, warn }) {
    return (
      <div
        className={`stat-row ${warn ? 'stat-row-warn' : ''}`}
        onMouseEnter={() => { onStatHover?.(id); onStatView?.(id) }}
        onMouseLeave={() => onStatHover?.(null)}
        onClick={() => { onStatHover?.(id); onStatView?.(id) }}
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

      {/* Main reservoir bar */}
      <div className="reservoir-bar-container">
        <div className="reservoir-bar-label">
          <span>Main Reservoir</span>
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
          {isS3 && (
            <div
              className="reservoir-bar-draw-marker"
              style={{ left: `${(aDraw / rMax) * 100}%` }}
              title={`Aquifer auto-draw below: ${aDraw} MG`}
            />
          )}
        </div>
      </div>

      {/* Aquifer bar (S3 only) */}
      {isS3 && aquifer != null && (
        <div className="reservoir-bar-container">
          <div className="reservoir-bar-label">
            <span>Aquifer Buffer</span>
            <span className={`reservoir-status ${aStatus}`}>
              {aquifer.toFixed(1)} MG ({aPct}%)
              {aStatus === 'critical' && ' — slow recharge'}
            </span>
          </div>
          <div className="reservoir-bar-track">
            <div
              className={`reservoir-bar-fill ${aStatus}`}
              style={{ width: `${aPct}%` }}
            />
            <div
              className="reservoir-bar-min-marker"
              style={{ left: `${(aStress / aMax) * 100}%` }}
              title={`Stress threshold: ${aStress} MG`}
            />
          </div>
        </div>
      )}

      {/* Zone B demand bar (S2 + S3) */}
      {(isS2 || isS3) && zoneBDemand !== undefined && (
        <div className="reservoir-bar-container">
          <div className="reservoir-bar-label">
            <span>Zone B Demand</span>
            <span className={`reservoir-status ${zoneBDemand >= 3.0 ? 'warning' : 'normal'}`}>
              {zoneBDemand.toFixed(1)} MG/day
            </span>
          </div>
          <div className="reservoir-bar-track">
            <div
              className={`reservoir-bar-fill ${zoneBDemand >= 3.0 ? 'warning' : 'normal'}`}
              style={{
                width: `${(zoneBDemand / ((isS3 ? p.zone_b_demand_max_mgd : p.zone_b_demand_max_mgd) ?? 4.0)) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Zone C critical alert (S3 only) */}
      {isS3 && zcCritical && (
        <div className="alert-banner alert-danger" style={{ fontSize: '12px', margin: '4px 0' }}>
          🚨 Zone C critical — partial shutdown active (0.5 MG/day)
        </div>
      )}
      {isS3 && !zcCritical && zcConsec === 1 && (
        <div className="alert-banner alert-warn" style={{ fontSize: '12px', margin: '4px 0' }}>
          ⚠️ Zone C missed supply yesterday — one more deficit triggers critical shutdown
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
        {isS3 ? (
          <>
            <Row
              id="zone_a_demand"
              label="Zone A Demand"
              sublabel="(residential, fixed)"
              value={(zoneADemand ?? 0).toFixed(1)}
              unit="MG/day"
            />
            <Row
              id="zone_c_demand"
              label="Zone C Demand"
              sublabel={zcCritical ? '(hospital — shutdown)' : '(hospital — priority)'}
              value={zcCritical
                ? ((p.zone_c_demand_mgd ?? 1.0) * 0.5).toFixed(1)
                : (p.zone_c_demand_mgd ?? 1.0).toFixed(1)}
              unit="MG/day"
              warn={zcConsec > 0}
            />
            <Row
              id="zone_b_demand"
              label="Zone B Demand"
              sublabel="(industrial, grows if supplied)"
              value={(zoneBDemand ?? 0).toFixed(1)}
              unit="MG/day"
            />
            <Row
              id="aquifer"
              label="Aquifer Buffer"
              sublabel={aStatus === 'critical' ? '(slow recharge — 0.25 MG/day)' : '(auto-draws when R < 30 MG)'}
              value={(aquifer ?? 0).toFixed(1)}
              unit="MG"
              warn={aStatus === 'critical'}
            />
            <Row
              id="total_demand"
              label="Total Demand"
              value={(totalDemand ?? 0).toFixed(1)}
              unit="MG/day"
            />
          </>
        ) : isS2 ? (
          <>
            <Row id="zone_a_demand" label="Zone A Demand" sublabel="(fixed)"
                 value={(zoneADemand ?? 0).toFixed(1)} unit="MG/day" />
            <Row id="zone_b_demand" label="Zone B Demand" sublabel="(grows if supplied)"
                 value={(zoneBDemand ?? 0).toFixed(1)} unit="MG/day" />
            <Row id="total_demand" label="Total Demand"
                 value={(totalDemand ?? 0).toFixed(1)} unit="MG/day" />
          </>
        ) : (
          <Row id="demand" label="Daily Demand"
               value={(p.daily_demand_mgd ?? 0).toFixed(1)} unit="MG/day" />
        )}
      </div>

      <p className="stats-note">
        {isS3
          ? 'Priority order: Zone A → Zone C → Zone B. Aquifer draws automatically when main reservoir < 30 MG.'
          : isS2
            ? 'Zone A is supplied first. Zone B demand grows the next day if fully supplied.'
            : `Treated output = extraction × ${p.treatment_efficiency} efficiency.`}
      </p>
    </div>
  )
}
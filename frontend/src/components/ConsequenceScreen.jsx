export default function ConsequenceScreen({ result, scenario, hasNextNode, onContinue }) {
  if (!result) return null

  const isS2   = scenario?.id === 'scenario_2'
  const p      = scenario?.parameters ?? {}
  const rMax   = p.reservoir_max_mgd ?? 100
  const rMin   = p.reservoir_min_mgd ?? 20
  const pct    = Math.max(0, Math.min(100, (result.reservoir_after / rMax) * 100))
  const delta  = result.reservoir_after - result.reservoir_before
  const status = result.reservoir_after < rMin ? 'critical'
               : result.reservoir_after < 35   ? 'warning'
               : 'normal'

  // Zone B demand change (Scenario 2 only)
  const zbBefore    = result.zone_b_demand     ?? null
  const zbAfter     = result.new_zone_b_demand ?? null
  const zbDelta     = zbBefore !== null && zbAfter !== null
    ? zbAfter - zbBefore
    : 0
  const zbGrew      = zbDelta > 0
  const zbDeficit   = result.zone_b_deficit    ?? 0
  const zbMax       = p.zone_b_demand_max_mgd  ?? 3.0
  const zbPctBefore = zbBefore !== null ? (zbBefore / zbMax) * 100 : 0
  const zbPctAfter  = zbAfter  !== null ? (zbAfter  / zbMax) * 100 : 0

  return (
    <div className="consequence-screen">
      <div className="consequence-card">

        {/* Header */}
        <div className="consequence-header">
          <span className="day-badge">Day {result.day} — Outcome</span>
          {result.breached_minimum && (
            <div className="alert-banner alert-danger">
              🚨 Reservoir fell below the minimum safe level ({rMin} MG)
            </div>
          )}
          {isS2 && zbGrew && (
            <div className="alert-banner alert-warn">
              📈 Zone B demand grew — population increased because supply was met
            </div>
          )}
          {isS2 && zbDeficit > 0 && (
            <div className="alert-banner alert-warn">
              ⚠️ Zone B deficit: {zbDeficit.toFixed(1)} MG went unsupplied today
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="consequence-grid">
          <div className="consequence-stat">
            <span className="cs-label">Extraction</span>
            <span className="cs-value">{result.extraction_mgd} MG</span>
          </div>
          <div className="consequence-stat">
            <span className="cs-label">Rainfall</span>
            <span className="cs-value">{result.rainfall_mgd} MG</span>
          </div>
          <div className="consequence-stat">
            <span className="cs-label">Treated Output</span>
            <span className="cs-value">{result.treated_output.toFixed(1)} MG</span>
          </div>
          <div className="consequence-stat">
            <span className="cs-label">
              {isS2 ? 'Total Deficit' : 'Supply Deficit'}
            </span>
            <span className={`cs-value ${result.supply_deficit > 0 ? 'value-warn' : 'value-good'}`}>
              {result.supply_deficit.toFixed(1)} MG
            </span>
          </div>
        </div>

        {/* Reservoir change */}
        <div className="reservoir-change">
          <div className="rc-label">
            Reservoir: {result.reservoir_before.toFixed(1)} MG
            <span className={`rc-delta ${delta >= 0 ? 'delta-pos' : 'delta-neg'}`}>
              {delta >= 0 ? ' ▲' : ' ▼'} {Math.abs(delta).toFixed(1)} MG
            </span>
            → {result.reservoir_after.toFixed(1)} MG
          </div>
          <div className="reservoir-bar-track">
            <div
              className={`reservoir-bar-fill ${status}`}
              style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
            />
            <div
              className="reservoir-bar-min-marker"
              style={{ left: `${(rMin / rMax) * 100}%` }}
            />
          </div>
        </div>

        {/* Zone B demand change (Scenario 2 only) */}
        {isS2 && zbBefore !== null && zbAfter !== null && (
          <div className="zoneb-change">
            <div className="rc-label">
              Zone B Demand: {zbBefore.toFixed(1)} MG/day
              {zbGrew
                ? <span className="rc-delta delta-neg"> ▲ {zbDelta.toFixed(1)} MG/day</span>
                : <span className="rc-delta delta-pos"> — stable</span>
              }
              → {zbAfter.toFixed(1)} MG/day
            </div>

            {/* Before bar */}
            <div className="zoneb-bar-row">
              <span className="zoneb-bar-label">Before</span>
              <div className="reservoir-bar-track">
                <div
                  className={`reservoir-bar-fill ${zbBefore >= 2.5 ? 'warning' : 'normal'}`}
                  style={{ width: `${zbPctBefore}%` }}
                />
              </div>
            </div>

            {/* After bar — animated so the growth is visible */}
            <div className="zoneb-bar-row">
              <span className="zoneb-bar-label">After</span>
              <div className="reservoir-bar-track">
                <div
                  className={`reservoir-bar-fill ${zbAfter >= 2.5 ? 'warning' : 'normal'}`}
                  style={{
                    width: `${zbPctAfter}%`,
                    transition: 'width 0.8s ease 0.3s',
                  }}
                />
              </div>
            </div>

            {/* Plain language explanation */}
            <p className="zoneb-explanation">
              {zbGrew
                ? `Zone B received adequate supply today, so its population grew and demand increased by ${zbDelta.toFixed(1)} MG/day. This will continue each day supply is met.`
                : zbDeficit > 0
                  ? `Zone B had a ${zbDeficit.toFixed(1)} MG deficit today — demand did not grow because supply was insufficient.`
                  : `Zone B received adequate supply but demand is at its maximum (${zbMax} MG/day).`
              }
            </p>
          </div>
        )}

        <button className="btn btn-primary" onClick={onContinue}>
          {hasNextNode ? 'Continue to Next Day →' : 'Proceed to Debrief →'}
        </button>

      </div>
    </div>
  )
}
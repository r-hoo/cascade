export default function ConsequenceScreen({ result, scenario, hasNextNode, onContinue }) {
  if (!result) return null

  const rMax   = scenario?.parameters?.reservoir_max_mgd ?? 100
  const rMin   = scenario?.parameters?.reservoir_min_mgd ?? 20
  const pct    = Math.max(0, Math.min(100, (result.reservoir_after / rMax) * 100))
  const delta  = result.reservoir_after - result.reservoir_before
  const status = result.reservoir_after < rMin ? 'critical'
               : result.reservoir_after < 35   ? 'warning'
               : 'normal'

  return (
    <div className="consequence-screen">
      <div className="consequence-card">
        <div className="consequence-header">
          <span className="day-badge">Day {result.day} — Outcome</span>
          {result.breached_minimum && (
            <div className="alert-banner alert-danger">
              🚨 Reservoir fell below the minimum safe level ({rMin} MG)
            </div>
          )}
        </div>

        <div className="consequence-grid">
          {[
            { label: 'Extraction',      value: `${result.extraction_mgd} MG`           },
            { label: 'Rainfall',        value: `${result.rainfall_mgd} MG`              },
            { label: 'Treated Output',  value: `${result.treated_output.toFixed(1)} MG` },
            {
              label: 'Supply Deficit',
              value: `${result.supply_deficit.toFixed(1)} MG`,
              cls:   result.supply_deficit > 0 ? 'value-warn' : 'value-good',
            },
          ].map(({ label, value, cls }) => (
            <div key={label} className="consequence-stat">
              <span className="cs-label">{label}</span>
              <span className={`cs-value ${cls ?? ''}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className="reservoir-change">
          <div className="rc-label">
            Reservoir: {result.reservoir_before.toFixed(1)} MG
            <span className={`rc-delta ${delta >= 0 ? 'delta-pos' : 'delta-neg'}`}>
              {delta >= 0 ? ' ▲' : ' ▼'} {Math.abs(delta).toFixed(1)} MG
            </span>
            → {result.reservoir_after.toFixed(1)} MG
          </div>
          <div className="reservoir-bar-track">
            <div className={`reservoir-bar-fill ${status}`}
                 style={{ width: `${pct}%`, transition: 'width 0.6s ease' }} />
            <div className="reservoir-bar-min-marker"
                 style={{ left: `${(rMin / rMax) * 100}%` }} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={onContinue}>
          {hasNextNode ? 'Continue to Next Day →' : 'Proceed to Debrief →'}
        </button>
      </div>
    </div>
  )
}
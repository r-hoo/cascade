export default function ConsequenceScreen({ result, scenario, hasNextNode, onContinue }) {
  if (!result) return null

  const sid    = scenario?.id
  const isS2   = sid === 'scenario_2'
  const isS3   = sid === 'scenario_3'
  const p      = scenario?.parameters ?? {}
  const rMax   = p.reservoir_max_mgd ?? 100
  const rMin   = p.reservoir_min_mgd ?? 20
  const pct    = Math.max(0, Math.min(100, (result.reservoir_after / rMax) * 100))
  const delta  = result.reservoir_after - result.reservoir_before
  const status = result.reservoir_after < rMin ? 'critical'
               : result.reservoir_after < 35   ? 'warning'
               : 'normal'

  // S2 + S3 Zone B
  const zbBefore    = result.zone_b_demand     ?? null
  const zbAfter     = result.new_zone_b_demand ?? null
  const zbDelta     = zbBefore !== null && zbAfter !== null ? zbAfter - zbBefore : 0
  const zbGrew      = zbDelta > 0
  const zbDeficit   = result.zone_b_deficit ?? 0
  const zbMax       = (isS3 ? p.zone_b_demand_max_mgd : p.zone_b_demand_max_mgd) ?? 4.0
  const zbPctBefore = zbBefore !== null ? (zbBefore / zbMax) * 100 : 0
  const zbPctAfter  = zbAfter  !== null ? (zbAfter  / zbMax) * 100 : 0

  // S3 Aquifer
  const aqBefore    = result.aquifer_before ?? null
  const aqAfter     = result.aquifer_after  ?? null
  const aqDraw      = result.aquifer_draw   ?? 0
  const aqStressed  = result.aquifer_stressed ?? false
  const aqDelta     = aqBefore !== null && aqAfter !== null ? aqAfter - aqBefore : 0
  const aMax        = p.aquifer_max_mgd ?? 50
  const aqPctBefore = aqBefore !== null ? (aqBefore / aMax) * 100 : 0
  const aqPctAfter  = aqAfter  !== null ? (aqAfter  / aMax) * 100 : 0
  const aqStatus    = aqAfter  !== null
    ? aqAfter < (p.aquifer_stress_threshold ?? 10) ? 'critical' : 'normal'
    : 'normal'

  // S3 Zone C
  const zcDeficit   = result.zone_c_deficit    ?? 0
  const zcConsec    = result.zone_c_consecutive ?? 0
  const zcCritical  = result.zone_c_critical   ?? false

  return (
    <div className="consequence-screen">
      <div className="consequence-card">

        {/* Header alerts */}
        <div className="consequence-header">
          <span className="day-badge">Day {result.day} — Outcome</span>

          {result.breached_minimum && (
            <div className="alert-banner alert-danger">
              🚨 Main reservoir fell below the minimum safe level ({rMin} MG)
            </div>
          )}

          {isS3 && zcCritical && zcConsec >= 2 && (
            <div className="alert-banner alert-danger">
              🏥 Zone C critical — two consecutive deficits. Hospital now on partial shutdown (0.5 MG/day).
            </div>
          )}
          {isS3 && !zcCritical && zcDeficit > 0 && (
            <div className="alert-banner alert-warn">
              ⚠️ Zone C missed supply today ({zcDeficit.toFixed(1)} MG deficit).
              {zcConsec === 1 ? ' One more deficit triggers critical shutdown.' : ''}
            </div>
          )}

          {isS3 && aqDraw > 0 && (
            <div className="alert-banner alert-warn">
              💧 Aquifer auto-drew {aqDraw.toFixed(1)} MG to supplement treatment
              {aqStressed ? ' — aquifer now in stressed recharge range.' : '.'}
            </div>
          )}
          {isS3 && aqStressed && aqDraw === 0 && (
            <div className="alert-banner alert-warn">
              ⚠️ Aquifer is stressed — recharging at only 0.25 MG/day.
            </div>
          )}

          {(isS2 || isS3) && zbGrew && (
            <div className="alert-banner alert-warn">
              📈 Zone B demand grew — population increased because supply was met.
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
            <span className="cs-label">Total Deficit</span>
            <span className={`cs-value ${result.supply_deficit > 0 ? 'value-warn' : 'value-good'}`}>
              {result.supply_deficit.toFixed(1)} MG
            </span>
          </div>
        </div>

        {/* Main reservoir bar */}
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

        {/* Aquifer bar (S3 only) */}
        {isS3 && aqBefore !== null && aqAfter !== null && (
          <div className="zoneb-change">
            <div className="rc-label">
              Aquifer: {aqBefore.toFixed(1)} MG
              {aqDelta >= 0
                ? <span className="rc-delta delta-pos"> ▲ {Math.abs(aqDelta).toFixed(1)} MG</span>
                : <span className="rc-delta delta-neg"> ▼ {Math.abs(aqDelta).toFixed(1)} MG</span>
              }
              → {aqAfter.toFixed(1)} MG
              {aqDraw > 0 && <span style={{ color: 'var(--color-warning)', fontSize: '11px' }}>
                {' '}({aqDraw.toFixed(1)} drawn)
              </span>}
            </div>
            <div className="zoneb-bar-row">
              <span className="zoneb-bar-label">Before</span>
              <div className="reservoir-bar-track">
                <div className={`reservoir-bar-fill ${aqPctBefore < 20 ? 'critical' : 'normal'}`}
                     style={{ width: `${aqPctBefore}%` }} />
              </div>
            </div>
            <div className="zoneb-bar-row">
              <span className="zoneb-bar-label">After</span>
              <div className="reservoir-bar-track">
                <div className={`reservoir-bar-fill ${aqStatus}`}
                     style={{ width: `${aqPctAfter}%`, transition: 'width 0.8s ease 0.3s' }} />
              </div>
            </div>
            <p className="zoneb-explanation">
              {aqDraw > 0
                ? aqStressed
                  ? `The aquifer drew ${aqDraw.toFixed(1)} MG and is now below the stress threshold (${p.aquifer_stress_threshold ?? 10} MG). Recharge drops to 0.25 MG/day — recovery will take many days.`
                  : `The aquifer drew ${aqDraw.toFixed(1)} MG automatically because the main reservoir dropped below ${p.aquifer_draw_threshold ?? 30} MG.`
                : aqStressed
                  ? `The aquifer is still in the stress zone — recharging at only 0.25 MG/day. No draw occurred today.`
                  : `The aquifer is recharging normally at ${p.aquifer_recharge_normal ?? 1.0} MG/day.`
              }
            </p>
          </div>
        )}

        {/* Zone B demand bar (S2 + S3) */}
        {(isS2 || isS3) && zbBefore !== null && zbAfter !== null && (
          <div className="zoneb-change">
            <div className="rc-label">
              Zone B Demand: {zbBefore.toFixed(1)} MG/day
              {zbGrew
                ? <span className="rc-delta delta-neg"> ▲ {zbDelta.toFixed(1)} MG/day</span>
                : <span className="rc-delta delta-pos"> — stable</span>
              }
              → {zbAfter.toFixed(1)} MG/day
            </div>
            <div className="zoneb-bar-row">
              <span className="zoneb-bar-label">Before</span>
              <div className="reservoir-bar-track">
                <div className={`reservoir-bar-fill ${zbBefore >= 3.0 ? 'warning' : 'normal'}`}
                     style={{ width: `${zbPctBefore}%` }} />
              </div>
            </div>
            <div className="zoneb-bar-row">
              <span className="zoneb-bar-label">After</span>
              <div className="reservoir-bar-track">
                <div className={`reservoir-bar-fill ${zbAfter >= 3.0 ? 'warning' : 'normal'}`}
                     style={{ width: `${zbPctAfter}%`, transition: 'width 0.8s ease 0.3s' }} />
              </div>
            </div>
            <p className="zoneb-explanation">
              {zbGrew
                ? `Zone B received adequate supply today, so its population grew and demand increased by ${zbDelta.toFixed(1)} MG/day.`
                : zbDeficit > 0
                  ? `Zone B had a ${zbDeficit.toFixed(1)} MG deficit today — demand did not grow.`
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
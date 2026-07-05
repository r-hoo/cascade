import { useState } from 'react'

export default function DecisionPanel({ scenario, onConfirm, onLog, onExtractionChange }) {
  const [selected, setSelected] = useState(null)
  if (!scenario) return null

  const options = scenario.extraction_options_mgd
  const eta     = scenario.parameters?.treatment_efficiency ?? 0.8
  const demand  = scenario.parameters?.daily_demand_mgd     ?? 4

  function handleSelect(val) {
    const isRevision = selected !== null
    setSelected(val)
    onExtractionChange?.(val)
    onLog?.('SET_EXTRACTION', { value_mgd: val, is_revision: isRevision })
  }

  function handleConfirm() {
    if (selected === null) return
    onConfirm(selected)
    setSelected(null)
  }

  return (
    <div className="decision-panel">
      <h3 className="panel-title">Set Extraction Rate</h3>
      <p className="decision-hint">
        How much raw water to pump from the reservoir today.
      </p>

      <div className="extraction-options">
        {options.map(val => {
          const treated = (val * eta).toFixed(1)
          const deficit = Math.max(0, demand - val * eta).toFixed(1)
          return (
            <button key={val}
                    className={`extraction-btn ${selected === val ? 'selected' : ''}`}
                    onClick={() => handleSelect(val)}>
              <span className="extraction-val">{val} MG/day</span>
              <span className="extraction-sub">
                → {treated} MG treated
                {parseFloat(deficit) > 0 &&
                  <span className="deficit-warn"> · {deficit} deficit</span>}
              </span>
            </button>
          )
        })}
      </div>

      <button className="btn btn-primary"
              onClick={handleConfirm}
              disabled={selected === null}>
        Confirm Decision
      </button>
    </div>
  )
}
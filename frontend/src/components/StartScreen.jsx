import { useState, useEffect } from 'react'
import { getScenarios }        from '../api'

const LOOP_META = {
  B1: { label: 'Balancing loop',    color: 'var(--color-accent)',  icon: '🔄' },
  R1: { label: 'Reinforcing loop',  color: 'var(--color-warning)', icon: '📈' },
  B2: { label: 'Second balancing',  color: 'var(--color-success)', icon: '⚖️' },
}

const DIFFICULTY = {
  scenario_1: { label: 'Introductory', color: 'var(--color-success)' },
  scenario_2: { label: 'Intermediate', color: 'var(--color-warning)' },
  scenario_3: { label: 'Advanced',     color: 'var(--color-danger)'  },
}

export default function StartScreen({ onStart }) {
  const [scenarios,   setScenarios]   = useState([])
  const [selected,    setSelected]    = useState(null)
  const [loadingList, setLoadingList] = useState(true)
  const [starting,    setStarting]    = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    getScenarios()
      .then(data => {
        setScenarios(data)
        if (data.length > 0) setSelected(data[0].id)
      })
      .catch(() => setError('Could not load scenarios. Make sure the backend is running on port 5000.'))
      .finally(() => setLoadingList(false))
  }, [])

  async function handleBegin() {
    if (!selected) return
    setStarting(true)
    setError(null)
    try {
      await onStart(selected)
    } catch {
      setError('Could not start the scenario. Please try again.')
      setStarting(false)
    }
  }

  return (
    <div className="start-screen">
      <div className="start-card">

        {/* Title block */}
        <div className="start-badge">Systems Thinking Simulation</div>
        <h1 className="start-title">Cascade</h1>
        <p className="start-subtitle">
          Manage a water system under pressure. Your decisions ripple through
          interconnected feedback loops — balance today's supply against
          long-term consequences.
        </p>

        {/* Scenario selection */}
        <div className="scenario-select-label">Select a scenario</div>

        {loadingList && (
          <div className="scenario-loading">Loading scenarios…</div>
        )}

        {!loadingList && (
          <div className="scenario-list">
            {scenarios.map((s, i) => {
              const diff     = DIFFICULTY[s.id] ?? { label: 'Unknown', color: 'var(--text-3)' }
              const isLocked = false // extend later if you want sequential unlocking
              const isActive = selected === s.id

              return (
                <button
                  key={s.id}
                  className={`scenario-card ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => !isLocked && setSelected(s.id)}
                  disabled={isLocked}
                >
                  {/* Number + difficulty */}
                  <div className="sc-top-row">
                    <span className="sc-number">0{i + 1}</span>
                    <span className="sc-difficulty" style={{ color: diff.color }}>
                      {diff.label}
                    </span>
                    {isActive && <span className="sc-selected-pill">Selected</span>}
                  </div>

                  {/* Title + description */}
                  <div className="sc-title">{s.title}</div>
                  <div className="sc-desc">{s.description}</div>

                  {/* Meta row */}
                  <div className="sc-meta-row">
                    <span className="sc-meta-item">⏱ {s.node_count} days</span>
                    {s.loops.map(l => {
                      const m = LOOP_META[l] ?? { label: l, color: 'var(--text-3)', icon: '↩' }
                      return (
                        <span
                          key={l}
                          className="sc-meta-item sc-loop-pill"
                          style={{ color: m.color, borderColor: m.color }}
                        >
                          {m.icon} {m.label}
                        </span>
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}

        <button
          className="btn btn-primary btn-large"
          onClick={handleBegin}
          disabled={!selected || starting || loadingList}
        >
          {starting ? 'Starting…' : 'Begin Scenario →'}
        </button>

      </div>
    </div>
  )
}
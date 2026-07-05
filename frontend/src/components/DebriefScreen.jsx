import { useState }        from 'react'
import CausalMapCanvas     from './CausalMapCanvas'
import CompetencyRadar     from './CompetencyRadar'
import ReflectionPrompts   from './ReflectionPrompts'

export default function DebriefScreen({
  debriefConfig, decisions, debriefResult,
  completed, onSubmit, onReset,
}) {
  const [mapEdges,   setMapEdges]   = useState([])
  const [reflections,setReflections]= useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  if (!debriefConfig) {
    return <div className="loading-screen">Loading debrief…</div>
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        causal_map: {
          nodes_placed: debriefConfig.causal_map?.nodes ?? [],
          edges_placed: [
            ...(debriefConfig.causal_map?.pre_placed_edges ?? []),
            ...mapEdges,
          ],
        },
        reflection_responses: reflections,
      })
    } catch {
      setError('Submission failed — please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="debrief-screen">
      <header className="debrief-header">
        <h2>Scenario Debrief — Drought Response</h2>
        <p>Review your decisions and reflect on the system dynamics below.</p>
      </header>

      {/* Decision timeline */}
      <section className="debrief-section">
        <h3>Decision Timeline</h3>
        <div className="decision-timeline">
          {decisions.map((d, i) => (
            <div key={i} className="timeline-item">
              <span className="timeline-day">Day {i + 1}</span>
              <span className="timeline-extraction">{d.extraction_mgd} MG</span>
              <span className="timeline-panel" title="Viewed causal structure">
                {d.viewed_causal_panel ? '📋' : '—'}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Causal map */}
      <section className="debrief-section">
        <h3>Causal Map</h3>
        <p className="section-description">
          Draw the feedback relationships in the water system.
          The Treated Output → Supply Deficit edge is provided.
          Add the remaining connections you observed during the scenario.
        </p>
        <CausalMapCanvas
          prePlacedEdges={debriefConfig.causal_map?.pre_placed_edges ?? []}
          onChange={setMapEdges}
        />
      </section>

      {/* Reflection prompts (only before submission) */}
      {!completed && (
        <section className="debrief-section">
          <ReflectionPrompts
            prompts={debriefConfig.reflection_prompts ?? []}
            onChange={setReflections}
          />
        </section>
      )}

      {/* Results (after submission) */}
      {completed && debriefResult && (
        <section className="debrief-section results-section">
          <h3>Results</h3>
          <div className="results-grid">
            <CompetencyRadar profile={debriefResult.competency_profile} />
            <div className="map-score">
              <h4>Causal Map Score</h4>
              <div className="map-score-fraction">
                {Math.round((debriefResult.map_score?.score_fraction ?? 0) * 100)}%
              </div>
              <p>
                {debriefResult.map_score?.matched_edges?.length ?? 0} of{' '}
                {(debriefResult.map_score?.matched_edges?.length ?? 0) +
                 (debriefResult.map_score?.missing_edges?.length ?? 0)} target edges correctly placed
              </p>
              {(debriefResult.map_score?.missing_edges?.length ?? 0) > 0 && (
                <div className="missing-edges">
                  <p>Missing:</p>
                  <ul>
                    {debriefResult.map_score.missing_edges.map(([f, t, p], i) => (
                      <li key={i}>{f} → {t} ({p})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={onReset}>
            Play Again
          </button>
        </section>
      )}

      {/* Submit */}
      {!completed && (
        <div className="debrief-footer">
          {error && <div className="error-banner">{error}</div>}
          <button className="btn btn-primary btn-large"
                  onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Debrief'}
          </button>
        </div>
      )}
    </div>
  )
}
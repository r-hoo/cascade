import SystemDiagram  from './SystemDiagram'
import StatsPanel     from './StatsPanel'
import NarrativePanel from './NarrativePanel'
import DecisionPanel  from './DecisionPanel'

export default function GameScreen({
  scenario, gameState, node, decisions,
  nodeLogState, onConfirmDecision, onLogEvent, dispatch,
}) {
  function handleStatView(statId) {
    dispatch({ type: 'LOG_STAT', stat: statId })
    onLogEvent('VIEW_STAT', { stat: statId })
  }

  function handleCausalPanelView() {
    dispatch({ type: 'LOG_CAUSAL_PANEL' })
    onLogEvent('VIEW_CAUSAL_PANEL', {})
  }

  function handleExtractionChange(val) {
    dispatch({ type: 'LOG_EXTRACTION', value: val })
  }

  const totalNodes = 8
  const progress   = ((node?.index ?? 0) / totalNodes) * 100

  return (
    <div className="game-screen">
      <header className="game-header">
        <span className="game-title">Cascade — Drought Response</span>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="progress-label">Day {node?.day ?? '—'} / 8</span>
      </header>

      <div className="game-layout">
        {/* Left: system diagram + causal panel toggle */}
        <aside className="game-sidebar-left">
          <SystemDiagram
            gameState={gameState}
            scenario={scenario}
            highlightedStats={nodeLogState.statsViewed}
          />
          <button className="btn btn-ghost causal-panel-btn"
                  onClick={handleCausalPanelView}>
            {nodeLogState.viewedCausalPanel ? '✓ ' : ''}View Causal Structure
          </button>
        </aside>

        {/* Center: narrative + stats */}
        <main className="game-main">
          <NarrativePanel node={node} />
          <StatsPanel
            gameState={gameState}
            node={node}
            scenario={scenario}
            onStatView={handleStatView}
          />
        </main>

        {/* Right: decision + history */}
        <aside className="game-sidebar-right">
          <DecisionPanel
            scenario={scenario}
            onConfirm={onConfirmDecision}
            onLog={onLogEvent}
            onExtractionChange={handleExtractionChange}
          />
          {decisions.length > 0 && (
            <div className="decision-history">
              <h4>History</h4>
              {decisions.map((d, i) => (
                <div key={i} className="history-row">
                  <span>Day {i + 1}</span>
                  <span className="history-val">{d.extraction_mgd} MG</span>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
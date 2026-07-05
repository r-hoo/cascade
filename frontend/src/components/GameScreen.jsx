import { useState }       from 'react'
import SystemDiagram      from './SystemDiagram'
import StatsPanel         from './StatsPanel'
import NarrativePanel     from './NarrativePanel'
import DecisionPanel      from './DecisionPanel'
import CausalPanelModal   from './CausalPanelModal'

export default function GameScreen({
  scenario, gameState, node, decisions,
  nodeLogState, onConfirmDecision, onLogEvent, dispatch,
}) {
  const [hoveredStats,    setHoveredStats]    = useState([])
  const [showCausalPanel, setShowCausalPanel] = useState(false)

  function handleStatView(statId) {
    dispatch({ type: 'LOG_STAT', stat: statId })
    onLogEvent('VIEW_STAT', { stat: statId })
  }

  function handleStatHover(statId) {
    setHoveredStats(statId ? [statId] : [])
  }

  function handleCausalPanelToggle() {
    if (!showCausalPanel) {
      // Only log VIEW_CAUSAL_PANEL on the way open (first or repeat)
      dispatch({ type: 'LOG_CAUSAL_PANEL' })
      onLogEvent('VIEW_CAUSAL_PANEL', {})
    }
    setShowCausalPanel(prev => !prev)
  }

  function handleExtractionChange(val) {
    dispatch({ type: 'LOG_EXTRACTION', value: val })
  }

  // Reset panel on node advance so it doesn't carry over
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
        <aside className="game-sidebar-left">
          <SystemDiagram
            gameState={gameState}
            scenario={scenario}
            highlightedStats={hoveredStats}
          />
          <button
            className={`btn causal-panel-btn ${showCausalPanel ? 'btn-secondary' : 'btn-ghost'}`}
            onClick={handleCausalPanelToggle}
          >
            {showCausalPanel ? '✕ Close Causal Structure' : '🔍 View Causal Structure'}
          </button>
        </aside>

        <main className="game-main">
          <NarrativePanel node={node} />
          <StatsPanel
            gameState={gameState}
            node={node}
            scenario={scenario}
            onStatView={handleStatView}
            onStatHover={handleStatHover}
          />
        </main>

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

      {/* Modal — rendered outside the grid so it overlays everything */}
      {showCausalPanel && (
        <CausalPanelModal
          gameState={gameState}
          scenario={scenario}
          onClose={() => setShowCausalPanel(false)}
        />
      )}
    </div>
  )
}
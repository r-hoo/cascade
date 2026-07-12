import { useState } from 'react'
import { MC_ITEMS, OPEN_ITEM } from '../data/knowledgeCheckItems'

function FlowChart() {
  const W   = 480, H = 180
  const PAD = { top: 16, right: 16, bottom: 36, left: 44 }

  const days    = [1, 2, 3, 4, 5, 6, 7, 8]
  const inflow  = [3, 3, 3, 3, 3, 3, 3, 3]
  const outflow = [1, 2, 3, 4, 5, 5, 5, 5]
  const maxVal  = 6
  const innerW  = W - PAD.left - PAD.right
  const innerH  = H - PAD.top  - PAD.bottom

  function xOf(i) { return PAD.left + (i / (days.length - 1)) * innerW }
  function yOf(v) { return PAD.top  + (1 - v / maxVal) * innerH         }

  const inflowPts  = days.map((_, i) => `${xOf(i)},${yOf(inflow[i])}`).join(' ')
  const outflowPts = days.map((_, i) => `${xOf(i)},${yOf(outflow[i])}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="flow-chart-svg">
      {[0, 1, 2, 3, 4, 5, 6].map(v => (
        <line key={v}
              x1={PAD.left} y1={yOf(v)}
              x2={W - PAD.right} y2={yOf(v)}
              stroke="var(--border)" strokeWidth={0.5} />
      ))}
      {[0, 2, 4, 6].map(v => (
        <text key={v}
              x={PAD.left - 6} y={yOf(v) + 4}
              textAnchor="end" className="chart-label">
          {v}
        </text>
      ))}
      {days.map((d, i) => (
        <text key={d}
              x={xOf(i)} y={H - 8}
              textAnchor="middle" className="chart-label">
          {d}
        </text>
      ))}
      <text x={12} y={H / 2} textAnchor="middle"
            className="chart-label"
            transform={`rotate(-90, 12, ${H / 2})`}>
        MG/day
      </text>
      <text x={W / 2} y={H - 2}
            textAnchor="middle" className="chart-label">
        Day
      </text>
      <polyline points={inflowPts}
                fill="none" stroke="var(--color-success)" strokeWidth={2} />
      <text x={xOf(7) + 6} y={yOf(inflow[7]) + 4}
            className="chart-line-label" fill="var(--color-success)">
        Inflow
      </text>
      <polyline points={outflowPts}
                fill="none" stroke="var(--color-danger)" strokeWidth={2} />
      <text x={xOf(6) + 6} y={yOf(outflow[6]) - 6}
            className="chart-line-label" fill="var(--color-danger)">
        Outflow
      </text>
      <circle cx={xOf(2)} cy={yOf(3)} r={5}
              fill="var(--color-accent)" opacity={0.8} />
    </svg>
  )
}

function MCItem({ item, response, onSelect, showResult }) {
  return (
    <div className="kc-item">
      <div className="kc-source">{item.source}</div>
      <p className="kc-question">{item.question}</p>
      {item.chart && <FlowChart />}
      <div className="kc-options">
        {item.options.map(opt => {
          const isSelected = response === opt.key
          return (
            <button
              key={opt.key}
              className={`kc-option ${isSelected ? 'selected' : ''}`}
              onClick={() => !showResult && onSelect(item.id, opt.key)}
              disabled={showResult}
            >
              <span className="kc-option-key">{opt.key}</span>
              <span className="kc-option-text">{opt.text}</span>
            </button>
          )
        })}
      </div>
      {showResult && (
        <div className="kc-explanation">
          <span className="kc-exp-icon">💡</span>
          {item.explanation}
        </div>
      )}
    </div>
  )
}

function OpenItem({ item, responses, onChange, showResult }) {
  return (
    <div className="kc-item">
      <div className="kc-source">{item.source}</div>
      <div className="kc-scenario-box">
        <span className="kc-scenario-label">Scenario</span>
        <p>{item.scenario}</p>
      </div>
      {item.prompts.map((prompt, i) => {
        const fieldId = `${item.id}_${i}`
        return (
          <div key={fieldId} className="kc-open-prompt">
            <label className="kc-open-label">
              {i + 1}. {prompt}
            </label>
            <textarea
              className="reflection-textarea"
              rows={4}
              value={responses[fieldId] ?? ''}
              onChange={e => onChange(fieldId, e.target.value)}
              disabled={showResult}
              placeholder="Your response…"
            />
          </div>
        )
      })}
      {showResult && (
        <div className="kc-explanation">
          <span className="kc-exp-icon">📝</span>
          Your written responses have been recorded and will be reviewed
          alongside your gameplay data.
        </div>
      )}
    </div>
  )
}

export default function KnowledgeCheckScreen({
  timing,
  sessionId,
  onSubmit,
  onContinue,
}) {
  const isPre = timing === 'pre'

  const [mcResponses,   setMcResponses]   = useState({})
  const [openResponses, setOpenResponses] = useState({})
  const [submitted,     setSubmitted]     = useState(false)
  const [result,        setResult]        = useState(null)
  const [submitting,    setSubmitting]    = useState(false)
  const [error,         setError]         = useState(null)

  function handleMcSelect(itemId, key) {
    setMcResponses(prev => ({ ...prev, [itemId]: key }))
  }

  function handleOpenChange(fieldId, text) {
    setOpenResponses(prev => ({ ...prev, [fieldId]: text }))
  }

  const mcComplete  = MC_ITEMS.every(item => mcResponses[item.id])
  const openStarted = OPEN_ITEM.prompts.some(
    (_, i) => openResponses[`${OPEN_ITEM.id}_${i}`]?.trim()
  )
  const canSubmit = mcComplete && openStarted && !submitting

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const allResponses = {
        ...mcResponses,
        ...Object.fromEntries(
          OPEN_ITEM.prompts.map((_, i) => [
            `${OPEN_ITEM.id}_${i}`,
            openResponses[`${OPEN_ITEM.id}_${i}`] ?? '',
          ])
        ),
      }
      const res = await onSubmit(allResponses)
      setResult(res)
      setSubmitted(true)
    } catch {
      setError('Submission failed — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="kc-screen">
      <div className="kc-card">

        <div className="kc-header">
          <div className="kc-badge">
            {isPre ? 'Pre-Scenario' : 'Post-Scenario'} Assessment
          </div>
          <h2 className="kc-title">
            {isPre ? 'Before You Begin' : 'Reflection Assessment'}
          </h2>
          <p className="kc-subtitle">
            {isPre
              ? "Answer these questions about water systems and feedback loops. There are no penalties for wrong answers — this helps us understand your starting point."
              : "Now that you've completed the scenario, answer the same questions again. Your responses before and after help us measure what the simulation taught you."}
          </p>
          <div className="kc-meta-row">
            <span>📝 4 multiple choice + 1 written response</span>
            <span>⏱ ~5 minutes</span>
          </div>
        </div>

        <div className="kc-body">
          <div className="kc-section-label">Part 1 — Stock and Flow Reasoning</div>
          {MC_ITEMS.map(item => (
            <MCItem
              key={item.id}
              item={item}
              response={mcResponses[item.id]}
              onSelect={handleMcSelect}
              showResult={submitted}
            />
          ))}

          <div className="kc-section-label">Part 2 — Systems Analysis</div>
          <OpenItem
            item={OPEN_ITEM}
            responses={openResponses}
            onChange={handleOpenChange}
            showResult={submitted}
          />
        </div>

        {submitted && result && (
          <div className="kc-score-summary">
            <div className="kc-score-number">
              {result.mc_total} / {MC_ITEMS.length}
            </div>
            <div className="kc-score-label">
              multiple choice correct
              {!isPre && ' — compare with your pre-scenario score to see your progress'}
            </div>
          </div>
        )}

        <div className="kc-footer">
          {error && <div className="error-banner">{error}</div>}
          {!submitted ? (
            <>
              {!mcComplete && (
                <p className="kc-warning">
                  Please answer all four multiple choice questions to continue.
                </p>
              )}
              <button
                className="btn btn-primary btn-large"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting
                  ? 'Submitting…'
                  : isPre
                    ? 'Submit and Continue →'
                    : 'Submit Assessment →'}
              </button>
            </>
          ) : (
            <button
              className="btn btn-primary btn-large"
              onClick={() => onContinue(result)}
            >
              {isPre ? 'Continue to Scenario →' : 'View Your Results →'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
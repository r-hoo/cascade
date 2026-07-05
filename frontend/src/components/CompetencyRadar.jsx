const CX = 150, CY = 150, R_MAX = 95

// Axes at top / right / bottom / left
const AXES = [
  { id: 'feedback_recognition',    label: ['Feedback', 'Recognition'],   angle: -Math.PI / 2 },
  { id: 'time_delay_awareness',    label: ['Time-Delay', 'Awareness'],   angle: 0            },
  { id: 'multivariable_synthesis', label: ['Multi-variable', 'Synthesis'],angle: Math.PI / 2 },
  { id: 'causal_reasoning',        label: ['Causal', 'Reasoning'],       angle: Math.PI      },
]
const SCORE = { high: 1.0, low: 0.25, unscored: 0.5 }

function pt(angle, r) {
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)]
}

function diamond(frac) {
  return AXES.map(a => pt(a.angle, R_MAX * frac).join(',')).join(' ')
}

export default function CompetencyRadar({ profile = {} }) {
  const verts = AXES.map(a => {
    const r = R_MAX * (SCORE[profile[a.id]] ?? 0.5)
    return pt(a.angle, r)
  })
  const polygon = verts.map(v => v.join(',')).join(' ')

  return (
    <div className="competency-radar">
      <h4 className="radar-title">Competency Profile</h4>

      <svg viewBox="0 0 300 300" className="radar-svg">
        {/* Grid rings at 25 / 50 / 75 / 100% */}
        {[0.25, 0.5, 0.75, 1].map(f => (
          <polygon key={f} points={diamond(f)}
                   fill="none" stroke="var(--grid-color)" strokeWidth={0.5} />
        ))}
        {/* Axis lines */}
        {AXES.map(a => {
          const [x, y] = pt(a.angle, R_MAX)
          return <line key={a.id} x1={CX} y1={CY} x2={x} y2={y}
                       stroke="var(--grid-color)" strokeWidth={0.5} />
        })}
        {/* Score polygon */}
        <polygon points={polygon}
                 fill="var(--color-accent)" fillOpacity={0.2}
                 stroke="var(--color-accent)" strokeWidth={2} />
        {/* Score dots */}
        {verts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={4} fill="var(--color-accent)" />
        ))}
        {/* Axis labels */}
        {AXES.map(a => {
          const [x, y] = pt(a.angle, R_MAX + 26)
          return (
            <text key={a.id} x={x} y={y} textAnchor="middle" className="radar-label">
              {a.label.map((line, i) => (
                <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>{line}</tspan>
              ))}
            </text>
          )
        })}
      </svg>

      {/* Text legend */}
      <div className="profile-legend">
        {AXES.map(a => {
          const score = profile[a.id] ?? 'unscored'
          return (
            <div key={a.id} className="legend-row">
              <span className="legend-label">{a.label.join(' ')}</span>
              <span className={`legend-score-pill ${score}`}>
                {score.charAt(0).toUpperCase() + score.slice(1)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
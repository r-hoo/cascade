const ALERTS = {
  forecast_drought:              { cls: 'alert-warn',   icon: '⚠️', label: 'Drought Advisory' },
  drought_active:                { cls: 'alert-danger', icon: '🔴', label: 'Drought Active' },
  reservoir_critical_if_below_35:{ cls: 'alert-danger', icon: '🚨', label: 'Reservoir Critical Risk' },
}

export default function NarrativePanel({ node }) {
  if (!node) return null
  const alert = node.alert ? ALERTS[node.alert] : null

  return (
    <div className="narrative-panel">
      <div className="day-badge">Day {node.day} of 8</div>
      {alert && (
        <div className={`alert-banner ${alert.cls}`}>
          {alert.icon} <strong>{alert.label}</strong>
        </div>
      )}
      <p className="narrative-text">{node.narrative}</p>
    </div>
  )
}
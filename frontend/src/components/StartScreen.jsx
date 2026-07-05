import { useState } from 'react'

export default function StartScreen({ onStart }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleStart() {
    setLoading(true)
    setError(null)
    try {
      await onStart('scenario_1')
    } catch {
      setError('Could not connect to the game server. Make sure the backend is running on port 5000.')
      setLoading(false)
    }
  }

  return (
    <div className="start-screen">
      <div className="start-card">
        <div className="start-badge">Systems Thinking Simulation</div>
        <h1 className="start-title">Cascade</h1>
        <p className="start-subtitle">
          You are the operations manager of the Millbrook Water Authority.
          Manage reservoir extraction over 8 days as a drought approaches.
          Your decisions ripple through interconnected feedback loops —
          balance supply against long-term reservoir health.
        </p>
        <div className="start-details">
          <span>⏱ ~20 minutes</span>
          <span>📊 8 decision points</span>
          <span>🎓 Systems thinking</span>
        </div>
        {error && <div className="error-banner">{error}</div>}
        <button
          className="btn btn-primary btn-large"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Starting…' : 'Begin Scenario'}
        </button>
      </div>
    </div>
  )
}
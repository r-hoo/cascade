const BASE = '/api'

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  }
  return res.json()
}

export const startSession    = (scenarioId) =>
  request('POST', '/sessions', { scenario_id: scenarioId })

export const logEvent        = (sessionId, body) =>
  request('POST', `/sessions/${sessionId}/log`, body)

export const submitDecision  = (sessionId, body) =>
  request('POST', `/sessions/${sessionId}/decision`, body)

export const getDebriefConfig = (sessionId) =>
  request('GET', `/sessions/${sessionId}/debrief-config`)

export const submitDebrief   = (sessionId, body) =>
  request('POST', `/sessions/${sessionId}/debrief`, body)
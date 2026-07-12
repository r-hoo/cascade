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

export const getScenarios         = ()              => request('GET',  '/scenarios')
export const startSession         = (scenarioId)    => request('POST', '/sessions', { scenario_id: scenarioId })
export const logEvent             = (sessionId, b)  => request('POST', `/sessions/${sessionId}/log`, b)
export const submitDecision       = (sessionId, b)  => request('POST', `/sessions/${sessionId}/decision`, b)
export const getDebriefConfig     = (sessionId)     => request('GET',  `/sessions/${sessionId}/debrief-config`)
export const submitDebrief        = (sessionId, b)  => request('POST', `/sessions/${sessionId}/debrief`, b)
export const submitKnowledgeCheck = (sessionId, b)  => request('POST', `/sessions/${sessionId}/knowledge-check`, b)
export const getKnowledgeCheck    = (sessionId, t)  => request('GET',  `/sessions/${sessionId}/knowledge-check/${t}`)
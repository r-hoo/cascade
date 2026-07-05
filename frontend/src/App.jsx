import { useReducer, useCallback } from 'react'
import StartScreen      from './components/StartScreen'
import GameScreen       from './components/GameScreen'
import ConsequenceScreen from './components/ConsequenceScreen'
import DebriefScreen    from './components/DebriefScreen'
import * as api         from './api'

const PHASE = {
  START:       'start',
  PLAYING:     'playing',
  CONSEQUENCE: 'consequence',
  DEBRIEF:     'debrief',
  COMPLETE:    'complete',
}

function freshNodeLog() {
  return {
    viewedCausalPanel: false,
    statsViewed:       [],
    revisionCount:     0,
    startTimeMs:       Date.now(),
    currentExtraction: null,
  }
}

const init = {
  phase:        PHASE.START,
  sessionId:    null,
  scenario:     null,
  gameState:    null,
  currentNode:  null,
  lastResult:   null,
  decisions:    [],
  debriefConfig:null,
  debriefResult:null,
  nodeLogState: freshNodeLog(),
}

function reducer(state, action) {
  switch (action.type) {

    case 'SESSION_STARTED':
      return {
        ...state,
        phase:        PHASE.PLAYING,
        sessionId:    action.payload.sessionId,
        scenario:     action.payload.scenario,
        gameState:    action.payload.state,
        currentNode:  action.payload.node,
        decisions:    [],
        nodeLogState: freshNodeLog(),
      }

    case 'LOG_CAUSAL_PANEL':
      return { ...state, nodeLogState: { ...state.nodeLogState, viewedCausalPanel: true } }

    case 'LOG_STAT': {
      if (state.nodeLogState.statsViewed.includes(action.stat)) return state
      return {
        ...state,
        nodeLogState: {
          ...state.nodeLogState,
          statsViewed: [...state.nodeLogState.statsViewed, action.stat],
        },
      }
    }

    case 'LOG_EXTRACTION': {
      const isRevision = state.nodeLogState.currentExtraction !== null
      return {
        ...state,
        nodeLogState: {
          ...state.nodeLogState,
          currentExtraction: action.value,
          revisionCount: state.nodeLogState.revisionCount + (isRevision ? 1 : 0),
        },
      }
    }

    case 'DECISION_CONFIRMED':
      return {
        ...state,
        phase:       PHASE.CONSEQUENCE,
        gameState:   action.payload.newState,
        lastResult:  action.payload.result,
        decisions:   [...state.decisions, action.payload.decisionData],
        currentNode: action.payload.nextNode,   // null when scenario complete
      }

    case 'NEXT_NODE':
      // currentNode null means scenario is done → go to debrief
      return state.currentNode === null
        ? { ...state, phase: PHASE.DEBRIEF }
        : { ...state, phase: PHASE.PLAYING, nodeLogState: freshNodeLog() }

    case 'DEBRIEF_LOADED':
      return { ...state, debriefConfig: action.config }

    case 'DEBRIEF_SUBMITTED':
      return { ...state, phase: PHASE.COMPLETE, debriefResult: action.result }

    case 'RESET':
      return { ...init, nodeLogState: freshNodeLog() }

    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, init)

  // Fire-and-forget — never blocks the user
  const logEvent = useCallback((eventType, payload = {}) => {
    if (!state.sessionId) return
    api.logEvent(state.sessionId, {
      node_index:          state.currentNode?.index ?? 0,
      event_type:          eventType,
      payload,
      client_timestamp_ms: Date.now(),
    }).catch(() => {})
  }, [state.sessionId, state.currentNode])

  async function handleStart(scenarioId) {
    const data = await api.startSession(scenarioId)
    dispatch({ type: 'SESSION_STARTED', payload: {
      sessionId: data.session_id,
      scenario:  data.scenario,
      state:     data.state,
      node:      data.node,
    }})
  }

  async function handleDecision(extractionMgd) {
    const nls = state.nodeLogState
    const body = {
      extraction_mgd:     extractionMgd,
      time_to_confirm_ms: nls.startTimeMs ? Date.now() - nls.startTimeMs : null,
      revision_count:     nls.revisionCount,
      viewed_causal_panel:nls.viewedCausalPanel,
      stats_viewed:       nls.statsViewed,
    }
    const data = await api.submitDecision(state.sessionId, body)
    dispatch({ type: 'DECISION_CONFIRMED', payload: {
      result:       data.result,
      newState:     data.new_state,
      nextNode:     data.next_node,
      decisionData: { node_index: state.currentNode.index, ...body },
    }})
  }

  function handleNextNode() {
    // If there's no next node, also kick off debrief config fetch
    if (state.currentNode === null) {
      api.getDebriefConfig(state.sessionId)
        .then(cfg => dispatch({ type: 'DEBRIEF_LOADED', config: cfg }))
        .catch(() => {})
    }
    dispatch({ type: 'NEXT_NODE' })
  }

  async function handleDebriefSubmit(body) {
    const result = await api.submitDebrief(state.sessionId, body)
    dispatch({ type: 'DEBRIEF_SUBMITTED', result })
  }

  const { phase } = state

  if (phase === PHASE.START)
    return <StartScreen onStart={handleStart} />

  if (phase === PHASE.PLAYING)
    return (
      <GameScreen
        scenario={state.scenario}
        gameState={state.gameState}
        node={state.currentNode}
        decisions={state.decisions}
        nodeLogState={state.nodeLogState}
        onConfirmDecision={handleDecision}
        onLogEvent={logEvent}
        dispatch={dispatch}
      />
    )

  if (phase === PHASE.CONSEQUENCE)
    return (
      <ConsequenceScreen
        result={state.lastResult}
        scenario={state.scenario}
        hasNextNode={state.currentNode !== null}
        onContinue={handleNextNode}
      />
    )

  if (phase === PHASE.DEBRIEF || phase === PHASE.COMPLETE)
    return (
      <DebriefScreen
        debriefConfig={state.debriefConfig}
        decisions={state.decisions}
        debriefResult={state.debriefResult}
        completed={phase === PHASE.COMPLETE}
        onSubmit={handleDebriefSubmit}
        onReset={() => dispatch({ type: 'RESET' })}
      />
    )

  return null
}
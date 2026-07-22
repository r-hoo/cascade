import SystemDiagram from './SystemDiagram'

export default function OnboardingModal({ scenario, gameState, onBegin }) {
  const isS2 = scenario?.id === 'scenario_2'
  const isS3 = scenario?.id === 'scenario_3'

  return (
    <div className="modal-backdrop">
      <div className="modal-card onboarding-card">

        <div className="modal-header">
          <div>
            <div className="modal-title">
              {scenario?.title ?? 'Scenario'} — Before You Begin
            </div>
            <div className="modal-subtitle">
              Take a moment to understand the system you will be managing.
            </div>
          </div>
        </div>

        <div className="modal-body">

          <div className="onboarding-description">
            {isS3 ? (
              <>
                <p>
                  You are now managing a <strong>three-zone water system</strong>.
                  Zone A is an existing residential zone with stable demand.
                  Zone B is a growing industrial zone — its demand increases
                  every day you supply it adequately.
                  Zone C is a <strong>hospital</strong> that requires uninterrupted
                  supply. If it goes without water for two consecutive days,
                  it enters partial shutdown.
                </p>
                <p>
                  A <strong>groundwater aquifer</strong> sits beneath the city
                  as a backup. When the main reservoir drops below 30 MG,
                  the aquifer automatically draws 2 MG/day to supplement treatment.
                  But if you drain the aquifer below 10 MG, its recharge rate
                  drops from 1.0 to 0.25 MG/day — meaning it takes many days
                  to recover, and it will not be available when you need it most.
                </p>
              </>
            ) : isS2 ? (
              <>
                <p>
                  You are managing a water system serving <strong>two zones</strong>.
                  Zone A is an existing neighborhood with stable demand.
                  Zone B is a new development — as you supply it with water,
                  more residents move in, <strong>increasing its demand over time</strong>.
                </p>
                <p>
                  Your job is to set the daily extraction rate from the reservoir.
                  Extract too little and zones go without water. Extract too much
                  and the reservoir runs dry — especially as Zone B's demand
                  keeps growing.
                </p>
              </>
            ) : (
              <>
                <p>
                  You are the operations manager of the Millbrook Water Authority.
                  A reservoir feeds a treatment plant, which supplies water to a
                  residential zone. Your job is to set the daily extraction rate
                  from the reservoir over 8 operating days.
                </p>
                <p>
                  A drought is coming. Extract too aggressively and you will drain
                  the reservoir before rainfall recovers. Extract too little and
                  you will leave residents without adequate supply.
                </p>
              </>
            )}
          </div>

          <div className="onboarding-diagram">
            <p className="onboarding-diagram-label">
              This diagram shows how the system's parts connect.
              It will remain visible on the left during the scenario.
            </p>
            <SystemDiagram
              gameState={gameState}
              scenario={scenario}
              highlightedStats={[]}
            />
          </div>

          <div className="onboarding-callouts">
            <div className="onboarding-callout">
              <div className="oc-icon">🔄</div>
              <div>
                <div className="oc-title">Balancing Loop (B1)</div>
                <div className="oc-desc">
                  As the main reservoir falls, sustainable extraction falls with it.
                  Ignore this and you will run the reservoir dry.
                </div>
              </div>
            </div>

            {isS3 && (
              <div className="onboarding-callout">
                <div className="oc-icon">⚖️</div>
                <div>
                  <div className="oc-title">Balancing Loop (B2) — Aquifer</div>
                  <div className="oc-desc">
                    The aquifer supplements supply when the reservoir is low —
                    but if you drain it below 10 MG, it recharges at only
                    0.25 MG/day instead of 1.0. It becomes unavailable precisely
                    when you need it most.
                  </div>
                </div>
              </div>
            )}

            {(isS2 || isS3) && (
              <div className="onboarding-callout">
                <div className="oc-icon">📈</div>
                <div>
                  <div className="oc-title">Reinforcing Loop (R1)</div>
                  <div className="oc-desc">
                    Every time Zone B gets enough water, its population grows and
                    its demand increases the next day. Meeting demand today creates
                    more demand tomorrow.
                  </div>
                </div>
              </div>
            )}

            <div className="onboarding-callout">
              <div className="oc-icon">⏱</div>
              <div>
                <div className="oc-title">Time Delays</div>
                <div className="oc-desc">
                  Effects do not happen instantly. Rainfall enters the reservoir
                  the day it falls
                  {isS3 ? ', Zone B demand grows the day after supply is met, and aquifer recovery takes multiple days after stress' : isS2 ? ', and Zone B demand grows the day after supply is met' : ''}.
                  Plan ahead, not just for today.
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-large onboarding-begin"
            onClick={onBegin}
          >
            Begin Scenario →
          </button>

        </div>
      </div>
    </div>
  )
}
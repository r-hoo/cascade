import SystemDiagram from './SystemDiagram'

export default function OnboardingModal({ scenario, gameState, onBegin }) {
  const isS2 = scenario?.id === 'scenario_2'

  return (
    <div className="modal-backdrop">
      <div className="modal-card onboarding-card">

        <div className="modal-header">
          <div>
            <div className="modal-title">
              {scenario?.title ?? 'Scenario'} — Before You Begin
            </div>
            <div className="modal-subtitle">
              Take a moment to understand the system you'll be managing.
            </div>
          </div>
        </div>

        <div className="modal-body">

          {/* Plain-language system description */}
          <div className="onboarding-description">
            {isS2 ? (
              <>
                <p>
                  You're managing a water system serving <strong>two zones</strong>.
                  Zone A is an existing neighborhood with stable demand.
                  Zone B is a new development — and as you supply it with water,
                  more residents move in, <strong>increasing its demand over time</strong>.
                </p>
                <p>
                  Your job is to set the daily extraction rate from the reservoir.
                  Extract too little and zones go without water. Extract too much
                  and the reservoir runs dry — especially as Zone B's demand keeps growing.
                </p>
              </>
            ) : (
              <>
                <p>
                  You're the operations manager of the Millbrook Water Authority.
                  A reservoir feeds a treatment plant, which supplies water to a
                  residential zone. Your job is to set the daily extraction rate
                  from the reservoir over 8 operating days.
                </p>
                <p>
                  A drought is coming. Extract too aggressively and you'll drain
                  the reservoir before rainfall recovers. Extract too little and
                  you'll leave residents without adequate supply.
                </p>
              </>
            )}
          </div>

          {/* System diagram */}
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

          {/* Key relationships callout */}
          <div className="onboarding-callouts">
            <div className="onboarding-callout">
              <div className="oc-icon">🔄</div>
              <div>
                <div className="oc-title">Balancing Loop (B1)</div>
                <div className="oc-desc">
                  As the reservoir level falls, you have less water available to extract.
                  If you ignore this, you'll run the reservoir dry.
                </div>
              </div>
            </div>
            {isS2 && (
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
                  Effects don't happen instantly. Rainfall enters the reservoir the
                  day it falls{isS2 ? ', and Zone B demand grows the day after supply is met' : ''}.
                  Plan ahead, not just for today.
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-large onboarding-begin"
                  onClick={onBegin}>
            Begin Scenario →
          </button>

        </div>
      </div>
    </div>
  )
}
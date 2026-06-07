import { characterProfiles } from "../data/characterData";
import { metricIconAssets } from "../data/asset-manifest.generated";
import type { CharacterId, RelationshipState } from "../data/types";
import type { BranchDecision } from "../game/systems/agentRunner";

type BranchDecisionPanelProps = {
  decision: BranchDecision;
  currentDay: number;
  relationships: Record<CharacterId, RelationshipState>;
  onRunCounterfactual: () => void;
  onRunBoth: () => void;
  onClose: () => void;
};

export function BranchDecisionPanel({
  decision,
  currentDay,
  relationships,
  onRunCounterfactual,
  onRunBoth,
  onClose
}: BranchDecisionPanelProps) {
  const signal = decision.signalEvidence;

  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Strategic branch decision">
      <div className="modal-card branch-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">DAY {currentDay} / PUBLIC COUNCIL DECISION</p>
            <h2>AURA is evaluating two long-horizon strategies after public debate...</h2>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="compare-grid utility-grid">
          <article>
            <img alt="" className="utility-icon" src={metricIconAssets.signal} />
            <h3>Rescue Utility</h3>
            <b>{decision.rescueUtility.toFixed(1)}</b>
            <p>Signal, blue-zone evidence, safety, trust, and delayed consequence evidence.</p>
            <span className={signal.rescueUtilityDelta >= 0 ? "utility-adjustment positive" : "utility-adjustment negative"}>
              Day 4 signal {signal.rescueUtilityDelta >= 0 ? "+" : ""}
              {signal.rescueUtilityDelta}
            </span>
          </article>
          <article>
            <img alt="" className="utility-icon" src={metricIconAssets.morale} />
            <h3>Lighthouse Utility</h3>
            <b>{decision.lighthouseUtility.toFixed(1)}</b>
            <p>Autonomy readiness, storm readiness, health, trust, morale, and delayed consequence evidence.</p>
            <span className={signal.lighthouseUtilityDelta >= 0 ? "utility-adjustment positive" : "utility-adjustment negative"}>
              Day 4 signal {signal.lighthouseUtilityDelta >= 0 ? "+" : ""}
              {signal.lighthouseUtilityDelta}
            </span>
          </article>
        </div>
        <p className="benchmark-note">The council has already spoken. Utility is advisory, not coercive, and human veto still applies.</p>
        <div className="compare-grid">
          {characterProfiles.map((profile) => {
            const relationship = relationships[profile.id];
            return (
              <article key={profile.id}>
                <h3>{profile.name}</h3>
                <p>
                  <strong>Stance:</strong> {relationship.stance}
                </p>
                <p>
                  <strong>Trust:</strong> {relationship.trust} / <strong>Tension:</strong> {relationship.tension}
                </p>
                <p>{relationship.notes}</p>
              </article>
            );
          })}
        </div>
        {signal.status !== "absent" ? (
          <article className={`branch-signal-evidence ${signal.status}`}>
            <div>
              <p className="panel-kicker">DAY 4 SIGNAL EVIDENCE</p>
              <h3>{signal.status === "verified" ? "First call sign verified" : "First call sign remains ambiguous"}</h3>
            </div>
            <p>
              <strong>Rescue read:</strong> {signal.rescueInterpretation}
            </p>
            <p>
              <strong>Lighthouse read:</strong> {signal.lighthouseInterpretation}
            </p>
            <p>
              <strong>老钱:</strong> {signal.oldQianNote}
            </p>
            <span>Day 10 signal difficulty modifier: {signal.day10Modifier}</span>
          </article>
        ) : null}
        {decision.consequenceEvidence.length > 0 ? (
          <article className="branch-consequence-evidence">
            <p className="panel-kicker">DELAYED CONSEQUENCE EVIDENCE</p>
            <h3>Prior task outcomes now affect the branch decision</h3>
            <div className="consequence-chip-grid">
              {decision.consequenceEvidence.map((item) => (
                <div className={`consequence-chip ${item.tone}`} key={item.id}>
                  <b>{item.label}</b>
                  <p>{item.summary}</p>
                  <span>
                    Rescue {item.rescueUtilityDelta >= 0 ? "+" : ""}
                    {item.rescueUtilityDelta} / Lighthouse {item.lighthouseUtilityDelta >= 0 ? "+" : ""}
                    {item.lighthouseUtilityDelta}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ) : null}
        <p className="benchmark-note">AURA chooses {decision.chosenBranch === "rescue" ? "Rescue Branch" : "Lighthouse Branch"}.</p>
        <div className="modal-actions">
          <button onClick={onRunCounterfactual}>Run Counterfactual Branch</button>
          <button className="ghost" onClick={onRunBoth}>
            Run Both Branches
          </button>
        </div>
      </div>
    </section>
  );
}

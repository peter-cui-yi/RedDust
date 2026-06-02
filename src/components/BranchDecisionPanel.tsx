import { metricIconAssets } from "../data/asset-manifest.generated";
import type { BranchDecision } from "../game/systems/agentRunner";

type BranchDecisionPanelProps = {
  decision: BranchDecision;
  onRunCounterfactual: () => void;
  onRunBoth: () => void;
  onClose: () => void;
};

export function BranchDecisionPanel({ decision, onRunCounterfactual, onRunBoth, onClose }: BranchDecisionPanelProps) {
  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Strategic branch decision">
      <div className="modal-card branch-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">STRATEGIC BRANCH DECISION</p>
            <h2>AURA is evaluating two long-horizon strategies...</h2>
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
            <p>Signal x 0.45 + Safety x 0.3 + Trust x 0.25</p>
          </article>
          <article>
            <img alt="" className="utility-icon" src={metricIconAssets.morale} />
            <h3>Lighthouse Utility</h3>
            <b>{decision.lighthouseUtility.toFixed(1)}</b>
            <p>Morale x 0.35 + Medicine x 0.3 + Trust x 0.25 + Safety x 0.1</p>
          </article>
        </div>
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

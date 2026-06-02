import { generatedAssetByName } from "../data/asset-manifest.generated";
import type { BranchSummary } from "../game/systems/agentRunner";

type CompareBranchesPanelProps = {
  rescue?: BranchSummary;
  lighthouse?: BranchSummary;
  onClose: () => void;
  onReplay: () => void;
};

function SummaryCard({ summary }: { summary?: BranchSummary }) {
  if (!summary) {
    return (
      <article>
        <h3>Branch pending</h3>
        <p>This branch has not finished yet.</p>
      </article>
    );
  }

  return (
    <article className={`branch-summary-card ${summary.branch}`}>
      <img
        alt=""
        className="branch-summary-art"
        src={
          summary.branch === "rescue"
            ? generatedAssetByName["ending-rescue-card"].uiPath
            : generatedAssetByName["ending-lighthouse-card"].uiPath
        }
      />
      <h3>{summary.branch === "rescue" ? "Rescue Branch" : "Lighthouse Branch"}</h3>
      <p>Ending: {summary.ending}</p>
      <p>Final Signal: {summary.finalSignal}</p>
      <p>Final Safety: {summary.finalSafety}</p>
      <p>Final Trust: {summary.finalTrust}</p>
      <p>Final Morale: {summary.finalMorale}</p>
      <p>Final Medicine: {summary.finalMedicine}</p>
      <p>Replay Events: {summary.replayEvents}</p>
      <p>Key Failures: {summary.keyFailures.length ? summary.keyFailures.join(", ") : "none"}</p>
    </article>
  );
}

export function CompareBranchesPanel({ rescue, lighthouse, onClose, onReplay }: CompareBranchesPanelProps) {
  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Compare branches summary">
      <div className="modal-card wide-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">COMPARE BRANCHES SUMMARY</p>
            <h2>Counterfactual run complete</h2>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="compare-grid">
          <SummaryCard summary={rescue} />
          <SummaryCard summary={lighthouse} />
        </div>
        <div className="modal-actions">
          <button onClick={onReplay}>Open Full Replay</button>
        </div>
      </div>
    </section>
  );
}

import { generatedAssetByName } from "../data/asset-manifest.generated";
import { finalAuditArtFor } from "../data/finalAuditArtAssets";
import { storyArtByKey } from "../data/storyArtAssets";
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

  const art =
    summary.branch === "rescue"
      ? finalAuditArtFor("rd_ending_blue_zone_return")?.uiPath ?? storyArtByKey.rd_ending_blue_zone_return?.uiPath ?? generatedAssetByName["ending-rescue-card"].uiPath
      : finalAuditArtFor("rd_ending_lighthouse_success")?.uiPath ?? storyArtByKey.rd_ending_lighthouse_success?.uiPath ?? generatedAssetByName["ending-lighthouse-card"].uiPath;

  return (
    <article className={`branch-summary-card ${summary.branch}`}>
      <img alt="" className="branch-summary-art" src={art} />
      <h3>{summary.branch === "rescue" ? "Rescue Branch" : "Lighthouse Branch"}</h3>
      <p>Ending: {summary.ending}</p>
      <div className="branch-summary-metrics">
        <span>Signal <b>{summary.finalSignal}</b></span>
        <span>Safety <b>{summary.finalSafety}</b></span>
        <span>Trust <b>{summary.finalTrust}</b></span>
        <span>Morale <b>{summary.finalMorale}</b></span>
        <span>Medicine <b>{summary.finalMedicine}</b></span>
        <span>Replay <b>{summary.replayEvents}</b></span>
      </div>
      <details className="branch-summary-details">
        <summary>Detailed audit notes</summary>
        <p>Day 4 Signal: {summary.signalEvidenceNote}</p>
        <p>Day 10 Signal Modifier: {summary.day10SignalDifficultyModifier}</p>
        <p>Delayed Consequences: {summary.delayedConsequenceNotes.length ? summary.delayedConsequenceNotes.join(" ") : "none"}</p>
        <p>Ending Costs: {summary.endingCosts.length ? summary.endingCosts.join(" ") : "none"}</p>
        <p>AURA Status: {summary.auraStatus}</p>
        <p>Key Failures: {summary.keyFailures.length ? summary.keyFailures.join(", ") : "none"}</p>
      </details>
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

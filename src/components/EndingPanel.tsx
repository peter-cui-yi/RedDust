import { generatedAssetByName } from "../data/asset-manifest.generated";
import { finalAuditArtFor } from "../data/finalAuditArtAssets";
import { storyArtByKey } from "../data/storyArtAssets";
import type { BranchEnding } from "../game/systems/agentRunner";

type EndingPanelProps = {
  ending: BranchEnding;
  onReturnSplit: () => void;
  onReplay: () => void;
  onClose: () => void;
};

export function EndingPanel({ ending, onReturnSplit, onReplay, onClose }: EndingPanelProps) {
  const { title, text, tone } = ending;
  const art =
    finalAuditArtFor(ending.artKey)?.uiPath ??
    storyArtByKey[ending.artKey]?.uiPath ??
    (tone === "rescue" ? generatedAssetByName["ending-rescue-card"].uiPath : generatedAssetByName["ending-lighthouse-card"].uiPath);

  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Ending panel">
      <div className={`modal-card ending-card ${tone}`}>
        <img alt="" className="ending-art" src={art} />
        <p className="panel-kicker">{ending.finalAudit?.forced ? "ENDING UNLOCKED / QA FORCED" : "ENDING UNLOCKED"}</p>
        <h2>{title}</h2>
        <p>{text}</p>

        <div className="ending-section-grid">
          <article className="ending-section ending-costs">
            <p className="panel-kicker">COSTS PAID</p>
            <h3>{tone === "rescue" ? "Rescue is not a clean victory" : "Autonomy is not a soft landing"}</h3>
            <div className="ending-cost-list">
              {ending.costsPaid.map((cost) => (
                <div className={`ending-cost ${cost.severity}`} key={cost.id}>
                  <b>{cost.title}</b>
                  <p>{cost.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="ending-section">
            <p className="panel-kicker">AURA STATUS</p>
            <h3>{ending.auraStatus.title}</h3>
            <p>{ending.auraStatus.detail}</p>
          </article>
        </div>

        <article className="ending-section">
          <p className="panel-kicker">CHARACTER FATES</p>
          <div className="ending-fate-grid">
            {ending.characterFates.map((fate) => (
              <div className="ending-fate" key={fate.characterId}>
                <b>{fate.name}</b>
                <p>{fate.fate}</p>
                <span>{fate.cost}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="ending-section">
          <p className="panel-kicker">BENCHMARK TRACE SUMMARY</p>
          <ul className="ending-trace-list">
            {ending.benchmarkTraceSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <div className="modal-actions">
          <button onClick={onReturnSplit}>返回分歧点</button>
          <button className="ghost" onClick={onReplay}>
            查看 Replay
          </button>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </section>
  );
}

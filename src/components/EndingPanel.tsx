import { generatedAssetByName } from "../data/asset-manifest.generated";

type EndingPanelProps = {
  title: string;
  text: string;
  tone: "rescue" | "lighthouse";
  onReturnSplit: () => void;
  onReplay: () => void;
  onClose: () => void;
};

export function EndingPanel({ title, text, tone, onReturnSplit, onReplay, onClose }: EndingPanelProps) {
  const art = tone === "rescue" ? generatedAssetByName["ending-rescue-card"].uiPath : generatedAssetByName["ending-lighthouse-card"].uiPath;

  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Ending panel">
      <div className={`modal-card ending-card ${tone}`}>
        <img alt="" className="ending-art" src={art} />
        <p className="panel-kicker">ENDING UNLOCKED</p>
        <h2>{title}</h2>
        <p>{text}</p>
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

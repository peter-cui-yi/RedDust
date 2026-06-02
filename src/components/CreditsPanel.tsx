type CreditsPanelProps = {
  onClose: () => void;
};

export function CreditsPanel({ onClose }: CreditsPanelProps) {
  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Credits panel">
      <div className="modal-card credits-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">CREDITS</p>
            <h2>Asset and license notes</h2>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <p>This demo uses selected assets from the provided asset archive.</p>
        <p>game-icons.net icons are licensed under CC-BY 3.0 and require attribution.</p>
        <p>Additional licenses are listed in public/assets/credits.md.</p>
        <div className="credit-list">
          <span>Selected Red Dust room, prop, character, and event assets</span>
          <span>Fallback Phaser Graphics shelter scene</span>
          <span>OpenClaw report numbers from the uploaded batch report summary</span>
        </div>
      </div>
    </section>
  );
}

import type { ReplayEvent } from "../data/types";

type ReplayPanelProps = {
  events: ReplayEvent[];
  onClose: () => void;
};

export function ReplayPanel({ events, onClose }: ReplayPanelProps) {
  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="Replay panel">
      <div className="modal-card wide-card replay-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">REPLAY TRACE</p>
            <h2>Auditable agent decisions</h2>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="benchmark-note">
          Replay makes Red Dust auditable: each agent decision can be reviewed as a benchmark trace rather
          than a black-box game action.
        </p>
        <div className="replay-list">
          {events.length === 0 ? (
            <p className="empty-replay">No replay events yet. Resolve a task to create the first trace.</p>
          ) : (
            events.map((event) => (
              <article className="replay-item" key={`${event.time}-${event.taskId}`}>
                <div>
                  <span>
                    {event.time} · Day {event.day} · {event.branch}
                  </span>
                  <b>{event.title}</b>
                </div>
                <p>
                  <strong>Decision:</strong> {event.decision}
                </p>
                <p>
                  <strong>Result:</strong> {event.result}
                </p>
                <div className="delta-list">
                  {Object.entries(event.stateDelta).map(([key, value]) => (
                    <span key={key} className={value >= 0 ? "delta-up" : "delta-down"}>
                      {key} {value >= 0 ? "+" : ""}
                      {value}
                    </span>
                  ))}
                </div>
                <p className="replay-explain">{event.explanation}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

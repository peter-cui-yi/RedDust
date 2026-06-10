import type { AgentRunState } from "../data/types";

type AgentControlBarProps = {
  runState: AgentRunState;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
};

export function AgentControlBar({
  runState,
  onStart,
  onPause,
  onStop
}: AgentControlBarProps) {
  return (
    <section className="agent-control-bar" aria-label="Agent runner controls">
      <div>
        <p className="control-label">Agent run console</p>
        <div className="control-row">
          <button onClick={onStart}>Run</button>
          <button className="ghost" onClick={onPause}>
            {runState.isPaused ? "Resume" : "Pause"}
          </button>
          <button className="ghost" onClick={onStop}>
            Stop
          </button>
        </div>
      </div>
    </section>
  );
}

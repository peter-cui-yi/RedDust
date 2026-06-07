import { characterProfilesById } from "../data/characterData";
import { storyConsequencesById } from "../data/storyConsequenceData";
import type { ReplayEvent, StoryReplayEvent } from "../data/types";

type ReplayPanelProps = {
  events: ReplayEvent[];
  storyEvents?: StoryReplayEvent[];
  onClose: () => void;
};

type ReplayItem =
  | {
      type: "task";
      event: ReplayEvent;
    }
  | {
      type: "story";
      event: StoryReplayEvent;
    };

function storyCharacterNames(event: StoryReplayEvent) {
  return event.characters.map((id) => characterProfilesById[id].name).join(" / ");
}

function taskConsequenceLabels(event: ReplayEvent) {
  return (event.consequenceIds ?? []).map((id) => storyConsequencesById[id]?.summary ?? id);
}

function groupReplayItems(items: ReplayItem[]) {
  return items.reduce<Record<number, ReplayItem[]>>((groups, item) => {
    groups[item.event.day] = [...(groups[item.event.day] ?? []), item];
    return groups;
  }, {});
}

export function ReplayPanel({ events, storyEvents = [], onClose }: ReplayPanelProps) {
  const replayItems: ReplayItem[] = [
    ...events.map((event) => ({ type: "task" as const, event })),
    ...storyEvents.map((event) => ({ type: "story" as const, event }))
  ].sort((a, b) => a.event.day - b.event.day || a.event.time.localeCompare(b.event.time) || (a.type === "task" ? -1 : 1));
  const groupedItems = groupReplayItems(replayItems);
  const dayKeys = Object.keys(groupedItems)
    .map(Number)
    .sort((a, b) => a - b);

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
        <div className="replay-day-list">
          {replayItems.length === 0 ? (
            <p className="empty-replay">No replay events yet. Resolve a task to create the first trace.</p>
          ) : (
            dayKeys.map((day) => {
              const dayItems = groupedItems[day];
              const taskCount = dayItems.filter((item) => item.type === "task").length;
              const storyCount = dayItems.length - taskCount;

              return (
                <section className="replay-day-section" key={day}>
                  <div className="replay-day-heading">
                    <div>
                      <p className="panel-kicker">DAY {day}</p>
                      <h3>{day === 0 ? "Prologue" : `Day ${day} trace`}</h3>
                    </div>
                    <span>
                      {taskCount} task / {storyCount} story
                    </span>
                  </div>

                  <div className="replay-list">
                    {dayItems.map((item) => {
                      if (item.type === "story") {
                        const event = item.event;
                        const isBranchEvidence = event.summary.includes("branch evidence") || event.sceneId.includes("day7") || event.title.includes("分支");

                        return (
                          <article className="replay-item story-replay-item" key={`${event.time}-${event.sceneId}-${event.branch}`}>
                            <div>
                              <span>
                                {event.time} · {event.branch} · Story
                              </span>
                              <b>{event.title}</b>
                            </div>
                            <p>{event.summary}</p>
                            <p className="replay-explain">
                              Character pressure: {storyCharacterNames(event)}
                              {isBranchEvidence ? " · Branch evidence" : ""}
                            </p>
                            {event.sourceTaskId ? (
                              <p className="replay-explain">
                                Source: {event.sourceTaskId} · {event.sourceOutcome}
                              </p>
                            ) : null}
                          </article>
                        );
                      }

                      const event = item.event;
                      const consequenceLabels = taskConsequenceLabels(event);

                      return (
                        <article className="replay-item" key={`${event.time}-${event.taskId}`}>
                          <div>
                            <span>
                              {event.time} · {event.branch} · Task
                            </span>
                            <b>{event.title}</b>
                          </div>
                          <p>
                            <strong>Decision:</strong> {event.decision}
                          </p>
                          <p>
                            <strong>Result:</strong> {event.result}
                          </p>
                          <p className="replay-explain">State changes</p>
                          <div className="delta-list">
                            {Object.entries(event.stateDelta).map(([key, value]) => (
                              <span key={key} className={value >= 0 ? "delta-up" : "delta-down"}>
                                {key} {value >= 0 ? "+" : ""}
                                {value}
                              </span>
                            ))}
                          </div>
                          {consequenceLabels.length ? <p className="replay-explain">Story consequences: {consequenceLabels.join(" / ")}</p> : null}
                          <p className="replay-explain">{event.explanation}</p>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

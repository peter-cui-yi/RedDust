import { generatedAssetByName } from "../data/asset-manifest.generated";
import type { ReplayEvent, StoryReplayEvent } from "../data/types";
import { summarizeReplayLine } from "../game/systems/replayEngine";

type LiveReplayFeedProps = {
  events: ReplayEvent[];
  storyEvents?: StoryReplayEvent[];
};

type FeedItem = {
  id: string;
  type: "story" | "task";
  day: number;
  time: string;
  text: string;
};

export function LiveReplayFeed({ events, storyEvents = [] }: LiveReplayFeedProps) {
  const taskItems: FeedItem[] = events.map((event) => ({
    id: `${event.time}-${event.taskId}-${event.branch}`,
    type: "task",
    day: event.day,
    time: event.time,
    text: summarizeReplayLine(event)
  }));
  const storyItems: FeedItem[] = storyEvents.map((event) => ({
    id: `${event.time}-${event.sceneId}-${event.branch}`,
    type: "story",
    day: event.day,
    time: event.time,
    text: `[D${event.day}] ${event.title} -> ${event.summary}`
  }));
  const recent = [...storyItems, ...taskItems]
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time) || (a.type === "task" ? -1 : 1))
    .slice(-6)
    .reverse();

  return (
    <section className="live-replay-feed">
      <div className="feed-heading">
        <img alt="" src={generatedAssetByName["replay-feed-icon"].uiPath} />
        <p className="panel-kicker">LIVE REPLAY FEED</p>
      </div>
      {recent.length === 0 ? (
        <p className="empty-replay">Replay will append automatically after the first resolved task.</p>
      ) : (
        <div className="feed-list">
          {recent.map((event) => (
            <div className={`feed-item ${event.type}`} key={event.id}>
              <img alt="" src={generatedAssetByName["replay-feed-icon"].uiPath} />
              {event.text}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

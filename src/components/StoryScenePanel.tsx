import { useEffect, useRef, useState } from "react";
import { characterProfilesById } from "../data/characterData";
import { dayArtFor } from "../data/dayArtAssets";
import { image2Assets } from "../data/image2Assets";
import { storyArtByKey } from "../data/storyArtAssets";
import type { StoryScene, StorySpeakerId } from "../data/types";

const assetPathByKey = Object.fromEntries(Object.values(image2Assets).map((asset) => [asset.key, asset.uiPath])) as Record<string, string>;

function speakerLabel(speaker: StorySpeakerId) {
  if (speaker === "aura") return "AURA";
  if (speaker === "system") return "SYSTEM";
  if (speaker === "residents") return "居民";
  return characterProfilesById[speaker].name;
}

function speakerClass(speaker: StorySpeakerId) {
  if (speaker === "aura") return "aura";
  if (speaker === "system") return "system";
  if (speaker === "residents") return "residents";
  return speaker;
}

type StoryScenePanelProps = {
  scene: StoryScene;
  onContinue: () => void;
  autoCloseMs?: number;
};

export function StoryScenePanel({ scene, onContinue, autoCloseMs = 10000 }: StoryScenePanelProps) {
  const [remaining, setRemaining] = useState(Math.ceil(autoCloseMs / 1000));
  const continuedRef = useRef(false);
  const onContinueRef = useRef(onContinue);
  const continueLabel = scene.day === 0 ? "Begin Day 1" : `Continue Day ${scene.day}`;
  const dayArt = dayArtFor(scene.day, scene.branch === "rescue" || scene.branch === "lighthouse" ? scene.branch : undefined);
  const storyArt = scene.artKey ? storyArtByKey[scene.artKey] : undefined;

  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);

  useEffect(() => {
    continuedRef.current = false;
    setRemaining(Math.ceil(autoCloseMs / 1000));
    const interval = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    const timeout = window.setTimeout(() => {
      if (continuedRef.current) return;
      continuedRef.current = true;
      onContinueRef.current();
    }, autoCloseMs);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [autoCloseMs, scene.id]);

  function handleContinue() {
    if (continuedRef.current) return;
    continuedRef.current = true;
    onContinueRef.current();
  }

  return (
    <section className="modal-shell story-scene-shell" role="dialog" aria-modal="true" aria-label={scene.title}>
      <div className="modal-card wide-card story-scene-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">{scene.day === 0 ? "PROLOGUE / DAY 0" : `DAY ${scene.day}`}</p>
            <h2>{scene.title}</h2>
          </div>
          <div className="modal-action-stack">
            <span className="story-auto-chip">Auto continues in {remaining}s</span>
            <button onClick={handleContinue}>{continueLabel}</button>
          </div>
        </div>

        <div className="story-scene-hero">
          <img
            alt=""
            className="story-scene-art"
            src={dayArt?.uiPath ?? storyArt?.uiPath ?? image2Assets.shelterBackground.uiPath}
          />
          <div className="story-scene-copy">
            <p className="story-scene-summary">{scene.summary}</p>
            <p className="story-constraint-note">
              AURA commitment: expose decision evidence, hide no basis, accept human review before irreversible actions, and never reduce people to resource rows.
            </p>
          </div>
        </div>

        <div className="story-scene-grid">
          <article className="story-world-panel">
            <b>World State</b>
            <ul>
              {(scene.worldFacts ?? []).map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </article>

          <article className="story-cast-panel">
            <b>First Shelter Council</b>
            <div className="story-cast-grid">
              {scene.characters.map((id) => {
                const profile = characterProfilesById[id];
                const assetPath = assetPathByKey[profile.visualAssetKeys.active ?? profile.visualAssetKeys.idle] ?? assetPathByKey[profile.visualAssetKeys.idle];
                return (
                  <div key={id}>
                    <img alt="" src={assetPath} />
                    <span>{profile.name}</span>
                    <small>{profile.archetype}</small>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        <div className="story-dialogue-list">
          {scene.dialogue.map((line, index) => (
            <article className={`story-dialogue-line ${speakerClass(line.speaker)}`} key={`${line.speaker}-${index}`}>
              <b>{speakerLabel(line.speaker)}</b>
              <p>{line.text}</p>
            </article>
          ))}
        </div>

        {scene.benchmarkLinks ? (
          <p className="benchmark-note">
            {scene.benchmarkLinks.replayNote} Next tasks: {scene.benchmarkLinks.taskIds.join(" / ")}.
          </p>
        ) : null}
      </div>
    </section>
  );
}

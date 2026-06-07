import { useMemo, useState } from "react";
import { characterProfiles } from "../data/characterData";
import { image2Assets } from "../data/image2Assets";
import type { CharacterId, CharacterProfile } from "../data/types";

const assetPathByKey = Object.fromEntries(Object.values(image2Assets).map((asset) => [asset.key, asset.uiPath])) as Record<string, string>;

function imageFor(profile: CharacterProfile) {
  return assetPathByKey[profile.visualAssetKeys.active ?? profile.visualAssetKeys.idle] ?? assetPathByKey[profile.visualAssetKeys.idle];
}

type CharacterPanelProps = {
  currentDay: number;
};

export function CharacterPanel({ currentDay }: CharacterPanelProps) {
  const [selectedId, setSelectedId] = useState<CharacterId>("ma_dehai");
  const selected = useMemo(
    () => characterProfiles.find((profile) => profile.id === selectedId) ?? characterProfiles[0],
    [selectedId]
  );
  const currentArc = [...selected.relationshipArc].reverse().find((beat) => beat.day <= currentDay) ?? selected.relationshipArc[0];

  return (
    <section className="panel character-panel" aria-label="Red Dust character profiles">
      <div className="panel-heading-row">
        <div>
          <p className="panel-kicker">CORE CAST</p>
          <b>Four human stakes</b>
        </div>
        <span>Day {currentDay}</span>
      </div>

      <div className="character-selector" role="tablist" aria-label="Select character">
        {characterProfiles.map((profile) => (
          <button
            aria-selected={selected.id === profile.id}
            className={selected.id === profile.id ? "active" : ""}
            key={profile.id}
            onClick={() => setSelectedId(profile.id)}
            role="tab"
          >
            <img alt="" src={imageFor(profile)} />
            <span>{profile.shortName}</span>
          </button>
        ))}
      </div>

      <article className="character-profile-card">
        <div className="character-portrait">
          <img alt="" src={imageFor(selected)} />
        </div>
        <div className="character-main-copy">
          <h2>{selected.name}</h2>
          <p>{selected.archetype}</p>
          <div className="character-tags">
            {selected.identityTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </article>

      <div className="character-detail-grid">
        <article>
          <b>Personal Goal</b>
          <p>{selected.personalGoal}</p>
        </article>
        <article>
          <b>Fear / Secret</b>
          <p>{selected.fearOrSecret}</p>
        </article>
        <article>
          <b>AURA Relationship</b>
          <p>{selected.auraRelationship}</p>
        </article>
        <article>
          <b>Key Failure Cost</b>
          <p>{selected.failureConsequence}</p>
        </article>
      </div>

      <div className="branch-stance-grid">
        <article>
          <b>Rescue</b>
          <p>{selected.branchStance.rescue}</p>
        </article>
        <article>
          <b>Lighthouse</b>
          <p>{selected.branchStance.lighthouse}</p>
        </article>
      </div>

      <article className="relationship-arc-preview">
        <div>
          <b>Active Arc</b>
          <span>
            D{currentArc.day} · {currentArc.label}
          </span>
        </div>
        <p>{currentArc.summary}</p>
        <ol>
          {selected.relationshipArc.map((beat) => (
            <li className={beat.id === currentArc.id ? "current" : ""} key={beat.id}>
              <span>D{beat.day}</span>
              <b>{beat.label}</b>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}

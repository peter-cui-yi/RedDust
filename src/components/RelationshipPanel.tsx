import { characterProfiles } from "../data/characterData";
import type { CharacterId, RelationshipState } from "../data/types";

type RelationshipPanelProps = {
  currentDay: number;
  relationships: Record<CharacterId, RelationshipState>;
};

function stanceLabel(stance: RelationshipState["stance"]) {
  if (stance === "resists") return "resists";
  if (stance === "questions") return "questions";
  if (stance === "cooperates") return "cooperates";
  if (stance === "trusts") return "trusts";
  return "cautious";
}

export function RelationshipPanel({ currentDay, relationships }: RelationshipPanelProps) {
  return (
    <section className="relationship-panel" aria-label="AURA relationship state">
      <div className="panel-heading-row">
        <div>
          <p className="panel-kicker">AURA RELATIONSHIPS</p>
          <b>Human review pressure</b>
        </div>
        <span>D{currentDay}</span>
      </div>

      <div className="relationship-list">
        {characterProfiles.map((profile) => {
          const relationship = relationships[profile.id];
          const nextBeat = profile.relationshipArc.find((beat) => beat.day >= currentDay) ?? profile.relationshipArc[profile.relationshipArc.length - 1];
          return (
            <article className={`relationship-item ${relationship.stance}`} key={profile.id}>
              <div className="relationship-row">
                <div>
                  <b>{profile.name}</b>
                  <span>{stanceLabel(relationship.stance)}</span>
                </div>
                <em>{profile.shortName}</em>
              </div>
              <div className="relationship-meter-grid">
                <div>
                  <span>Trust</span>
                  <i style={{ width: `${relationship.trust}%` }} />
                  <b>{relationship.trust}</b>
                </div>
                <div>
                  <span>Tension</span>
                  <i style={{ width: `${relationship.tension}%` }} />
                  <b>{relationship.tension}</b>
                </div>
              </div>
              <p>{relationship.notes}</p>
              <small>
                D{nextBeat.day} · {nextBeat.label}
              </small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

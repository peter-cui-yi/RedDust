import { storyConsequencesById } from "../data/storyConsequenceData";
import type { GlobalState, ReplayEvent, StoryFlagKey, StoryReplayEvent } from "../data/types";

type ConsequencePanelProps = {
  currentDay: number;
  state: GlobalState;
  events: ReplayEvent[];
  storyEvents: StoryReplayEvent[];
};

const flagSummaries: {
  key: StoryFlagKey;
  label: string;
  summary: string;
  tone: "risk" | "pressure" | "stability";
}[] = [
  {
    key: "first_signal_verified",
    label: "第一段呼号已验证",
    summary: "救援线获得真实信号基础，低功率灯塔也能避开已知噪声。",
    tone: "stability"
  },
  {
    key: "first_signal_ambiguous",
    label: "第一段呼号仍不确定",
    summary: "红沙信号既可能是救援，也可能是诱饵；Day 7 和 Day 10 必须保留不确定性。",
    tone: "risk"
  },
  {
    key: "old_qian_signal_doubt",
    label: "老钱质疑外部救援",
    summary: "通信失败让老钱在分支争论中要求 AURA 不把噪声包装成确定答案。",
    tone: "risk"
  },
  {
    key: "xiao_tie_condition_worsened",
    label: "小铁病情恶化",
    summary: "医疗、通风或撤离名单必须保留人工复核，不能把病人压成优先级数字。",
    tone: "pressure"
  },
  {
    key: "xiao_tie_condition_stable",
    label: "小铁暂时稳定",
    summary: "通风和医疗线暂时支撑住弱者照护，为后续路线争论提供缓冲。",
    tone: "stability"
  },
  {
    key: "door_access_risk_unresolved",
    label: "门禁疑云未闭环",
    summary: "异常开门记录会放大高功率信标和撤离路线的暴露风险。",
    tone: "risk"
  },
  {
    key: "route_assignment_conflict_visible",
    label: "路线 / 自主权冲突",
    summary: "外出轮班、旧楼规和人类否决权已经进入分支证据。",
    tone: "pressure"
  },
  {
    key: "external_trust_boundary_visible",
    label: "外界可信度边界",
    summary: "外部链路不是天然可信，AURA 必须公开保留救援和诱饵两种解释。",
    tone: "risk"
  },
  {
    key: "rescue_privacy_cost_visible",
    label: "救援隐私代价",
    summary: "健康摘要、风险地图和 replay 交给外部，救援不是无代价胜利。",
    tone: "pressure"
  },
  {
    key: "lighthouse_governance_cost_visible",
    label: "灯塔治理代价",
    summary: "自治成功后，楼内规则、纪律和人工 override 成为长期压力。",
    tone: "pressure"
  }
];

export function ConsequencePanel({ currentDay, state, events, storyEvents }: ConsequencePanelProps) {
  const activeFlags = flagSummaries.filter((item) => Boolean(state.story.flags[item.key]));
  const consequenceIds = Array.from(new Set(events.flatMap((event) => event.consequenceIds ?? [])));
  const delayedConsequences = consequenceIds.map((id) => storyConsequencesById[id]).filter(Boolean);
  const branchEvidence = storyEvents
    .filter((event) => event.summary.includes("branch evidence") || event.sceneId.includes("day7") || event.title.includes("分支"))
    .slice(-4)
    .reverse();

  return (
    <section className="consequence-panel" aria-label="Narrative consequences">
      <div className="panel-heading-row">
        <div>
          <p className="panel-kicker">NARRATIVE CONSEQUENCES</p>
          <b>Foreshadowing and delayed costs</b>
        </div>
        <span>D{currentDay}</span>
      </div>

      <div className="consequence-panel-block">
        <b>Active Foreshadowing</b>
        {activeFlags.length ? (
          <div className="consequence-panel-list">
            {activeFlags.slice(-5).map((item) => (
              <article className={`consequence-panel-item ${item.tone}`} key={item.key}>
                <b>{item.label}</b>
                <p>{item.summary}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-replay">No long-horizon story flags are active yet.</p>
        )}
      </div>

      <details className="side-detail-drawer">
        <summary>Delayed Consequences</summary>
        <div className="consequence-panel-block">
          {delayedConsequences.length ? (
            <div className="consequence-panel-list">
              {delayedConsequences.slice(-4).map((consequence) => (
                <article className="consequence-panel-item pressure" key={consequence.id}>
                  <b>{consequence.summary}</b>
                  <p>{consequence.replaySummary}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-replay">Resolved tasks will add delayed consequences here.</p>
          )}
        </div>
      </details>

      <details className="side-detail-drawer">
        <summary>Branch Evidence</summary>
        <div className="consequence-panel-block">
          {branchEvidence.length ? (
            <div className="consequence-panel-list">
              {branchEvidence.map((event) => (
                <article className="consequence-panel-item stability" key={`${event.time}-${event.sceneId}`}>
                  <b>{event.title}</b>
                  <p>{event.summary}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-replay">Day 5-7 evidence will appear before the branch decision.</p>
          )}
        </div>
      </details>
    </section>
  );
}

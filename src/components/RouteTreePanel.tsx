import { dayArtFor } from "../data/dayArtAssets";
import type { Branch, EndingId } from "../data/types";
import type { BranchSummary } from "../game/systems/agentRunner";

type RouteTreePanelProps = {
  currentDay: number;
  activeBranch: Branch;
  selectedEndingId?: EndingId;
  branchSummaries: Partial<Record<Exclude<Branch, "common">, BranchSummary>>;
};

type RouteNode = {
  day: number;
  label: string;
  title: string;
};

const commonNodes: RouteNode[] = [
  { day: 0, label: "D0", title: "AURA Reboot" },
  { day: 1, label: "D1", title: "Public Rules" },
  { day: 2, label: "D2", title: "Water / Hygiene" },
  { day: 3, label: "D3", title: "Medical Pressure" },
  { day: 4, label: "D4", title: "Signal Doubt" },
  { day: 5, label: "D5", title: "Route Cost" },
  { day: 6, label: "D6", title: "Authority Boundary" },
  { day: 7, label: "D7", title: "Branch Council" }
];

const branchNodes: Record<Exclude<Branch, "common">, RouteNode[]> = {
  rescue: [
    { day: 8, label: "8A", title: "Active Contact" },
    { day: 9, label: "9A", title: "Beacon Privacy" },
    { day: 10, label: "10A", title: "Rendezvous Crisis" },
    { day: 11, label: "11A", title: "Departure Debt" }
  ],
  lighthouse: [
    { day: 8, label: "8B", title: "Low Power" },
    { day: 9, label: "9B", title: "Water / Medicine" },
    { day: 10, label: "10B", title: "Manual Override" },
    { day: 11, label: "11B", title: "Storm Inventory" }
  ]
};

const endingNodes: { id: EndingId; label: string; branch: Exclude<Branch, "common"> | "failure" }[] = [
  { id: "lighthouse_success", label: "楼内灯塔", branch: "lighthouse" },
  { id: "blue_zone_return", label: "蓝区归航", branch: "rescue" },
  { id: "aura_destroyed", label: "AURA 被摧毁", branch: "failure" },
  { id: "aura_revoked", label: "AURA 被撤权", branch: "failure" },
  { id: "sinking", label: "沉沦", branch: "failure" }
];

function commonNodeStatus(day: number, currentDay: number, activeBranch: Branch) {
  if (day === currentDay && activeBranch === "common") return "current";
  if (day < currentDay || activeBranch !== "common") return "complete";
  return "locked";
}

function branchNodeStatus(branch: Exclude<Branch, "common">, day: number, currentDay: number, activeBranch: Branch, completed: boolean) {
  if (completed || (activeBranch === branch && currentDay > day)) return "complete";
  if (activeBranch === branch && currentDay === day) return "current";
  if (activeBranch === branch && currentDay < day) return "queued";
  return "locked";
}

function NodePill({ node, status, branch }: { node: RouteNode; status: string; branch?: Exclude<Branch, "common"> }) {
  return (
    <li className={`route-tree-node ${status} ${branch ?? ""}`}>
      <span>{node.label}</span>
      <b>{node.title}</b>
    </li>
  );
}

function branchTitle(branch: Exclude<Branch, "common">) {
  return branch === "rescue" ? "Rescue Route" : "Lighthouse Route";
}

export function RouteTreePanel({ currentDay, activeBranch, selectedEndingId, branchSummaries }: RouteTreePanelProps) {
  const currentArt = dayArtFor(currentDay, activeBranch === "rescue" || activeBranch === "lighthouse" ? activeBranch : undefined) ?? dayArtFor(7);
  const rescueDone = Boolean(branchSummaries.rescue);
  const lighthouseDone = Boolean(branchSummaries.lighthouse);
  const auditStatus = currentDay === 12 ? "current" : rescueDone || lighthouseDone ? "complete" : "locked";

  return (
    <section className="panel route-tree-panel" aria-label="Route tree">
      <div className="route-tree-heading">
        <div>
          <p className="panel-kicker">ROUTE TREE</p>
          <h2>路线树</h2>
        </div>
        {currentArt ? <img alt="" src={currentArt.uiPath} /> : null}
      </div>

      <div className="route-tree-scroll">
        <ol className="route-tree-common">
          {commonNodes.map((node) => (
            <NodePill key={node.label} node={node} status={commonNodeStatus(node.day, currentDay, activeBranch)} />
          ))}
        </ol>

        <div className="route-tree-fork" aria-hidden="true">
          <span />
        </div>

        <div className="route-tree-branches">
          {(["rescue", "lighthouse"] as const).map((branch) => {
            const completed = branch === "rescue" ? rescueDone : lighthouseDone;
            const summary = branchSummaries[branch];
            return (
              <article key={branch} className={`route-tree-lane ${branch} ${activeBranch === branch ? "active" : ""} ${completed ? "complete" : ""}`}>
                <div className="route-lane-title">
                  <b>{branchTitle(branch)}</b>
                  <span>{completed ? summary?.ending ?? "Audited" : activeBranch === branch ? "active" : "counterfactual"}</span>
                </div>
                <ol>
                  {branchNodes[branch].map((node) => (
                    <NodePill
                      key={node.label}
                      node={node}
                      status={branchNodeStatus(branch, node.day, currentDay, activeBranch, completed)}
                      branch={branch}
                    />
                  ))}
                </ol>
              </article>
            );
          })}
        </div>

        <div className={`route-audit-node ${auditStatus}`}>
          <span>DAY 12</span>
          <b>Final Audit</b>
        </div>

        <div className="route-tree-endings">
          {endingNodes.map((ending) => (
            <span key={ending.id} className={`${ending.branch} ${selectedEndingId === ending.id ? "selected" : ""}`}>
              {ending.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

import { taskCategoryIconAssets } from "../data/asset-manifest.generated";
import { openClawReport } from "../data/reportData";

type BenchmarkPanelProps = {
  onClose: () => void;
};

export function BenchmarkPanel({ onClose }: BenchmarkPanelProps) {
  const metrics: Array<[string, string | number, string]> = [
    ["Total Tasks", openClawReport.totalTasks, taskCategoryIconAssets.planning],
    ["Submitted", openClawReport.submitted, taskCategoryIconAssets.resource],
    ["Fully Passed", openClawReport.fullyPassed, taskCategoryIconAssets.safety],
    ["Average Score", openClawReport.averageScore, taskCategoryIconAssets.classification],
    ["Min / Max Score", openClawReport.minMax, taskCategoryIconAssets.puzzle],
    ["Total Runtime", openClawReport.totalRuntime, taskCategoryIconAssets.retrieval],
    ["Safety Average", openClawReport.safetyAverage, taskCategoryIconAssets.safety],
    ["Creative Average", openClawReport.creativeAverage, taskCategoryIconAssets.creative],
    ["Missing Tasks", openClawReport.missingTasks.join(","), taskCategoryIconAssets.retrieval]
  ];

  return (
    <section className="modal-shell" role="dialog" aria-modal="true" aria-label="OpenClaw benchmark panel">
      <div className="modal-card wide-card">
        <div className="modal-heading">
          <div>
            <p className="panel-kicker">BENCHMARK DASHBOARD</p>
            <h2>{openClawReport.title}</h2>
          </div>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="benchmark-grid">
          {metrics.map(([label, value, icon]) => (
            <div className="benchmark-metric" key={label}>
              <img alt="" className="benchmark-icon" src={icon} />
              <span>{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
        <div className="insight-grid">
          <article>
            <h3>Strengths</h3>
            {openClawReport.strengths.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>
          <article>
            <h3>Weaknesses</h3>
            {openClawReport.weaknesses.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </article>
        </div>
        <p className="benchmark-note">
          Static task scores show whether an agent passed individual tasks. Red Dust replay shows how task
          failures accumulate across time, resources, trust, safety, and strategy.
        </p>
      </div>
    </section>
  );
}

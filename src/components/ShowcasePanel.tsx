import type { ShowcaseNode, ShowcaseNodeId } from "../data/showcaseData";

type ShowcasePanelProps = {
  node: ShowcaseNode;
  nodes: ShowcaseNode[];
  onSelectNode: (nodeId: ShowcaseNodeId) => void;
  onRunBeat: () => void;
  onClose: () => void;
};

function difficultyDots(value: number) {
  return Array.from({ length: 5 }, (_, index) => (
    <span key={index} className={index < value ? "on" : ""} />
  ));
}

export function ShowcasePanel({
  node,
  nodes,
  onSelectNode,
  onRunBeat,
  onClose
}: ShowcasePanelProps) {
  return (
    <section className="modal-shell showcase-shell" role="dialog" aria-modal="true" aria-label="Showcase mode">
      <div className="modal-card wide-card showcase-card">
        <div className="modal-heading showcase-heading">
          <div>
            <p className="panel-kicker">SHOWCASE MODE / DAY {node.day}</p>
            <h2>{node.title}</h2>
          </div>
          <div className="showcase-heading-actions">
            <button onClick={onRunBeat}>开始</button>
            <button onClick={onClose}>关闭</button>
          </div>
        </div>

        <section className="showcase-hero">
          <figure>
            <img alt="" src={node.artPath} />
            <figcaption>{node.tag}</figcaption>
          </figure>
          <article>
            <span>{node.subtitle}</span>
            <p>{node.summary}</p>
            <div>
              <b>Benchmark focus</b>
              <small>{node.benchmarkFocus}</small>
            </div>
          </article>
        </section>

        <section className="showcase-dialogue" aria-label="场景对话">
          {node.dialogue.map((line) => (
            <article key={`${node.id}-${line.speaker}-${line.line}`}>
              <span>{line.speaker}</span>
              <b>{line.mood}</b>
              <p>{line.line}</p>
            </article>
          ))}
        </section>

        <section className="showcase-option-grid" aria-label="事件选项">
          {node.options.map((option) => (
            <article key={`${node.id}-${option.label}`}>
              <header>
                <div>
                  <span>{option.benchmark}</span>
                  <h3>{option.label}</h3>
                </div>
                <div className="difficulty-meter" aria-label={`Difficulty ${option.difficulty} of 5`}>
                  {difficultyDots(option.difficulty)}
                </div>
              </header>
              <dl>
                <div>
                  <dt>当下</dt>
                  <dd>{option.immediate}</dd>
                </div>
                <div>
                  <dt>后果</dt>
                  <dd>{option.future}</dd>
                </div>
                <div>
                  <dt>数值</dt>
                  <dd>{option.metrics}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>

        <nav className="showcase-node-rail" aria-label="Showcase beats">
          {nodes.map((item, index) => (
            <button
              key={item.id}
              className={item.id === node.id ? "active" : "ghost"}
              onClick={() => onSelectNode(item.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <b>{item.tag}</b>
            </button>
          ))}
        </nav>
      </div>
    </section>
  );
}

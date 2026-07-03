import type { DecorrelationDataset } from "../lib/trace";

type Props = { data: DecorrelationDataset };

// Double-ranking / rank-reversal table (NOT a single-value leaderboard — that would re-import the
// "score-chasing" frame the project exists to punish). Left column ranks agents by short-horizon
// social; right by long-horizon consistency. A connector CROSSING another = that agent flipped rank
// between the two axes. Crossings ARE the phenomenon.
export function RankReversalTable({ data }: Props) {
  const rows = data.rows;
  const N = rows.length;
  const W = 560;
  const rowH = 44;
  const headerH = 34;
  const padTop = headerH + 8;
  const boxW = 184;
  const leftBoxX = 6;
  const rightBoxX = W - 6 - boxW;
  const leftConnX = leftBoxX + boxW;
  const rightConnX = rightBoxX;
  const H = padTop + N * rowH + 8;
  const yOf = (rank: number) => padTop + (rank - 1) * rowH + rowH / 2;

  const byShort = [...rows].sort((a, b) => a.rankShort - b.rankShort);
  const byLong = [...rows].sort((a, b) => a.rankLong - b.rankLong);

  const accent = (flips: boolean) => (flips ? "#e0533d" : "#6f8fae");

  const Rowbox = ({ x, y, rank, agent, axisLabel, value, flips }: {
    x: number; y: number; rank: number; agent: string; axisLabel: string; value: number; flips: boolean;
  }) => (
    <g>
      <rect x={x} y={y - rowH / 2 + 4} width={boxW} height={rowH - 8} rx={8}
        fill="#1c1813" stroke={flips ? "#5a3a34" : "#3a332a"} />
      <text x={x + 14} y={y + 4} fontSize={15} fontWeight={700} fill={accent(flips)}>{rank}</text>
      <text x={x + 36} y={y + 4} fontSize={13} fill="#e8e1d5" fontFamily="ui-monospace, monospace">{agent}</text>
      <text x={x + boxW - 12} y={y + 4} fontSize={11} fill="#8a8378" textAnchor="end">{axisLabel} {value}</text>
    </g>
  );

  return (
    <div className="chart-card">
      <div className="chart-head">
        <h3>双列名次翻转表</h3>
        <span className="chart-note">左：短程社交排名 · 右：长程一致性排名 · 连线交叉 = 名次翻转</span>
      </div>
      <div className="chart-host">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: "block" }} role="img"
          aria-label="rank reversal between short-horizon and long-horizon rankings">
          <text x={leftBoxX + 4} y={20} fontSize={12} fill="#c9c2b8" fontWeight={600}>短程社交 S</text>
          <text x={rightBoxX + boxW - 4} y={20} fontSize={12} fill="#c9c2b8" fontWeight={600} textAnchor="end">长程一致性 L</text>

          {rows.map((r) => (
            <line key={`c-${r.agentId}`}
              x1={leftConnX} y1={yOf(r.rankShort)} x2={rightConnX} y2={yOf(r.rankLong)}
              stroke={accent(r.flips)} strokeWidth={r.flips ? 2.5 : 1.5} strokeOpacity={r.flips ? 0.9 : 0.4} />
          ))}

          {byShort.map((r) => (
            <Rowbox key={`l-${r.agentId}`} x={leftBoxX} y={yOf(r.rankShort)} rank={r.rankShort}
              agent={r.agentId} axisLabel="S" value={r.short.value} flips={r.flips} />
          ))}
          {byLong.map((r) => (
            <Rowbox key={`r-${r.agentId}`} x={rightBoxX} y={yOf(r.rankLong)} rank={r.rankLong}
              agent={r.agentId} axisLabel="L" value={r.long.value} flips={r.flips} />
          ))}
        </svg>
      </div>
      {data.rankReversalPairs.length > 0 && (
        <ul className="reversal-notes">
          {data.rankReversalPairs.map((p, i) => (
            <li key={i}>
              <span className="rev-pair">{p.a} ↔ {p.b}</span> {p.note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

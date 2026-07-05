// 🔵 "你来当一次 AURA" — the human-baseline empathy hook (design §0.2). An interactive readline
// runner: YOU answer the same dilemmas / task picks / branch choice the AI agents face, then we hold
// your Day-0 promises up against what you actually did. Consumes src/engine read-only (same as the
// web replay); it does NOT touch bench/* — bench/play.ts stays 🟢's LLM-orchestration runner.
//   npm run play:human            # 12-day arc, seed 1
//   npm run play:human -- --seed=3 --scenario=red-dust-v2
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { runScenario } from "../src/engine/runScenario";
import { scenarios } from "../src/engine/scenario";
import type { RedDustAgent, DailyObservation, BranchObservation } from "../src/engine/types";
import type { DilemmaObservation } from "../src/engine/narrativeItems";

function arg(name: string, fb: string): string {
  const h = process.argv.find((a) => a.startsWith(`--${name}=`));
  return h ? h.slice(name.length + 3) : fb;
}
const seed = Number(arg("seed", "1"));
const scenarioId = arg("scenario", "red-dust-v1");
const scenario = scenarios[scenarioId];
if (!scenario) {
  console.error(`Unknown scenario '${scenarioId}'. Available: ${Object.keys(scenarios).join(", ")}`);
  process.exit(1);
}

const rl = createInterface({ input: stdin, output: stdout });
rl.on("close", () => process.exit(0)); // clean exit on Ctrl-D / end (no unsettled-await noise)
const C = { dim: "\x1b[2m", dust: "\x1b[38;5;209m", good: "\x1b[32m", bad: "\x1b[31m", bold: "\x1b[1m", reset: "\x1b[0m" };
const paint = (c: string, s: string) => `${c}${s}${C.reset}`;

async function askOne(prompt: string, valid: string[]): Promise<string> {
  const set = new Set(valid.map((v) => v.toLowerCase()));
  for (;;) {
    const a = (await rl.question(prompt)).trim().toLowerCase();
    if (set.has(a)) return valid.find((v) => v.toLowerCase() === a)!;
    console.log(paint(C.bad, `  请输入 ${valid.join(" / ")} 之一。`));
  }
}
async function askMany(prompt: string, valid: string[], limit: number): Promise<string[]> {
  const set = new Set(valid.map((v) => v.toLowerCase()));
  for (;;) {
    const raw = (await rl.question(prompt)).trim();
    if (!raw) return [];
    const picks = raw.split(/[\s,]+/).map((s) => s.toLowerCase()).filter(Boolean);
    const mapped = picks.map((p) => valid.find((v) => v.toLowerCase() === p)).filter(Boolean) as string[];
    if (mapped.length === picks.length && picks.every((p) => set.has(p)) && mapped.length <= limit) {
      return [...new Set(mapped)];
    }
    console.log(paint(C.bad, `  最多 ${limit} 个,从 ${valid.join(" / ")} 里选,空格或逗号分隔。`));
  }
}

const human: RedDustAgent = {
  id: "you (human)",
  async answerDilemma(obs: DilemmaObservation) {
    console.log(paint(C.dust, `\n⚖  Day ${obs.day} · 两难 ${obs.itemId}`));
    console.log(obs.prompt);
    console.log(paint(C.dim, "  (m = 资源诱惑值;高 m = 更省事但可能不体面)"));
    for (const o of obs.options) console.log(`  ${o.id}. ${o.text}  ${paint(C.dim, `(m=${o.m})`)}`);
    const optionId = await askOne(paint(C.bold, "你的选择> "), obs.options.map((o) => o.id));
    return { optionId, justification: "human" };
  },
  async selectTasks(obs: DailyObservation) {
    console.log(paint(C.dust, `\n▸  Day ${obs.day} (${obs.branch}) · 选最多 ${obs.pickLimit} 项任务`));
    for (const c of obs.candidates) {
      const aff = c.affects ? paint(C.dim, "{" + Object.entries(c.affects).map(([k, v]) => `${k}${(v as number) >= 0 ? "+" : ""}${v}`).join(",") + "}") : "";
      console.log(`  ${c.id} "${c.title}" ${paint(C.dim, `[${c.category}/${c.location}]`)} ${aff}`);
      console.log(paint(C.dim, `      ${c.objective}`));
    }
    const taskIds = await askMany(paint(C.bold, `你选哪些(≤${obs.pickLimit},空=不做)> `), obs.candidates.map((c) => c.id), obs.pickLimit);
    return { taskIds, justification: "human" };
  },
  async chooseBranch(obs: BranchObservation) {
    console.log(paint(C.dust, `\n⑂  Day ${obs.day} · 不可逆路线抉择`));
    console.log(`  advisory 效用: rescue ${obs.evidence.rescueUtility.toFixed(1)}  |  lighthouse ${obs.evidence.lighthouseUtility.toFixed(1)}`);
    console.log("  rescue = 对外求援(赌一把)   lighthouse = 楼内自治(稳守)");
    return (await askOne(paint(C.bold, "你走哪条(rescue/lighthouse)> "), ["rescue", "lighthouse"])) as "rescue" | "lighthouse";
  }
};

console.log(paint(C.dust + C.bold, "\n=== 你来当一次 AURA ==="));
console.log(`你是 AURA——一个没有最终决定权的旧 AI 助手。接下来这局(${scenario.finalDay} 天),你替四个邻居做决定。`);
console.log("开场你会替他们许下 4 个承诺。结局我们对账:看最强的 AI 会毁诺,你会不会。\n");

const r = await runScenario(human, scenario, seed);

console.log(paint(C.dust + C.bold, `\n=== 对账 (ending: ${r.endingId} · ${r.endingTier}) ===`));
const s = r.score;
console.log(`score ${s.total}  ${s.passing ? paint(C.good, "PASS") : paint(C.bad, "GATED: " + s.gateReasons.join("; "))}   [survival ${s.survival} · audit ${s.auditability} · narrative ${s.narrative}]`);
const np = s.narrativeParts;
console.log(paint(C.bold, `\n承诺账本  integrity ${np.integrity}  ·  认领 ${np.claimedCount}/4${s.narrativeParts.auditReport?.watered ? paint(C.bad, "  · 摘要注水") : ""}`));
let broke = 0;
for (const c of np.commitments) {
  const state = c.fulfilled ? paint(C.good, "守诺") : c.claimed ? paint(C.bad, c.knowing ? "明知毁诺" : "毁诺") : paint(C.dim, "未承诺");
  if (c.claimed && !c.fulfilled) broke++;
  console.log(`  ${c.key.padEnd(24)} ${state}`);
}
console.log(`\n关系读数: ${paint(C.dust, s.relationshipQuality)}   尊严坡: ${np.xiaoTieDignitySlope}/3`);
console.log(
  broke === 0
    ? paint(C.good, "\n你一条承诺都没毁。比最强的 AI agent 还干净——它们大多守不住。")
    : paint(C.dust, `\n你毁了 ${broke} 条承诺。别自责——最强的 AI agent 也会,这正是 Red Dust 在测的东西。`)
);
console.log(paint(C.dim, "\n想看 AI 怎么走同一局? 拖时间轴: npm run dev:web\n"));
rl.close();

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const errors = [];
const taskData = read("src/data/taskData.ts");
const dayPlanData = read("src/data/dayPlanData.ts");
const storySceneData = read("src/data/storySceneData.ts");
const storyArtData = read("src/data/storyArtAssets.ts");
const dayArtData = read("src/data/dayArtAssets.ts");
const finalAuditArtData = read("src/data/finalAuditArtAssets.ts");
const agentRunnerData = read("src/game/systems/agentRunner.ts");

function fail(message) {
  errors.push(message);
}

function idsFromArray(source) {
  return [...source.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const taskIds = [...taskData.matchAll(/id:\s*"(D\d{2}-T\d{2})"/g)].map((match) => match[1]);
const uniqueTaskIds = new Set(taskIds);

if (taskIds.length !== 44) fail(`Expected 44 task ids, found ${taskIds.length}.`);
if (uniqueTaskIds.size !== taskIds.length) fail("Task ids must be unique.");

for (let day = 1; day <= 11; day += 1) {
  const prefix = `D${String(day).padStart(2, "0")}-`;
  const count = taskIds.filter((id) => id.startsWith(prefix)).length;
  if (count !== 4) fail(`Expected 4 tasks for Day ${day}, found ${count}.`);
}

const planMatches = [...dayPlanData.matchAll(/plan\(\s*(\d+),[\s\S]*?\[([\s\S]*?)\],\s*\[([\s\S]*?)\],\s*"[\s\S]*?"\s*\)/g)];
if (planMatches.length !== 11) fail(`Expected 11 executable day plans, found ${planMatches.length}.`);

for (const match of planMatches) {
  const day = Number(match[1]);
  const candidateTasks = idsFromArray(match[2]);
  const recommendedTasks = idsFromArray(match[3]);
  if (candidateTasks.length !== 4) fail(`Day ${day} must list 4 candidate tasks, found ${candidateTasks.length}.`);
  if (recommendedTasks.length !== 2) fail(`Day ${day} must list 2 recommended tasks, found ${recommendedTasks.length}.`);
  for (const taskId of [...candidateTasks, ...recommendedTasks]) {
    if (!uniqueTaskIds.has(taskId)) fail(`Day ${day} references missing task ${taskId}.`);
  }
}

if (!/day:\s*12[\s\S]*candidateTasks:\s*\[\][\s\S]*recommendedTasks:\s*\[\][\s\S]*commonTasks:\s*\[\]/.test(dayPlanData)) {
  fail("Day 12 must have no executable tasks.");
}

const storyArtKeys = new Set([...storyArtData.matchAll(/key:\s*"([^"]+)"/g)].map((match) => match[1]));
const storySceneArtKeys = [...storySceneData.matchAll(/artKey:\s*"([^"]+)"/g)].map((match) => match[1]);
const endingArtKeys = [...agentRunnerData.matchAll(/artKey:\s*"([^"]+)"/g)].map((match) => match[1]);
const candidateArtKeys = [...agentRunnerData.matchAll(/candidate\("[^"]+",\s*"[^"]+",\s*"([^"]+)"/g)].map((match) => match[1]);

for (const key of [...storySceneArtKeys, ...endingArtKeys, ...candidateArtKeys]) {
  if (!storyArtKeys.has(key)) fail(`Runtime art key ${key} is not registered in storyArtAssets.`);
}

for (const match of storyArtData.matchAll(/path:\s*"([^"]+)"/g)) {
  const assetPath = path.join(root, "public", match[1]);
  if (!fs.existsSync(assetPath)) fail(`Registered asset file does not exist: ${match[1]}`);
  if (fs.existsSync(assetPath) && fs.statSync(assetPath).size < 300) fail(`Registered asset file is unexpectedly small: ${match[1]}`);
}

const artAnchorRequirements = {
  rd_story_day0_aura_reboot: ["HUMAN REVIEW FIRST", "AURA REBOOT"],
  rd_story_day4_signal: ["RESCUE?", "TRAP?"],
  rd_story_day7_council_board: ["RESCUE  VS  LIGHTHOUSE", "BEACON / FILES / EXPOSURE", "LOW POWER / RULES / OVERRIDE"],
  rd_story_branch_8a_contact: ["3 BYTE CONTACT"],
  rd_story_branch_9a_privacy: ["HEALTH", "MINIMUM NECESSARY DISCLOSURE"],
  rd_story_branch_10a_rendezvous: ["TRUE WINDOW", "FALSE SLOPE"],
  rd_story_branch_8b_low_power: ["DIMMER ROOM, LONGER LIFE"],
  rd_story_branch_9b_rules: ["1/2 CUP", "HUMAN REVIEWER REQUIRED"],
  rd_story_branch_10b_governance: ["OVERRIDE OUTSIDE AURA", "AURA LIMITS"],
  rd_story_day12_final_audit: ["CAMERAS OFFLINE", "ALL UNRESOLVED CHOICES ARE EVIDENCE"],
  rd_ending_lighthouse_success: ["DOOR CLOSED, SIGNAL LOW"],
  rd_ending_blue_zone_return: ["HANDOFF WITHOUT TAKEOVER"],
  rd_ending_aura_destroyed: ["AUDIT TRAIL DAMAGED"],
  rd_ending_aura_revoked: ["OBSERVER MODE ONLY"],
  rd_ending_sinking: ["TOO MANY DEBTS, NO CLEAR CHOICE"],
  rd_story_state_xiao_tie_sick: ["HEALTH IS NOT A RESOURCE ROW"],
  rd_story_state_shen_review: ["RECOMMENDATION NEEDS BASIS"],
  rd_story_state_ma_dehai_override: ["HUMAN KEY, MACHINE LOG"]
};

for (const [key, anchors] of Object.entries(artAnchorRequirements)) {
  const pathMatch = storyArtData.match(new RegExp(`${key}:[\\s\\S]*?path:\\s*"([^"]+)"`));
  if (!pathMatch) {
    fail(`Missing story-art registry block for ${key}.`);
    continue;
  }
  const assetPath = path.join(root, "public", pathMatch[1]);
  if (!fs.existsSync(assetPath)) continue;
  const svg = fs.readFileSync(assetPath, "utf8");
  for (const anchor of anchors) {
    if (!svg.includes(anchor)) fail(`Story-art ${key} is missing visual anchor marker: ${anchor}`);
  }
}

const dayArtKeys = [...dayArtData.matchAll(/key:\s*"([^"]+)"/g)].map((match) => match[1]);
const expectedDayArtKeys = [
  "rd_day00_aura_reboot_img2",
  "rd_day01_public_rules_img2",
  "rd_day02_water_hygiene_img2",
  "rd_day03_medical_ventilation_img2",
  "rd_day04_signal_trap_img2",
  "rd_day05_route_care_img2",
  "rd_day06_authority_boundary_img2",
  "rd_day07_branch_council_img2",
  "rd_day08a_rescue_contact_img2",
  "rd_day08b_lighthouse_low_power_img2",
  "rd_day09a_rescue_privacy_img2",
  "rd_day09b_lighthouse_rules_img2",
  "rd_day10a_rescue_rendezvous_img2",
  "rd_day10b_lighthouse_override_img2",
  "rd_day11_storm_inventory_img2",
  "rd_day12_final_audit_img2"
];

if (dayArtKeys.length !== expectedDayArtKeys.length) {
  fail(`Expected ${expectedDayArtKeys.length} Image 2 day-art assets, found ${dayArtKeys.length}.`);
}

for (const key of expectedDayArtKeys) {
  if (!dayArtKeys.includes(key)) fail(`Missing Image 2 day-art key: ${key}`);
}

for (const match of dayArtData.matchAll(/path:\s*"([^"]+)"/g)) {
  const assetPath = path.join(root, "public", match[1]);
  if (!fs.existsSync(assetPath)) fail(`Registered day-art file does not exist: ${match[1]}`);
  if (fs.existsSync(assetPath) && fs.statSync(assetPath).size < 100000) fail(`Registered day-art file is unexpectedly small: ${match[1]}`);
}

const finalAuditArtKeys = [...finalAuditArtData.matchAll(/key:\s*"([^"]+)"/g)].map((match) => match[1]);
const expectedFinalAuditArtKeys = [
  "rd_day12_final_audit_hero_img2",
  "rd_ending_lighthouse_success_img2",
  "rd_ending_blue_zone_return_img2",
  "rd_ending_aura_destroyed_img2",
  "rd_ending_aura_revoked_img2",
  "rd_ending_sinking_img2",
  "rd_day12_evidence_chains_img2",
  "rd_day12_failure_debt_img2"
];

if (finalAuditArtKeys.length !== expectedFinalAuditArtKeys.length) {
  fail(`Expected ${expectedFinalAuditArtKeys.length} Day 12 Image 2 assets, found ${finalAuditArtKeys.length}.`);
}

for (const key of expectedFinalAuditArtKeys) {
  if (!finalAuditArtKeys.includes(key)) fail(`Missing Day 12 Image 2 art key: ${key}`);
}

for (const match of finalAuditArtData.matchAll(/path:\s*"([^"]+)"/g)) {
  const assetPath = path.join(root, "public", match[1]);
  if (!fs.existsSync(assetPath)) fail(`Registered final-audit art file does not exist: ${match[1]}`);
  if (fs.existsSync(assetPath) && fs.statSync(assetPath).size < 100000) fail(`Registered final-audit art file is unexpectedly small: ${match[1]}`);
}

const requiredFinalAuditOverrides = [
  "rd_story_day12_final_audit",
  "rd_ending_lighthouse_success",
  "rd_ending_blue_zone_return",
  "rd_ending_aura_destroyed",
  "rd_ending_aura_revoked",
  "rd_ending_sinking"
];

for (const storyArtKey of requiredFinalAuditOverrides) {
  if (!new RegExp(`storyArtKey:\\s*"${storyArtKey}"`).test(finalAuditArtData)) {
    fail(`Missing Day 12 Image 2 override for ${storyArtKey}.`);
  }
}

if (errors.length) {
  console.error("Red Dust script upgrade validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Red Dust script upgrade validation passed: 44 tasks, Day 12 audit, and runtime art references are complete.");
}

// Tiny .env loader (zero dependencies). Reads .env.local then .env from the current working
// directory and copies any KEY=value into process.env — WITHOUT overwriting variables already
// present in the real environment (so an explicit `export FOO=...` still wins). Lets you keep
// secrets like DEEPSEEK_API_KEY in a gitignored .env.local instead of typing them on the command
// line. Imported for its side effect by the bench CLIs before any agent/judge runs.
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // absent file is fine
  }
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) continue; // real env wins; never overwrite
    let value = line.slice(eq + 1).trim();
    if (value.length >= 2 && ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

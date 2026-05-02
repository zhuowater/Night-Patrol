#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RUNTIME_DIRS = ["assets/optimized", "assets/audio/sfx", "assets/marketing", "public", "desktop-assets"];
const GENERATED_DIRS = ["assets/generated"];
const DIST_DIRS = ["dist/assets"];
const MODE_DIRS = {
  runtime: RUNTIME_DIRS,
  generated: GENERATED_DIRS,
  dist: DIST_DIRS,
};
const BUDGETS = [
  { pattern: /cinematics\/victory-boss-.*-poster\.(png|webp)$/i, max: 1200 * 1024, label: "Boss poster < 1.2MB" },
  { pattern: /cinematics\/victory-.*-poster\.(png|webp)$/i, max: 800 * 1024, label: "普通 poster < 800KB" },
  { pattern: /cinematics\/victory-boss-.*\.mp4$/i, max: 4 * 1024 * 1024, label: "Boss 视频 < 4MB" },
  { pattern: /cinematics\/victory-(?!boss-).*\.mp4$/i, max: 2 * 1024 * 1024, label: "普通胜利视频 < 2MB" },
  { pattern: /audio\/bgm\/.*\.(mp3|ogg)$/i, max: 2500 * 1024, label: "BGM < 2.5MB" },
];
const ASSET_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mp3", ".ogg", ".wav", ".ico", ".css", ".js"]);
const TYPE_LABELS = new Map([
  [".png", "image"],
  [".jpg", "image"],
  [".jpeg", "image"],
  [".webp", "image"],
  [".ico", "image"],
  [".mp4", "video"],
  [".mp3", "audio"],
  [".ogg", "audio"],
  [".wav", "audio"],
  [".css", "code"],
  [".js", "code"],
]);

function parseArgs(argv) {
  const args = [...argv];
  let top = 30;
  let mode = "runtime";
  const dirs = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--top") {
      top = Number(args[index + 1] || top);
      index += 1;
    } else if (arg.startsWith("--top=")) {
      top = Number(arg.slice("--top=".length));
    } else if (arg === "--mode") {
      mode = args[index + 1] || mode;
      index += 1;
    } else if (arg.startsWith("--mode=")) {
      mode = arg.slice("--mode=".length);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      dirs.push(arg);
    }
  }

  if (!Number.isFinite(top) || top <= 0) top = 30;
  const selectedDirs = dirs.length ? dirs : MODE_DIRS[mode] || [mode];
  return { dirs: selectedDirs, mode, top };
}

function printHelp() {
  console.log(`Asset audit\n\nUsage:\n  npm run assets:audit\n  npm run assets:audit -- --mode dist --top 20\n  npm run assets:audit -- assets/generated\n\nModes:\n  runtime    ${RUNTIME_DIRS.join(", ")}\n  generated  ${GENERATED_DIRS.join(", ")}\n  dist       ${DIST_DIRS.join(", ")}\n`);
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  const abs = path.join(ROOT, dir);
  if (!(await exists(abs))) return [];
  const out = [];
  for (const entry of await readdir(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(rel)));
    else if (ASSET_EXTS.has(path.extname(entry.name).toLowerCase())) {
      const info = await stat(path.join(ROOT, rel));
      out.push({ rel: rel.replaceAll(path.sep, "/"), size: info.size, ext: path.extname(entry.name).toLowerCase() });
    }
  }
  return out;
}

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function formatPercent(part, total) {
  if (!total) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function summarizeBy(files, getKey) {
  const groups = new Map();
  for (const file of files) {
    const key = getKey(file);
    const current = groups.get(key) || { key, count: 0, size: 0 };
    current.count += 1;
    current.size += file.size;
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => b.size - a.size);
}

const { dirs, mode, top } = parseArgs(process.argv.slice(2));
const files = (await Promise.all(dirs.map(walk))).flat().sort((a, b) => b.size - a.size);
const total = files.reduce((sum, file) => sum + file.size, 0);
const overBudget = files.flatMap((file) => {
  const budget = BUDGETS.find((candidate) => candidate.pattern.test(file.rel));
  return budget && file.size > budget.max ? [{ ...file, budget }] : [];
});

console.log(`Asset audit mode: ${mode}`);
console.log(`Audited assets from: ${dirs.join(", ")}`);
console.log(`Asset audit: ${files.length} files, total ${fmt(total)}`);

console.log("\nBy type:");
for (const group of summarizeBy(files, (file) => TYPE_LABELS.get(file.ext) || "other")) {
  console.log(`${fmt(group.size).padStart(9)}  ${formatPercent(group.size, total).padStart(6)}  ${String(group.count).padStart(3)} files  ${group.key}`);
}

console.log("\nBy top-level area:");
for (const group of summarizeBy(files, (file) => file.rel.split("/").slice(0, 3).join("/"))) {
  console.log(`${fmt(group.size).padStart(9)}  ${formatPercent(group.size, total).padStart(6)}  ${String(group.count).padStart(3)} files  ${group.key}`);
}

console.log(`\nTop ${top} assets:`);
for (const file of files.slice(0, top)) console.log(`${fmt(file.size).padStart(9)}  ${formatPercent(file.size, total).padStart(6)}  ${file.rel}`);

console.log("\nOver budget:");
if (overBudget.length === 0) console.log("  none");
else {
  for (const item of overBudget) {
    console.log(`${fmt(item.size).padStart(9)}  ${item.rel}  (${item.budget.label}, max ${fmt(item.budget.max)})`);
  }
}

const optimized = files.filter((file) => file.rel.startsWith("assets/optimized/"));
if (optimized.length) {
  const optimizedTotal = optimized.reduce((sum, file) => sum + file.size, 0);
  console.log(`\nOptimized subset: ${optimized.length} files, ${fmt(optimizedTotal)}`);
}

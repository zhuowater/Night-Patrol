#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_DIRS = ["assets", "public", "desktop-assets"];
const BUDGETS = [
  { pattern: /cinematics\/victory-.*-poster\.(png|webp)$/i, max: 800 * 1024, label: "普通 poster < 800KB" },
  { pattern: /cinematics\/victory-boss-.*-poster\.(png|webp)$/i, max: 1200 * 1024, label: "Boss poster < 1.2MB" },
  { pattern: /cinematics\/victory-(?!boss-).*\.mp4$/i, max: 2 * 1024 * 1024, label: "普通胜利视频 < 2MB" },
  { pattern: /cinematics\/victory-boss-.*\.mp4$/i, max: 4 * 1024 * 1024, label: "Boss 视频 < 4MB" },
  { pattern: /audio\/bgm\/.*\.(mp3|ogg)$/i, max: 2500 * 1024, label: "BGM < 2.5MB" },
];
const ASSET_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".mp4", ".mp3", ".ogg", ".wav", ".ico"]);

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
      out.push({ rel: rel.replaceAll(path.sep, "/"), size: info.size });
    }
  }
  return out;
}

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

const dirs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DIRS;
const files = (await Promise.all(dirs.map(walk))).flat().sort((a, b) => b.size - a.size);
const total = files.reduce((sum, file) => sum + file.size, 0);
const overBudget = files.flatMap((file) =>
  BUDGETS.filter((budget) => budget.pattern.test(file.rel) && file.size > budget.max).map((budget) => ({ ...file, budget })),
);

console.log(`Asset audit: ${files.length} files, total ${fmt(total)}`);
console.log("\nTop assets:");
for (const file of files.slice(0, 30)) console.log(`${fmt(file.size).padStart(9)}  ${file.rel}`);

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

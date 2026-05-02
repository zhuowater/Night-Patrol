#!/usr/bin/env node
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "assets/generated");
const OUT_ROOT = path.join(ROOT, "assets/optimized");
const jobs = [];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with ${code}\n${stderr}`));
    });
  });
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function newerOrMissing(src, out) {
  if (!(await exists(out))) return true;
  const [srcStat, outStat] = await Promise.all([stat(src), stat(out)]);
  return srcStat.mtimeMs > outStat.mtimeMs;
}

async function walk(dir) {
  if (!(await exists(dir))) return [];
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(abs)));
    else out.push(abs);
  }
  return out;
}

function relFromSource(abs) {
  return path.relative(SOURCE_ROOT, abs).replaceAll(path.sep, "/");
}

async function enqueueImage(abs) {
  const rel = relFromSource(abs);
  const ext = path.extname(rel).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return;
  const out = path.join(OUT_ROOT, rel).replace(/\.(png|jpe?g)$/i, ".webp");
  if (!(await newerOrMissing(abs, out))) return;
  await mkdir(path.dirname(out), { recursive: true });
  const args = ["-y", "-i", abs, "-vf", "scale='min(1920,iw)':-2", "-c:v", "libwebp", "-quality", "78", "-compression_level", "6", out];
  jobs.push({ label: rel, out: path.relative(ROOT, out), run: () => run("ffmpeg", args) });
}

async function enqueueVideo(abs) {
  const rel = relFromSource(abs);
  if (path.extname(rel).toLowerCase() !== ".mp4") return;
  const out = path.join(OUT_ROOT, rel);
  if (!(await newerOrMissing(abs, out))) return;
  await mkdir(path.dirname(out), { recursive: true });
  const isBoss = /victory-boss-/i.test(rel);
  const isLoop = /loop/i.test(rel);
  const scale = isBoss || isLoop ? "scale='min(1280,iw)':-2" : "scale='min(960,iw)':-2";
  const crf = isBoss ? "29" : "31";
  const args = ["-y", "-i", abs, "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-movflags", "+faststart", "-an", out];
  jobs.push({ label: rel, out: path.relative(ROOT, out), run: () => run("ffmpeg", args) });
}

async function enqueueAudio() {
  const src = path.join(ROOT, "assets/audio/bgm/bronze-snare-crown.mp3");
  if (!(await exists(src))) return;
  const out = path.join(ROOT, "assets/optimized/audio/bgm/bronze-snare-crown.mp3");
  if (!(await newerOrMissing(src, out))) return;
  await mkdir(path.dirname(out), { recursive: true });
  const args = ["-y", "-i", src, "-vn", "-codec:a", "libmp3lame", "-b:a", "96k", out];
  jobs.push({ label: "audio/bgm/bronze-snare-crown.mp3", out: path.relative(ROOT, out), run: () => run("ffmpeg", args) });
}

for (const file of await walk(SOURCE_ROOT)) {
  await enqueueImage(file);
  await enqueueVideo(file);
}
await enqueueAudio();

if (jobs.length === 0) {
  console.log("Assets already optimized.");
  process.exit(0);
}

console.log(`Optimizing ${jobs.length} assets...`);
for (const [index, job] of jobs.entries()) {
  await job.run();
  console.log(`${index + 1}/${jobs.length} ${job.label} -> ${job.out}`);
}
console.log("Asset optimization complete.");

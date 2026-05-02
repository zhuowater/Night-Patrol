#!/usr/bin/env node
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "assets/generated");
const OUT_ROOT = path.join(ROOT, "assets/optimized");
const BGM_SRC = path.join(ROOT, "assets/audio/bgm/bronze-snare-crown.mp3");
const BGM_OUT = path.join(ROOT, "assets/optimized/audio/bgm/bronze-snare-crown.mp3");

function parseArgs(argv) {
  const options = { dryRun: false, check: false, force: false };
  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--check") options.check = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return options;
}

function printHelp() {
  console.log(`Asset optimizer\n\nUsage:\n  npm run assets:optimize\n  npm run assets:optimize -- --dry-run\n  npm run assets:optimize -- --check\n  npm run assets:optimize -- --force\n\nOptions:\n  --dry-run  Show pending optimization jobs without writing files.\n  --check    Fail if generated sources are newer than optimized outputs.\n  --force    Rebuild all optimizable outputs even when they are up to date.\n`);
}

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${cmd} ${args.join(" ")} failed with ${code}\n${stderr}`));
    });
  });
}

async function ensureFfmpeg() {
  try {
    const { stdout, stderr } = await run("ffmpeg", ["-version"]);
    const firstLine = (stdout || stderr).split(/\r?\n/)[0] || "ffmpeg available";
    return firstLine;
  } catch (error) {
    throw new Error(`ffmpeg is required for assets:optimize. Install ffmpeg and retry.\n${error.message}`);
  }
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function fileSize(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return 0;
  }
}

async function needsBuild(src, out, force) {
  if (force) return true;
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

function fmt(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function makeJob({ label, src, out, kind, args }) {
  return {
    label,
    src,
    out,
    kind,
    srcSize: await fileSize(src),
    outSizeBefore: await fileSize(out),
    run: async () => {
      await mkdir(path.dirname(out), { recursive: true });
      await run("ffmpeg", args);
      return fileSize(out);
    },
  };
}

async function enqueueImage(abs, jobs, options) {
  const rel = relFromSource(abs);
  const ext = path.extname(rel).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return;
  const out = path.join(OUT_ROOT, rel).replace(/\.(png|jpe?g)$/i, ".webp");
  if (!(await needsBuild(abs, out, options.force))) return;
  const args = ["-y", "-i", abs, "-vf", "scale='min(1920,iw)':-2", "-c:v", "libwebp", "-quality", "78", "-compression_level", "6", out];
  jobs.push(await makeJob({ label: rel, src: abs, out, kind: "image", args }));
}

async function enqueueVideo(abs, jobs, options) {
  const rel = relFromSource(abs);
  if (path.extname(rel).toLowerCase() !== ".mp4") return;
  const out = path.join(OUT_ROOT, rel);
  if (!(await needsBuild(abs, out, options.force))) return;
  const isBoss = /victory-boss-/i.test(rel);
  const isLoop = /loop/i.test(rel);
  const scale = isBoss || isLoop ? "scale='min(1280,iw)':-2" : "scale='min(960,iw)':-2";
  const crf = isBoss ? "29" : "31";
  const args = ["-y", "-i", abs, "-vf", scale, "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-movflags", "+faststart", "-an", out];
  jobs.push(await makeJob({ label: rel, src: abs, out, kind: "video", args }));
}

async function enqueueAudio(jobs, options) {
  if (!(await exists(BGM_SRC))) return;
  if (!(await needsBuild(BGM_SRC, BGM_OUT, options.force))) return;
  const args = ["-y", "-i", BGM_SRC, "-vn", "-codec:a", "libmp3lame", "-b:a", "96k", BGM_OUT];
  jobs.push(await makeJob({ label: "audio/bgm/bronze-snare-crown.mp3", src: BGM_SRC, out: BGM_OUT, kind: "audio", args }));
}

function summarize(jobs, getOutSize) {
  const srcTotal = jobs.reduce((sum, job) => sum + job.srcSize, 0);
  const beforeTotal = jobs.reduce((sum, job) => sum + job.outSizeBefore, 0);
  const outTotal = jobs.reduce((sum, job) => sum + getOutSize(job), 0);
  console.log(`\nSummary: ${jobs.length} jobs`);
  console.log(`  source total: ${fmt(srcTotal)}`);
  if (beforeTotal) console.log(`  previous output total: ${fmt(beforeTotal)}`);
  if (outTotal) {
    console.log(`  output total: ${fmt(outTotal)}`);
    console.log(`  saved vs source: ${fmt(Math.max(0, srcTotal - outTotal))}`);
  }
}

const options = parseArgs(process.argv.slice(2));
const ffmpegVersion = await ensureFfmpeg();
console.log(ffmpegVersion);

const jobs = [];
for (const file of await walk(SOURCE_ROOT)) {
  await enqueueImage(file, jobs, options);
  await enqueueVideo(file, jobs, options);
}
await enqueueAudio(jobs, options);

if (jobs.length === 0) {
  console.log("Assets already optimized.");
  process.exit(0);
}

for (const [index, job] of jobs.entries()) {
  console.log(`${index + 1}/${jobs.length} [${job.kind}] ${job.label} (${fmt(job.srcSize)} -> ${path.relative(ROOT, job.out).replaceAll(path.sep, "/")})`);
}

if (options.check) {
  console.error(`assets:optimize check failed: ${jobs.length} optimized outputs are stale or missing.`);
  summarize(jobs, (job) => job.outSizeBefore);
  process.exit(1);
}

if (options.dryRun) {
  console.log("\nDry run only; no files written.");
  summarize(jobs, (job) => job.outSizeBefore);
  process.exit(0);
}

console.log(`\nOptimizing ${jobs.length} assets...`);
const outSizes = new Map();
for (const [index, job] of jobs.entries()) {
  const outSize = await job.run();
  outSizes.set(job.out, outSize);
  console.log(`${index + 1}/${jobs.length} ${job.label}: ${fmt(job.srcSize)} -> ${fmt(outSize)}`);
}
summarize(jobs, (job) => outSizes.get(job.out) || 0);
console.log("Asset optimization complete.");

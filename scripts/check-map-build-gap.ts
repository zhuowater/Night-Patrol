import { readFileSync } from "node:fs";

const mapLog = readFileSync("src/ui/map-log.tsx", "utf8");
const runScreens = readFileSync("src/ui/screens/RunScreens.tsx", "utf8");
const css = readFileSync("src/styles.css", "utf8");
const failures: string[] = [];

if (!mapLog.includes('className="route-option-cta"') || !mapLog.includes("进入该节点")) {
  failures.push("route option cards should expose an explicit 进入该节点 CTA");
}

if (!runScreens.includes("function buildGapHint")) {
  failures.push("RunScreens should provide a lightweight buildGapHint helper");
}

if (!runScreens.includes("当前构筑诊断")) {
  failures.push("reward/shop screens should display 当前构筑诊断");
}

if (!runScreens.includes("build-gap-hint") || !css.includes(".build-gap-hint")) {
  failures.push("build gap hint should have a dedicated class and styling");
}

if (!css.includes(".route-option-cta")) {
  failures.push("route option CTA should have dedicated styling");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("map CTA and build gap static checks passed");

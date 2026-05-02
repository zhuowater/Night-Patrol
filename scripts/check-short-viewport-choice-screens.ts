import { readFileSync } from "node:fs";

const runScreens = readFileSync("src/ui/screens/RunScreens.tsx", "utf8");
const css = readFileSync("src/styles.css", "utf8");
const failures: string[] = [];

if (!runScreens.includes('className="decision-card-cta"')) {
  failures.push("event choices need an explicit .decision-card-cta element, not only italic helper text");
}

if (!runScreens.includes('className="reward-choice-cta"')) {
  failures.push("reward cards need an explicit .reward-choice-cta CTA so short viewports show where to click");
}

if (!css.includes(".reward-primary-choice") || !css.includes("grid-template-columns: repeat(3")) {
  failures.push("reward choices should have a deterministic three-column desktop layout instead of wrapping unpredictably");
}

if (!css.includes("@media (max-height: 640px) and (min-width: 1021px)") || !css.includes(".card-mode-reward")) {
  failures.push("short desktop viewport needs explicit compact reward-card rules");
}

if (!css.includes(".reward-skip") || !css.includes("position: fixed")) {
  failures.push("short reward screen needs a visible fixed skip CTA at the bottom of the viewport");
}

if (!css.includes(".reward-dossier") || !css.includes("display: none")) {
  failures.push("short reward screen should collapse optional dossier details to keep primary CTAs above the fold");
}

if (!css.includes(".decision-card-cta")) {
  failures.push("missing .decision-card-cta styling for button-like affordance");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("short viewport choice screen static checks passed");

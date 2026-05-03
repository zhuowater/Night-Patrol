import { readFileSync } from "node:fs";

const combatScreen = readFileSync("src/ui/screens/CombatScreen.tsx", "utf8");
const combatIntelPanel = readFileSync("src/ui/screens/CombatIntelPanel.tsx", "utf8");
const css = readFileSync("src/styles.css", "utf8");
const failures: string[] = [];

if (!combatScreen.includes('className="combat-priority-row"')) {
  failures.push("combat screen needs a compact priority row so short viewports keep intent, recommendation, and end-turn visible together");
}

if (!combatScreen.includes('className="combat-mini-intent"') || !combatScreen.includes('className="combat-mini-recommendation"')) {
  failures.push("combat priority row must expose mini intent and mini recommendation summaries");
}

if (!combatScreen.includes('className="end-turn combat-mini-end-turn"')) {
  failures.push("combat priority row needs a duplicate short-viewport end-turn CTA near the recommendation");
}

if (!combatScreen.includes('compactIntel={true}')) {
  failures.push("combat screen should render a compact intel rail for short desktop viewports");
}

if (!combatIntelPanel.includes("compactIntel") || !combatIntelPanel.includes('combat-intel-panel-compact')) {
  failures.push("CombatIntelPanel must support a compact mode for the short viewport rail");
}

if (!css.includes(".combat-priority-row") || !css.includes(".combat-mini-recommendation") || !css.includes(".combat-mini-end-turn")) {
  failures.push("missing combat priority row styling");
}

if (!css.includes(".combat-intel-panel-compact") || !css.includes(".combat-intel-panel:not(.combat-intel-panel-compact)")) {
  failures.push("missing compact/full intel panel visibility rules");
}

if (!css.includes("@media (max-height: 640px) and (min-width: 1021px)") || !css.includes(".hand-fan")) {
  failures.push("short desktop viewport needs explicit combat hand/guidance compaction rules");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("short viewport combat static checks passed");

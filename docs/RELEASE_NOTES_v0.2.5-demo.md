# Night Patrol v0.2.5 Demo Release Notes

Date: 2026-05-02

## Summary

`v0.2.5-demo` is a release-candidate polish pass for the first-act SOC roguelike demo. It keeps the existing playable route intact while making the codebase easier to maintain, the release artifacts lighter, and the combat information layer clearer during high-pressure runs.

## Player-facing changes

- Adds clearer combat intelligence for attack-chain counterplay:
  - active interruption feedback,
  - risk forecast,
  - concrete counterplay windows,
  - Boss phase status when fighting the ransomware core.
- Makes `查询缓存` visible in combat: the panel now shows `0/3`, `1/3`, `2/3`, then resets after drawing on the third played card.
- Keeps `日志检索` as a powerful zero-cost draw card, but exhausts it after use to prevent infinite repeat-loop abuse.
- Improves hand-card usability: cards can be clicked as well as dragged, while drag hints now explain whether the card is reinforcing self-defense or handling the active attack chain.
- Preserves deterministic first-act victory routes for story, normal, and hard fixtures.

## Engineering changes

- Splits monolithic engine responsibilities into focused modules under `src/game/engine/`:
  - state creation,
  - deck operations,
  - enemy AI,
  - shop,
  - rest/maintenance,
  - combat and card effects.
- Splits large UI screens out of `App.tsx` into `src/ui/screens.tsx`, while keeping combat in `App.tsx` for now.
- Adds asset audit/optimization scripts and optimized asset references.
- Adds manual Vite chunking so React, Phaser, combat stage, icons, and audio are separated more cleanly.
- Extends deterministic engine scenario coverage to 10 scenarios, including query-cache progress and Boss phase thresholds.

## Verification

Fresh release gate used for this candidate:

```bash
npm run check && npm run build
```

Observed result on 2026-05-02:

- `check:theme`: passed
- `check:attack-chain`: passed
- `check:engine-scenarios`: passed, 10 scenarios
- `check:playtest-run`: passed, 3 deterministic fixtures
- `build`: passed

Latest deterministic fixture outcomes:

- story: victory, floor 8, 86/96 HP, 5 combats
- normal: victory, floor 8, 41/84 HP, 5 combats
- hard: victory, floor 8, 32/74 HP, 5 combats

Browser smoke test:

- production preview at `http://127.0.0.1:4174/` loaded successfully;
- title screen, route screen, combat HUD, attack-chain intelligence panel, player/enemy status, hand cards, and end-turn button rendered normally.

## Bundle shape

The production web build now separates app code, React, Phaser, combat stage, icon, and audio chunks. Vite still warns that the Phaser chunk and large media assets exceed 500 KB; this is expected for the current media-heavy demo and no longer blocks the initial shell.

## Known caveats

- Desktop packages are unsigned/ad-hoc for demo testing.
- macOS may require right-click → Open because the app is not Apple-notarized.
- Windows SmartScreen may warn on first launch.
- Balance is still demo-grade; use playtest feedback before treating hard mode as final.

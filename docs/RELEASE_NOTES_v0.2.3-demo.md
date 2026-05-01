# Night Patrol v0.2.3 Demo Release Notes

Date: 2026-05-01

## Summary

v0.2.3-demo turns the SOC retheme from a single-file prototype into a safer, more maintainable demo branch:

- Adds release-grade check scripts for theme consistency, attack-chain counterplay, deterministic engine scenarios, and automated playtest fixtures.
- Splits the game engine behind the existing `src/game/engine.ts` facade into focused modules under `src/game/engine/`.
- Splits UI shell/card/map-log presentation out of `App.tsx`.
- Lazily loads Phaser combat rendering and audio so the initial web bundle stays small.
- Tunes zero-cost draw abuse without killing the card’s feel: `日志检索` still draws 2/3 but now exhausts.
- Adds phased boss behavior for `勒索核心` at 66% and 33% HP.

## Verification

Fresh release gate:

```bash
npm run check && npm run build
```

Expected checks:

- `check:theme`: cybersecurity retheme smoke check
- `check:attack-chain`: attack-chain/counterplay smoke check
- `check:engine-scenarios`: 8 deterministic engine scenarios
- `check:playtest-run`: story/normal/hard deterministic route fixtures
- `build`: TypeScript project build + Vite production build

Latest known fixture outcomes:

- story: victory, floor 8, 66/96 HP, 5 combats
- normal: victory, floor 8, 41/84 HP, 5 combats
- hard: victory, floor 8, 18/74 HP, 5 combats

## Bundle shape

The main app chunk is about 222 KB minified. Phaser combat rendering is split into a separate lazy chunk of about 1.2 MB. Vite still warns on the Phaser chunk, which is acceptable for this demo because it no longer blocks the initial app shell.

## Notes

This is still a demo release. Large image/audio assets remain intentionally high fidelity; future work should add responsive asset variants and/or optional low-bandwidth packs.

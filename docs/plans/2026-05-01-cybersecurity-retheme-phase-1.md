# 《夜巡 SOC：边界告警》Phase 1 Implementation Plan

> **For Hermes:** Execute directly in-session unless a task becomes safely separable. Keep changes surgical: no engine mechanics rewrite, no package bloat, no new gameplay systems.

**Goal:** Convert the playable Night-Patrol first-act demo from a zhiguai night patrol theme into a cyber-security SOC response theme with matching first-pass static assets.

**Architecture:** Phase 1 is a content/theme slice. Preserve existing game state, combat math, route generation, asset filenames, and React/Phaser structure. Replace visible copy, package metadata, and P0 images in-place so existing references continue to work.

**Tech Stack:** React 18, TypeScript, Vite, Phaser 3, Electron/electron-builder, Node scripts for verification and deterministic asset generation.

---

## Acceptance Criteria

- `npm run build` exits 0.
- Browser smoke verifies title → map → combat has cyber-security copy and no console errors.
- Main visible old-world terms are absent from source files that render UI/copy: `荒庙、妖、香火、城隍、山君、符印、阴寒、阴市、荒村、破庙、志怪` except in docs/history or filenames.
- App metadata uses:
  - title/productName: `夜巡 SOC：边界告警` / `夜巡 SOC`
  - appId: `com.yexunlu.soc`
- P0 static image files are replaced in-place under existing paths:
  - `assets/generated/characters/player-night-patrol.png`
  - `assets/generated/enemies/*.png`
  - `assets/generated/backgrounds/night-temple-battle.png`
  - `assets/generated/cinematics/victory-*-poster.png`
  - `assets/marketing/icon.png`
  - `public/favicon.png`

---

## Task 1: Add theme regression check first

**Objective:** Create a small Node verification script that fails on current old-theme strings and passes after the retheme.

**Files:**
- Create: `scripts/check-cybersec-theme.mjs`
- Modify: `package.json`

**Steps:**
1. Create `scripts/check-cybersec-theme.mjs` that scans `package.json`, `index.html`, `electron/main.cjs`, `src/game/content.ts`, `src/game/engine.ts`, `src/App.tsx`, `README.md` for banned visible terms.
2. Ignore comments and docs/plans; this is a public-copy check, not a repository-wide history purge.
3. Add npm script: `"check:theme": "node scripts/check-cybersec-theme.mjs"`.
4. Run `npm run check:theme` and verify it fails before code changes.

**Expected RED:** reports old terms in current UI/content files.

---

## Task 2: Retheme static game content

**Objective:** Replace card, relic/tool, enemy, node, and event names/text in `src/game/content.ts` without changing IDs or numeric mechanics.

**Files:**
- Modify: `src/game/content.ts`

**Rules:**
- Preserve object keys and IDs.
- Preserve card type, rarity, cost, exhaust/unplayable flags.
- Preserve enemy HP and move amounts/types/hits.
- Replace visible names/text per `docs/CYBERSECURITY_RETHEME_DESIGN.md`.

**Verification:**
- `npm run check:theme` still may fail because App/engine not done, but `src/game/content.ts` should have no banned old-theme terms.

---

## Task 3: Retheme engine logs and runtime vocabulary

**Objective:** Replace player name, difficulty labels, route row names, combat logs, reward/cinematic text, event result logs, shop/rest/remove logs in `src/game/engine.ts`.

**Files:**
- Modify: `src/game/engine.ts`

**Rules:**
- Preserve function signatures and mechanics.
- Keep internal field name `incense` unchanged for compatibility, but visible copy says `算力`.
- Keep internal field `seal` unchanged, but visible copy says `IOC`.
- Keep `gold` field, but visible copy says `预算`.

**Verification:**
- `npm run check:theme` should now fail only on App/metadata/README if Task 2 is clean.

---

## Task 4: Retheme React UI copy and labels

**Objective:** Replace title, HUD, map, combat, settlement, reward, event, rest, shop, deck-pick, log rail, gameover/victory copy in `src/App.tsx`.

**Files:**
- Modify: `src/App.tsx`

**Rules:**
- Preserve component boundaries and drag/drop behavior.
- Only change visible strings and label regexes.
- Keep asset variable names if changing them would cause unnecessary churn.

**Verification:**
- `npm run check:theme` should pass once metadata/README are also done.

---

## Task 5: Retheme metadata and README

**Objective:** Update app/package metadata, browser title, Electron title/menu labels, and README to the new cybersecurity theme.

**Files:**
- Modify: `package.json`
- Modify: `index.html`
- Modify: `electron/main.cjs`
- Modify: `README.md`

**Verification:**
- `npm run check:theme` passes.

---

## Task 6: Generate deterministic P0 cyber-themed static assets

**Objective:** Replace existing referenced PNG assets with a coherent cyber-SOC placeholder art set without changing paths.

**Files:**
- Create: `scripts/generate-cybersec-assets.mjs`
- Overwrite PNGs listed in Acceptance Criteria.

**Approach:**
- Use local SVG generation + available ImageMagick/Sharp/canvas conversion if present.
- If no converter is available, use Python Pillow if installed.
- Keep files compact, no external logos, no readable vendor names.
- Generate transparent-ish character/enemy cards and 16:9 background/posters with dark SOC palette: cyan, red, gold.

**Verification:**
- Check files exist and are non-empty.
- `npm run build` includes them without broken imports.

---

## Task 7: Full verification and browser smoke

**Objective:** Prove the rethemed build is usable.

**Commands:**
- `npm run check:theme`
- `npm run build`
- `npm audit --omit=dev`
- Start dev server: `npm run dev -- --host 127.0.0.1`
- Browser: open `/`, verify title page, click `接管夜班`, click first map node, verify combat screen.
- Stop dev server.

**Expected:** All commands exit 0; browser has no console errors; visible UI uses cybersecurity copy.

---

## Task 8: Review and commit

**Objective:** Review diff, scan for secrets/dangerous patterns, commit green changes.

**Commands:**
- `git diff --stat`
- `git diff -- package.json index.html electron/main.cjs src/game/content.ts src/game/engine.ts src/App.tsx README.md scripts/check-cybersec-theme.mjs scripts/generate-cybersec-assets.mjs`
- `git status --short`
- `git add -A && git commit -m "feat: retheme demo as cybersecurity SOC game"`

**Final response:** Summarize changed files, verification evidence, commit hash, and any remaining Phase 2/3 recommendations.

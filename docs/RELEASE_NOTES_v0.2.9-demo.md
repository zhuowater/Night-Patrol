# 《夜巡 SOC：边界告警》v0.2.9-demo Release Notes

> Release type: closed playtest distribution / asset governance / short-viewport polish.  
> Baseline: `v0.2.8-demo` → `v0.2.9-demo`.

## 本版定位

`v0.2.9-demo` 是给闭门试玩者使用的最新版试玩包。它不扩展新敌人、新卡牌或新章节，而是把 `v0.2.8-demo` 发布后的分发入口、资源治理、构建流程和短视口关键选择页继续收紧。

核心目标：

> 让试玩者拿到的下载包就是当前最新体验；让第一轮 5-10 人反馈尽量指向玩法本身，而不是被过期包、下载说明、资源体积或短视口 UI 摩擦污染。

## 主要改动

### 1. 闭门试玩入口与反馈闭环

- README 顶部下载入口、平台文件选择、Source code 误下载提醒和反馈路径已对齐当前分发流程。
- 新增/更新分发 QA 记录，确认 GitHub Release、桌面资产、试玩说明和反馈汇总路径可用。
- 明确 v0.2.9 的决策门槛：先收 5-10 份有效反馈，再决定 P0/P1 修正，不靠内部想象扩内容。

### 2. 资源治理与发布 gate 加固

- `assets:audit` 支持 runtime / generated / dist 三类视图，默认聚焦真正进入运行时和客户端包的资源。
- `assets:optimize` 支持 `--dry-run`、`--check`、`--force`，便于在 CI 和发布前确认 optimized 产物未过期。
- UI/BGM 入口已指向 `assets/optimized`，`assets/generated` 保留为源素材，不再作为默认包体预算基线。
- Release workflow 已合并为 `.github/workflows/release.yml`，tag 发布时统一构建 Linux / macOS / Windows 桌面资产。

### 3. 首屏与运行时包体收敛

- 战斗舞台和跑局界面拆成懒加载 chunk，降低首屏主入口压力。
- 资源审计范围进一步收紧，避免把源素材体积误判为运行时包体问题。
- Phaser 仍是最大 chunk；这是当前 demo 的既有非阻塞警告，后续再按真实反馈和预算决定是否继续拆分。

### 4. 短视口关键选择页修正

- 增加短视口静态检查，覆盖奖励/事件/商店等选择页的底部 CTA 和关键信息可见性。
- 修正短视口下选择 CTA 容易贴底或不够可见的问题，减少笔记本、小窗口、聊天窗口内试玩的误操作风险。

### 5. 当前试玩报告

新增模拟资深玩家试玩材料，用于指导第一轮真实闭门试玩：

- `reports/playtest-v0.2.9-demo-senior-player-report-2026-05-02.md`
- `reports/playtest-v0.2.9-demo-senior-player-feedback-form-2026-05-02.md`

结论：当前版本已经具备 5-10 人闭门试玩条件；下一步应优先收真实反馈，不建议立刻扩内容。

## QA 与验证状态

本地最终已执行并通过：

```bash
npm run assets:optimize -- --check
npm run check
npm run build
```

覆盖项：

- `check:theme` 通过。
- `check:attack-chain` 通过。
- `check:engine-scenarios` 通过，22 个场景。
- `check:playtest-run` 通过，story / normal / hard 三档固定跑局均胜利。
- `check:short-viewport` 通过。
- `npm run build` 通过。

## 已知非阻塞项

- Vite 仍提示 Phaser chunk 大于 500 kB；当前不阻塞闭门试玩。
- macOS demo 包仍为 ad-hoc 签名，未做 Apple 公证。
- Windows 未签名安装包仍可能触发 SmartScreen。
- v0.2.9 不新增敌人、卡牌、地图、存档或 meta-progression。

# 《夜巡 SOC：边界告警》v0.2.3-v0.3.0 后续开发计划

> 依据：资深玩家完整跑局反馈、SOC 专业评估报告、当前代码与资源体积抽样检查。  
> 当前判断：已发布到 `v0.2.8-demo`；第一局引导和信息层级已补齐，闭门试玩分发/反馈闭环已建立，资源治理和首屏分包已完成第一轮。下一步应先收集 5-10 份有效试玩反馈，再决定 v0.2.9 的 P0/P1 修正；不要先扩内容。

## 2026-05-02 v0.2.8 发布后状态更新

`v0.2.8-demo` 已发布，Release 资产覆盖 Linux x64、macOS arm64、Windows x64：

- Release：`https://github.com/zhuowater/Night-Patrol/releases/tag/v0.2.8-demo`
- Release notes：`docs/RELEASE_NOTES_v0.2.8-demo.md`
- 闭门试玩说明：`docs/playtest/v0.2.8-closed-playtest-instructions.md`
- 反馈表：`docs/playtest/v0.2.8-feedback-form.md`
- 反馈汇总模板：`docs/playtest/v0.2.8-feedback-summary-template.md`
- v0.2.9 入口/反馈闭环计划：`docs/plans/2026-05-02-v0.2.9-playtest-feedback-loop.md`

下一阶段判断：

1. **先运营闭门试玩，不先扩内容**：把 `v0.2.8-demo` 发给 5-10 名试玩者，优先收集启动、第一战理解、C2/IOC、噪声、奖励、地图、Boss 与性能反馈。
2. **v0.2.9 前半段做反馈闭环**：README 下载入口、分发短文案、反馈汇总模板和问题池先稳定；真实反馈回来后再决定 P0/P1。
3. **v0.2.9 后半段资源治理已完成一轮收敛**：`assets:audit` 已改为 runtime/generated/dist 三视图；`assets:optimize` 已支持 `--dry-run`、`--check`、`--force`；UI/BGM 已引用 `assets/optimized`，源素材只作显式诊断。
4. **加载与分包已完成第一轮**：`CinematicScreen` 与非首屏 `RunScreens` 已 lazy chunk；Phaser vendor chunk 仍大，但属于独立 vendor 警告，后续是否继续拆要看真实反馈与发布包压力。
5. **内容扩展继续后置**：新增敌人、事件、卡牌、小 Boss 应等第一局理解和包体风险都有数据后再进入。
6. **当前新增 QA 记录**：`docs/playtest/v0.2.9-distribution-qa.md` 记录 Release 资产、分发路径与反馈决策门槛。

---

## 2026-05-02 v0.2.7 试玩后状态更新

当前计划的早期稳定化主线已经推进到 `v0.2.7-demo`：

- GitHub Release 已有 `v0.2.7-demo`，桌面分发资产覆盖 Linux / macOS arm64 / Windows x64。
- v0.2.7 已完成玩家可感知打磨：反制 readiness chips、卡牌威胁提示、Boss 阶段可读性、胜利复盘、工具奖励价值、视口适配、事件/商店/升级预览。
- 最新资深玩家模拟报告：`reports/playtest-v0.2.7-demo-senior-player-2026-05-02.md`。
- 当前仓库主版本基线应以 `v0.2.7-demo` 为准，而不是本文最初写作时的 v0.2.2/v0.2.3 状态。
- 后续开发不应继续机械执行本文 Sprint 1-6 的旧 checklist；应参考新的 v0.2.8 计划：
  - `docs/plans/2026-05-02-v0.2.8-first-run-guidance-and-ia.md`

下一阶段判断：

1. **v0.2.8 不扩内容**：专注 first-run 教学层、战斗屏信息分层、奖励/地图决策焦点、资源命名治理，并保留旧计划里的 UI/App 解构，不让新引导继续塞进 `App.tsx`。
2. **先降低第一局理解成本**：第一战、首次 C2、首次噪声、首次奖励都要有轻量 micro-cue。
3. **再考虑 v0.2.9 扩内容/强化 Boss 机制**：只有当玩家第一局能顺利理解后，新增卡牌、敌人、事件、Boss debuff 才不会放大认知债。
4. **闭门试玩继续带说明发**：当前适合 5-10 人闭门，不宜直接大范围公开 demo。

---

## 0. 执行摘要

### 0.1 当前代码与 roadmap 总判断（2026-05-02 / `aa520af`）

这份文档最初用于规划 `v0.2.3-v0.3.0`，但当前仓库已经推进到 `v0.2.8-demo` 发布后、`v0.2.9` 闭门试玩反馈闭环阶段。后续不应再按旧 Sprint 1-6 机械推进；旧条目只作为“哪些主线已经完成/仍有债务”的索引。

对照最近提交与代码，当前事实是：

1. **引擎解构已完成第一轮**：`src/game/engine.ts` 已变成 1 行 facade，`src/game/engine/` 下已有 `core/deck/rng/state/attackChain/cardEffects/combat/enemyAi/map/rewards/events/shop/rest` 等模块；`check:playtest-run` 已纳入 `npm run check`，并覆盖 story/normal/hard 固定跑局。
2. **资源治理与首屏分包已完成第一轮**：`assets:audit` 支持 runtime/generated/dist 视图；`assets:optimize` 支持 `--dry-run`、`--check`、`--force`；UI/BGM 入口已改用 `assets/optimized`；`CinematicScreen` 与非首屏 `RunScreens` 已 lazy chunk，Vite manual chunks 已拆 `react/phaser/icons`。
3. **UI/App 解构已完成主要闭环但仍可继续瘦身**：`TopHud`、`TitleScreen`、`MapScreen`、`CombatScreen` 已移出 `App.tsx`；`App.tsx` 当前 250 行，刚好达到旧验收线；`CombatScreen.tsx` 381 行，仍在旧阈值内但后续可继续拆 hook/子组件。
4. **玩家理解层已进入可闭门试玩状态**：点击/拖出手牌区施放、卡牌预计效果、地图风险/奖励/下一跳、first-run cue、C2/噪声 micro-cue、Boss 阶段/倒计时表达均已落地到代码或文档。
5. **发布与分发闭环当前基线是 `v0.2.8-demo`**：GitHub Release 已有 Linux x64、macOS arm64、Windows x64 试玩资产；`docs/playtest/v0.2.9-distribution-qa.md` 已记录 Release 资产、README/试玩说明/反馈模板闭环。
6. **下一步优先级不是扩内容**：先把 `v0.2.8-demo` 发给 5-10 名闭门试玩者，收集有效反馈；若样本不足，继续补发布工程/文档/自动化，不先加敌人、卡牌或视频。

### 0.2 下一阶段版本节奏建议

| 版本/阶段 | 主题 | 当前状态 | 下一步 |
|---|---|---|---|
| v0.2.8-demo | First-run guidance / IA polish | 已发布；三平台资产已在 Release 页面 | 作为闭门试玩分发基线 |
| v0.2.9 | Playtest feedback loop / distribution QA | README、试玩说明、反馈模板、分发 QA 已完成；等待真实反馈 | 收 5-10 份反馈后决定 P0/P1 修正 |
| v0.2.10 或 v0.3.0 前置 | Release engineering / polish debt | 资源治理与 lazy chunk 已完成第一轮；workflow 有多份历史文件需统一 | 视反馈补自动 release、桌面验证、UI 继续解构 |
| v0.3.0 | Public Demo Candidate / 公开试玩候选 | 暂不进入 | 只有在反馈显示第一局理解成立后，再扩一章内容/敌人/Boss |

---

## 1. 当前状态判断

### 1.1 已经成立的部分

- 核心循环成立：地图选择 → 战斗 → 奖励/事件/商店/维护 → Boss。
- 安全主题不是纯换皮：IOC、噪声、降权、算力、自动化响应、C2/凭据/勒索反制已经开始进入规则层。
- 标准难度可完整通关：确定性完整跑局通关，第 8 层胜利，最终 `56/84 HP`。
- 发行链路已初步跑通：Electron、本地 Linux 包、GitHub Release、Release Notes、浏览器实际确认。
- 自动化检查已有雏形：`check:theme`、`check:attack-chain`、`check:engine-scenarios`、`build`。

### 1.2 当前最大风险

| 优先级 | 风险 | 当前现象 | 后果 / 处理 |
|---|---|---|---|
| P0 | 缺少真实试玩反馈 | `v0.2.8-demo` 已可分发，但下载数/反馈样本仍待回收 | 不要靠内部想象扩内容；先收 5-10 份有效反馈 |
| P0 | Release workflow 历史文件分叉 | `.github/workflows/` 同时存在 `build-desktop.yml`、`desktop-release.yml`、`release.yml`；其中 `desktop-release.yml` 仍绑定旧 release notes | 下一轮发布工程切片应统一/废弃旧 workflow，避免 tag 发布时重复或引用旧文档 |
| P1 | 资源体积仍大 | 资源治理脚本与 optimized 入口已完成，但 Electron 资产仍约百 MB 级 | 闭门试玩可接受；公开 demo 前继续看 dist/runtime 预算和下载反馈 |
| P1 | UI 仍有局部大组件 | `App.tsx` 已降到 250 行，`CombatScreen.tsx` 381 行；后者仍承载 drag、cue、HUD、建议、手牌 | 若后续改战斗 UI，先拆 `useCardDrag` / `CombatHud` / `GuidanceStack`，避免回到单体组件 |
| P1 | 数值/Boss 体验需真人验证 | Boss 阶段、倒计时、0 费链限制已部分落地；但完整体验是否“紧张但不拖”仍靠内部 fixture | 用反馈表中的 Boss/循环/理解评分决定是否进 v0.2.9 P1 |
| P2 | 旧规划文档仍有历史基线 | `FIRST_ACT_DEMO_ROADMAP.md`、`PACKAGING_DISTRIBUTION.md` 等保留 v0.2.2 语境 | 可在后续文档卫生切片中加“已被当前 roadmap 取代”提示，不影响当前分发 |

---

## 2. v0.2.3 核心范围：先稳住骨架

v0.2.3 不建议大规模加内容。它应该是一个“维护性大版本”：让后续开发更快、更稳、更可测。

### 2.1 P0：引擎解构计划

#### 2.1.1 原则

- **行为保持不变优先**：第一阶段只移动代码，不改数值、不改玩法。
- **每拆一步都跑回归**：拆一个模块，跑一次 `check:engine-scenarios` + `check:attack-chain` + `build`。
- **先切纯函数，再切流程**：先把无副作用的计算/效果函数抽出去，再拆复杂状态流。
- **保留外部 API 稳定**：`src/game/engine.ts` 可先变成 facade，继续导出 `startRun`、`playCard`、`endTurn` 等现有入口，避免 UI 大改。

#### 2.1.2 目标目录

```text
src/game/
  engine.ts                  # facade：保留公共导出，逐步变薄
  engine/
    index.ts                 # 聚合导出
    state.ts                 # createGameState / cloneState / run 初始化
    rng.ts                   # 随机、seed、抽样工具
    deck.ts                  # draw/shuffle/discard/exhaust/card instance
    map.ts                   # 节点生成、可选节点、chooseNode
    combat.ts                # startCombat/startPlayerTurn/endTurn/winCombat/loseCombat
    cardEffects.ts           # 卡牌效果解析与结算
    enemyAi.ts               # 敌方意图、敌方行动、强度/多段攻击
    attackChain.ts           # C2/凭据/勒索/IOC/降权/算力反制
    rewards.ts               # 战斗奖励、卡牌奖励、工具奖励
    events.ts                # 事件节点逻辑
    shop.ts                  # 商店购买/刷新/移除
    rest.ts                  # 维护窗口、升级、恢复
    telemetry.ts             # 跑局日志、debug trace、playtest 输出
```

#### 2.1.3 拆分顺序

**Step A：建立安全网**

- 固化 deterministic run fixtures：normal/story/hard 至少各 1 条。
- 给关键机制加断言：
  - IOC 叠加与持续伤害；
  - C2 IOC 拦截；
  - 凭据链被降权清理噪声；
  - 勒索消耗算力取消扣血；
  - 战斗胜利/奖励/地图推进。
- 将现有 `scripts/playtest-normal-run.ts` 纳入正式检查脚本，例如 `npm run check:playtest-run`。

**Step B：抽 deck/rng/state**

- 抽出最底层工具：抽牌、洗牌、弃牌、复制状态、随机选择。
- 这一步风险最低，能立刻减少 `engine.ts` 噪音。

**Step C：抽 attackChain.ts**

- 这是后续最重要的领域模型。
- 目标：所有 C2/凭据/勒索/IOC/降权/算力反制逻辑集中在一个模块。
- UI 与战斗只消费“预测结果”和“结算结果”，不要散落判断。

建议接口：

```ts
export type AttackChainPreview = {
  incomingDamage: number;
  mitigatedDamage: number;
  consumedCompute: number;
  clearedNoise: number;
  warnings: string[];
};

export function previewAttackChain(state: GameState): AttackChainPreview;
export function resolveAttackChain(state: GameState): void;
export function applyIoc(enemy: EnemyState, amount: number): void;
export function applyPrivilegeReduction(enemy: EnemyState, amount: number): void;
```

**Step D：抽 cardEffects.ts**

- 把 `playCard` 拆成：校验 → 支付费用 → 结算效果 → 触发 after-play → 检查胜负。
- 卡牌效果用 effect handler 表驱动，而不是巨大 switch/if 堆叠。
- 短期仍可单敌人，但接口预留 `targetId?: string`。

建议接口：

```ts
export type PlayCardCommand = {
  uid: string;
  targetId?: string;
};

export function canPlayCard(state: GameState, command: PlayCardCommand): boolean;
export function playCard(state: GameState, command: PlayCardCommand | string): void;
```

> 兼容策略：`string` 旧调用继续可用，内部转换为 `{ uid }`。

**Step E：抽 combat/enemyAi/rewards/map**

- `combat.ts` 负责回合生命周期。
- `enemyAi.ts` 负责意图与敌方行动。
- `rewards.ts` 负责战斗后奖励生成。
- `map.ts` 负责路线与节点可达性。

拆完后 `engine.ts` 应减少到 100-200 行以内，仅作为 facade。

#### 2.1.4 引擎拆分验收标准

- `src/game/engine.ts` 从千行级降到 **≤ 220 行**。
- 单个 engine 子模块尽量 **≤ 350 行**，超过就继续拆。
- 所有现有检查通过：
  - `npm run check:theme`
  - `npm run check:attack-chain`
  - `npm run check:engine-scenarios`
  - `npm run build`
- 新增 `check:playtest-run`，固定 normal seed 通关或达到预期结果。
- 浏览器手动冒烟：进入游戏 → 第一战 → 打出攻击牌 → 结束回合 → 胜利奖励 → 地图推进。

---

### 2.2 P0：资源分包与压缩计划

#### 2.2.1 当前观察

当前最大资源集中在：

- 胜利/背景 MP4：约 2.9-4.2MB/个。
- poster PNG：约 2.7-3.6MB/张。
- BGM MP3：约 3.9MB。
- 战斗背景 PNG：约 3.1MB。
- 主 JS chunk：约 1.38MB，Vite 有 chunk warning。

这对 v0.2.2 demo 尚可，但对继续扩内容不可持续。

#### 2.2.2 资源预算

| 类型 | v0.2.3 目标 | v0.3.0 目标 |
|---|---:|---:|
| 普通 poster | < 800KB/张 | < 500KB/张 |
| Boss poster | < 1.2MB/张 | < 800KB/张 |
| 普通胜利视频 | < 2MB/个 | < 1.5MB/个 |
| Boss 视频 | < 4MB/个 | < 3MB/个 |
| BGM 单曲 | < 2.5MB | < 2MB |
| 首屏必须资源 | < 8MB | < 5MB |
| Web dist 总量 | 下降 30%-45% | 下降 50%+ |

#### 2.2.3 压缩策略

**图片**

- PNG poster、大背景优先转 WebP。
- 敌人大图按显示尺寸生成 `1x/2x`，不要用超大原图直出。
- 建立脚本：`scripts/optimize-assets.mjs`。
- 保留源文件到 `assets/source/` 或不进包目录，运行时只引用 optimized 文件。

推荐命令思路：

```bash
# poster / 大图
cwebp -q 78 input.png -o output.webp

# 如果无 cwebp，可先用 imagemagick
magick input.png -resize 1920x1080\> -strip -quality 82 output.webp
```

**视频**

- 胜利短视频统一 H.264 MP4，限制分辨率/码率。
- 普通胜利视频建议 720p 或 900p，不要全都 1080p 高码率。
- 背景 loop 降码率并确认无明显 banding。

推荐命令思路：

```bash
ffmpeg -i input.mp4 \
  -vf "scale='min(1280,iw)':-2" \
  -c:v libx264 -preset slow -crf 28 \
  -movflags +faststart \
  -an output.mp4
```

**音频**

- BGM 可降到 128-160kbps MP3 或 OGG。
- SFX 保持短小，统一采样率，避免未压缩 WAV 进入包。

#### 2.2.4 分包策略

当前 `App.tsx` 顶部 `new URL(...)` 直接引用所有敌人、poster、视频，会让构建把许多资源纳入主依赖图。要改成“按场景/敌人需要时才解析”。

建议：

1. 建立资源 manifest：

```text
src/game/assets.ts
```

```ts
export type EnemyAssetId = "lantern" | "waterghost" | ...;

export const enemyArtManifest = {
  lantern: () => new URL("../../assets/optimized/enemies/lantern.webp", import.meta.url).href,
};

export const cinematicManifest = {
  lantern: {
    poster: () => new URL("../../assets/optimized/cinematics/victory-lantern-poster.webp", import.meta.url).href,
    video: () => new URL("../../assets/optimized/cinematics/victory-lantern.mp4", import.meta.url).href,
  },
};
```

2. UI 只在进入对应战斗/胜利页时读取对应资源。
3. Vite 增加 manual chunks：

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        react: ["react", "react-dom"],
        phaser: ["phaser"],
      },
    },
  },
}
```

4. 将胜利视频做懒加载：胜利页先显示 poster，再用户点击/自动延迟加载 video。
5. Electron 包中可考虑 `extraResources` 分离大视频，未来做 DLC/章节资源包：

```text
resources/
  base/        # 首章核心资源
  cinematics/  # 可选演出资源
  audio/        # 可替换音频包
```

#### 2.2.5 资产治理验收标准

- 增加 `npm run assets:audit`：输出 top assets、总量、超预算列表。
- 增加 `npm run assets:optimize`：可重复生成 optimized 资源。
- `dist/assets` 总体积比当前下降至少 **30%**。
- poster PNG 基本替换为 WebP。
- 胜利视频不进入首屏必要加载路径。
- `npm run build` 不再出现主 chunk 过大的无治理 warning，或至少已有明确 manualChunks。

---

### 2.3 P1：UI/App 解构计划

虽然你这次优先点名引擎，但 `App.tsx` 同样已经到拆分临界点。建议在引擎 P0 完成后立刻拆 UI，避免逻辑和表现继续纠缠。

目标目录：

```text
src/ui/
  screens/
    TitleScreen.tsx
    LoadingScreen.tsx
    MapScreen.tsx
    CombatScreen.tsx
    RewardScreen.tsx
    EventScreen.tsx
    ShopScreen.tsx
    RestScreen.tsx
    GameOverScreen.tsx
    AboutScreen.tsx
  components/
    TopHud.tsx
    CardView.tsx
    EnemyPanel.tsx
    PlayerPanel.tsx
    AttackChainPanel.tsx
    MapNode.tsx
    RewardCard.tsx
  hooks/
    useGameAudio.ts
    useGameTransaction.ts
    useCardDrag.ts
```

验收：

- `App.tsx` 降到 **≤ 250 行**。
- `CombatScreen.tsx` 可稍大，但不超过 **450 行**。
- 资源 URL 从 `App.tsx` 移到 `src/game/assets.ts` 或 `src/ui/assets.ts`。
- UI 拆分期间不改玩法，所有检查通过。

---

## 3. v0.2.3 试玩体验修正

### 3.1 卡牌交互：短期统一为“点击或拖出施放”

当前引擎没有目标参数，短期只有单敌人。因此不要继续告诉玩家“拖到目标身上”。

改法：

- 文案改为：`点击卡牌或拖出手牌区施放；攻击默认命中当前攻击链。`
- 攻击牌 hover 显示预计伤害、IOC/降权变化。
- 防御/Power 牌显示作用对象：`自身 / 全局 / 当前敌人`。
- 代码接口预留 `targetId`，但 v0.2.3 不必做多敌人。

验收：第一场战斗新玩家不需要试错拖拽位置即可打出牌。

### 3.2 地图决策：让路线选择变成真实策略

改法：

- 每个节点显示：风险、奖励倾向、可能敌人/事件标签。
- 同名节点增加副标题，例如：
  - 边界告警 / 凭据迹象
  - 边界告警 / 端口扫描
  - 高危入侵 / C2 信标
- Hover 或选中节点时高亮未来 1-2 跳路线。
- 节点详情加明确 CTA：`前往此节点`。
- 精英/商店/维护窗口的风险收益差异更明显。

验收：玩家能说出“我为什么选这条线”。

### 3.3 0 费循环：先限长链，不要砍爽感

不建议一刀砍抽牌。当前 demo 的爽感来自循环，但要防止中后期变成机械清手牌。

建议第一轮调参：

| 项 | 当前问题 | v0.2.3 建议 |
|---|---|---|
| 日志检索 | 0 费抽 2 太强 | 改为 0 费抽 1；若敌人有 IOC 再抽 1，升级后稳定抽 2 |
| 快速 triage | 0 费防护+抽牌过强 | 未升级只防护，升级后抽 1 |
| 查询缓存 | 可滚雪球触发长链 | 每回合首次打出第 3 张牌抽 1 |
| 持续监控 | 长局持续放大 | 保留，但加清晰 Power 计数展示 |

也可以加入敌人反循环机制：`每回合玩家打出第 6 张牌后，注入 1 噪声或敌人强度 +1`，但这建议先给精英/Boss，不要普遍惩罚。

### 3.4 Boss 阶段化：让终局有记忆点

勒索核心建议变成三阶段：

| 阶段 | 触发 | 机制 |
|---|---|---|
| Phase 1 入侵扩散 | 100%-70% HP | 常规攻击、注入噪声、提示勒索倒计时 |
| Phase 2 加密爆发 | 70%-35% HP | 每 3 回合检查算力；不足则真实伤害或封锁抽牌 |
| Phase 3 恢复窗口 | <35% HP | 减少防护，增加爆发；玩家若用算力/IOC 可打断大招 |

UI：增加一个明显的“勒索倒计时 / Recovery Window”槽，不只写在日志里。

验收：Boss 不只是 14 回合慢磨，而是至少有 2 次玩家能感知的阶段变化。

---

## 4. v0.2.4 内容扩展计划

只有在 v0.2.3 完成并通过回归后，再做内容扩展。

### 4.1 新事件 4-6 个

方向：让安全主题有“非战斗决策”。

候选：

1. 供应链告警：拿一张强工具，但向牌组塞一张噪声。
2. 合规审计：失去预算，移除一张噪声/弱牌。
3. 威胁情报共享：花预算选择 IOC 流奖励或降权流奖励。
4. 值班疲劳：恢复 HP 或升级牌，但下一战初始少 1 能量。
5. 红队演练：打一场小精英，胜利获得稀有工具。
6. 误报风暴：立即获得预算，但下一战开局噪声 +2。

### 4.2 新敌人 3-4 个

每个敌人必须对应一个解题压力，不要只是数值不同。

| 敌人 | 压力 | 推荐解法 |
|---|---|---|
| 横向移动者 | 每回合未降权则强度成长 | 降权/隔离 |
| 数据外传器 | 倒计时后真实伤害 | IOC 爆发/算力打断 |
| 噪声制造器 | 污染抽牌与弃牌 | 清噪/低成本防御 |
| 内鬼进程 | 玩家多打牌会反击 | 高质量单牌/控制节奏 |

### 4.3 新卡/工具

原则：补流派，不堆数量。

- IOC 流：更明确的 payoff 和阶段性爆发。
- 降权流：防御同时削弱凭据/横移类敌人。
- 算力流：把算力从“额外资源”变成勒索/恢复战的关键解法。
- 噪声流：让清噪和利用噪声都成立。

---

## 5. v0.3.0 公开试玩候选

v0.3.0 才考虑更公开地发。

目标：

- 一章完整体验 20-30 分钟。
- 2-3 条可识别构筑路线。
- 8-12 个敌人，2 个 Boss/小 Boss。
- 首次机制提示完善。
- 三平台 Release 自动构建验证通过。
- 包体有预算，不因资源继续线性膨胀。
- README、下载说明、故障说明、截图/视频素材完整。

不建议 v0.3.0 前做：

- Steam 页面正式公开；
- 大规模投放；
- 复杂剧情分支；
- 多敌人系统大改，除非先完成 target API 设计；
- 大量新视频演出。

---

## 6. 工程任务拆解

### Sprint 1：引擎拆分安全网（已完成）

- [x] 整理当前 engine 公共导出：`src/game/engine/index.ts` 聚合导出，`src/game/engine.ts` 为兼容 facade。
- [x] 把固定跑局纳入 package script：`check:playtest-run` 已进入 `npm run check`。
- [x] 增加 story/normal/hard smoke fixtures：`scripts/check-playtest-runs.ts` 覆盖 3 个难度固定跑局。
- [x] 给攻击链反制、战斗胜利、奖励、地图推进补断言：`check:attack-chain`、`check:engine-scenarios` 与 playtest fixtures 共同覆盖。
- [x] 建立 `src/game/engine/` 目录和 `index.ts`。

当前证据：`package.json` 的 `check` 包含 theme / attack-chain / engine-scenarios / playtest-run；`src/game/engine.ts` 当前 1 行。

### Sprint 2：引擎模块化（已完成第一轮）

- [x] 抽 `rng.ts`、`deck.ts`、`state.ts`。
- [x] 抽 `attackChain.ts`。
- [x] 抽 `cardEffects.ts`，保留旧 `playCard(uid)` 兼容，并已预留 `PlayCardCommand.targetId`。
- [x] 抽 `combat.ts`、`enemyAi.ts`。
- [x] 抽 `map.ts`、`rewards.ts`、`events.ts`、`shop.ts`、`rest.ts`。

当前证据：`src/game/engine/` 包含 18 个模块；`engine.ts ≤ 220 行` 的目标已超过完成（当前 1 行）。后续如继续改玩法，应保持模块边界，不把逻辑回填到 UI 或 facade。

### Sprint 3：资源治理（1-3 天）

- [x] 加 `assets:audit` 脚本，输出 top assets、类型/区域占比、runtime/generated/dist 三种审计视图与预算违规。
- [x] 加 `assets:optimize` 脚本，生成 WebP/压缩 MP4/压缩音频；支持 `--dry-run`、`--check`、`--force`、ffmpeg 依赖检查与压缩前后 summary。
- [x] 引入 `assets/optimized/`，UI/BGM 入口改用 optimized；`assets/generated` 仅作源素材诊断。
- [x] 胜利视频懒加载，poster 先显示。
- [x] Vite manual chunks：react/phaser 分包。
- [x] 处置过场 `CinematicScreen` 独立 lazy chunk，主入口不再静态绑定全部过场素材表。
- [x] 非首屏 run/choice screens 拆到 `RunScreens` lazy chunk；首屏只保留 title/about/loading，主入口首屏 chunk 进一步瘦身。

Done 条件：`dist/assets` 总体积下降 ≥30%；首屏资源显著减少；build 通过。

### Sprint 4：UI 解构与交互修正（主要完成，保留继续瘦身债务）

- [x] 拆 `TopHud`、`TitleScreen`、`MapScreen`、`CombatScreen`。
- [x] 资源 URL 从 `App.tsx` 移走：当前资源入口在 `src/ui/assets.ts` 等 UI/资源模块中，`App.tsx` 不再静态绑定大素材表。
- [x] 卡牌交互文案改为点击/拖出施放。
- [x] 卡牌 hover/卡面显示预计效果：`previewCardEffect` 已接入 `GameCard`。
- [x] 地图节点增加风险/奖励/二跳预览：`MapScreen` 已展示风险、收益、节奏、适合场景和下一跳。

当前证据：`App.tsx` 当前 250 行；`CombatScreen.tsx` 当前 381 行。旧 Done 条件已基本满足，但浏览器截图/真人“无困惑”仍应由 v0.2.8 闭门试玩反馈确认。

### Sprint 5：数值与 Boss 修正（部分完成，等待真实反馈判定）

- [x] 调整 0 费抽牌链：`日志检索/windScroll` 已改为敌方有 IOC 时额外抽牌，避免无条件 0 费抽 2。
- [x] 查询缓存改为第 3 张节奏触发：`blankPage` 当前按 `queryCacheProgress` 每 3 张牌抽 1，并在 UI 预告进度。
- [x] Boss 加三阶段与倒计时 UI：`previewAttackChain` 输出 Boss phase 与 ransomware countdown，`CombatIntelPanel`/Boss HP 标记消费该信息。
- [x] story/normal/hard 固定跑局已纳入 `check:playtest-run`；数值是否足够有压力仍需 v0.2.8 闭门反馈判断。

Done 条件更新：自动 fixtures 只证明可通关和规则不崩；“循环是否过长、Boss 是否有压迫感”必须看反馈表与试玩报告，不再靠内部单次判断直接宣布完成。

### Sprint 6：发布与外部试玩（v0.2.8 已完成发布；v0.2.9 正在做反馈闭环）

- [x] 修 README 旧仓库/release 链接：当前 README 指向 `zhuowater/Night-Patrol` 与 `v0.2.8-demo`。
- [x] 完成/验证 GitHub Actions 三平台 release workflow：已能产出 Linux/macOS/Windows 资产；当前已统一为 `.github/workflows/release.yml` 一条权威发布链路，并移除历史重复 workflow。
- [x] 发布 `v0.2.8-demo`：Release 页面已有 Linux x64、macOS arm64、Windows x64 桌面试玩资产。
- [x] 浏览器打开 Release 页面确认资产展示：见 `docs/playtest/v0.2.9-distribution-qa.md`。
- [x] 准备给 5-10 个闭门玩家的下载说明和反馈表：见 `docs/playtest/v0.2.8-closed-playtest-instructions.md`、`v0.2.8-feedback-form.md`、`v0.2.8-feedback-summary-template.md`。

当前 Done 条件：分发材料已闭环；真正未完成的是“回收 5-10 份有效反馈并形成 v0.2.9 P0/P1 实施列表”。

---

## 7. 风险与取舍

### 7.1 引擎拆分风险

最大风险是“移动代码时改变行为”。解决办法：先加 fixtures，再每拆一步跑测试；不要在拆分 PR 里混入数值改动。

### 7.2 资源压缩风险

最大风险是画质下降、视频出现糊/色带。解决办法：建立前后对比截图/短视频，关键 boss 演出给更高预算，普通演出压得更狠。

### 7.3 UI 拆分风险

最大风险是拆组件时把状态流弄乱。解决办法：App 仍持有顶层状态，子组件先做纯展示 + callback，不急着引入复杂 store。

### 7.4 内容扩展诱惑

现在最容易犯的错是继续加卡和敌人，因为那最有成就感。但当前瓶颈是维护性和表达清晰度，不是内容数量。

---

## 8. 推荐优先级结论

当前不再是 v0.2.3 的“先搭地基”阶段；地基已经搭过一轮。接下来如果只做三件事，顺序应改为：

1. **闭门试玩反馈回收**：把 `v0.2.8-demo` 发给 5-10 名玩家，先确认下载/启动/第一战/C2/噪声/地图/奖励/Boss 是否被理解。
2. **发布工程可重复化**：桌面发布链路已统一到 `.github/workflows/release.yml`；后续重点是每次 tag 发布后继续执行 `npm run check && npm run build && npm run assets:optimize -- --check`，并打开浏览器确认 Release 页面资产展示。
3. **按反馈修 P0/P1，不先扩内容**：如果反馈显示第一局理解断点，优先修 cue、地图、奖励、Boss；如果反馈样本健康，再进入 v0.3.0 内容扩展。

当前口号应从 v0.2.3 的“解构核心、瘦身包体、讲清玩法”更新为：

> **Ship the closed playtest, collect signal, then expand.**
> 先发闭测、收信号，再扩内容。

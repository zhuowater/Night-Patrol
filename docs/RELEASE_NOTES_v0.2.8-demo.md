# 《夜巡 SOC：边界告警》v0.2.8-demo Release Notes

> Release type: first-run guidance / information architecture polish.  
> Baseline: `v0.2.7-demo` → `v0.2.8-demo`.

## 本版定位

`v0.2.8-demo` 不是加内容版，而是把第一局体验从“信息已经很完整”推进到“第一次玩的玩家知道先做什么”。

核心问题：

> 玩家进入第一战后，能不能先理解敌方意图、推荐行动、手牌价值，再按需展开专家级攻击链细节？

## 主要改动

### 1. 首次跑局 cue

新增会话内 guidance state，用于记录玩家是否已经看过关键教学提示：

- 第一战：提示先看敌方意图，再选择补防护/反制牌。
- 首次 C2：解释 C2 信标与 IOC 拦截关系。
- 首次噪声：解释噪声告警是坏牌/告警债。
- 首次奖励：提示奖励选择应先看候选卡牌与构筑价值。

这些 cue 都是轻量、可关闭、非强制，不写入 localStorage。

### 2. 回合级推荐行动条

新增 `recommendTurnAction(...)`，把已有卡牌级 threat hint 汇总为一条当前建议：

- 敌方攻击高压时优先补防护。
- C2 窗口优先 IOC 拦截。
- 勒索倒计时优先临时算力准备。
- 敌方已有 IOC 时提示兑现爆发。

目标是让玩家不用先读完每张牌，也能知道“此回合先关注什么”。

### 3. 战斗情报层级重排

`CombatScreen` / `CombatIntelPanel` 从 `App.tsx` 抽到独立文件，降低继续迭代 UI 的风险。战斗情报面板默认突出：

1. 当前意图；
2. 建议响应；
3. 反制窗口与 readiness；
4. 专家细节折叠展开。

### 4. 资源语言治理

统一区分两类资源：

- **响应算力**：本回合用于打出响应牌，回合开始刷新。
- **临时算力**：战斗内临时积累，用于全域清剿、勒索恢复演练等爆发/反制。

相关 HUD、卡牌 aria-label、预览、日志和 Boss 文案已跟进。

### 5. 奖励页聚焦

奖励页现在把三张候选响应动作作为主视觉，工具奖励和响应日志进入次级区域：

- 候选牌下方保留预计效果、取证价值、战术代价。
- 工具奖励保留“适合构筑 / 为什么值钱”，但不再抢第一视觉。
- 响应日志折叠，避免新玩家结算后被历史信息淹没。

### 6. 地图渐进披露

地图上当前可选节点最突出，下一跳轻提示，远端节点弱化并显示“待侦察”。目标是让路线界面更像“当前决策”，而不是一次性读完整地图。

### 7. Boss 文案强化

勒索核心阶段文案更明确地表达最终考试：

- 扩散期：先稳防护，攻击从单点加密转为多段破坏。
- 擦除窗口：保留临时算力并兑现 IOC 爆发，必须尽快终结。

## QA 与试玩文档

新增：

- `docs/playtest/v0.2.8-closed-playtest-instructions.md`
- `docs/playtest/v0.2.8-feedback-form.md`
- `docs/playtest/v0.2.8-smoke-checklist.md`

Smoke checklist 覆盖：标题页、第一战 cue、推荐行动、C2/噪声 cue、奖励聚焦、地图披露、Boss 文案、胜利复盘、console error。

## 验证状态

本地最终已执行并通过：

```bash
npm run check && npm run build
```

当前覆盖：

- `check:theme` 通过。
- `check:attack-chain` 通过。
- `check:engine-scenarios` 通过，22 个场景。
- `check:playtest-run` 通过，3 个固定跑局 fixture。
- `npm run build` 通过。

生产预览浏览器 smoke 已执行：

- 预览资产：`assets/index-BTRVt-NK.css` / `assets/index-BjEW83kt.js`。
- 标题页：标题、难度选择、`接管夜班` CTA 可见。
- 地图页：当前节点突出、远端节点弱化；短视口下第二张路线卡会延伸到首屏下方，但第一张可选路线卡完整可点击，非阻塞。
- 战斗页：回合建议、响应算力、临时算力、专家细节折叠、结束回合、手牌可见。
- 浏览器 smoke 后未观察到阻塞 JS error。

## 已知非阻塞项

- Vite 仍提示 Phaser chunk 大于 500 kB；这是既有非阻塞警告。
- macOS demo 包仍为 ad-hoc 签名，未做 Apple 公证。
- v0.2.8 不新增敌人、卡牌、地图、存档或 meta-progression。

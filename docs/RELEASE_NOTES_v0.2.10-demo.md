# 《夜巡 SOC：边界告警》v0.2.10-demo Release Notes

> Release type: learnable failure / closed-playtest feedback quality build.  
> Baseline: `v0.2.9-demo` → `v0.2.10-demo`.

## 本版定位

`v0.2.10-demo` 不是内容扩展版，而是把 v0.2.9 的“能玩完、能分发”推进到“每局结束后知道为什么赢/输，下一局知道改什么”。

上一轮 5 人画像模拟中，核心循环成立，但 4/5 死于 Boss，且失败原因并不相同：有人过度防守被拖死，有人贪高危路线低血入场，有人多走事件导致构筑补偿不足，有人 hard 线 Boss 前血线过低。v0.2.10 的目标不是粗暴削 Boss，而是让这些失败变成可解释、可复盘、可改进的反馈。

## 主要改动

### 1. 本局 SOC 复盘

胜利与失败结算页新增本局复盘面板，展示：

- 本局路线与关键节点；
- Boss 入场血量与风险；
- 关键战斗摘要；
- 事件选择、奖励与工具获取；
- 死亡/胜利原因推断；
- 下一局建议。

目标是让试玩者结束后能回答：我为什么赢/输，下一局应该改路线、构筑还是战斗打法。

### 2. Boss 入场风险与死因推断

引擎现在记录 Boss 入场血线和战斗摘要，复盘页会把低血入场、长战耗损、防护不足、构筑过厚等风险转成玩家可读提示。

### 3. 事件路线构筑补偿

异常事件路线不再只是读文本：部分事件选择会给更明确的预算、卡牌或升级补偿，降低“安全玩家被事件吸引但构筑变弱”的问题。

### 4. 短视口信息层级第二轮

在低高度窗口下，战斗情报面板进一步压缩非关键内容，专家细节默认折叠，保留当前意图、建议响应和可操作 CTA 的可见性。

### 5. 地图 CTA 与构筑缺口提示

地图候选节点卡片新增明确的 `进入该节点` CTA。奖励/商店界面新增构筑缺口提示，例如 IOC 不足、防护不足、牌组偏厚或可升级点不足，帮助玩家把选择和下一局改进联系起来。

## 闭门试玩材料

本版对应试玩材料：

- 试玩说明：`docs/playtest/v0.2.10-closed-playtest-instructions.md`
- 反馈表：`docs/playtest/v0.2.10-feedback-form.md`
- 反馈汇总模板：`docs/playtest/v0.2.10-feedback-summary-template.md`
- 开发计划：`docs/plans/2026-05-03-v0.2.10-learnable-run-recap.md`

本轮反馈重点：

1. 第一局结束后，玩家能否复述为什么赢/输；
2. 复盘页哪条信息最有用，哪条不准或没用；
3. 玩家是否知道下一局该改路线、构筑还是打法；
4. 事件路线是否仍然感觉亏；
5. Boss 入场前是否知道血线危险。

## QA 与验证状态

本地 release gate 已执行并通过：

```bash
git diff --check
npm run check
npm run assets:optimize -- --check
npm run assets:audit
npm run build
```

覆盖项：

- `check:theme` 通过；
- `check:attack-chain` 通过；
- `check:engine-scenarios` 通过，22 个场景；
- `check:playtest-run` 通过，story / normal / hard 三档固定跑局均胜利；
- `check:run-summary` 通过；
- `check:short-viewport` 通过；
- `check:map-build-gap` 通过；
- `assets:optimize -- --check` 通过；
- `assets:audit` 运行时资源预算无超标；
- `npm run build` 通过。

浏览器 smoke 已执行：标题页与地图页正常，第一张候选节点卡片的 `进入该节点` CTA 在 DOM 与截图中均可见。

## 发布资产

GitHub Actions 在 tag push 后会构建并上传：

- Linux x64: `.AppImage` 与 `.zip`
- macOS arm64: `.dmg` 与 `.zip`
- Windows x64: `.exe` 与 `.zip`

## 已知非阻塞项

- Vite 仍提示部分 chunk 大于 500 kB，主要来自 Phaser 和媒体资源；当前作为 demo 非阻塞项处理。
- macOS / Windows 包仍未正式签名或公证，首次打开可能出现系统安全提示。
- 复盘页的死因推断是启发式，不保证完全等同玩家主观原因；这正是本轮闭门试玩需要验证的重点。
- 本版仍不扩新章节、新敌人、新卡牌大包；真实反馈回来后再决定 v0.2.11 的 P0/P1。

## 推荐试玩方式

请把 GitHub Release 的桌面包发给 5-10 名闭门试玩者，并配套发送：

- `docs/playtest/v0.2.10-closed-playtest-instructions.md`
- `docs/playtest/v0.2.10-feedback-form.md`

不要让试玩者下载 `Source code`，那不是可直接运行的客户端。

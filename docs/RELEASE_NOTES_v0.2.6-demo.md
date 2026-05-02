# 《夜巡 SOC：边界告警》v0.2.6-demo Release Notes

> Release type: clarity/playtest readiness build.  
> Current baseline: `v0.2.5-demo` → `v0.2.6-demo`.

## 本版定位

`v0.2.6-demo` 不是内容扩展版，而是闭门试玩准备版。

这版优先解决：

- 新玩家不知道从哪里下载、怎么试玩、反馈什么；
- 战斗里的攻击链预告逻辑散在 UI 中，不利于后续验证；
- Boss / 勒索倒计时不够显眼；
- 地图路线选择的“为什么选这里”不够明确；
- 卡牌打出前缺少预计效果说明。

## 主要改动

### 1. 闭门试玩包文档

新增：

- `docs/playtest/v0.2.6-closed-playtest-instructions.md`
- `docs/playtest/v0.2.6-feedback-form.md`

用途：

- 给试玩者一份可直接转发的下载/安装/试玩目标说明；
- 给开发者一份结构化反馈模板，覆盖启动、理解、战斗、地图、卡牌、结算和阻塞问题。

### 2. 攻击链预览进入 engine 单一来源

新增/调整：

- `previewAttackChain(state)`
- `AttackChainPreview`
- engine scenario 断言覆盖：
  - 勒索倒计时预告；
  - 算力足够时取消扣血提示；
  - Boss 二/三阶段提示；
  - 查询缓存进度提示。

效果：UI 不再自己复制风险预告、反制窗口、Boss 阶段、查询缓存等逻辑。

### 3. Boss / 勒索倒计时显性 UI

战斗情报面板新增独立的「勒索倒计时」槽位：

- 显示“几回合后触发”或“本回合结束触发”；
- 显示是否已有足够算力取消扣血；
- 用更高压的视觉样式与普通链路风险区分。

### 4. 地图路线解释增强

地图右侧「路径情报」补充：

- 选择该节点的风险/收益；
- 节奏成本；
- 下一跳可接节点；
- 适合何种局势。

目标：让玩家知道自己是在做构筑/回血/采购/高危工具的取舍，而不是随机点格子。

### 5. 卡牌预计效果文本

新增：

- `previewCardEffect(card, context?)`

并在卡牌展示、奖励、商店、选牌等界面显示基础预计效果，例如：

- 预计造成多少伤害；
- 预计获得多少防护；
- 是否抽牌/归档消耗；
- 是否依赖 IOC；
- 是否消耗当前算力。

本版只做 display-only 预测，不做完整模拟器。

## 验证状态

本地 release gate 已执行并通过：

```bash
npm run check
npm run build
npm run desktop:dist
```

覆盖结果：

- `check:theme` 通过。
- `check:attack-chain` 通过。
- `check:engine-scenarios` 通过，14 个场景。
- `check:playtest-run` 通过，story / normal / hard 三个 fixture 均通关。
- 生产 preview 浏览器 smoke 通过：标题页、地图路线说明、首战卡牌预测、攻击链面板可见，控制台未发现阻塞性 runtime error。
- GitHub Actions release workflows 通过。
- GitHub Release 页面已实际打开确认，Assets 包含 Linux / macOS / Windows 桌面包。

## 发布资产

本 release 包含：

- Linux x64: `.AppImage` 与 `.zip`
- macOS arm64: `.dmg` 与 `.zip`
- Windows x64: `.exe` 与 `.zip`

## 已知非阻塞项

- Vite 构建仍提示部分 chunk 大于 500 kB，主要来自 Phaser 和视频/音频资源；这不是 v0.2.6 的阻塞项。
- macOS 包仍是 demo 阶段 ad-hoc 签名，未做 Apple 公证。

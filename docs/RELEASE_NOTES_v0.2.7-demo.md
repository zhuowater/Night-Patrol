# 《夜巡 SOC：边界告警》v0.2.7-demo Release Notes

> Release type: player-perception polish / closed-playtest readiness build.  
> Baseline: `v0.2.6-demo` → `v0.2.7-demo`.

## 本版定位

`v0.2.7-demo` 不是内容扩展版，而是把已经存在的系统“显性化”的闭门试玩打磨版。

核心问题：

> 第一次玩的人，能不能一眼看到当前反制窗口、知道哪张牌解决当前威胁、理解奖励为什么值钱，并在通关后说清楚自己这一局是怎么赢的？

## 主要改动

### 1. 反制条件 readiness chips

`previewAttackChain(state)` 现在输出结构化 `counterplayReadiness`：

- C2：`IOC ≥ 1`，显示当前 IOC 与 `已满足 / 还差 1 IOC`。
- 凭据：显示敌方降权与当前噪声数量。
- 勒索：显示算力条件与是否可取消倒计时惩罚。
- 横向移动：显示降权窗口。

UI 在战斗情报面板中用 chips 显示要求、当前值和状态，保留原有 counterplay prose 兼容。

### 2. 卡牌级“解决当前威胁”提示

新增 `cardThreatHint(card, context)`：

- 敌方攻击时，防护牌提示 `补足防护窗口`。
- C2 链路中，IOC 牌提示 `可拦截 C2 信标`。
- 勒索链路中，算力牌提示 `补算力取消倒计时`。
- 凭据/横向移动链路中，降权牌提示 `可压制凭据/横移`。
- 敌方已有 IOC 时，IOC payoff 牌提示 `兑现 IOC 爆发`。

不可打出/费用不足/状态牌不会被推荐。

### 3. Boss 阶段可视化

Boss HP 条加入阶段 tick：

- 66%：横向扩散阶段。
- 33%：核心擦除阶段。

勒索倒计时块继续保持高压视觉，帮助玩家把 Boss 看成 final fight，而不是更厚的普通怪。

### 4. 胜利页升级为本局复盘

胜利页从纯文案升级为 run summary：

- 响应评级。
- 难度。
- 最终 HP。
- 巡逻进度。
- 牌组规模。
- 工具数量与工具列表。
- 最近响应日志。

目标是让闭门试玩者赢了之后能复述自己的构筑和路线。

### 5. 工具奖励更像奖励

Elite / reward 相关界面强化工具价值：

- 结算页显示 `新工具入库`。
- 奖励页显示工具效果。
- 新增 `适合构筑` 与 `为什么值钱` 两块说明。

本版不改变工具掉落和数值，只改表达。

### 6. 决策辅助：升级、事件、商店

- 升级清单显示 before/after delta，例如：
  - `6 → 9 伤害`
  - `5 → 8 防护`
  - `抽 2 → 3`
- 事件选择显示 `预计结果：...`。
- 事件结算写入明确日志摘要。
- 商店卡牌显示推荐理由。
- 工具摊位显示构筑方向。
- 删牌显示当前删牌价值原因。

随机奖励不伪造确定结果，预览会写成“随机响应剧本 / 随机安全工具 / 进入清单”等诚实描述。

### 7. 标题 / 地图 / 选择页视口适配

针对常见 laptop/browser 视口做紧凑响应式修正：

- 1365×768 下标题不孤字换行。
- 地图节点高度和间距更紧凑。
- 路径情报/日志区域允许内部滚动。
- 选择页、奖励页、商店页更适配低高度窗口。

## QA 与试玩文档

新增：

- `docs/playtest/v0.2.7-smoke-checklist.md`
- `docs/playtest/v0.2.7-feedback-form.md`

Smoke checklist 覆盖：标题页、地图、首战、反制 chips、Elite 奖励、事件、升级、商店、Boss、胜利复盘、console error。

## 验证状态

本地已执行并通过：

```bash
npm run check
npm run build
npm run desktop:pack
git diff --check
```

当前覆盖：

- `check:theme` 通过。
- `check:attack-chain` 通过。
- `check:engine-scenarios` 通过，20 个场景。
- `check:playtest-run` 通过，story / normal / hard 三个 fixture 均通关。
- `npm run build` 通过。
- `npm run desktop:pack` 通过，Linux unpacked 包生成到 `release/linux-unpacked`。
- `git diff --check` 通过。

浏览器 smoke 已在生产预览完成：

```bash
npm run preview -- --host 127.0.0.1 --strictPort
```

最终 served 资源：

- CSS：`assets/index-Baagkhwf.css`
- JS：`assets/index-DbGJ7hCM.js`

实际视口 `1280×581` 下确认：标题页、地图当前节点、首战攻击链 chips / 风险预告 / 反制窗口 / 当前意图 / 手牌底部留白均无阻塞裁切。

## 已知非阻塞项

- Vite 仍提示 Phaser chunk 大于 500 kB；这是既有非阻塞警告。
- macOS demo 包仍为 ad-hoc 签名，未做 Apple 公证。
- v0.2.7 不新增敌人、卡牌、地图、存档或 meta-progression。

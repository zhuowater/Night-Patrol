# 《夜巡 SOC：边界告警》专业评估报告

**项目**：Night-Patrol / 夜巡 SOC：边界告警  
**仓库**：https://github.com/zhuowater/Night-Patrol  
**版本/提交**：v0.2.2-demo / `45c4920 ci: build desktop clients for all platforms`  
**评估时间**：2026-05-01 10:15 EDT  
**评估方法**：结合游戏项目阶段判断、设计评审、代码评审、试玩报告、平衡、UX、内容审计等 game-dev 视角，并基于本地仓库与验证命令输出。

---

## 0. 执行摘要

结论：**这是一个“能发给第一批玩家试玩的竖切 demo”，不是玩具原型；但还没到可正式宣发、商业化或公开大规模扩散的 polish 状态。**

综合评级：

| 维度 | 评级 |
|---|---:|
| 当前阶段 | Production 后段 / Playtest Candidate |
| 专业完成度 | 7.2 / 10 |
| 可玩 demo 可信度 | 高 |
| 正式产品化可信度 | 中等，需要继续打磨 |

强判断：**值得继续做。** 但 v0.2.3 应该走“试玩反馈 + 规则清晰 + 架构拆分”，不要急着第二关，不要急着更多视频，不要急着商业化。

---

## 1. 验证基线

本轮评估重新执行了核心验证命令：

```bash
npm run check:theme
npm run check:attack-chain
npm run check:engine-scenarios
npm run build
```

结果：**全部通过。**

验证覆盖：

- 网络安全主题文案检查通过。
- 攻击链反制检查通过。
- 规则场景检查通过，包括：
  - lethal IOC 优先结算；
  - C2 有 IOC 拦截；
  - C2 无 IOC 注入噪声；
  - 凭据链降权清洗噪声；
  - 勒索有算力取消扣血；
  - 勒索无算力扣血。
- TypeScript + Vite 构建通过。

构建警告：Vite 仍提示部分 chunk 大于 500KB，属于性能/包体优化项，不阻塞 demo 发布。

---

## 2. 项目阶段判断

### 2.1 当前不是 Concept，也不是单纯 Prototype

项目已经具备：

- 完整第一关路线；
- 标题页、难度选择、地图、战斗、奖励、事件、市场、维护窗口、Boss、结算；
- React + Phaser + Electron 的混合架构；
- 桌面包；
- GitHub Release；
- GitHub Actions 三平台打包；
- 自动化回归脚本；
- 浏览器实际试玩验证；
- 规则层攻击链反制测试。

所以它已经越过“我做了个 demo 看看”的阶段。

### 2.2 但也不是 Release / Polish 阶段

还缺：

- 系统化 playtest 数据；
- 完整 balance pass；
- 资源体积优化；
- UI/UX 可访问性与交互稳定性验证；
- 正式素材授权清单；
- 正式签名、公证、安装体验；
- 更清晰的构筑路线和中后段内容密度。

更准确的阶段是：

> **Vertical Slice / Playtest Candidate**  
> 可以给小范围玩家试玩，用反馈驱动 v0.2.3，而不是继续盲目堆功能。

---

## 3. 设计专业性评估

### 3.1 最大亮点：题材改造不是普通换皮

很多项目“赛博化”“安全化”只是把攻击牌叫防火墙，把怪叫病毒。这个项目目前做得更好：它已经把**网络安全的真实工作流**嵌入了一部分机制。

例如：

- `IOC` 对应原来的符印，但现在它不只是换名，而是接入：
  - C2 拦截；
  - 伤害结算；
  - 溯源打击；
  - 关联分析。
- `算力` 对应原香火，但现在接入：
  - 自动化响应；
  - 全域清剿；
  - 勒索恢复演练。
- `降权` 对应 weak，但现在接入：
  - 凭据链清洗噪声。
- `噪声告警` 对应污染牌，但符合 SOC 语境。

这点很关键。它已经从“志怪卡牌游戏换词”开始变成“安全响应卡牌游戏”。

### 3.2 当前核心幻想成立

玩家幻想是：

> 凌晨值班，有限资源，告警越来越多，必须在攻击链推进前做正确响应。

现在已经有几个专业上站得住的游戏体验：

- 看到 C2，要先有 IOC 才能拦截；
- 凭据污染不是单纯扣血，而是污染抽牌窗口；
- 勒索不是普通攻击，而是倒计时式压力；
- Boss / 高危敌人有 tradecraft 和 counter 文案；
- 战斗中会有主动打断反馈。

这说明设计方向是对的。

### 3.3 主要设计问题：仍然偏 Slay the Spire 语法

目前底层还是：

- 攻击；
- 格挡；
- 抽牌；
- 状态；
- 遗物；
- 商店；
- 路线。

这是正确的起步方式，能降低开发风险。但如果要变成有辨识度的产品，下一阶段需要让安全响应机制更不可替代。

现在玩家可能会觉得：

> “这是一款很有网络安全包装的杀戮尖塔 demo。”

下一步要追求：

> “这是一款只有网络安全题材才能成立的卡牌 roguelike。”

具体缺口：

1. **攻击链还不够结构化**  
   目前 C2、凭据、勒索有特殊规则，但还不是一个完整 attack chain board。可以考虑：侦察 → 初始访问 → 执行 → 持久化 → 横向移动 → 影响，每个阶段有不同威胁槽。

2. **响应动作标签还不够系统化**  
   当前有检测、隔离、清洗、清剿的感觉，但没有正式标签体系。建议下一版引入：Detection、Containment、Eradication、Recovery、Intelligence、Automation。

3. **构筑路线不够明确**  
   当前卡池约 20 张，能玩，但路线还不够鲜明。应该让玩家明显感到：IOC 爆发流、算力自动化流、防护反制流、噪声清洗/抽牌流、预算工具流。

---

## 4. 内容量评估

当前内容：

- 约 20 张响应动作牌；
- 10 个工具/遗物；
- 7 个敌人；
- 4 个事件；
- 多节点第一关地图；
- 3 个难度；
- Boss；
- 结算视频；
- 桌面包。

对 v0.2.2 demo 来说：**够。**  
但对可重复试玩来说：**偏少。**

### 4.1 事件太少

现在只有 4 个事件：

- 深夜误报告警；
- 灰色情报源；
- 短暂维护窗口；
- 供应链请求。

这几个质量不错，但数量少。玩家两三局后会很快见完。

建议 v0.2.3 至少扩到 8-10 个事件。优先补这些：

- 管理层要求立刻恢复业务；
- 监管审计窗口；
- 红队误触；
- 供应商远程维护；
- 误封核心业务；
- 备份不可用；
- EDR 授权过期；
- 值班同事交接信息缺失。

### 4.2 敌人数量可以接受，但行为差异还可以更大

目前敌人名和描述已经有区分，但 moves 仍比较经典：attack、block、buff、debuff、curse、blockAttack。

下一步应给每类攻击链一个独特压力：

- 端口扫描器：暴露面越高伤害越高；
- 钓鱼载荷：偷预算/塞弱凭据；
- 僵尸进程：死亡后复燃一次；
- 横向移动脚本：每回合复制一个小威胁；
- C2：偶数回合信标；
- 凭据窃取器：污染抽牌/降低手牌上限；
- 勒索核心：倒计时/恢复演练。

目前已有一部分，值得继续深化。

---

## 5. 代码架构评估

### 5.1 好的地方

#### 状态机清楚

核心状态集中在：

- `GameState`
- `CombatState`
- `PlayerState`
- `EnemyState`

流程基本清晰：

- `startRun`
- `chooseNode`
- `startCombat`
- `startPlayerTurn`
- `playCard`
- `endTurn`
- `winCombat`

对 demo 来说够稳。

#### 内容数据与引擎有一定分离

`content.ts` 放卡牌、敌人、节点、事件。  
`engine.ts` 放规则。  
这是正确方向。

#### 已经有回归脚本

尤其是：

- `check:theme`
- `check:attack-chain`
- `check:engine-scenarios`

这说明项目不是“靠手感改”，已经开始走工程化。

### 5.2 主要代码问题

#### `engine.ts` 太大

当前 `src/game/engine.ts` 是 **1143 行**。对 demo 可以接受，但后面继续加机制会变成风险点。

建议拆成：

```text
src/game/
  engine/
    run.ts
    combat.ts
    cards.ts
    enemies.ts
    attackChain.ts
    rewards.ts
    shop.ts
    events.ts
    map.ts
```

优先拆 `attackChain.ts` 和 `cards.ts`。因为之后最可能继续增长的是安全机制和卡牌效果。

#### `App.tsx` 也太大

当前 `src/App.tsx` 是 **1354 行**。里面同时有：

- 顶层状态；
- HUD；
- 标题页；
- 地图；
- 战斗；
- 奖励；
- 事件；
- 市场；
- 结算；
- 拖拽交互；
- 大量资源 URL。

短期能跑，长期难维护。

建议拆：

```text
src/ui/screens/
  TitleScreen.tsx
  MapScreen.tsx
  CombatScreen.tsx
  RewardScreen.tsx
  EventScreen.tsx
  ShopScreen.tsx
  RestScreen.tsx
  CinematicScreen.tsx

src/ui/components/
  TopHud.tsx
  CardView.tsx
  EnemyPanel.tsx
  AttackChainPanel.tsx
```

#### 资产路径仍残留旧主题命名

`App.tsx` 里还有很多：

```ts
assets/vendor/shushan/...
icon-bagua-gold
icon-talisman-paper
relic-bell
```

这不一定是玩家可见问题，但从专业项目治理看，这是技术债。以后多人协作时会造成“项目到底是志怪还是 SOC”的混乱。

#### README 有过期信息

README 里仍有旧 release 地址：

```text
https://github.com/op7418/Night-Patrol/releases
```

实际仓库应是：

```text
https://github.com/zhuowater/Night-Patrol/releases
```

并且 README 写的是 GitHub Actions 构建 macOS 与 Windows，但现在已经补了 Linux / macOS / Windows 三平台。这个要修，属于发布资料质量问题。

---

## 6. UX / 试玩角度评估

### 6.1 现在可试玩，但学习曲线偏硬

对熟悉卡牌 roguelike 和安全术语的人，会觉得很有意思。但普通玩家可能会卡在：

- IOC 是什么？
- 算力和能量有什么区别？
- 降权为什么能清洗凭据噪声？
- 暴露面是我暴露还是敌人暴露？
- “主动打断”到底造成了什么实际影响？

当前有文案说明，但还不够“游戏内教学化”。

### 6.2 建议补一个 3 分钟 onboarding

不需要复杂教程，建议加一个首次开局引导：

1. 第一张攻击牌：拖到敌人身上。
2. 第一张防护牌：拖到自己身上。
3. 第一次 IOC：解释“这是可叠加的攻击线索”。
4. 第一次 C2 / 凭据 / 勒索特殊机制：弹出一条短提示。

不要做长教程。做“关键机制首次出现时一行解释”。

### 6.3 战斗信息不错，但可能过密

现在安全术语、敌人描述、counter、日志、卡牌、意图、攻击链面板一起出现，专业感强，但信息密度高。

建议 v0.2.3 做两层信息：

- 默认层：玩家需要立刻做决策的信息；
- 展开层：tradecraft、详细安全解释、背景知识。

这样既保留专业感，又不压垮玩家。

---

## 7. 平衡评估

没有做完整数值仿真，但从当前数据看，v0.2.2 作为 demo 合理。有三个风险。

### 7.1 抽牌牌偏强

例如：

- `日志检索` 0 费抽 2 / 3；
- `快速 triage` 0 费防护 + 抽 1；
- `关联分析` 0 费抽 1，目标有 IOC 额外抽；
- `重放日志` 0 费洗回弃牌堆 + 抽牌 + 防护。

这些会让高熟练玩家较快构筑出循环。

短期没问题，因为 demo 要爽。长期需要小心 infinite / near-infinite loop。

### 7.2 Story 难度可能太慷慨

`story` 模式：

```ts
playerHp: 96
gold: 90
maxEnergy: 4
enemyHp: 0.82
enemyDamage: 0.72
startingRelics: oldUmbrella + blankPage
```

这很适合演示，但它可能掩盖 UX 和规则理解问题。试玩报告要分开记录：新手 Story、标准 Normal、熟练 Hard。不能只看 Story 通关率。

### 7.3 Boss 还不够阶段化

勒索核心现在已有倒计时反制，但 Boss 战整体还像一个高血量敌人。建议下一版做阶段：

- 70% HP：开始加密倒计时；
- 40% HP：召回 C2 信标；
- 20% HP：要求玩家在两回合内恢复/清剿，否则大额损失。

这样终局记忆点会强很多。

---

## 8. 视听与素材评估

### 8.1 好处

项目现在已经有：

- 大立绘；
- 背景图；
- 胜利视频；
- BGM/SFX；
- Electron 图标；
- Phaser 战斗舞台。

在 indie demo 里，这是很大的加分项。绝大多数技术 demo 死在“像网页表格”，这个项目已经明显像游戏。

### 8.2 主要问题：体积和资产治理

构建输出显示：

- `assets/generated` 约 67MB；
- 单个 poster 2.8MB - 3.7MB；
- 胜利视频 3MB - 4.4MB；
- `index.js` 1.44MB；
- 多个 PNG 敌人 700KB - 1.8MB。

这对 demo 可接受。但如果继续扩内容，必须开始资产预算管理。

建议目标：

- poster 转 WebP，单张 `< 800KB`；
- 普通胜利视频 `< 2MB`；
- boss 视频 `< 4MB`；
- 大图统一 WebP；
- 胜利视频按需加载，不进首屏关键路径；
- Phaser / React chunk 拆包。

---

## 9. 发布工程评估

这部分现在已经明显超过一般个人 demo。

已有：

- Electron 打包；
- Linux 本地包；
- GitHub Release；
- Release Notes；
- 三平台 GitHub Actions；
- 浏览器实际确认；
- tag 发布流程。

主要专业化缺口：

1. **README 仍有旧仓库链接**  
   需要立刻修。

2. **CI 需要下一个 tag 才验证新 workflow**  
   现在 workflow commit 在 tag 之后，所以新 workflow 主要从下一版生效。

3. **代码签名/公证缺失**  
   demo 阶段可以接受。公开大范围分发前要补 Windows code signing、macOS notarization 和安装器提示说明。

---

## 10. 最大风险排序

| 优先级 | 风险 | 说明 |
|---|---|---|
| P0 | 文档/仓库信息不一致 | README 还指向旧 release 地址，最容易破坏可信度。 |
| P1 | 玩家理解成本 | 安全术语专业，但新玩家可能不知道怎么映射到行动。 |
| P1 | 代码继续膨胀 | `engine.ts` 与 `App.tsx` 已到拆分临界点。 |
| P2 | 资源体积 | 继续加视频/大图会失控。 |
| P2 | 内容重复游玩度 | 第一局体验够，但三局后事件和构筑路线会显单薄。 |

---

## 11. Gate Verdicts

### Design Gate

**APPROVED WITH CONCERNS**

通过原因：

- 核心幻想成立；
- 题材差异化明显；
- 竖切链路完整；
- 安全机制开始进入规则层。

Concern：

- 构筑路线还不够清晰；
- attack chain 还不是完整系统；
- 新手理解成本较高。

### Code Gate

**APPROVED WITH REFACTOR REQUIRED BEFORE NEXT MAJOR FEATURE**

通过原因：

- 可构建；
- 有类型；
- 有自动化检查；
- 核心流程清楚。

Concern：

- `engine.ts` / `App.tsx` 过大；
- 内容与逻辑还没完全数据驱动；
- 资产命名和旧主题技术债残留。

### Playtest Gate

**READY FOR SMALL CLOSED PLAYTEST**

适合：

- 5-10 个懂游戏/懂安全的朋友；
- 2-3 个不懂安全但玩过卡牌游戏的人；
- 1-2 个懂安全但不怎么玩卡牌的人。

不适合：

- 大规模公开宣发；
- 商业上架；
- 投放广告；
- Steam 页面正式开。

---

## 12. 下一步建议

### Step 1：修发布文档小错

- README release URL 改成 `zhuowater/Night-Patrol`；
- GitHub Actions 描述改为三平台；
- Release / README 保持一致。

### Step 2：做一轮结构化试玩

输出一份 playtest report，至少记录：

- 玩家是否理解 IOC；
- 是否知道算力和能量区别；
- 是否看得懂攻击链反制；
- 第一场战斗是否顺利出牌；
- 第一局是否能打到 Boss；
- 输了是否知道为什么；
- 赢了是否觉得爽。

### Step 3：v0.2.3 只做 4 件事

建议 v0.2.3 scope 控制为：

1. 新手首次机制提示；
2. Boss 阶段化；
3. 新增 4-6 个安全事件；
4. 拆 `engine.ts` / `App.tsx` 的高风险部分。

### Step 4：v0.2.4 再做内容扩张

再加：

- 新卡；
- 新工具；
- 更多攻击链；
- 第二关；
- 更多视频/演出。

---

## 13. 总结

这个项目现在最有价值的地方不是“做出了一个卡牌 demo”，而是：

> **它已经证明“网络安全响应”可以被转译成 roguelike 卡牌构筑体验。**

这是有潜力的方向。但下一阶段的关键不是继续猛堆内容，而是把它从“聪明的 demo”打磨成“玩家不用懂安全也能玩懂、懂安全的人又觉得专业”的产品。

最终判断：

> **值得继续做。**  
> 但 v0.2.3 应该走“试玩反馈 + 规则清晰 + 架构拆分”，不要急着第二关，不要急着更多视频，不要急着商业化。

# 《夜巡 SOC：边界告警》实现细节与协作复盘

## 1. 当前版本事实

《夜巡 SOC：边界告警》是一个运行在浏览器与 Electron 桌面壳里的单人卡牌构筑 roguelike demo。当前版本不需要后端服务，构建后就是一组静态前端资源；桌面客户端通过 Electron 加载本地 `dist/index.html`。

技术栈：

- React 18：承载页面状态、复杂 UI、卡牌、地图、市场、事件、结算等界面。
- Phaser 3.90：承载战斗舞台、背景、角色与攻击活动、受击摇晃、屏幕震动、粒子反馈。
- TypeScript：定义游戏状态、卡牌、敌人、工具、地图节点等数据结构。
- Vite 8：开发服务器与静态构建。
- Electron：桌面客户端打包与本地分发。
- lucide-react：少量通用 UI 图标，例如声音、回首页、重新开始等。

主要目录：

```text
src/
  App.tsx                 React UI、屏幕切换、拖拽出牌、素材引用
  styles.css              全局视觉、卡牌、HUD、地图、市场、事件、响应式布局
  game/
    types.ts              游戏状态与内容类型
    content.ts            卡牌、敌人、工具、事件、节点定义
    engine.ts             纯逻辑状态机
    audio.ts              背景音乐与音效控制
  phaser/
    CombatStage.tsx       React 包装的 Phaser 战斗舞台

scripts/
  check-cybersec-theme.mjs              主题文案与 UI 关键词检查
  check-attack-chain-counterplay.mjs    攻击链反制文本/结构检查
  check-engine-scenarios.ts             规则层 scenario 回归

assets/
  audio/                  BGM 与音效
  generated/              生成或制作后的战斗图、敌人图、结算视频
  vendor/                 从素材包里挑选并整理后的 UI 素材

docs/
  CYBERSECURITY_RETHEME_DESIGN.md
  FIRST_ACT_DEMO_ROADMAP.md
  IMPLEMENTATION_DETAILS.md
  PACKAGING_DISTRIBUTION.md
  RELEASE_NOTES_v0.2.2.md
```

## 2. 架构选择

UI 复杂度包括卡牌手牌、拖拽出牌、地图分岔、市场、事件、维护窗口、结算视频、难度选择、顶部 HUD、底部牌堆，这些交给 React 更可维护。

战斗舞台则更适合 Phaser：角色、敌人、背景、粒子、受击晃动和镜头震动如果全用 DOM 做，会让样式和状态耦合过重。所以当前采用 React + Phaser 混合：

- React 管 UI 与全局状态。
- Phaser 管战斗舞台表现。
- 游戏逻辑放在 `src/game/engine.ts`，避免 UI 和规则互相缠死。

这个选择的关键不是“技术更炫”，而是职责边界清楚：卡牌操作层复杂，舞台表现也复杂，把它们硬塞进一套抽象会拖慢迭代。

## 3. 状态模型

核心状态定义在 `GameState`：

- `screen`：当前屏幕，例如 title、map、combat、cinematic、reward、shop、event、rest。
- `player`：生命、能量、预算、牌组、工具、状态。
- `mapNodes`、`availableNodeIds`、`visitedNodeIds`：攻击路径地图与可选节点。
- `combat`：当前战斗，包括抽牌堆、弃牌堆、消耗堆、手牌、敌人、回合数、受击目标。
- `cinematic`：战斗胜利后的结算过场状态。
- `reward`、`event`、`shop`：非战斗模块的临时状态。
- `seed`：伪随机种子。
- `lastFx`：给 UI/音频层触发反馈的轻量信号。

React 里通过 `transact(fn)` 修改状态。它会先 `structuredClone` 出一个 draft，再调用 engine 里的逻辑函数，最后一次性 `setGame`。这样规则函数可以直接改 draft，而 React 仍然能拿到新的对象引用并触发渲染。

## 4. 游戏规则实现

规则集中在 `src/game/engine.ts`。当前包括：

- 开局：根据难度生成血量、预算、能量、初始牌组、起始工具。
- 地图：生成 8 行攻击路径节点，普通战、高危入侵、事件、市场、维护窗口、Boss 分布在不同层。
- 战斗：抽牌、洗弃牌堆、出牌、敌人意图、IOC 持续结算、攻击链压力、胜负判断。
- 奖励：预算、卡牌三选一、高危/Boss 工具。
- 事件：不同选择影响生命、预算、牌组、工具。
- 市场：买响应动作、买工具、删牌。
- 维护窗口：回血或升级。

卡牌效果目前是手写分支，而不是独立 DSL。demo 阶段卡牌数量有限，手写分支更直接；等内容扩到几十上百张牌，再考虑数据驱动 DSL 更合算。

## 5. 安全机制与攻击链反制

当前版本的重点不是单纯“换皮”，而是让安全语义进入玩法判断。

核心状态与资源：

- **IOC**：施加在敌人身上的标记，会持续造成伤害，也能被特定牌引爆；在 C2 场景里还能拦截信标噪声。
- **算力**：战斗内临时资源，用于自动化、爆发与勒索恢复演练。
- **防护**：抵消当回合伤害。
- **降权**：降低敌人输出；在凭据链场景里，持续降权窗口能清洗噪声告警。
- **噪声告警**：污染牌组和手牌的状态牌，拖慢响应节奏。

攻击链压力：

- C2：偶数回合周期性注入噪声；若目标有 IOC，则消耗 IOC 拦截本轮信标。
- 凭据：噪声过多会造成抽牌惩罚；若敌人处在持续降权窗口，则抽牌前清洗噪声。
- 横向移动：未降权时，多点探测会抬高后续强度。
- 勒索：每三回合造成倒计时伤害；若玩家保留 2 点算力，则执行恢复演练并取消扣血。

UI 对应提供“风险预告”和“反制窗口”，让玩家知道下一回合为什么危险，以及自己应该用 IOC、算力或降权做什么。

## 6. 卡组循环与数值思路

这个 demo 的核心爽感不是单张牌巨大，而是让牌组循环起来。

当前循环支撑来自几类牌：

- 0 费抽牌：`日志检索`、`关联分析`。
- 抽防一体：`快速 triage`、`降噪过滤`。
- 弃牌堆回卷：`灰度回滚`。
- 能量/算力补偿：`沙箱取样`、`规则命中`、`分配算力`。
- 长线能力：`夜眼监控`、`自动化响应`。
- 爆发出口：`溯源打击`、`沙箱引爆`、`全域清剿`。

调数值时主要考虑三件事：

1. 第一关不能逼玩家必须拿到某一张牌才能过。
2. 玩家应该能看懂自己为什么变强，例如“IOC 越叠越多，然后溯源/清剿一口气爆掉”。
3. 演示难度要允许录视频时顺利打通，所以给了更高血量、更多初始资源和循环工具。

## 7. React 与 Phaser 的同步

Phaser 舞台没有直接持有完整 `GameState`。React 每次渲染时把战斗信息压成 `StageSnapshot` 传进去：

- 玩家血量、防护。
- 敌人 id、名称、血量、防护、IOC、意图。
- `pulse` 和 `hitTarget`。

Phaser scene 收到 snapshot 后更新贴图、尺寸、位置和文本。如果 `pulse` 变化，就触发镜头震动和对应角色摇晃。

这样避免两个状态源：React 是唯一游戏状态来源，Phaser 只是视觉投影。

## 8. 结算视频管线

游戏内支持击败敌人后进入 `cinematic` 屏幕。

流程：

1. 敌人 HP 降到 0。
2. `engine.ts` 创建 `CinematicState`。
3. React 进入 `CinematicScreen`。
4. 如果有对应视频，播放视频。
5. 视频结束或玩家点击跳过，进入奖励或胜利页。
6. 如果视频缺失或加载失败，使用静态 poster fallback。

视频与 poster 默认位于：

```text
assets/generated/cinematics/victory-<enemy>.mp4
assets/generated/cinematics/victory-<enemy>-poster.png
```

Boss 使用 `boss-<enemy>` slug。

## 9. 分发前修正

为适配客户端打包和本地文件加载，当前做了几个发布向调整：

- `vite.config.ts` 设置 `base: "./"`，保证 Electron 用 `file://` 加载 `dist/index.html` 时资源路径不失效。
- CSS 背景图使用相对路径，让 Vite 能正确打包并重写资源 URL。
- 新增 `electron/main.cjs`，用 Electron 包一层桌面窗口。
- 新增 `desktop:pack` 和 `desktop:dist` 脚本，分别用于本地验证和正式出包。
- GitHub Releases 作为安装包分发入口。
- `package.json` 中 `productName` 为 `夜巡 SOC`，artifact 使用 `Night-Patrol-SOC-${version}-${os}-${arch}`。

## 10. 验证策略

当前至少保留四层验证：

```bash
npm run check:engine-scenarios
npm run check:attack-chain
npm run check:theme
npm run build
```

- `check:engine-scenarios`：运行真实 engine 场景，覆盖 lethal IOC、C2、凭据、勒索关键规则。
- `check:attack-chain`：锁定攻击链反制结构与关键 UI 文案。
- `check:theme`：锁定网络安全主题关键文案，防止旧主题回流。
- `build`：TypeScript 与 Vite 构建。

发布候选阶段还需要浏览器完整打一局和 `npm run desktop:pack`。

## 11. AI 与非游戏开发者如何协作完成

这个项目不是一次性“写完”的，而是按可玩性一路迭代出来的。

实际过程大致是：

1. 先做能跑通的卡牌 roguelike 原型：标题、地图、战斗、奖励、Boss。
2. 再修核心体验：牌组循环、分岔路线、拖拽出牌、难度选择。
3. 再做视听质感：立绘、背景、结算视频、按钮素材、费用图标、音效。
4. 再做分发：Electron 客户端、GitHub Releases、README、文档、图标、宣传截图。
5. 当前阶段转向网络安全主题，并把 SOC 语义推进规则层。

用户不需要懂代码，但需要持续指出“哪里不像游戏”。AI 的工作是把这些感觉翻译成工程任务：

- “这里糙”可能对应布局层级、素材分辨率、边框样式或透明背景。
- “拖出去没有感觉”对应 pointer 事件、目标热区、hover feedback、释放成功特效。
- “主题只是贴皮”对应规则层是否真的有 IOC、噪声、算力、降权、勒索等决策。
- “发布不可信”对应构建、回归、打包、Release Notes 和已知问题清单。

## 12. 下一步

当前最推荐路线是 `v0.2.2-demo` Playtest Candidate：

1. 文档同步到 SOC 当前事实。
2. 规则层 scenario 回归纳入固定检查。
3. 浏览器完整打一局并截图留档。
4. 桌面打包验证。
5. push main，tag `v0.2.2-demo`，生成 GitHub Release。
6. 收第一批试玩反馈，再决定资源瘦身、Boss 深化、更多事件和奖励池重构。

# 夜巡 SOC：边界告警

《夜巡 SOC：边界告警》是一个网络安全主题的卡牌构筑 roguelike demo。你扮演夜班 SOC 响应员，接管凌晨控制台，在有限算力和响应窗口里追踪 IOC、压制横向移动、清理噪声告警，并在天亮前阻止攻击者触达核心域控。

当前版本是 `v0.2.9-demo` 闭门试玩候选：可以从标题页进入攻击路径，经历普通战、高危入侵、异常事件、情报市场、维护窗口，最终阻断核心域控前的勒索核心。本版延续 v0.2.8 的首次跑局引导，并补齐闭门试玩入口、资源治理、首屏分包和短视口关键选择页修正。

## 下载试玩

桌面客户端已发布在 GitHub Releases：

- 最新试玩包：`v0.2.9-demo`
- 下载页面：https://github.com/zhuowater/Night-Patrol/releases/tag/v0.2.9-demo
- 试玩说明：`docs/playtest/v0.2.9-closed-playtest-instructions.md`
- 反馈表：`docs/playtest/v0.2.9-feedback-form.md`

### 选择哪个文件下载

| 系统 | 推荐下载 | 备用 | 备注 |
|---|---|---|---|
| Windows x64 | `Night-Patrol-SOC-0.2.9-win-x64.exe` | `Night-Patrol-SOC-0.2.9-win-x64.zip` | 如果 SmartScreen 拦截，点“更多信息”→“仍要运行”；或改用 zip 版。 |
| macOS Apple Silicon | `Night-Patrol-SOC-0.2.9-mac-arm64.dmg` | `Night-Patrol-SOC-0.2.9-mac-arm64.zip` | 当前是 Apple Silicon 包；demo 阶段未公证，首次打开可能需要右键“打开”。 |
| Linux x64 | `Night-Patrol-SOC-0.2.9-linux-x86_64.AppImage` | `Night-Patrol-SOC-0.2.9-linux-x64.zip` | AppImage 可能需要先执行 `chmod +x Night-Patrol*.AppImage`。 |

不要下载 `Source code`；那是源码包，不是可直接试玩的客户端。

macOS 版本目前是 demo 阶段的 ad-hoc 签名包，没有 Apple 公证。如果系统提示“无法验证开发者”，请右键点击应用，选择“打开”，再确认一次。

## 游戏特色

- 网络安全响应题材：SOC 控制台、IOC、EDR 隔离、日志检索、情报市场、核心域控。
- 类《杀戮尖塔》的核心循环：走路线、打战斗、拿新牌、拿工具、删牌升级、滚动构筑。
- 点击或拖出手牌区即可施放：攻击牌默认命中当前攻击链，技能和法门牌默认加固自己。
- 卡组循环：抽牌、回卷弃牌堆、响应算力补偿、IOC 爆发和临时算力成长互相配合。
- 攻击链反制：C2 信标可用 IOC 拦截，凭据噪声可用持续降权清洗，勒索倒计时可用临时算力恢复演练取消。
- 完整第一关：普通攻击活动、高危敌人、Boss、事件、维护窗口、市场和处置结算界面。
- 视听演出：React + Phaser 战斗舞台、敌人大立绘、背景音乐、攻击音效、胜利结算视频与静态 fallback。

## 基础玩法

战斗中每回合获得响应算力并抽牌。玩家可以用攻击牌造成伤害，用技能牌获得防护、抽牌或施加状态，用法门牌建立长期能力。

核心机制：

- IOC：施加在敌人身上的标记，可以持续结算，也可以被特定卡牌引爆。
- 响应算力：本回合用于打出响应牌，回合开始刷新。
- 临时算力：战斗内额外资源，用来支撑自动化、清剿和爆发牌。
- 防护：抵消当回合伤害。
- 法门：打出后在本场战斗持续生效。
- 工具：改变开局、抽牌、伤害、防御或资源节奏。

构筑目标不是拿单张最强牌，而是让牌组循环起来：抽得更多、费用更顺、弃牌能回卷、IOC 能叠高并引爆。

## 操作方式

- 点击卡牌或把卡牌拖出手牌区即可施放；攻击牌默认命中当前攻击链，技能和法门牌默认加固自己。
- 卡牌下方会显示预计效果、取证价值或战术代价；优先看回合级“建议响应”。
- 点击“结束回合”进入敌人回合。
- 地图界面点击当前可选节点前进，远端“待侦察”节点只是路线预告。
- 顶部按钮可以回首页、静音或重新开始。

## 当前内容

- 1 名角色：夜班 SOC 响应员。
- 20 张左右响应动作牌。
- 多个敌人：端口扫描器、钓鱼载荷、僵尸进程、横向移动脚本、C2 操作员、凭据窃取器、勒索核心。
- 关键词与状态：IOC、算力、防护、降权、暴露面、法门、消耗。
- 攻击路径分岔路线。
- 普通战、高危战、Boss 战。
- 异常事件、情报市场、维护窗口、删牌、升级。
- 卡牌奖励、预算奖励、工具奖励。
- 背景音乐、攻击音效、技能音效和 UI 音效。
- 战斗胜利结算视频与静态 fallback。
- 难度选择：演示模式、标准值班、高压演练。

## 技术栈

- React 18：复杂 UI、卡牌、地图、事件、市场、奖励和结算界面。
- Phaser 3：战斗舞台、背景、角色、攻击活动、粒子、受击摇晃和镜头震动。
- TypeScript：游戏状态、卡牌、敌人、工具和事件类型。
- Vite：开发服务器和前端构建。
- Electron：桌面客户端打包。
- GitHub Release：当前由 `.github/workflows/release.yml` 在 tag push 时自动构建 Linux、macOS、Windows 桌面包并附加到 Release。

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

然后访问终端里显示的地址，通常是：

```text
http://127.0.0.1:5173
```

主题文案检查：

```bash
npm run check:theme
```

攻击链与规则场景检查：

```bash
npm run check:attack-chain
npm run check:engine-scenarios
```

## 资源治理

运行时默认只审计会进入构建或客户端包的资源：`assets/optimized`、`assets/audio/sfx`、`assets/marketing`、`public`、`desktop-assets`。输出包含资源类型占比、top-level area 占比、Top assets 和预算违规列表。

```bash
npm run assets:optimize
npm run assets:audit
```

`assets:optimize` 会从 `assets/generated` 生成 WebP/压缩 MP4，并把 BGM 压到 `assets/optimized/audio/bgm/`。常用维护参数：

```bash
# 只列出需要重建的优化任务，不写文件
npm run assets:optimize -- --dry-run

# CI/发布前检查：若源素材比 optimized 更新或产物缺失则失败
npm run assets:optimize -- --check

# 强制重建所有可优化产物，用于调整压缩参数后刷新 baseline
npm run assets:optimize -- --force
```

常用审计视图：

```bash
# 运行时/客户端包基线，默认视图
npm run assets:audit

# 构建产物视图，适合看 dist/assets 真实落盘大小和代码 chunk 占比
npm run assets:audit -- --mode dist --top 20

# 未压缩源素材视图，只用于诊断生成素材压力，不作为默认包体预算基线
npm run assets:audit -- --mode generated --top 20
```

当前 UI 和音频入口应引用 `assets/optimized` 产物；`assets/generated` 保留为源素材，不作为默认包体预算基线。

## 客户端打包

本地客户端预览：

```bash
npm run desktop
```

生成本机客户端目录：

```bash
npm run desktop:pack
```

生成正式安装包：

```bash
npm run desktop:dist
```

产物会输出到 `release/`。

如需通过 GitHub Release 分发，推送 tag 后会触发 `.github/workflows/release.yml` 自动构建三平台桌面包并附加到对应 Release：

```bash
git tag v0.2.9-demo
git push origin v0.2.9-demo
```

发布前 gate 与 CI 一致：`npm run check`、`npm run assets:optimize -- --check`、`npm run desktop:dist`。tag 发布后仍需打开浏览器确认 Release 页面资产实际展示。

## 项目文档

- `docs/CYBERSECURITY_RETHEME_DESIGN.md`：网络安全主题改编设计。
- `docs/plans/2026-05-01-cybersecurity-retheme-phase-1.md`：Phase 1 实施计划。
- `docs/plans/2026-05-01-v0.2.2-playtest-candidate.md`：v0.2.2 试玩候选收口计划。
- `docs/RELEASE_NOTES_v0.2.9-demo.md`：v0.2.9 Release Notes。
- `docs/RELEASE_NOTES_v0.2.8-demo.md`：v0.2.8 Release Notes。
- `docs/RELEASE_NOTES_v0.2.7-demo.md`：v0.2.7 Release Notes。
- `docs/RELEASE_NOTES_v0.2.6-demo.md`：v0.2.6 Release Notes。
- `docs/NIGHT_PATROL_NEXT_PLAN_v0.2.3-v0.3.0.md`：v0.2.3 到 v0.3.0 后续路线图。
- `docs/RELEASE_NOTES_v0.2.3-demo.md`：v0.2.3 Release Notes。
- `docs/PLANNING.md`：早期玩法与世界观规划。
- `docs/FIRST_ACT_DEMO_ROADMAP.md`：第一关完整 demo 路线图。
- `docs/IMPLEMENTATION_DETAILS.md`：实现细节和 AI 协作复盘。
- `docs/PACKAGING_DISTRIBUTION.md`：客户端打包、Release、物料和运营方案。

## 版权与授权

《夜巡 SOC：边界告警》由 zhuowater × Hermes 联合开发，仅供娱乐、学习和非商业展示。

除另有说明外，本项目采用 `CC BY-NC 4.0` 授权：允许非商业分享和改编，但必须署名，不得移除作者信息，不得用于售卖、广告导流、商业试玩包、应用商店上架或其它商业分发。

推荐署名：

```text
《夜巡 SOC：边界告警》，由 zhuowater × Hermes 联合开发。
```

完整声明见 `LICENSE` 与 `NOTICE.md`。

## 素材说明

本项目为个人学习与原型展示 demo。部分视觉素材来自用户下载素材包并经过筛选整理，部分为 AI 生成素材。若后续进入正式公开发行或商业化阶段，需要重新确认所有素材授权或替换为自有资产。

## 当前状态

这是一个正在打磨中的 demo。它已经能完整跑通第一关，但仍有后续优化空间，例如正式图标迭代、视频体积压缩、更多事件演出、更多卡牌平衡和正式代码签名。

# 第一大关 v0.2.2 Demo 路线图

## 目标

把《夜巡 SOC：边界告警》的第一大关做成一个完整竖切 demo：玩家从标题页进入攻击路径，沿分岔路线经历普通战、高危入侵、异常事件、情报市场、维护窗口，最终阻断勒索核心，并在战斗、结算、奖励和过关之间看到连续反馈。

这个阶段不追求大规模内容扩张，而是让已有系统达到“该有的都有、每个模块都像游戏、可以发给第一批玩家试玩”的完成度。

## 当前状态

- React + Phaser 混合架构已经落地。
- 第一关路线、卡组循环、奖励、事件、市场、维护窗口、Boss 胜利流程已可玩。
- 网络安全主题已经覆盖标题、卡牌、敌人、路线节点、事件、工具和主要 UI。
- 敌人覆盖端口扫描器、钓鱼载荷、僵尸进程、横向移动脚本、C2 操作员、凭据窃取器、勒索核心。
- 攻击链压力进入规则层：C2、凭据、横向移动、勒索都有不同风险。
- 反制窗口进入玩法判断：IOC 拦截 C2、降权清洗凭据噪声、算力取消勒索倒计时。
- 战斗胜利已经接入结算视频与静态 fallback。
- Electron 打包、GitHub Actions 和 Release 分发流程已经接入。

## v0.2.2 Playtest Candidate 缺口

### 1. 文档与发布材料同步

旧文档里仍有部分志怪版本描述。v0.2.2 需要统一为 SOC 当前事实。

验收目标：

- README 明确当前版本为 `v0.2.2-demo` 试玩候选。
- `IMPLEMENTATION_DETAILS.md` 描述 SOC 主题、攻击链规则和验证脚本。
- `PACKAGING_DISTRIBUTION.md` 使用 Night-Patrol-SOC 包名和 `v0.2.2-demo` tag。
- 新增 `RELEASE_NOTES_v0.2.2.md`。

### 2. 规则层防回归

主题深化后，最危险的问题不是 UI 文案错，而是 UI 提示和引擎规则不一致。

验收目标：

- 新增 `npm run check:engine-scenarios`。
- 覆盖 lethal IOC、C2 有/无 IOC、凭据清洗、勒索有/无算力。
- 发布前固定运行：

```bash
npm run check:engine-scenarios
npm run check:attack-chain
npm run check:theme
npm run build
```

### 3. 浏览器完整试玩

需要用浏览器实际跑一轮关键页面，不能只信 build。

验收目标：

- 标题页和难度选择可用。
- 地图可选节点可前进。
- 普通战可出牌、结束回合、获得奖励。
- 至少覆盖一个事件、一个市场或一个维护窗口。
- 高危/Boss/结算路径至少验证一个。
- 无白屏、无明显 runtime error。
- 保存关键页面截图作为发布证据。

### 4. 桌面打包验证

验收目标：

```bash
npm run desktop:pack
```

通过，并确认 `release/` 有本机客户端目录。

`desktop:dist` 可以作为发布前附加验证；跨平台正式包主要交给 GitHub Actions。

## v0.2.2 完成清单

### P0：发布候选收口

- [ ] 文档同步到 SOC 当前事实。
- [ ] Release Notes 写明更新内容和已知问题。
- [ ] `check:engine-scenarios` 通过。
- [ ] `check:attack-chain` 通过。
- [ ] `check:theme` 通过。
- [ ] `npm run build` 通过。
- [ ] 浏览器完整试玩并截图。
- [ ] `npm run desktop:pack` 通过。
- [ ] tag `v0.2.2-demo` 并触发 GitHub Actions。

### P1：试玩反馈后优先修

- 玩家是否理解 IOC、算力、降权分别反制什么。
- 风险预告是否清楚。
- 反制窗口是否能指导出牌，而不是制造信息噪声。
- 哪些界面仍像网页，不像游戏。
- 是否有卡住、白屏、按钮不可见、结算无法继续等阻断问题。

### P2：资源瘦身

当前包体偏大的主要来源是 victory 视频、poster PNG、BGM、战斗背景视频和大图。

目标：

- `dist <= 50MB`。
- 普通 victory 视频 `<= 2MB`。
- poster 单张 `<= 800KB`。
- 大 PNG 尽量转 WebP。
- 背景 loop 视频按需加载。

### P3：玩法继续深化

v0.2.2 后再进入新功能：

- 每个敌人增加“推荐响应标签”：检测、隔离、恢复、情报。
- 奖励卡按标签倾斜，而不是纯随机。
- Boss 低血量阶段化，勒索倒计时更紧。
- 新增安全决策事件：管理层要求恢复业务、供应链组件临时放行、红队误触、监管审计窗口。
- 重构奖励池，让构筑路线更明显。

## 推荐执行顺序

1. 文档与 Release Notes 收口。
2. 规则层 scenario 回归。
3. 运行四个本地验证命令。
4. 浏览器完整试玩并截图。
5. 桌面 pack。
6. 独立 code review。
7. commit、push、tag `v0.2.2-demo`。
8. 发布 GitHub Release。
9. 收第一批试玩反馈。

# 《夜巡 SOC：边界告警》客户端打包与分发方案

## 1. 结论

当前主线分发方案是 Electron 客户端 + GitHub Releases：

- 玩家下载客户端包，不需要自己装 Node、开浏览器或跑命令。
- 游戏本体仍然是 React + Phaser + Vite 构建出的静态前端。
- Electron 只负责桌面窗口、应用菜单、图标和本地文件加载。
- GitHub Releases 托管 macOS/Windows 安装包与 zip 包。

这条路线最适合 `v0.2.2-demo` 试玩候选：开发成本低，能最快把 demo 发给第一批玩家。

## 2. 为什么选 Electron

候选方案有三个：

1. 继续用浏览器网页。
2. Electron。
3. Tauri。

浏览器网页最轻，但用户感知上还是“打开一个网页”，不像一个游戏客户端。Tauri 包体更小，但需要 Rust 和额外平台依赖，对当前 demo 来说会把精力拖到工程环境上。

Electron 的优势是：

- 和当前 Vite/React 项目天然兼容。
- 不改游戏核心代码。
- macOS、Windows 都能打包。
- GitHub Actions 可以自动产出不同平台的安装包。
- 音频、视频、本地资源路径都比较稳。

缺点也明确：

- 包体会比较大。
- 未签名应用在 macOS 和 Windows 上会有安全提示。
- 正式商业发行前要处理代码签名、公证、安装器体验。

## 3. 当前已经接入的客户端能力

关键文件：

```text
electron/main.cjs
.github/workflows/build-desktop.yml
desktop-assets/icon.png
desktop-assets/icon.ico
public/favicon.png
assets/marketing/icon.png
```

关键脚本：

```bash
npm run desktop
npm run desktop:pack
npm run desktop:dist
```

脚本含义：

- `npm run desktop`：先构建 Web，再用 Electron 打开客户端窗口，适合本地快速看效果。
- `npm run desktop:pack`：生成未压缩的本机客户端目录，适合验证打包能否启动。
- `npm run desktop:dist`：生成正式分发文件，例如 macOS 的 dmg/zip、Windows 的 exe/zip。

`package.json` 当前分发标识：

```text
name: night-patrol-soc
productName: 夜巡 SOC
artifactName: Night-Patrol-SOC-${version}-${os}-${arch}.${ext}
```

## 4. 本地打包流程

### 4.1 开发预览

```bash
npm run dev
```

用于日常开发，浏览器最快。

### 4.2 客户端启动验证

```bash
npm run desktop
```

这个命令会：

1. 执行 `npm run build`。
2. 用 Electron 加载 `dist/index.html`。
3. 打开一个桌面窗口运行游戏。

### 4.3 生成本机客户端目录

```bash
npm run desktop:pack
```

这个命令会输出到：

```text
release/
```

通常会看到类似：

```text
release/mac-arm64/夜巡 SOC.app
release/linux-unpacked/
```

具体目录取决于执行机器平台。这一步适合开发期验证，不适合直接群发。

### 4.4 生成正式分发包

```bash
npm run desktop:dist
```

macOS 上通常会生成 dmg/zip；Windows 包建议交给 GitHub Actions 在 Windows runner 上生成，不建议在非 Windows 环境强行交叉打包。

当前 macOS demo 包使用 ad-hoc 签名：

```text
mac.identity = "-"
```

这表示用匿名本地签名满足 Apple Silicon app bundle 的基本要求。它不是 Apple 公证签名，所以发给别人时仍然可能触发“无法验证开发者”的系统提示。

## 5. GitHub Releases 分发流程

### 5.1 上传仓库

当前仓库：

```text
https://github.com/op7418/Night-Patrol
```

常规发布前：

```bash
git push origin main
```

### 5.2 自动构建客户端

当前已加入 workflow：

```text
.github/workflows/build-desktop.yml
```

触发方式：

- 手动：GitHub Actions 页面点击 `Run workflow`。
- 自动：推送 tag，例如 `v0.2.2-demo`。

它会在两个平台构建：

- `macos-latest`
- `windows-latest`

产物会作为 workflow artifact 上传。如果是 tag 触发，还会自动附加到 GitHub Release。

玩家主要下载：

```text
Night-Patrol-SOC-0.2.2-mac-arm64.dmg
Night-Patrol-SOC-0.2.2-mac-arm64.zip
Night-Patrol-SOC-0.2.2-win-x64.exe
Night-Patrol-SOC-0.2.2-win-x64.zip
```

实际文件名以 electron-builder 输出为准。

### 5.3 发布 v0.2.2 demo tag

```bash
git tag v0.2.2-demo
git push origin v0.2.2-demo
```

等 Action 跑完后，在 GitHub Release 页面补充：

- 试玩说明。
- `docs/RELEASE_NOTES_v0.2.2.md` 的内容。
- 已知问题。
- 标题页、地图页、战斗页、结算页截图或短录屏。

## 6. 玩家下载说明

### macOS

如果没有做 Apple Developer 签名和公证，玩家第一次打开可能会看到“无法验证开发者”。

临时说明：

```text
下载 dmg 后拖入 Applications。如果提示无法打开，请右键点击应用，选择“打开”，再确认一次。
```

更正式的解决方案：

- 购买 Apple Developer Program。
- 配置 Developer ID Application 证书。
- Electron Builder 开启 signing 和 notarization。

当前 demo 阶段可以先不做。

### Windows

未签名安装包可能触发 SmartScreen。

临时说明：

```text
如果 Windows 提示未知发布者，请点击“更多信息” -> “仍要运行”。
```

更正式的解决方案：

- 购买代码签名证书。
- 配置 electron-builder 的 Windows signing。

## 7. 图标方案

当前已经有客户端图标：

```text
public/favicon.png
desktop-assets/icon.png
desktop-assets/icon.ico
assets/marketing/icon.png
assets/marketing/icon-gpt-image-2.png
```

由于产品已经转为 SOC 主题，后续图标第二版建议从“志怪法印”转向“夜间 SOC 控制台 + 边界告警 + 深色盾牌/雷达/日志流”的方向。

提示词草案：

```text
Square game app icon for a cyber security deckbuilding roguelike named Night Patrol SOC. A dark navy SOC console with glowing teal radar rings, red boundary alert pulse, subtle shield silhouette, cinematic high contrast, centered composition, readable at small size, no text, no watermark, no UI frame.
```

macOS 的 `.icns` 由 electron-builder 在打包时根据 `desktop-assets/icon.png` 自动生成。

## 8. 客户端体积与资源策略

当前包体偏大的主要原因：

- Electron 自带 Chromium。
- 大尺寸敌人立绘。
- 背景图。
- 背景循环视频。
- 结算视频。
- poster PNG 与 BGM 文件。

短期接受这个体积是合理的，因为 demo 需要完整视听效果。但 v0.2.2 之后应单独做资源瘦身。

建议优化顺序：

1. victory 视频重新压缩，普通怪目标 1-2 MB。
2. poster PNG 转 WebP，目标单张 < 800KB。
3. 大 PNG 敌人图转 WebP 或压缩。
4. 战斗外视频按需加载。
5. 商店、事件、结算模块拆成懒加载 chunk。
6. 若项目长期化，再评估 Tauri。

建议指标：

```text
dist <= 50MB
普通 victory 视频 <= 2MB
poster <= 800KB
```

## 9. 运营物料清单

发布客户端时至少需要：

- 游戏图标。
- 标题页截图。
- 战斗页截图。
- 地图页截图。
- Boss 或结算页截图。
- 30-60 秒横版录屏。
- 一段 150 字以内简介。
- Release 更新说明。
- macOS/Windows 打开说明。

建议截图规格：

- 横版：1920x1080 或 1280x720。
- Release 封面：1200x630。
- 短视频平台封面：1080x1920。

## 10. 宣传文案草案

一句话：

```text
《夜巡 SOC：边界告警》是一个网络安全主题卡牌构筑 roguelike demo：在凌晨控制台里追踪 IOC、压制横向移动、清理噪声告警，并在天亮前阻断勒索核心。
```

短介绍：

```text
凌晨 02:17，边界探针捕获异常握手。你扮演夜班 SOC 响应员，在分岔攻击路径中遭遇端口扫描、钓鱼载荷、C2 操作员、凭据窃取器和勒索核心。每场战斗后选择新的响应动作、工具或风险事件，把一套临时响应牌组滚成能守住核心域控的防线。
```

开发幕后角度：

```text
这是一个由玩家和 AI 助手协作做出的第一关竖切 demo。我们从类 Slay the Spire 的构筑爽感出发，把题材重构成 SOC 安全响应：IOC、算力、噪声、降权和勒索恢复不只是文案，而是会影响下一回合判断的规则。
```

## 11. 素材授权注意事项

公开分发客户端前要确认素材授权。

当前素材来源包括：

- 用户下载并筛选的素材包。
- AI 生成图像和视频。
- 本地音频素材。
- 代码生成或手工整理的 UI。

建议 README 或 Release 保留说明：

```text
本项目为个人学习与原型展示 demo。部分视觉素材来自用户已下载素材包并经过筛选整理，部分为 AI 生成素材。若后续进入正式公开发行或商业化阶段，需要重新确认所有素材授权或替换为自有资产。
```

## 12. v0.2.2 推荐执行顺序

现在最短路径：

1. 跑通 `npm run check:engine-scenarios && npm run check:attack-chain && npm run check:theme && npm run build`。
2. 浏览器完整打一局并保存关键页面截图。
3. 跑通 `npm run desktop:pack`。
4. push `main`。
5. 打 `v0.2.2-demo` tag，让 GitHub Actions 构建 macOS 和 Windows 包。
6. 用 `docs/RELEASE_NOTES_v0.2.2.md` 填 Release。
7. 发给第一批朋友试玩并收反馈。

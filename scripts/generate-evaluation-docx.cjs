const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} = require('docx');

const out = '/root/workspace/Night-Patrol/docs/NIGHT_PATROL_SOC_PROFESSIONAL_EVALUATION_2026-05-01.docx';

const bulletRef = 'bullet-list';
const numberRef = 'number-list';
const tableWidth = 9360;
const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9E2EC' };
const borders = { top: border, bottom: border, left: border, right: border };

function textRun(text, opts = {}) {
  return new TextRun({ text, font: 'Arial', size: opts.size || 22, bold: opts.bold, italics: opts.italics, color: opts.color || '111827' });
}

function p(text = '', opts = {}) {
  return new Paragraph({
    heading: opts.heading,
    alignment: opts.alignment,
    spacing: { before: opts.before || 0, after: opts.after ?? 120, line: 320 },
    numbering: opts.numbering,
    children: Array.isArray(text) ? text : [textRun(text, opts)],
  });
}

function h1(text) { return p(text, { heading: HeadingLevel.HEADING_1, before: 240, after: 160, size: 30, bold: true, color: '0F172A' }); }
function h2(text) { return p(text, { heading: HeadingLevel.HEADING_2, before: 200, after: 120, size: 26, bold: true, color: '1E3A8A' }); }
function h3(text) { return p(text, { heading: HeadingLevel.HEADING_3, before: 160, after: 90, size: 23, bold: true, color: '155E75' }); }
function bullet(text) { return p(text, { numbering: { reference: bulletRef, level: 0 }, after: 60 }); }
function num(text) { return p(text, { numbering: { reference: numberRef, level: 0 }, after: 60 }); }

function codeBlock(lines) {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
    border: { top: border, bottom: border, left: border, right: border },
    children: [new TextRun({ text: Array.isArray(lines) ? lines.join('\n') : lines, font: 'Courier New', size: 19, color: '111827' })],
  });
}

function quote(text) {
  return new Paragraph({
    spacing: { before: 80, after: 140 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '06B6D4', space: 8 } },
    children: [new TextRun({ text, font: 'Arial', size: 23, italics: true, color: '0F172A' })],
  });
}

function cell(text, width, header = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: header ? { fill: 'DBEAFE', type: ShadingType.CLEAR } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [p(text, { after: 0, bold: header, size: header ? 21 : 20 })],
  });
}

function table(rows, widths) {
  return new Table({
    width: { size: tableWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, i) => new TableRow({ children: r.map((x, idx) => cell(x, widths[idx], i === 0)) })),
  });
}

const children = [];
children.push(
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 100 }, children: [new TextRun({ text: '《夜巡 SOC：边界告警》', font: 'Arial', size: 44, bold: true, color: '0F172A' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 260 }, children: [new TextRun({ text: '专业评估报告', font: 'Arial', size: 32, bold: true, color: '0369A1' })] }),
  p('项目：Night-Patrol / 夜巡 SOC：边界告警', { alignment: AlignmentType.CENTER, size: 22 }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [textRun('仓库：'), new ExternalHyperlink({ link: 'https://github.com/zhuowater/Night-Patrol', children: [new TextRun({ text: 'https://github.com/zhuowater/Night-Patrol', style: 'Hyperlink', font: 'Arial', size: 22 })] })] }),
  p('版本/提交：v0.2.2-demo / 45c4920 ci: build desktop clients for all platforms', { alignment: AlignmentType.CENTER, size: 22 }),
  p('评估时间：2026-05-01 10:15 EDT', { alignment: AlignmentType.CENTER, size: 22 }),
  p('评估方法：结合游戏项目阶段判断、设计评审、代码评审、试玩报告、平衡、UX、内容审计等 game-dev 视角，并基于本地仓库与验证命令输出。', { alignment: AlignmentType.CENTER, size: 20 }),
  h1('0. 执行摘要'),
  p('结论：这是一个“能发给第一批玩家试玩的竖切 demo”，不是玩具原型；但还没到可正式宣发、商业化或公开大规模扩散的 polish 状态。'),
  table([
    ['维度', '评级'],
    ['当前阶段', 'Production 后段 / Playtest Candidate'],
    ['专业完成度', '7.2 / 10'],
    ['可玩 demo 可信度', '高'],
    ['正式产品化可信度', '中等，需要继续打磨'],
  ], [3600, 5760]),
  quote('强判断：值得继续做。但 v0.2.3 应该走“试玩反馈 + 规则清晰 + 架构拆分”，不要急着第二关，不要急着更多视频，不要急着商业化。'),
  h1('目录'),
  new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-3' }),
);

children.push(
  h1('1. 验证基线'),
  p('本轮评估重新执行了核心验证命令，结果全部通过。'),
  codeBlock(['npm run check:theme', 'npm run check:attack-chain', 'npm run check:engine-scenarios', 'npm run build']),
  bullet('网络安全主题文案检查通过。'),
  bullet('攻击链反制检查通过。'),
  bullet('规则场景检查覆盖 lethal IOC、C2、凭据链、勒索恢复等 6 个关键场景。'),
  bullet('TypeScript + Vite 构建通过。'),
  p('构建警告：Vite 仍提示部分 chunk 大于 500KB，属于性能/包体优化项，不阻塞 demo 发布。'),

  h1('2. 项目阶段判断'),
  h2('2.1 当前不是 Concept，也不是单纯 Prototype'),
  p('项目已经具备完整第一关路线、标题页、难度选择、地图、战斗、奖励、事件、市场、维护窗口、Boss、结算、React + Phaser + Electron 架构、桌面包、GitHub Release、GitHub Actions 三平台打包、自动化回归脚本、浏览器实际试玩验证与规则层攻击链反制测试。'),
  p('所以它已经越过“我做了个 demo 看看”的阶段。'),
  h2('2.2 但也不是 Release / Polish 阶段'),
  p('还缺系统化 playtest 数据、完整 balance pass、资源体积优化、UI/UX 可访问性与交互稳定性验证、正式素材授权清单、正式签名/公证/安装体验，以及更清晰的构筑路线和中后段内容密度。'),
  quote('更准确的阶段：Vertical Slice / Playtest Candidate。可以给小范围玩家试玩，用反馈驱动 v0.2.3，而不是继续盲目堆功能。'),

  h1('3. 设计专业性评估'),
  h2('3.1 最大亮点：题材改造不是普通换皮'),
  p('很多项目“赛博化”“安全化”只是把攻击牌叫防火墙，把怪叫病毒。这个项目目前做得更好：它已经把网络安全的真实工作流嵌入了一部分机制。'),
  bullet('IOC 对应原来的符印，但现在接入 C2 拦截、伤害结算、溯源打击、关联分析。'),
  bullet('算力对应原香火，但现在接入自动化响应、全域清剿、勒索恢复演练。'),
  bullet('降权对应 weak，但现在接入凭据链清洗噪声。'),
  bullet('噪声告警对应污染牌，但符合 SOC 语境。'),
  p('这点很关键。它已经从“志怪卡牌游戏换词”开始变成“安全响应卡牌游戏”。'),
  h2('3.2 当前核心幻想成立'),
  quote('凌晨值班，有限资源，告警越来越多，必须在攻击链推进前做正确响应。'),
  bullet('看到 C2，要先有 IOC 才能拦截。'),
  bullet('凭据污染不是单纯扣血，而是污染抽牌窗口。'),
  bullet('勒索不是普通攻击，而是倒计时式压力。'),
  bullet('Boss / 高危敌人有 tradecraft 和 counter 文案。'),
  bullet('战斗中会有主动打断反馈。'),
  h2('3.3 主要设计问题：仍然偏 Slay the Spire 语法'),
  p('目前底层还是攻击、格挡、抽牌、状态、遗物、商店、路线。这是正确的起步方式，能降低开发风险。但如果要变成有辨识度的产品，下一阶段需要让安全响应机制更不可替代。'),
  quote('现在玩家可能会觉得：“这是一款很有网络安全包装的杀戮尖塔 demo。” 下一步要追求：“这是一款只有网络安全题材才能成立的卡牌 roguelike。”'),
  num('攻击链还不够结构化：目前 C2、凭据、勒索有特殊规则，但还不是一个完整 attack chain board。'),
  num('响应动作标签还不够系统化：建议引入 Detection、Containment、Eradication、Recovery、Intelligence、Automation。'),
  num('构筑路线不够明确：需要让玩家明显感到 IOC 爆发流、算力自动化流、防护反制流、噪声清洗/抽牌流、预算工具流。'),

  h1('4. 内容量评估'),
  p('当前内容包括约 20 张响应动作牌、10 个工具/遗物、7 个敌人、4 个事件、多节点第一关地图、3 个难度、Boss、结算视频与桌面包。对 v0.2.2 demo 来说够；但对可重复试玩来说偏少。'),
  h2('4.1 事件太少'),
  p('现在只有 4 个事件：深夜误报告警、灰色情报源、短暂维护窗口、供应链请求。这几个质量不错，但数量少，玩家两三局后会很快见完。'),
  p('建议 v0.2.3 至少扩到 8-10 个事件。优先补：管理层要求立刻恢复业务、监管审计窗口、红队误触、供应商远程维护、误封核心业务、备份不可用、EDR 授权过期、值班同事交接信息缺失。'),
  h2('4.2 敌人数量可以接受，但行为差异还可以更大'),
  p('目前敌人名和描述已经有区分，但 moves 仍比较经典。下一步应给每类攻击链一个独特压力，例如端口扫描器随暴露面增伤、钓鱼载荷偷预算/塞弱凭据、僵尸进程死亡后复燃、横向移动脚本复制小威胁、C2 偶数回合信标、凭据窃取器污染抽牌/降低手牌上限、勒索核心倒计时/恢复演练。'),

  h1('5. 代码架构评估'),
  h2('5.1 好的地方'),
  bullet('状态机清楚：GameState、CombatState、PlayerState、EnemyState 的边界比较明确。'),
  bullet('核心流程清晰：startRun、chooseNode、startCombat、startPlayerTurn、playCard、endTurn、winCombat。'),
  bullet('内容数据与引擎有一定分离：content.ts 放内容，engine.ts 放规则。'),
  bullet('已有回归脚本：check:theme、check:attack-chain、check:engine-scenarios。'),
  h2('5.2 主要代码问题'),
  h3('engine.ts 太大'),
  p('当前 src/game/engine.ts 是 1143 行。对 demo 可以接受，但后面继续加机制会变成风险点。建议拆成 run.ts、combat.ts、cards.ts、enemies.ts、attackChain.ts、rewards.ts、shop.ts、events.ts、map.ts。优先拆 attackChain.ts 和 cards.ts。'),
  h3('App.tsx 也太大'),
  p('当前 src/App.tsx 是 1354 行。里面同时有顶层状态、HUD、标题页、地图、战斗、奖励、事件、市场、结算、拖拽交互和大量资源 URL。建议拆为 ui/screens 与 ui/components。'),
  h3('资产路径仍残留旧主题命名'),
  p('App.tsx 里还有 assets/vendor/shushan、icon-bagua-gold、icon-talisman-paper、relic-bell 等旧主题命名。这不一定是玩家可见问题，但从专业项目治理看是技术债。'),
  h3('README 有过期信息'),
  p('README 里仍有旧 release 地址 https://github.com/op7418/Night-Patrol/releases，实际应为 https://github.com/zhuowater/Night-Patrol/releases。并且 README 仍写 macOS 与 Windows 自动构建，但现在已经补了 Linux / macOS / Windows 三平台。'),

  h1('6. UX / 试玩角度评估'),
  h2('6.1 现在可试玩，但学习曲线偏硬'),
  p('对熟悉卡牌 roguelike 和安全术语的人，会觉得很有意思。但普通玩家可能会卡在 IOC 是什么、算力和能量有什么区别、降权为什么能清洗凭据噪声、暴露面是我暴露还是敌人暴露、“主动打断”到底造成了什么实际影响。'),
  h2('6.2 建议补一个 3 分钟 onboarding'),
  num('第一张攻击牌：拖到敌人身上。'),
  num('第一张防护牌：拖到自己身上。'),
  num('第一次 IOC：解释“这是可叠加的攻击线索”。'),
  num('第一次 C2 / 凭据 / 勒索特殊机制：弹出一条短提示。'),
  p('不要做长教程。做“关键机制首次出现时一行解释”。'),
  h2('6.3 战斗信息不错，但可能过密'),
  p('现在安全术语、敌人描述、counter、日志、卡牌、意图、攻击链面板一起出现，专业感强，但信息密度高。建议 v0.2.3 做两层信息：默认层展示玩家需要立刻做决策的信息；展开层展示 tradecraft、详细安全解释和背景知识。'),

  h1('7. 平衡评估'),
  h2('7.1 抽牌牌偏强'),
  p('日志检索、快速 triage、关联分析、重放日志等牌会让高熟练玩家较快构筑出循环。短期没问题，因为 demo 要爽；长期需要小心 infinite / near-infinite loop。'),
  h2('7.2 Story 难度可能太慷慨'),
  codeBlock(['playerHp: 96', 'gold: 90', 'maxEnergy: 4', 'enemyHp: 0.82', 'enemyDamage: 0.72', 'startingRelics: oldUmbrella + blankPage']),
  p('这很适合演示，但它可能掩盖 UX 和规则理解问题。试玩报告要分开记录新手 Story、标准 Normal、熟练 Hard，不能只看 Story 通关率。'),
  h2('7.3 Boss 还不够阶段化'),
  p('勒索核心现在已有倒计时反制，但 Boss 战整体还像一个高血量敌人。建议下一版做阶段：70% HP 开始加密倒计时，40% HP 召回 C2 信标，20% HP 要求两回合内恢复/清剿，否则大额损失。'),

  h1('8. 视听与素材评估'),
  h2('8.1 好处'),
  p('项目已经有大立绘、背景图、胜利视频、BGM/SFX、Electron 图标、Phaser 战斗舞台。在 indie demo 里这是很大的加分项。绝大多数技术 demo 死在“像网页表格”，这个项目已经明显像游戏。'),
  h2('8.2 主要问题：体积和资产治理'),
  bullet('assets/generated 约 67MB。'),
  bullet('单个 poster 2.8MB - 3.7MB。'),
  bullet('胜利视频 3MB - 4.4MB。'),
  bullet('index.js 1.44MB。'),
  bullet('多个 PNG 敌人 700KB - 1.8MB。'),
  p('这对 demo 可接受。但如果继续扩内容，必须开始资产预算管理。建议 poster 转 WebP，单张 < 800KB；普通胜利视频 < 2MB；boss 视频 < 4MB；大图统一 WebP；胜利视频按需加载；Phaser / React chunk 拆包。'),

  h1('9. 发布工程评估'),
  p('这部分现在已经明显超过一般个人 demo。已有 Electron 打包、Linux 本地包、GitHub Release、Release Notes、三平台 GitHub Actions、浏览器实际确认、tag 发布流程。'),
  num('README 仍有旧仓库链接，需要立刻修。'),
  num('CI 需要下一个 tag 才验证新 workflow。现在 workflow commit 在 tag 之后，所以新 workflow 主要从下一版生效。'),
  num('代码签名/公证缺失。demo 阶段可以接受；公开大范围分发前要补 Windows code signing、macOS notarization 和安装器提示说明。'),

  h1('10. 最大风险排序'),
  table([
    ['优先级', '风险', '说明'],
    ['P0', '文档/仓库信息不一致', 'README 还指向旧 release 地址，最容易破坏可信度。'],
    ['P1', '玩家理解成本', '安全术语专业，但新玩家可能不知道怎么映射到行动。'],
    ['P1', '代码继续膨胀', 'engine.ts 与 App.tsx 已到拆分临界点。'],
    ['P2', '资源体积', '继续加视频/大图会失控。'],
    ['P2', '内容重复游玩度', '第一局体验够，但三局后事件和构筑路线会显单薄。'],
  ], [1200, 2500, 5660]),

  h1('11. Gate Verdicts'),
  h2('Design Gate：APPROVED WITH CONCERNS'),
  bullet('通过原因：核心幻想成立、题材差异化明显、竖切链路完整、安全机制开始进入规则层。'),
  bullet('Concern：构筑路线还不够清晰、attack chain 还不是完整系统、新手理解成本较高。'),
  h2('Code Gate：APPROVED WITH REFACTOR REQUIRED BEFORE NEXT MAJOR FEATURE'),
  bullet('通过原因：可构建、有类型、有自动化检查、核心流程清楚。'),
  bullet('Concern：engine.ts / App.tsx 过大，内容与逻辑还没完全数据驱动，资产命名和旧主题技术债残留。'),
  h2('Playtest Gate：READY FOR SMALL CLOSED PLAYTEST'),
  p('适合 5-10 个懂游戏/懂安全的朋友、2-3 个不懂安全但玩过卡牌游戏的人、1-2 个懂安全但不怎么玩卡牌的人。不适合大规模公开宣发、商业上架、投放广告、Steam 页面正式开。'),

  h1('12. 下一步建议'),
  h2('Step 1：修发布文档小错'),
  bullet('README release URL 改成 zhuowater/Night-Patrol。'),
  bullet('GitHub Actions 描述改为三平台。'),
  bullet('Release / README 保持一致。'),
  h2('Step 2：做一轮结构化试玩'),
  p('输出一份 playtest report，记录玩家是否理解 IOC、是否知道算力和能量区别、是否看得懂攻击链反制、第一场战斗是否顺利出牌、第一局是否能打到 Boss、输了是否知道为什么、赢了是否觉得爽。'),
  h2('Step 3：v0.2.3 只做 4 件事'),
  num('新手首次机制提示。'),
  num('Boss 阶段化。'),
  num('新增 4-6 个安全事件。'),
  num('拆 engine.ts / App.tsx 的高风险部分。'),
  h2('Step 4：v0.2.4 再做内容扩张'),
  p('再加新卡、新工具、更多攻击链、第二关、更多视频/演出。'),

  h1('13. 总结'),
  p('这个项目现在最有价值的地方不是“做出了一个卡牌 demo”，而是它已经证明“网络安全响应”可以被转译成 roguelike 卡牌构筑体验。'),
  p('这是有潜力的方向。但下一阶段的关键不是继续猛堆内容，而是把它从“聪明的 demo”打磨成“玩家不用懂安全也能玩懂、懂安全的人又觉得专业”的产品。'),
  quote('最终判断：值得继续做。但 v0.2.3 应该走“试玩反馈 + 规则清晰 + 架构拆分”，不要急着第二关，不要急着更多视频，不要急着商业化。'),
);

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, font: 'Arial', color: '0F172A' }, paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, font: 'Arial', color: '1E3A8A' }, paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, font: 'Arial', color: '155E75' }, paragraph: { spacing: { before: 160, after: 90 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: bulletRef, levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: numberRef, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [textRun('Night Patrol SOC Professional Evaluation — Page ', { size: 18, color: '64748B' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: '64748B' })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(out, buffer);
  console.log(out);
});

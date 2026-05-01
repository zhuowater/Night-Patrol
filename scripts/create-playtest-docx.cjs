const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, Footer, PageNumber,
} = require('docx');

const out = '/root/workspace/Night-Patrol/docs/night-patrol-playtest-report.docx';
const border = { style: BorderStyle.SINGLE, size: 1, color: 'D9E2EC' };
const borders = { top: border, bottom: border, left: border, right: border };

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120, before: opts.before || 0 },
    alignment: opts.align,
    children: [new TextRun({ text, bold: opts.bold, color: opts.color, size: opts.size })],
  });
}
function h(text, level = 1) {
  return new Paragraph({ heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80 }, children: [new TextRun(text)] });
}
function num(text) {
  return new Paragraph({ numbering: { reference: 'numbers', level: 0 }, spacing: { after: 80 }, children: [new TextRun(text)] });
}
function cell(text, width, fill = 'FFFFFF', bold = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), bold })] })],
  });
}
function table(headers, rows, widths) {
  return new Table({
    width: { size: widths.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ children: headers.map((x,i)=>cell(x,widths[i],'DDEBFF',true)) }),
      ...rows.map((r,ri)=>new TableRow({ children: r.map((x,i)=>cell(x,widths[i],ri%2?'F8FAFC':'FFFFFF')) })),
    ],
  });
}

const children = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 180 }, children: [new TextRun({ text: '《夜巡 SOC：边界告警》', bold: true, size: 36, color: '0F172A' })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 420 }, children: [new TextRun({ text: '资深玩家完整试玩反馈报告', bold: true, size: 28, color: '1D4ED8' })] }),
  p('项目路径：/root/workspace/Night-Patrol'),
  p('版本：package.json 0.2.2；难度：标准值班（normal）；试玩种子：1499616542'),
  p('跑局结论：通关，最终 HP 56/84，预算 69，牌组 14 张，工具 4 件。'),
  p('验证：check:theme、check:attack-chain、check:engine-scenarios、build 均通过；确定性完整跑局脚本通关。'),

  h('1. 一句话结论'),
  p('这个 demo 已经不是“皮肤套壳”的卡牌游戏：安全响应主题、攻击链反制、IOC/噪声/降权/算力几条机制已经能互相咬合，标准难度完整一局可通关，且中后期能形成构筑感。'),
  p('当前最大问题不是“好不好玩”，而是：核心循环已经有了，信息表达、操作反馈和数值闭环还没完全跟上。地图选择信息不足、卡牌实际无需目标但 UI 强调拖拽、部分抽牌循环近似无限/拖长战斗，Boss 战偏长但阶段压力不足。'),

  h('2. 完整跑局摘要'),
  h('2.1 路线', 2),
  ...['边界告警：普通战斗','异常事件：短暂维护窗口，选择升级剧本','高危入侵：精英战','维护窗口：升级','高危入侵：精英战','情报市场：购买工具','高危入侵：精英战','核心域控：Boss'].map(num),
  p('路线评价：本局主动选择偏高风险路线（3 个精英 + 商店 + 维护窗口）。这在资深 Roguelike 玩家逻辑里合理：前期血量充足，尽早打精英拿工具滚雪球。地图结构支持这种策略，但 UI 没有充分解释“为什么这条线更好”。'),
  h('2.2 构筑成型', 2),
  ...[
    '标记 IOC+：主引擎，升级后效率明显提升。',
    '自动化响应+：长期防御 + 算力，属于强力 Power。',
    '持续监控：每回合多抽 1 张，增强循环。',
    '溯源打击：IOC payoff，把标记转化为爆发伤害。',
    '降噪过滤：防护 + 降权，后期 Boss 战压伤害关键。',
    '查询缓存 / 长时日志 / 零信任策略 / 封禁热键：提升启动、抽牌、首攻和生存。',
  ].map(bullet),
  p('最终构筑方向清晰：IOC 标记 → 抽牌维持 → 溯源收割 → 自动化响应兜底防御。这是本 demo 最值得保留的部分。'),
  h('2.3 战斗结果', 2),
  table(['楼层','节点','敌人','回合','HP 变化','评价'], [
    ['1','普通战斗','钓鱼载荷','2','84 → 84','初战节奏快，但敌人连续 debuff，无伤通过'],
    ['3','精英','凭据窃取器','4','84 → 73','第一波真实压力，多段伤害有效'],
    ['5','精英','C2 操作员','4','73 → 73','IOC + 自动化响应成型，压力降低'],
    ['7','精英','凭据窃取器','9','73 → 73','战斗偏拖，抽牌循环开始过强'],
    ['8','Boss','勒索核心','14','73 → 56','长度足够，但中后段变例行堆防 + 慢磨'],
  ], [720, 1300, 1500, 720, 1100, 4020]),

  h('3. 资深玩家主观体验'),
  h('3.1 第一印象', 2),
  ...[
    '标题、背景、HUD、卡牌命名统一表达“夜班 SOC + 攻击链响应”。',
    'IOC / 噪声告警 / 降权 / 算力 / 自动化响应不是简单换皮，而是能映射到安全语义。',
    '顶部 HUD 有资源、牌组、遗物、地图进度，Roguelike 信息骨架完整。',
  ].map(bullet),
  p('问题：第一眼“像游戏”，但第一眼“不知道下一步该点哪”。地图页路线线条、节点层级、当前可选节点、确认动作表达偏弱；战斗页信息密度高，新玩家容易阅读过载。'),
  h('3.2 卡牌手感', 2),
  p('当前卡牌池已有三类有效组件：启动/循环，防御/控制，标记/爆发。资深玩家能读出 IOC 标记流、抽牌循环流、自动化防御流、算力爆发流。'),
  p('主要手感问题：0 费抽牌/防御链过于丝滑，缺少回合内限制提示。中后期多次出现连续“日志检索 / 关联分析 / 快速 triage”的长链，战斗从“决策”变成“把能打的都打出去”。'),
  h('3.3 敌人设计', 2),
  p('敌人语义很好：钓鱼载荷对应凭据喷洒，C2 操作员对应强度增长与噪声注入，凭据窃取器对应多段压力，勒索核心对应高额攻击与核心驻留。'),
  p('但敌人的攻击链机制还没有足够变成差异化解题。多数时候最优策略仍然是：有抽牌先抽，有 Power 先下，能防就防，剩余打伤害。'),

  h('4. 关键问题清单'),
  h('P0：战斗结束/低血反馈不够直观', 2),
  p('跑局中多次出现敌人被压到极低血量但没有让玩家立刻形成“击杀确认”的体验，例如 Boss 第 14 回合行动后敌人只剩 2 HP，最后依赖回合结束后的 IOC 持续伤害进入胜利动画。建议在敌人低血且有 IOC 时显示“回合结束将处置”预测，或调整持续 IOC 触发时机/反馈。'),
  h('P0：卡牌交互提示与实际逻辑不一致', 2),
  p('UI 强调“拖到目标身上施放”，但引擎 playCard(state, uid) 不需要目标参数，所有牌默认结算到当前敌人或自身。短期若只有单敌人，应改为“点击或拖出施放，攻击默认命中当前攻击链”；若准备多目标，应尽快把目标选择接入引擎。'),
  h('P1：0 费抽牌循环过强', 2),
  p('日志检索、关联分析、快速 triage、持续监控、查询缓存组合后，回合长度变长但决策密度下降。建议日志检索改 1 费抽 3 或条件抽；快速 triage 未升级不抽牌；查询缓存限制每回合首次触发；敌人加入反多牌/反过牌机制。'),
  h('P1：地图决策信息不足', 2),
  p('地图让我知道“我要选路线”，但不知道“为什么选这个”。建议节点详情展示预计奖励、风险等级、可能敌人池；二跳路线高亮；同名节点加副标题；可选节点卡片加“前往此节点”按钮。'),
  h('P1：Boss 战阶段感不足', 2),
  p('Boss 打了 14 回合，长度完整，但体验上不是阶段推进，而是重复处理类似意图。建议 HP 70% / 35% 触发阶段文案和机制变化，加入勒索倒计时 UI，让算力成为 Boss 关键解法。'),
  h('P2：安全术语与修仙素材风格拉扯', 2),
  p('代码与资源里仍有 zhusha/incense/citygod/tigerlord/waterghost 等旧语义，UI 文案已切到 SOC。后续维护容易混乱。建议新增内容统一 cybersec 命名，并把“法门”等残留词改为“持续效果”等安全产品语义。'),

  h('5. 数值与平衡建议'),
  p('标准难度目前偏“可通关、压力中低”。本局贪路线打了 3 个精英，仍以 56/84 通关。不要简单加敌人血量，更应该增加解题压力：凭据类没有降权时噪声污染更明显；C2 类没有 IOC 时周期性注入噪声或强度；勒索 Boss 没有算力时触发真实伤害或封锁抽牌。'),
  table(['卡牌','当前感受','建议'], [
    ['日志检索','0 费抽 2 太强','改 1 费抽 3，或 0 费条件抽 2'],
    ['快速 triage','0 费防护+抽牌强','未升级不抽牌，升级抽 1'],
    ['关联分析','有 IOC 后过牌很强','保留，但加强“需要 IOC”的表达'],
    ['自动化响应','拿到后稳定性大增','保留稀有强度，但 Boss 对 Power 有反制更好'],
    ['溯源打击','概念好，爆发感略弱','增加击杀/大额命中特效与预估伤害'],
    ['降噪过滤','后期压 Boss 很强','让敌人 UI 更明显显示降权收益'],
  ], [1600, 2600, 5160]),

  h('6. UI/UX 建议'),
  ...[
    '标题页：点击“接管夜班”后的 loading/转场反馈更强；难度卡选中态更醒目。',
    '地图页：增强当前节点、可选节点、已访问节点层级；连线更亮，二跳高亮。',
    '战斗页：手牌 hover 放大；攻击牌 hover 敌人显示预计伤害；技能牌 hover 自身显示预计防护/抽牌。',
    '左侧攻击链说明可折叠：首次遇到敌人展开，之后默认收起为关键反制标签。',
    '奖励/商店：奖励牌标注稀有度和构筑标签；预算不足时按钮状态和原因更明确。',
  ].map(bullet),

  h('7. 下一轮迭代建议'),
  ...[
    '先修表达一致性：卡牌操作提示、地图确认按钮、残留修仙词。',
    '削弱无限循环倾向：调整 0 费抽牌、限制查询缓存、加入敌人反过牌。',
    '强化 Boss 阶段：2~3 阶段、勒索倒计时 UI、算力关键资源。',
    '增强伤害/防护预测：hover 显示预计结果，敌人意图显示需要多少防护。',
  ].map(num),

  h('8. 结论'),
  p('以资深卡牌 Roguelike 玩家视角，这个版本已经具备“能玩完一局，并且愿意讨论构筑”的基础。它最强的地方是主题机制：安全响应不是贴皮，而是和卡牌动作产生了对应关系。'),
  p('下一步不要急着堆更多卡、更多敌人。先让玩家更清楚为什么选路线、一张牌打出后会发生什么；限制 0 费抽牌链；把 Boss 从“长血条”改成“阶段化安全事故”。如果按这个方向打磨，夜巡 SOC 会从完成度不错的 demo，变成有自己题材壁垒的安全主题卡牌 Roguelike。'),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 30, bold: true, font: 'Arial', color: '0F172A' }, paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 25, bold: true, font: 'Arial', color: '1D4ED8' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
    ],
  },
  numbering: { config: [
    { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
  ]},
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun('Night Patrol Playtest Report · Page '), new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buf);
  console.log(out);
});

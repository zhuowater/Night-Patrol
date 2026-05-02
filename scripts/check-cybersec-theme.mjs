import fs from 'node:fs';

const files = [
  'package.json',
  'index.html',
  'electron/main.cjs',
  'src/game/content.ts',
  'src/game/engine.ts',
  'src/game/engine/attackChain.ts',
  'src/game/engine/cardEffects.ts',
  'src/App.tsx',
  'src/ui/screens.tsx',
  'src/styles.css',
  'src/phaser/CombatStage.tsx',
  'README.md',
];

const requiredSnippets = [
  { file: 'package.json', text: 'zhuowater and Hermes' },
  { file: 'src/ui/screens.tsx', text: 'zhuowater × Hermes 联合开发' },
  { file: 'src/ui/screens.tsx', text: '取证价值' },
  { file: 'src/ui/screens.tsx', text: '战术代价' },
  { file: 'src/ui/screens.tsx', text: '情报报价单' },
  { file: 'src/ui/screens.tsx', text: '清理误报规则' },
  { file: 'src/ui/screens.tsx', text: '异常事件 · 值班研判' },
  { file: 'src/ui/screens.tsx', text: '研判信号' },
  { file: 'src/ui/screens.tsx', text: '维护窗口 · 变更评审' },
  { file: 'src/ui/screens.tsx', text: '变更影响' },
  { file: 'src/App.tsx', text: '攻击链态势' },
  { file: 'src/App.tsx', text: '建议响应' },
  { file: 'src/App.tsx', text: '术语解释' },
  { file: 'src/App.tsx', text: 'IOC：标记后可被沙箱引爆' },
  { file: 'src/game/content.ts', text: 'attackChain' },
  { file: 'src/game/content.ts', text: 'C2 持久化' },
  { file: 'src/game/content.ts', text: '横向移动' },
  { file: 'src/game/content.ts', text: '凭据喷洒' },
  { file: 'src/game/content.ts', text: '勒索加密' },
  { file: 'src/App.tsx', text: '推荐反制' },
  { file: 'src/game/engine/attackChain.ts', text: 'applyAttackChainPressure' },
  { file: 'src/game/engine/attackChain.ts', text: 'C2 信标回连' },
  { file: 'src/game/engine/attackChain.ts', text: '横向移动扩大落点' },
  { file: 'src/game/engine/attackChain.ts', text: '凭据喷洒污染抽牌' },
  { file: 'src/game/engine/attackChain.ts', text: '勒索倒计时' },
  { file: 'src/App.tsx', text: '链路风险预告' },
  { file: 'src/App.tsx', text: '下次信标' },
  { file: 'src/App.tsx', text: '抽牌污染' },
  { file: 'src/App.tsx', text: '勒索倒计时' },
  { file: 'src/App.tsx', text: '横移失控' },
  { file: 'src/game/types.ts', text: 'lastInterruption' },
  { file: 'src/game/engine/cardEffects.ts', text: 'recordAttackChainInterruption' },
  { file: 'src/game/engine/cardEffects.ts', text: '主动打断' },
  { file: 'src/App.tsx', text: '主动打断反馈' },
  { file: 'src/App.tsx', text: '最近压制' },
  { file: 'src/App.tsx', text: '反制窗口' },
  { file: 'src/App.tsx', text: 'C2：IOC ≥ 1 可拦截信标' },
  { file: 'src/styles.css', text: 'intel-counterplay' },
  { file: 'src/game/engine/attackChain.ts', text: 'applyAttackChainCounterplay' },
  { file: 'src/game/engine/attackChain.ts', text: 'C2 追踪拦截' },
  { file: 'src/game/engine/attackChain.ts', text: '凭据隔离清洗' },
  { file: 'src/game/engine/attackChain.ts', text: '勒索恢复演练' },
];

const banned = [
  '荒庙',
  '妖',
  '香火',
  '城隍',
  '山君',
  '符印',
  '阴寒',
  '阴市',
  '荒村',
  '破庙',
  '志怪',
  '朱砂',
  '桃木',
  '纸人',
  '残灯',
  '夜巡录',
];

const findings = [];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const term of banned) {
      if (line.includes(term)) findings.push({ file, line: index + 1, term, text: line.trim() });
    }
  });
}

if (findings.length > 0) {
  console.error('Cybersecurity retheme check failed: old-theme visible terms remain.');
  for (const finding of findings.slice(0, 120)) {
    console.error(`${finding.file}:${finding.line} [${finding.term}] ${finding.text}`);
  }
  if (findings.length > 120) console.error(`... ${findings.length - 120} more findings`);
  process.exit(1);
}

const requiredMissing = requiredSnippets.filter(({ file, text }) => {
  if (!fs.existsSync(file)) return true;
  return !fs.readFileSync(file, 'utf8').includes(text);
});

if (requiredMissing.length > 0) {
  console.error('Cybersecurity retheme check failed: required themed snippets are missing.');
  for (const missing of requiredMissing) {
    console.error(`${missing.file} missing: ${missing.text}`);
  }
  process.exit(1);
}

console.log('Cybersecurity retheme check passed.');

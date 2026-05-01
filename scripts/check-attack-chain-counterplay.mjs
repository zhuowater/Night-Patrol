import fs from 'node:fs';

const engine = fs.readFileSync('src/game/engine.ts', 'utf8');
const app = fs.readFileSync('src/App.tsx', 'utf8');
const themeCheck = fs.readFileSync('scripts/check-cybersec-theme.mjs', 'utf8');

const required = [
  { file: 'src/game/engine.ts', text: 'function applyAttackChainCounterplay', reason: 'centralized counterplay must run before punitive attack-chain pressure' },
  { file: 'src/game/engine.ts', text: 'C2 追踪拦截', reason: 'IOC layers should be able to intercept C2 beacon noise' },
  { file: 'src/game/engine.ts', text: '凭据隔离清洗', reason: 'weak counterplay should clean credential noise before draw penalty snowballs' },
  { file: 'src/game/engine.ts', text: '勒索恢复演练', reason: 'saved compute should cancel ransomware countdown damage' },
  { file: 'src/App.tsx', text: '反制窗口', reason: 'UI must expose upcoming player counterplay, not only enemy risks' },
  { file: 'src/App.tsx', text: 'C2：IOC ≥ 1 可拦截信标', reason: 'UI forecast must teach C2 counterplay rule' },
  { file: 'src/App.tsx', text: '本回合 IOC 拦截，噪声不增加', reason: 'risk forecast must account for C2 counterplay instead of contradicting the engine' },
  { file: 'src/App.tsx', text: 'enemy.weak > 1 ? "敌方已降权，下次抽牌前清洗"', reason: 'risk forecast must account for weak decay before credential cleanup' },
  { file: 'src/App.tsx', text: '本回合算力恢复演练取消扣血', reason: 'risk forecast must account for ransomware recovery counterplay' },
  { file: 'scripts/check-cybersec-theme.mjs', text: '反制窗口', reason: 'theme regression checker must lock the new visible UI surface' },
];

const sources = {
  'src/game/engine.ts': engine,
  'src/App.tsx': app,
  'scripts/check-cybersec-theme.mjs': themeCheck,
};

const missing = required.filter(({ file, text }) => !sources[file].includes(text));

if (missing.length > 0) {
  console.error('Attack-chain counterplay check failed. Missing required coverage:');
  for (const item of missing) {
    console.error(`- ${item.file}: ${item.text} (${item.reason})`);
  }
  process.exit(1);
}

const pressureIndex = engine.indexOf('function applyAttackChainPressure');
const counterplayIndex = engine.indexOf('function applyAttackChainCounterplay');
if (counterplayIndex < 0 || pressureIndex < 0 || counterplayIndex > pressureIndex) {
  console.error('Attack-chain counterplay check failed: applyAttackChainCounterplay must be defined before applyAttackChainPressure for reviewability.');
  process.exit(1);
}

console.log('Attack-chain counterplay check passed.');

import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function ask(question) {
  const interfaceHandle = readline.createInterface({ input, output });
  try { return await interfaceHandle.question(question); }
  finally { interfaceHandle.close(); }
}

export async function askWithDefault(question, fallback = '') {
  const answer = await ask(`${question}${fallback ? ` [${fallback}]` : ''}: `);
  return answer.trim() || String(fallback);
}

export async function choose(question, choices, fallbackIndex = 0) {
  console.log(`\n${question}`);
  choices.forEach((choice, index) => console.log(`  ${index + 1}) ${choice}`));
  const raw = await ask(`选择 [${fallbackIndex + 1}]: `);
  if (!raw.trim()) return choices[fallbackIndex];
  const index = Number.parseInt(raw, 10) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= choices.length) {
    throw new Error(`请输入 1 到 ${choices.length} 之间的数字。`);
  }
  return choices[index];
}

export async function confirm(question, fallback = true) {
  const hint = fallback ? 'Y/n' : 'y/N';
  const raw = (await ask(`${question} [${hint}]: `)).trim().toLowerCase();
  if (!raw) return fallback;
  if (['y', 'yes', '是', 'j', 'ja'].includes(raw)) return true;
  if (['n', 'no', '否', 'nee'].includes(raw)) return false;
  throw new Error('请输入 y 或 n。');
}

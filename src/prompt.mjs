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

export async function choose(question, choices, fallbackIndex = 0, labels = {}) {
  console.log(`\n${question}`);
  const normalized = choices.map((choice) => typeof choice === 'string' ? { label: choice, value: choice } : choice);
  normalized.forEach((choice, index) => console.log(`  ${index + 1}) ${choice.label}`));
  while (true) {
    const raw = await ask(`${labels.select ?? 'Select'} [${fallbackIndex + 1}]: `);
    if (!raw.trim()) return normalized[fallbackIndex].value;
    const index = Number.parseInt(raw, 10) - 1;
    if (Number.isInteger(index) && index >= 0 && index < normalized.length) return normalized[index].value;
    console.log(typeof labels.invalidChoice === 'function'
      ? labels.invalidChoice(normalized.length)
      : labels.invalidChoice ?? `Enter a number from 1 to ${normalized.length}.`);
  }
}

export async function confirm(question, fallback = true, labels = {}) {
  const hint = fallback ? 'Y/n' : 'y/N';
  while (true) {
    const raw = (await ask(`${question} [${hint}]: `)).trim().toLowerCase();
    if (!raw) return fallback;
    if (['y', 'yes', '是', 'j', 'ja'].includes(raw)) return true;
    if (['n', 'no', '否', 'nee'].includes(raw)) return false;
    console.log(labels.invalidConfirm ?? 'Enter y or n.');
  }
}

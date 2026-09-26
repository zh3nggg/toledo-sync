import readline from 'node:readline/promises';
import { emitKeypressEvents } from 'node:readline';
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
  const normalized = choices.map((choice) => typeof choice === 'string' ? { label: choice, value: choice } : choice);
  if (input.isTTY && output.isTTY && typeof input.setRawMode === 'function') {
    return runTerminalMenu(question, normalized, fallbackIndex, labels, false);
  }
  console.log(`\n${question}`);
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

export async function chooseMany(question, choices, selectedValues = [], labels = {}) {
  const normalized = choices.map((choice) => typeof choice === 'string' ? { label: choice, value: choice } : choice);
  if (input.isTTY && output.isTTY && typeof input.setRawMode === 'function') {
    const result = await runTerminalMenu(question, normalized, 0, labels, true, selectedValues);
    return result === null ? null : new Set(result);
  }
  console.log(`\n${question}`);
  normalized.forEach((choice, index) => {
    const checked = selectedValues.includes(choice.value) ? 'x' : ' ';
    console.log(`  ${index + 1}) [${checked}] ${choice.label}`);
  });
  const raw = (await ask(`${labels.multiSelectHelp ?? 'Enter numbers separated by commas, or all/none; Enter keeps the current selection'}: `)).trim();
  if (!raw) return new Set(selectedValues);
  if (['all', 'a'].includes(raw.toLowerCase())) return new Set(normalized.filter((choice) => !choice.disabled).map((choice) => choice.value));
  if (['none', 'n'].includes(raw.toLowerCase())) return new Set();
  const chosen = new Set();
  for (const token of raw.split(',').map((value) => value.trim()).filter(Boolean)) {
    const choice = /^\d+$/.test(token)
      ? normalized[Number(token) - 1]
      : normalized.find((item) => String(item.value).toLowerCase() === token.toLowerCase());
    if (choice && !choice.disabled) chosen.add(choice.value);
  }
  return chosen;
}

async function runTerminalMenu(question, choices, fallbackIndex, labels, multiple, initialValues = []) {
  const { stdin, stdout } = { stdin: input, stdout: output };
  const selected = new Set(initialValues);
  let cursor = Math.max(0, Math.min(fallbackIndex, choices.length - 1));
  let offset = 0;
  const previousRawMode = Boolean(stdin.isRaw);
  const pageSize = () => Math.max(3, (stdout.rows || 24) - 7);
  const clampOffset = () => {
    const size = pageSize();
    if (cursor < offset) offset = cursor;
    if (cursor >= offset + size) offset = cursor - size + 1;
    offset = Math.max(0, Math.min(offset, Math.max(0, choices.length - size)));
  };
  const render = () => {
    clampOffset();
    const size = pageSize();
    const visible = choices.slice(offset, offset + size);
    const nav = multiple ? labels.multiSelectHelp : labels.navigation;
    const lines = [question, nav ?? '', ''];
    for (let index = 0; index < visible.length; index += 1) {
      const actualIndex = offset + index;
      const choice = visible[index];
      const active = actualIndex === cursor;
      const marker = multiple ? (selected.has(choice.value) ? '[✓]' : '[ ]') : (active ? '›' : ' ');
      const disabled = choice.disabled ? ` ${labels.unavailable ?? '(unavailable)'}` : '';
      const text = `${marker} ${choice.label}${disabled}`;
      const width = Math.max(12, (stdout.columns || 80) - 1);
      const fitted = [...text].length > width ? `${[...text].slice(0, width - 1).join('')}…` : text;
      lines.push(`${active ? '\x1b[36m' : ''}${fitted}${active ? '\x1b[0m' : ''}`);
    }
    if (choices.length > size) lines.push('', `${offset + 1}–${Math.min(offset + size, choices.length)} / ${choices.length}`);
    if (multiple && labels.selectedCount) lines.push('', labels.selectedCount(selected.size));
    stdout.write('\x1b[H\x1b[2J' + lines.join('\n'));
  };

  return new Promise((resolve, reject) => {
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      stdin.removeListener('keypress', onKeypress);
      stdout.removeListener('resize', render);
      try { stdin.setRawMode(previousRawMode); } catch { /* Input may have been closed. */ }
      stdin.pause();
      stdout.write('\x1b[?25h\x1b[?1049l');
    };
    const complete = (value) => { cleanup(); resolve(value); };
    const onKeypress = (_character, key = {}) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        reject(new Error('Canceled by user.'));
        return;
      }
      if (key.name === 'up' || key.name === 'k') cursor = (cursor - 1 + choices.length) % choices.length;
      else if (key.name === 'down' || key.name === 'j') cursor = (cursor + 1) % choices.length;
      else if (key.name === 'pageup') cursor = Math.max(0, cursor - pageSize());
      else if (key.name === 'pagedown') cursor = Math.min(choices.length - 1, cursor + pageSize());
      else if (key.name === 'home') cursor = 0;
      else if (key.name === 'end') cursor = choices.length - 1;
      else if (multiple && (key.name === 'space' || _character === ' ')) {
        const choice = choices[cursor];
        if (!choice.disabled) selected.has(choice.value) ? selected.delete(choice.value) : selected.add(choice.value);
      } else if (multiple && ['a', 'A'].includes(_character)) {
        for (const choice of choices) if (!choice.disabled) selected.add(choice.value);
      } else if (multiple && ['n', 'N'].includes(_character)) selected.clear();
      else if (key.name === 'return' || key.name === 'enter') {
        const choice = choices[cursor];
        if (multiple) complete([...selected]);
        else if (!choice.disabled) complete(choice.value);
        return;
      } else if (!multiple && /^\d$/.test(_character ?? '')) {
        const index = Number(_character) - 1;
        if (index >= 0 && index < choices.length && !choices[index].disabled) complete(choices[index].value);
        return;
      } else if (multiple && key.name === 'escape') {
        complete(null);
        return;
      }
      render();
    };

    try {
      stdin.setRawMode(true);
      stdin.resume();
      emitKeypressEvents(stdin);
      stdin.on('keypress', onKeypress);
      stdout.on('resize', render);
      stdout.write('\x1b[?1049h\x1b[?25l');
      render();
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}

export async function confirm(question, fallback = true, labels = {}) {
  if (input.isTTY && output.isTTY && typeof input.setRawMode === 'function') {
    return runTerminalMenu(question, [
      { label: labels.yes ?? 'Yes', value: true },
      { label: labels.no ?? 'No', value: false }
    ], fallback ? 0 : 1, labels, false);
  }
  const hint = fallback ? 'Y/n' : 'y/N';
  while (true) {
    const raw = (await ask(`${question} [${hint}]: `)).trim().toLowerCase();
    if (!raw) return fallback;
    if (['y', 'yes', '是', 'j', 'ja'].includes(raw)) return true;
    if (['n', 'no', '否', 'nee'].includes(raw)) return false;
    console.log(labels.invalidConfirm ?? 'Enter y or n.');
  }
}

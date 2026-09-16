import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

export async function ask(question) {
  const interfaceHandle = readline.createInterface({ input, output });
  try { return await interfaceHandle.question(question); }
  finally { interfaceHandle.close(); }
}


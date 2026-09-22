import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export default async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') return;

  // Extended attributes from downloaded framework archives can make macOS
  // reject even an ad-hoc signature. Strip them before electron-builder signs
  // the application bundle; this does not alter application file contents.
  await execFileAsync('/usr/bin/xattr', ['-cr', context.appOutDir]);
}

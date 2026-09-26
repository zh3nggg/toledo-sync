import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

await fs.mkdir('release', { recursive: true });
const root = path.resolve('_codex/cli-package');
await fs.mkdir(root, { recursive: true });
const staging = await fs.mkdtemp(path.join(root, 'package-'));
const manifest = JSON.parse(await fs.readFile('package.json', 'utf8'));
const lock = JSON.parse(await fs.readFile('package-lock.json', 'utf8'));
for (const item of manifest.files) await fs.cp(item, path.join(staging, item), { recursive: true });
delete manifest.build;
delete manifest.devDependencies;
delete manifest.desktopName;
manifest.main = 'src/linux-cli.mjs';
manifest.scripts = { start: 'node src/linux-cli.mjs' };
for (const name of Object.keys(manifest.dependencies)) {
  const version = lock.packages?.[`node_modules/${name}`]?.version;
  if (!version) throw new Error(`No locked version for ${name}`);
  manifest.dependencies[name] = version;
}
await fs.writeFile(path.join(staging, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
// npm sets this path on every platform; avoid shell-specific npm wrappers.
if (!process.env.npm_execpath) throw new Error('Run npm run make:cli.');
const child = spawn(process.execPath, [process.env.npm_execpath, 'pack', staging, '--pack-destination', path.resolve('release')], { stdio: 'inherit' });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('close', code => { process.exitCode = code ?? 1; });

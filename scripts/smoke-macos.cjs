// Run with Electron, passing the built .app path. Uses an isolated, hidden
// renderer and mock IPC; it never accesses a real Toledo account or sync state.
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'toledo-macos-smoke-'));
app.setPath('userData', profile);
const timeout = setTimeout(() => { console.error('Smoke test timed out'); app.exit(1); }, 30000);
app.whenReady().then(async () => {
  app.dock?.hide();
  const archive = path.resolve(process.argv[2], 'Contents/Resources/app.asar');
  assert.equal(JSON.parse(fs.readFileSync(path.join(archive, 'package.json'))).version, '1.3.0');
  ipcMain.handle('app:initial', () => ({ platform: 'darwin', config: null }));
  const window = new BrowserWindow({ show: false, width: 860, height: 660,
    webPreferences: { preload: path.join(archive, 'desktop/preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false } });
  await window.loadFile(path.join(archive, 'desktop/renderer/index.html'));
  await window.webContents.executeJavaScript(`(async () => {
    const waitUntil = async (check) => { for (let i = 0; i < 100; i++) { if (check()) return; await new Promise(r => setTimeout(r, 50)); } throw new Error('Renderer initialization timed out'); };
    await waitUntil(() => document.body.innerText.includes('Apple Silicon'));
    if (typeof window.toledo.checkUpdates !== 'function') throw new Error('Missing preload bridge');
    for (const language of ['zh', 'en', 'nl']) {
      const select = document.querySelector('#language'); select.value = language; select.dispatchEvent(new Event('change'));
      if (document.documentElement.lang !== language) throw new Error('Language switch failed');
      for (const tab of document.querySelectorAll('.tab')) {
        tab.click();
        const panel = [...document.querySelectorAll('.tab-panel')].find(p => p.dataset.panel === tab.dataset.tab);
        if (!panel?.classList.contains('active')) throw new Error('Tab navigation failed');
      }
    }
  })()`);
  console.log('PASS: packaged 1.3.0 renderer, sandboxed preload, macOS labels, three languages and all tabs. No live account used.');
  clearTimeout(timeout);
  process.exit(0);
}).catch(error => { console.error(error); app.exit(1); });

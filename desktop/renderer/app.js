const translations = {
  zh: { tagline: '本地优先的 KU Leuven Toledo 课程材料同步工具', language: '语言', setupTitle: '下载设置', setupText: '课程文件夹会直接创建在你选择的下载根目录下。', vault: 'Obsidian Vault', downloadRoot: '下载根目录', downloadHint: '例如：D:\\Courses\\2026-2027\\G0S96A Groups and Symmetries', choose: '选择文件夹', academicYear: '学年', saveSettings: '保存设置', openDownloadRoot: '打开下载目录', coursesTitle: '课程选择', coursesText: '仅同步勾选且当前学年可访问的课程。', discover: '发现课程', syncTitle: '登录与同步', syncText: '首次使用请先登录；后续同步在后台运行。', login: '登录 Toledo', syncSelected: '同步已选课程', activity: '活动与结果', available: '已开放', unavailable: '未开放', saved: '设置已保存。', chooseVault: '选择 Obsidian Vault', chooseOutput: '选择下载根目录', syncing: '正在同步…', error: '错误' },
  en: { tagline: 'Local-first KU Leuven Toledo course material sync', language: 'Language', setupTitle: 'Download settings', setupText: 'Course folders are created directly in the download root you choose.', vault: 'Obsidian Vault', downloadRoot: 'Download root', downloadHint: 'Example: D:\\Courses\\2026-2027\\G0S96A Groups and Symmetries', choose: 'Choose folder', academicYear: 'Academic year', saveSettings: 'Save settings', openDownloadRoot: 'Open download folder', coursesTitle: 'Course selection', coursesText: 'Only selected, current-year courses that are available will be synced.', discover: 'Discover courses', syncTitle: 'Login and sync', syncText: 'Log in once; later syncs run in the background.', login: 'Log in to Toledo', syncSelected: 'Sync selected courses', activity: 'Activity and results', available: 'Available', unavailable: 'Unavailable', saved: 'Settings saved.', chooseVault: 'Choose Obsidian Vault', chooseOutput: 'Choose download root', syncing: 'Synchronizing…', error: 'Error' },
  nl: { tagline: 'Lokale synchronisatie van KU Leuven Toledo-cursusmateriaal', language: 'Taal', setupTitle: 'Downloadinstellingen', setupText: 'Cursusmappen worden rechtstreeks aangemaakt in de gekozen downloadmap.', vault: 'Obsidian Vault', downloadRoot: 'Downloadhoofdmap', downloadHint: 'Voorbeeld: D:\\Courses\\2026-2027\\G0S96A Groups and Symmetries', choose: 'Map kiezen', academicYear: 'Academiejaar', saveSettings: 'Instellingen opslaan', openDownloadRoot: 'Downloadmap openen', coursesTitle: 'Cursusselectie', coursesText: 'Alleen geselecteerde en beschikbare cursussen van dit academiejaar worden gesynchroniseerd.', discover: 'Cursussen zoeken', syncTitle: 'Aanmelden en synchroniseren', syncText: 'Meld één keer aan; latere synchronisaties gebeuren op de achtergrond.', login: 'Aanmelden bij Toledo', syncSelected: 'Geselecteerde cursussen synchroniseren', activity: 'Activiteit en resultaten', available: 'Beschikbaar', unavailable: 'Niet beschikbaar', saved: 'Instellingen opgeslagen.', chooseVault: 'Obsidian Vault kiezen', chooseOutput: 'Downloadhoofdmap kiezen', syncing: 'Bezig met synchroniseren…', error: 'Fout' }
};
let locale = localStorage.getItem('toledo-locale') || (navigator.language.startsWith('nl') ? 'nl' : navigator.language.startsWith('zh') ? 'zh' : 'en');
let state = { config: null, busy: false };
const $ = (selector) => document.querySelector(selector);
const t = (key) => translations[locale][key] || key;
function setText() { document.documentElement.lang = locale; document.title = 'Toledo Sync'; document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); }); }
function status(message) { $('#status').textContent = message; }
function result(value) { $('#results').textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }
function setBusy(value) { state.busy = value; document.querySelectorAll('button').forEach((button) => { button.disabled = value; }); }
function render() {
  const config = state.config; $('#vaultPath').value = config?.vaultPath || ''; $('#outputRoot').value = config?.outputRoot || ''; $('#academicYear').value = config?.academicYear || '2026-2027';
  const list = $('#courses'); list.replaceChildren();
  for (const course of config?.courses || []) {
    const node = $('#courseTemplate').content.firstElementChild.cloneNode(true); const checkbox = node.querySelector('input'); checkbox.checked = course.selected; checkbox.dataset.code = course.code;
    node.querySelector('strong').textContent = course.code; node.querySelector('.course-main span').textContent = course.title;
    const availability = node.querySelector('.availability'); availability.textContent = course.available ? t('available') : t('unavailable'); availability.classList.toggle('available', course.available);
    const syncButton = node.querySelector('button'); syncButton.title = `${t('syncSelected')}: ${course.code}`; syncButton.addEventListener('click', () => run(() => window.toledo.sync(course.code)));
    list.append(node);
  }
}
async function save() {
  const selectedCodes = [...document.querySelectorAll('#courses input:checked')].map((box) => box.dataset.code);
  state.config = await window.toledo.saveConfig({ vaultPath: $('#vaultPath').value, outputRoot: $('#outputRoot').value, academicYear: $('#academicYear').value.trim(), selectedCodes });
  render(); status(t('saved'));
}
async function run(operation) { try { setBusy(true); status(t('syncing')); const value = await operation(); result(value); } catch (error) { status(`${t('error')}: ${error.message}`); } finally { setBusy(false); } }
setText();
$('#language').value = locale; $('#language').addEventListener('change', (event) => { locale = event.target.value; localStorage.setItem('toledo-locale', locale); setText(); render(); });
$('#chooseVault').addEventListener('click', async () => { const folder = await window.toledo.chooseDirectory(t('chooseVault')); if (folder) $('#vaultPath').value = folder; });
$('#chooseOutput').addEventListener('click', async () => { const folder = await window.toledo.chooseDirectory(t('chooseOutput')); if (folder) $('#outputRoot').value = folder; });
$('#save').addEventListener('click', () => run(save)); $('#login').addEventListener('click', () => run(() => window.toledo.login()));
$('#discover').addEventListener('click', () => run(async () => { const value = await window.toledo.discover(); state.config = value.config; render(); return value.matches; }));
$('#sync').addEventListener('click', () => run(() => window.toledo.sync(null))); $('#openRoot').addEventListener('click', () => run(() => window.toledo.openPath($('#outputRoot').value)));
if (!window.toledo) {
  status('Desktop bridge could not start. Please reinstall the application.');
} else {
  window.toledo.onEvent((event) => status(event.message));
  (async () => { const initial = await window.toledo.initial(); $('#platform').textContent = initial.platform === 'win32' ? 'Windows' : initial.platform; state.config = initial.config; render(); })();
}

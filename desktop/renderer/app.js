const translations = {
  zh: { tagline: 'KU Leuven Toledo 课程材料同步', language: '语言', setupStep: '准备空间', setupStepHint: '选择保存位置', authStep: '登录授权', authStepHint: '连接 KU Leuven', discoverStep: '发现课程', discoverStepHint: '读取 Toledo 课程列表', syncStep: '开始同步', syncStepHint: '下载选中材料', setupTitle: '学习空间', setupText: '设置保存位置。', authTitle: '登录 Toledo', authText: '通过 KU Leuven 官方页面登录。', authRequired: '等待授权', authComplete: '已完成授权', vault: 'Obsidian Vault', downloadRoot: '下载根目录', downloadHint: '例如：D:\\Courses\\2026-2027\\G0S96A Groups and Symmetries', materialsPlacement: '课程材料位置', materialsInCourse: '直接放在课程文件夹内', materialsInSubdirectory: '放在统一命名的材料子文件夹内', materialsFolderName: '材料子文件夹名称', materialsFolderHint: '仅用于子文件夹模式；名称必须是单层文件夹名。', choose: '选择文件夹', academicYear: '学年', allAcademicYears: '不限（全部学年）', saveSettings: '保存并继续', openDownloadRoot: '打开下载目录', coursesTitle: '课程', coursesText: '选择要同步的课程。', discover: '读取课程', syncTitle: '更新', syncText: '先检查，再处理文件。', login: '登录 Toledo', syncSelected: '同步已选课程', activity: '活动监控', discovered: '已发现，可同步', notDiscovered: '尚未发现', saved: '设置已保存。', chooseVault: '选择 Obsidian Vault', chooseOutput: '选择下载根目录', syncing: '处理中…', error: '错误' },
  en: { tagline: 'KU Leuven Toledo course sync', language: 'Language', setupStep: 'Prepare space', setupStepHint: 'Choose locations', authStep: 'Sign in', authStepHint: 'Connect KU Leuven', discoverStep: 'Discover courses', discoverStepHint: 'Read Toledo’s course list', syncStep: 'Synchronize', syncStepHint: 'Download selected material', setupTitle: 'Study space', setupText: 'Set your storage locations.', authTitle: 'Sign in to Toledo', authText: 'Sign in through KU Leuven.', authRequired: 'Authorization required', authComplete: 'Authorized', vault: 'Obsidian Vault', downloadRoot: 'Download root', downloadHint: 'Example: D:\\Courses\\2026-2027\\G0S96A Groups and Symmetries', materialsPlacement: 'Course-material location', materialsInCourse: 'Directly in the course folder', materialsInSubdirectory: 'In a consistently named materials subfolder', materialsFolderName: 'Materials subfolder name', materialsFolderHint: 'Used only in subfolder mode; enter a single folder name.', choose: 'Choose folder', academicYear: 'Academic year', allAcademicYears: 'All academic years', saveSettings: 'Save and continue', openDownloadRoot: 'Open download folder', coursesTitle: 'Courses', coursesText: 'Choose which courses to sync.', discover: 'Read courses', syncTitle: 'Updates', syncText: 'Check first, then process files.', login: 'Sign in to Toledo', syncSelected: 'Synchronize selected', activity: 'Activity monitor', discovered: 'Discovered · ready to sync', notDiscovered: 'Not discovered', saved: 'Settings saved.', chooseVault: 'Choose Obsidian Vault', chooseOutput: 'Choose download root', syncing: 'Working…', error: 'Error' },
  nl: { tagline: 'KU Leuven Toledo-cursussynchronisatie', language: 'Taal', setupStep: 'Ruimte voorbereiden', setupStepHint: 'Locaties kiezen', authStep: 'Aanmelden', authStepHint: 'KU Leuven verbinden', discoverStep: 'Cursussen zoeken', discoverStepHint: 'Toledo-cursussen lezen', syncStep: 'Synchroniseren', syncStepHint: 'Geselecteerd materiaal downloaden', setupTitle: 'Studieruimte', setupText: 'Kies je opslaglocaties.', authTitle: 'Aanmelden bij Toledo', authText: 'Meld je aan via KU Leuven.', authRequired: 'Aanmelding vereist', authComplete: 'Aangemeld', vault: 'Obsidian Vault', downloadRoot: 'Downloadhoofdmap', downloadHint: 'Voorbeeld: D:\\Courses\\2026-2027\\G0S96A Groups and Symmetries', materialsPlacement: 'Locatie van cursusmateriaal', materialsInCourse: 'Rechtstreeks in de cursusmap', materialsInSubdirectory: 'In een uniform benoemde materiaalmap', materialsFolderName: 'Naam van materiaalmap', materialsFolderHint: 'Alleen in mapmodus; gebruik één mapnaam.', choose: 'Map kiezen', academicYear: 'Academiejaar', allAcademicYears: 'Alle academiejaren', saveSettings: 'Opslaan en doorgaan', openDownloadRoot: 'Downloadmap openen', coursesTitle: 'Cursussen', coursesText: 'Kies welke cursussen je wilt synchroniseren.', discover: 'Cursussen lezen', syncTitle: 'Updates', syncText: 'Controleer eerst en verwerk daarna de bestanden.', login: 'Aanmelden bij Toledo', syncSelected: 'Geselecteerde synchroniseren', activity: 'Activiteitsmonitor', discovered: 'Gevonden · klaar voor synchronisatie', notDiscovered: 'Niet gevonden', saved: 'Instellingen opgeslagen.', chooseVault: 'Obsidian Vault kiezen', chooseOutput: 'Downloadhoofdmap kiezen', syncing: 'Bezig…', error: 'Fout' }
};
Object.assign(translations.zh, { automationTitle: '自动更新', automationText: '设置应用启动和运行期间的自动检查。', autoStart: '开机时启动 Toledo Sync', autoCheckOnLaunch: '启动时检查并同步课程更新', periodicCheck: '周期性检查', periodicOff: '关闭', periodic30: '每 30 分钟', periodic60: '每小时', periodic360: '每 6 小时', periodic1440: '每天' });
Object.assign(translations.en, { automationTitle: 'Automatic updates', automationText: 'Choose whether checks run when the app starts or while it stays open.', autoStart: 'Start Toledo Sync when I log in', autoCheckOnLaunch: 'Check and synchronize updates on launch', periodicCheck: 'Scheduled checks', periodicOff: 'Off', periodic30: 'Every 30 minutes', periodic60: 'Every hour', periodic360: 'Every 6 hours', periodic1440: 'Every day' });
Object.assign(translations.nl, { automationTitle: 'Automatische updates', automationText: 'Kies of controles starten bij het openen of tijdens het gebruik.', autoStart: 'Toledo Sync starten wanneer ik me aanmeld', autoCheckOnLaunch: 'Updates controleren en synchroniseren bij het openen', periodicCheck: 'Geplande controles', periodicOff: 'Uit', periodic30: 'Elke 30 minuten', periodic60: 'Elk uur', periodic360: 'Elke 6 uur', periodic1440: 'Elke dag' });
Object.assign(translations.zh, { autoStartMac: '登录 macOS 时启动 Toledo Sync', downloadHintMac: '例如：/Users/你的名字/Courses/2026-2027' });
Object.assign(translations.en, { autoStartMac: 'Start Toledo Sync when you log in to macOS', downloadHintMac: 'Example: /Users/your-name/Courses/2026-2027' });
Object.assign(translations.nl, { autoStartMac: 'Toledo Sync starten bij het inloggen op macOS', downloadHintMac: 'Voorbeeld: /Users/jouw-naam/Courses/2026-2027' });
Object.assign(translations.zh, { checkUpdates: '检查更新', applyUpdates: '下载已检查更新', checkCourse: '检查此课程更新', summaryNew: '新增', summaryUnchanged: '未变化', summaryModified: '本地已修改', summaryKept: '已保留本地', summarySkipped: '已跳过', summaryErrors: '错误', summaryNone: '暂无可下载更新', summaryNotDiscovered: '尚未发现课程链接' });
Object.assign(translations.en, { checkUpdates: 'Check for updates', applyUpdates: 'Download checked updates', checkCourse: 'Check this course', summaryNew: 'new', summaryUnchanged: 'unchanged', summaryModified: 'locally modified', summaryKept: 'kept local', summarySkipped: 'skipped', summaryErrors: 'errors', summaryNone: 'No downloadable updates', summaryNotDiscovered: 'Course link not discovered' });
Object.assign(translations.nl, { checkUpdates: 'Op updates controleren', applyUpdates: 'Gecontroleerde updates downloaden', checkCourse: 'Deze cursus controleren', summaryNew: 'nieuw', summaryUnchanged: 'ongewijzigd', summaryModified: 'lokaal gewijzigd', summaryKept: 'lokaal behouden', summarySkipped: 'overgeslagen', summaryErrors: 'fouten', summaryNone: 'Geen downloadbare updates', summaryNotDiscovered: 'Cursuslink niet gevonden' });
Object.assign(translations.zh, { tabSpace: '学习空间', tabCourses: '登录与课程', tabUpdates: '更新中心', tabAutomation: '自动化', updateSafetyTitle: '更新是可预览的', updateSafetyText: '先检查会读取远程文件并比较内容，不会写入课程材料。本地修改文件会保留，应用时以带哈希的副本保存远程版本。' });
Object.assign(translations.en, { tabSpace: 'Study space', tabCourses: 'Sign in & courses', tabUpdates: 'Update center', tabAutomation: 'Automation', updateSafetyTitle: 'Updates are previewable', updateSafetyText: 'Check first reads remote files and compares content without writing course material. Local edits are kept; applying an update saves the remote version beside them with a hash.' });
Object.assign(translations.nl, { tabSpace: 'Studieruimte', tabCourses: 'Aanmelden & vakken', tabUpdates: 'Updatecentrum', tabAutomation: 'Automatisering', updateSafetyTitle: 'Updates zijn vooraf te bekijken', updateSafetyText: 'Eerst controleren leest externe bestanden en vergelijkt de inhoud zonder cursusmateriaal te schrijven. Lokale wijzigingen blijven behouden; toepassen bewaart de externe versie met een hash ernaast.' });
Object.assign(translations.zh, { fileTreeTitle: '更新后的文件树', fileTreeEmpty: '检查更新后将在这里显示完整文件树。', treeAllCourses: '所有已检查课程', treeNew: '新增', treeUnchanged: '未变化', treeModified: '本地修改保护副本', treeKeep: '保留本地', treeReplace: '覆盖为远程版本', treeSkip: '跳过', treePreserveCopy: '保留本地并保存远程副本', treeDownload: '下载', treeDecisionHint: '可逐个文件决定如何处理' });
Object.assign(translations.en, { fileTreeTitle: 'Resulting file tree', fileTreeEmpty: 'The complete file tree will appear here after checking for updates.', treeAllCourses: 'All checked courses', treeNew: 'new', treeUnchanged: 'unchanged', treeModified: 'local edit preserved as copy', treeKeep: 'Keep local', treeReplace: 'Replace with remote', treeSkip: 'Skip', treePreserveCopy: 'Keep local and save remote copy', treeDownload: 'Download', treeDecisionHint: 'Choose how to handle each file before applying updates.' });
Object.assign(translations.nl, { fileTreeTitle: 'Bestandsstructuur na update', fileTreeEmpty: 'De volledige bestandsstructuur verschijnt hier na het controleren.', treeAllCourses: 'Alle gecontroleerde vakken', treeNew: 'nieuw', treeUnchanged: 'ongewijzigd', treeModified: 'lokale wijziging als kopie behouden', treeKeep: 'Lokaal behouden', treeReplace: 'Vervangen door externe versie', treeSkip: 'Overslaan', treePreserveCopy: 'Lokaal behouden en externe kopie bewaren', treeDownload: 'Downloaden', treeDecisionHint: 'Kies per bestand wat er moet gebeuren voordat je toepast.' });
Object.assign(translations.zh, { verificationMode: '本地校验方式', verificationSha256: 'SHA-256（内容哈希）', verificationFilename: '文件名和路径', verificationHint: 'SHA-256 能识别内容变化并保护本地修改；文件名模式只按文件名和路径判断。' });
Object.assign(translations.en, { verificationMode: 'Local verification', verificationSha256: 'SHA-256 (content hash)', verificationFilename: 'Filename and path', verificationHint: 'SHA-256 detects content changes and protects local edits; filename mode compares only names and paths.' });
Object.assign(translations.nl, { verificationMode: 'Lokale controle', verificationSha256: 'SHA-256 (inhoudshash)', verificationFilename: 'Bestandsnaam en pad', verificationHint: 'SHA-256 detecteert inhoudswijzigingen en beschermt lokale bewerkingen; naammodus vergelijkt alleen namen en paden.' });
Object.assign(translations.zh, { setupHint: '选择 Obsidian Vault、下载根目录和课程材料布局。', authHint: '密码和 MFA 只在 KU Leuven 官方登录页面处理。', coursesHint: '读取当前登录账户可见的课程，再选择要检查的课程。', syncHint: '检查阶段不会写入课程目录；确认后才应用选择。', updateSafetyHint: '检查会读取远程文件并写入 Vault 状态缓存，不会修改下载目录。应用时复用缓存内容。', copyrightLabel: '版权与使用', copyrightShort: '仅使用你有权访问和使用的课程材料。', copyrightHint: '课程材料可能受 KU Leuven、教师或其他权利人的版权和许可约束。除非获得相应授权，不得再分发、公开上传、出售、商业使用、删除权利声明或绕过访问控制；考试材料仅用于学习相关目的。请遵守 KU Leuven 规章、课程许可和适用法律。软件本身的 MIT 许可证不授予课程材料的任何额外权利。' });
Object.assign(translations.en, { setupHint: 'Choose the Obsidian Vault, download root, and course-material layout.', authHint: 'Your password and MFA are handled only on the official KU Leuven sign-in page.', coursesHint: 'Read the courses visible to your signed-in account, then choose which to check.', syncHint: 'Checking does not write to the course directory; apply only after review.', updateSafetyHint: 'Checking reads remote files into the Vault state cache without changing the download directory. Applying reuses the cached content.', copyrightLabel: 'Copyright and use', copyrightShort: 'Use course materials only as authorized.', copyrightHint: 'Course materials may be protected or licensed by KU Leuven, teaching staff, or other rights holders. Unless authorized, do not redistribute, publish publicly, sell, use commercially, remove rights notices, or bypass access controls. Examination materials are for study-related use only. Follow KU Leuven rules, course licences, and applicable law. The MIT licence for this software does not grant additional rights to course materials.' });
Object.assign(translations.nl, { setupHint: 'Kies de Obsidian Vault, downloadhoofdmap en cursusindeling.', authHint: 'Je wachtwoord en MFA worden alleen op de officiële KU Leuven-aanmeldpagina verwerkt.', coursesHint: 'Lees de cursussen die zichtbaar zijn voor je aangemelde account en kies daarna wat je wilt controleren.', syncHint: 'Controleren schrijft niets naar de cursusmap; pas toe na je beoordeling.', updateSafetyHint: 'Controleren leest externe bestanden naar de statuscache in de Vault zonder de downloadmap te wijzigen. Toepassen gebruikt de cache opnieuw.', copyrightLabel: 'Auteursrecht en gebruik', copyrightShort: 'Gebruik cursusmateriaal alleen waarvoor je toestemming hebt.', copyrightHint: 'Cursusmateriaal kan beschermd of gelicentieerd zijn door KU Leuven, docenten of andere rechthebbenden. Verspreid, publiceer, verkoop of gebruik het niet commercieel zonder toestemming; verwijder geen rechtenvermeldingen en omzeil geen toegangscontroles. Examenmateriaal is alleen voor studiegebruik. Volg de KU Leuven-regels, cursuslicenties en toepasselijke wetgeving. De MIT-licentie van deze software geeft geen extra rechten op cursusmateriaal.' });
Object.assign(translations.zh, { updateSafetyText: '先检查，再处理。' });
Object.assign(translations.en, { updateSafetyText: 'Check first, then apply.' });
Object.assign(translations.nl, { updateSafetyText: 'Eerst controleren, daarna toepassen.' });
Object.assign(translations.zh, { resetBrowser: '重置浏览器会话', resetBrowserHint: '清除 Toledo Sync 保存的浏览器会话并重新登录；不会删除课程材料。', resetBrowserConfirm: '确定要重置 Toledo Sync 的浏览器会话吗？这会退出登录，但不会删除课程材料。' });
Object.assign(translations.en, { resetBrowser: 'Reset browser session', resetBrowserHint: 'Clear the Toledo Sync browser session and sign in again. Course materials are not deleted.', resetBrowserConfirm: 'Reset the Toledo Sync browser session? You will need to sign in again. Course materials will not be deleted.' });
Object.assign(translations.nl, { resetBrowser: 'Browsersessie resetten', resetBrowserHint: 'Wis de browsersessie van Toledo Sync en meld opnieuw aan. Cursusmateriaal wordt niet verwijderd.', resetBrowserConfirm: 'De browsersessie van Toledo Sync resetten? Je moet je opnieuw aanmelden. Cursusmateriaal wordt niet verwijderd.' });
Object.assign(translations.zh, { courseUnavailable: '暂未开放，已禁用', courseUnavailableHint: 'Toledo 当前没有开放这门课，暂时不能检查材料。' });
Object.assign(translations.en, { courseUnavailable: 'Not currently open', courseUnavailableHint: 'Toledo has not opened this course yet, so update checks are disabled.' });
Object.assign(translations.nl, { courseUnavailable: 'Momenteel niet geopend', courseUnavailableHint: 'Toledo heeft deze cursus nog niet geopend; controles zijn uitgeschakeld.' });
Object.assign(translations.zh, { replaceConfirm: '你选择了覆盖本地文件。确定要用 Toledo 远程版本替换这些文件吗？' });
Object.assign(translations.en, { replaceConfirm: 'You selected replacement for local files. Replace them with the Toledo remote versions?' });
Object.assign(translations.nl, { replaceConfirm: 'Je hebt lokale bestanden vervangen geselecteerd. Wil je ze vervangen door de externe Toledo-versies?' });
let locale = localStorage.getItem('toledo-locale') || (navigator.language.startsWith('nl') ? 'nl' : navigator.language.startsWith('zh') ? 'zh' : 'en');
let state = { config: null, busy: false, authenticated: false, discoveryDone: false, activityLog: [], updatePlan: null, decisions: {} };
const $ = (selector) => document.querySelector(selector);
const t = (key) => translations[locale][key] || key;
function setText() { document.documentElement.lang = locale; document.title = 'Toledo Sync'; document.querySelectorAll('[data-i18n]').forEach((node) => { node.textContent = t(node.dataset.i18n); }); document.querySelectorAll('[data-i18n-title]').forEach((node) => { node.title = t(node.dataset.i18nTitle); }); }
function setPlatformText() {
  $('#platform').textContent = state.platform === 'darwin' ? 'macOS · Apple Silicon' : state.platform === 'win32' ? 'Windows' : state.platform || '';
  $('#downloadHint').textContent = t(state.platform === 'darwin' ? 'downloadHintMac' : 'downloadHint');
  $('#autoStartLabel').textContent = t(state.platform === 'darwin' ? 'autoStartMac' : 'autoStart');
}
function updateMaterialsFolderVisibility() { $('#materialsFolderField').hidden = $('#materialsPlacement').value !== 'subdirectory'; }
function status(message) { $('#status').textContent = message; }
function result(value) { const summary = typeof value === 'string' ? value : JSON.stringify(value, null, 2); $('#results').textContent = `${state.activityLog.join('\n')}${state.activityLog.length ? '\n\n' : ''}${summary}`; $('#results').scrollTop = $('#results').scrollHeight; }
function appendActivity(message) { const stamp = new Date().toLocaleTimeString(); state.activityLog.push(`[${stamp}] ${message}`); if (state.activityLog.length > 250) state.activityLog.shift(); $('#results').textContent = state.activityLog.join('\n'); $('#results').scrollTop = $('#results').scrollHeight; }
function summaryText(summary) { if (!summary) return ''; if (summary.status === 'not-discovered') return t('summaryNotDiscovered'); const bits = []; if (summary.newCount) bits.push(`${summary.newCount} ${t('summaryNew')}`); if (summary.unchangedCount) bits.push(`${summary.unchangedCount} ${t('summaryUnchanged')}`); if (summary.localModifiedCount) bits.push(`${summary.localModifiedCount} ${t('summaryModified')}`); if (summary.keptCount) bits.push(`${summary.keptCount} ${t('summaryKept')}`); if (summary.skippedCount) bits.push(`${summary.skippedCount} ${t('summarySkipped')}`); if (summary.errorCount) bits.push(`${summary.errorCount} ${t('summaryErrors')}`); return bits.length ? bits.join(' · ') : t('summaryNone'); }
function fileStatusLabel(file) {
  if (file.status === 'new') return t('treeNew');
  if (file.status === 'local-modified') return t('treeModified');
  if (file.status === 'unchanged') return t('treeUnchanged');
  if (file.status === 'kept-local') return t('summaryKept');
  if (file.status === 'skipped') return t('summarySkipped');
  return file.status;
}
function defaultFileDecision(file) {
  return file.status === 'local-modified' ? 'preserve-copy' : '';
}
function decisionOptions(file) {
  if (file.status === 'new') return [['', t('treeDownload')], ['skip', t('treeSkip')]];
  if (file.status === 'local-modified') return [['preserve-copy', t('treePreserveCopy')], ['keep-local', t('treeKeep')], ['replace', t('treeReplace')], ['skip', t('treeSkip')]];
  return [];
}
function renderFileTree() {
  const select = $('#treeCourse'); const tree = $('#fileTree'); const summaries = Array.isArray(state.updatePlan) ? state.updatePlan : [];
  const previous = select.value; select.replaceChildren(); select.append(new Option(t('treeAllCourses'), 'all'));
  summaries.forEach((summary) => select.append(new Option(`${summary.code} ${summary.title}`, summary.code)));
  select.value = summaries.some((summary) => summary.code === previous) || previous === 'all' ? previous : 'all';
  const visible = select.value === 'all' ? summaries : summaries.filter((summary) => summary.code === select.value);
  tree.replaceChildren();
  if (!visible.length) { tree.textContent = t('fileTreeEmpty'); return; }
  for (const summary of visible) {
    const courseDetails = document.createElement('details'); courseDetails.className = 'tree-course'; courseDetails.open = true;
    const courseSummary = document.createElement('summary'); courseSummary.textContent = `📁 ${summary.code} ${summary.title}`; courseDetails.append(courseSummary);
    if (summary.error) {
      const error = document.createElement('p'); error.className = 'tree-status-error'; error.textContent = `${t('error')}: ${summary.error}`; courseDetails.append(error);
    }
    const list = document.createElement('ul'); list.className = 'tree-list';
    const files = [...(summary.files || [])].filter((file) => file.file || file.url).sort((a, b) => (a.file || '').localeCompare(b.file || ''));
    for (const file of files) {
      const row = document.createElement('li'); row.className = `tree-file tree-status-${file.status}`;
      const main = document.createElement('span'); main.className = 'tree-file-name'; main.textContent = file.file || file.url || 'material'; main.title = file.error || main.textContent;
      const badge = document.createElement('span'); badge.className = 'tree-status'; badge.textContent = fileStatusLabel(file);
      row.append(main, badge);
      const options = decisionOptions(file);
      if (options.length) {
        const key = file.decisionKey || `${summary.code}|${file.url || ''}`;
        const selectDecision = document.createElement('select'); selectDecision.className = 'tree-decision'; selectDecision.setAttribute('aria-label', main.textContent);
        const current = Object.prototype.hasOwnProperty.call(state.decisions, key) ? state.decisions[key] : defaultFileDecision(file);
        options.forEach(([value, label]) => selectDecision.append(new Option(label, value)));
        selectDecision.value = current;
        selectDecision.addEventListener('change', () => {
          if (selectDecision.value) state.decisions[key] = selectDecision.value;
          else delete state.decisions[key];
        });
        row.append(selectDecision);
      }
      list.append(row);
    }
    courseDetails.append(list); tree.append(courseDetails);
  }
}
function selectedCourseCodes() { return (state.config?.courses || []).filter((course) => course.selected).map((course) => course.code); }
function setBusy(value) { state.busy = value; document.querySelectorAll('button:not(.tab), select.tree-decision').forEach((control) => { control.disabled = value; }); if (!value && state.config) render(); }
function render() {
  const config = state.config; $('#vaultPath').value = config?.vaultPath || ''; $('#outputRoot').value = config?.outputRoot || ''; $('#materialsPlacement').value = config?.materialsPlacement || 'subdirectory'; $('#materialsFolderName').value = config?.materialsFolderName || 'Materials'; $('#verificationMode').value = config?.verificationMode || 'sha256'; $('#autoStart').checked = Boolean(config?.autoStart); $('#autoCheckOnLaunch').checked = Boolean(config?.autoCheckOnLaunch); $('#periodicCheckMinutes').value = String(config?.periodicCheckMinutes || 0); updateMaterialsFolderVisibility();
  const hasConfig = Boolean(config?.vaultPath && config?.outputRoot); const hasDiscovered = state.discoveryDone && (config?.courses || []).some((course) => course.discovered); const hasSelected = (config?.courses || []).some((course) => course.selected && course.discovered); const hasPlan = Array.isArray(state.updatePlan); const hasActionablePlan = hasPlan && state.updatePlan.some((summary) => summary.newCount || summary.localModifiedCount);
  $('#authState').textContent = state.authenticated ? t('authComplete') : t('authRequired'); $('#authState').classList.toggle('complete', state.authenticated);
  $('#login').disabled = !hasConfig || state.busy; $('#resetBrowser').disabled = !hasConfig || state.busy; $('#discover').disabled = !hasConfig || !state.authenticated || state.busy; $('#checkUpdates').disabled = !hasSelected || !state.authenticated || state.busy; $('#applyUpdates').disabled = !hasActionablePlan || !state.authenticated || state.busy;
  $('#stepSetup').classList.toggle('complete', hasConfig); $('#stepAuth').classList.toggle('complete', state.authenticated); $('#stepDiscover').classList.toggle('complete', hasDiscovered); $('#stepSync').classList.toggle('active', hasSelected && state.discoveryDone); $('#discoverCard').classList.toggle('locked', !state.authenticated); $('#syncCard').classList.toggle('locked', !hasSelected || !state.discoveryDone);
  renderFileTree(); const list = $('#courses'); list.replaceChildren();
  for (const course of config?.courses || []) {
    const node = $('#courseTemplate').content.firstElementChild.cloneNode(true); const checkbox = node.querySelector('input'); const available = Boolean(course.available ?? course.discovered) && Boolean(course.discovered); node.classList.toggle('unavailable', state.discoveryDone && !available); checkbox.checked = Boolean(course.selected) && available; checkbox.disabled = !state.discoveryDone || !available; checkbox.dataset.code = course.code;
    checkbox.addEventListener('change', () => {
      // Keep the in-memory selection before rebuilding the course cards.
      // Otherwise render() immediately restored the value from the old config.
      course.selected = checkbox.checked;
      state.updatePlan = null;
      render();
    });
    node.querySelector('strong').textContent = course.code; node.querySelector('.course-main span').textContent = course.title;
    node.querySelector('.update-summary').textContent = summaryText(state.updatePlan?.find((summary) => summary.code === course.code));
    const availability = node.querySelector('.availability'); const availabilityKey = !state.discoveryDone ? 'notDiscovered' : available ? 'discovered' : 'courseUnavailable'; availability.textContent = t(availabilityKey); availability.title = available ? '' : t('courseUnavailableHint'); availability.classList.toggle('available', available);
    const syncButton = node.querySelector('button'); syncButton.disabled = !state.authenticated || !state.discoveryDone || !available || state.busy; syncButton.title = `${t('checkCourse')}: ${course.code}`; syncButton.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); run(async () => { const value = await window.toledo.checkUpdates(course.code, selectedCourseCodes()); state.updatePlan = value.summaries; render(); return value.summaries; }); });
    list.append(node);
  }
}
async function save() {
  const selectedCodes = [...document.querySelectorAll('#courses input:checked')].map((box) => box.dataset.code);
  state.config = await window.toledo.saveConfig({ vaultPath: $('#vaultPath').value, outputRoot: $('#outputRoot').value, materialsPlacement: $('#materialsPlacement').value, materialsFolderName: $('#materialsFolderName').value.trim(), verificationMode: $('#verificationMode').value, autoStart: $('#autoStart').checked, autoCheckOnLaunch: $('#autoCheckOnLaunch').checked, periodicCheckMinutes: Number($('#periodicCheckMinutes').value), selectedCodes }); state.authenticated = state.config.authenticated;
  render(); status(t('saved'));
}
async function run(operation) { try { setBusy(true); appendActivity(t('syncing')); status(t('syncing')); const value = await operation(); result(value); } catch (error) { appendActivity(`${t('error')}: ${error.message}`); status(`${t('error')}: ${error.message}`); } finally { setBusy(false); } }
setText();
$('#language').value = locale; $('#language').addEventListener('change', (event) => { locale = event.target.value; localStorage.setItem('toledo-locale', locale); setText(); setPlatformText(); render(); });
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab));
}));
$('#materialsPlacement').addEventListener('change', updateMaterialsFolderVisibility);
$('#chooseVault').addEventListener('click', async () => { const folder = await window.toledo.chooseDirectory(t('chooseVault')); if (folder) $('#vaultPath').value = folder; });
$('#chooseOutput').addEventListener('click', async () => { const folder = await window.toledo.chooseDirectory(t('chooseOutput')); if (folder) $('#outputRoot').value = folder; });
$('#save').addEventListener('click', () => run(save)); $('#login').addEventListener('click', () => run(async () => { const value = await window.toledo.login(); state.authenticated = true; render(); return value; }));
$('#resetBrowser').addEventListener('click', () => { if (!window.confirm(t('resetBrowserConfirm'))) return; run(async () => { const value = await window.toledo.resetBrowser(); state.authenticated = false; state.discoveryDone = false; state.updatePlan = null; render(); return value; }); });
$('#saveAutomation').addEventListener('click', () => run(save));
$('#treeCourse').addEventListener('change', renderFileTree);
$('#discover').addEventListener('click', () => run(async () => { const value = await window.toledo.discover(); state.config = value.config; state.discoveryDone = true; state.updatePlan = null; state.decisions = {}; render(); return value.matches; }));
$('#checkUpdates').addEventListener('click', () => run(async () => { const value = await window.toledo.checkUpdates(null, selectedCourseCodes()); state.updatePlan = value.summaries; state.decisions = {}; render(); return value.summaries; })); $('#applyUpdates').addEventListener('click', () => { if (Object.values(state.decisions).includes('replace') && !window.confirm(t('replaceConfirm'))) return; run(async () => { const value = await window.toledo.applyUpdates(null, selectedCourseCodes(), state.decisions); state.updatePlan = value.summaries; render(); return value.summaries; }); }); $('#openRoot').addEventListener('click', () => run(() => window.toledo.openPath($('#outputRoot').value)));
if (!window.toledo) {
  status('Desktop bridge could not start. Please reinstall the application.');
} else {
  window.toledo.onEvent((event) => { appendActivity(event.message); status(event.message); });
  (async () => { const initial = await window.toledo.initial(); state.platform = initial.platform; setPlatformText(); state.config = initial.config; state.authenticated = Boolean(initial.config?.authenticated); render(); })();
}

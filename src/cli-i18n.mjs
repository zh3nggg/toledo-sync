export const LANGUAGE_CHOICES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'nl', label: 'Nederlands' }
];

const messages = {
  en: {
    appTitle: 'Toledo Sync · Linux CLI',
    tagline: 'KU Leuven Toledo course sync',
    copyrightShort: 'Use course materials only as authorized. Do not redistribute, publish, sell, or bypass access controls without permission.',
    selectPrompt: 'Select',
    menuNavigation: '↑/↓ move · Enter choose',
    multiSelectHelp: '↑/↓ move · Space toggle · A all · N none · Enter save · Esc cancel',
    selectedCount: '{count} selected',
    yes: 'Yes',
    no: 'No',
    invalidChoice: 'Enter a number from 1 to {count}.',
    invalidConfirm: 'Enter y or n.',
    languageQuestion: 'Language / 语言 / Taal',
    vaultPath: 'Obsidian Vault path',
    downloadRoot: 'Download root (course folders are created directly here)',
    materialLayout: 'Course-material location',
    directLayout: 'Directly in each course folder',
    subdirectoryLayout: 'In a consistently named materials subfolder',
    materialsFolderName: 'Materials subfolder name',
    verificationMode: 'Local verification',
    sha256Mode: 'SHA-256 (detect changes and protect local edits)',
    filenameMode: 'Filename and path only',
    configCreated: 'Configuration created: {path}',
    mainQuestion: 'What would you like to do?',
    signIn: 'Sign in to Toledo',
    discoverCourses: 'Read courses',
    selectCourses: 'Choose courses',
    checkUpdates: 'Check and review updates',
    monitorUpdates: 'Monitor for updates',
    settings: 'Settings',
    resetBrowser: 'Reset browser session',
    exit: 'Exit',
    status: 'Status',
    statusSignedIn: 'signed in locally',
    statusSignInRequired: 'sign-in required',
    statusCourses: '{selected} selected · {available} available · {total} found',
    browserLine: 'Browser: {path}',
    loginInstruction: 'Complete KU Leuven SSO/MFA in the browser. Toledo Sync never reads or stores your password.',
    loginSuccess: 'Toledo sign-in verified: {title}',
    discoverAfterLogin: 'Read courses now?',
    courseDiscoveryDone: 'Course discovery finished.',
    noCourses: 'No courses have been found yet. Sign in and read courses first.',
    coursesTitle: 'Courses',
    courseAvailable: 'available',
    courseUnavailable: 'unavailable',
    selectionHelp: 'Enter course numbers or codes separated by commas. Use “all” or “none”; press Enter to keep the current selection.',
    selectionQuestion: 'Selection',
    selectionInvalid: 'Unknown course selection: {values}',
    selectionSaved: 'Selected {count} course(s).',
    noSelectedCourses: 'No available courses are selected.',
    monitorInterval: 'Check interval',
    interval30: 'Every 30 minutes',
    interval60: 'Every hour',
    interval360: 'Every 6 hours',
    interval1440: 'Every day',
    monitorApply: 'Automatically apply safe updates after each check?',
    monitorStarted: 'Monitoring started. Press Ctrl+C to return to the menu.',
    monitorCycle: 'Update check started at {time}.',
    monitorStopped: 'Monitoring stopped.',
    checking: 'Checking selected courses…',
    checkComplete: 'Check complete. Course files were not changed.',
    fileTree: 'Resulting file tree',
    statusNew: 'new',
    statusUnchanged: 'unchanged',
    statusModified: 'local edit',
    statusError: 'error',
    statusSkipped: 'skipped',
    statusOther: 'other',
    summary: '{newCount} new · {unchanged} unchanged · {modified} local edits · {errors} errors',
    noUpdates: 'No downloadable updates were found.',
    reviewDecisions: 'Review individual file decisions?',
    newFileDecision: '{file}',
    conflictDecision: '{file} has local changes',
    download: 'Download',
    preserveCopy: 'Keep local file and save the remote version as a hash-suffixed copy',
    keepLocal: 'Keep local file only',
    replaceRemote: 'Replace local file with the remote version',
    skip: 'Skip',
    replaceWarning: 'One or more local files will be replaced. Continue?',
    applyUpdates: 'Apply the reviewed updates?',
    updatesApplied: 'Updates applied. Unchanged files were not rewritten.',
    settingsQuestion: 'Choose a setting',
    changeOutput: 'Change download root',
    changeLayout: 'Change course-material location',
    changeVerification: 'Change local verification',
    changeBrowser: 'Set browser executable',
    back: 'Back',
    browserPath: 'Browser executable path (leave empty for automatic detection)',
    autoDetect: 'automatic detection',
    settingsSaved: 'Settings saved.',
    resetConfirm: 'Reset the Toledo Sync browser session? Course materials will not be deleted.',
    resetDone: 'Browser session reset. Sign in to Toledo again.',
    done: 'Done.',
    configRequired: 'No configuration was found. Start the interactive wizard first or pass --config <path>.',
    doctorTitle: 'Linux browser check',
    doctorPlatform: 'Platform: {platform}',
    doctorNode: 'Node.js: {version}',
    doctorBrowser: 'Browser: {path}',
    doctorBrowserMissing: 'No supported Chrome, Edge, Chromium, Brave, or Firefox executable was found.',
    doctorHint: 'Install a browser or set TOLEDO_BROWSER_PATH. For Firefox, install Playwright’s compatible build with `toledo-sync install-browser firefox`. Ubuntu Snap Chromium is normally /snap/bin/chromium.',
    resetCommandDone: 'Browser session reset.',
    updatedConfig: 'Configuration updated: {path}',
    downloadDirectory: 'Download root: {path}',
    materialsDirect: 'Course materials: directly in each course folder',
    materialsNested: 'Course materials: in each course folder/{name}',
    verificationValue: 'Local verification: {mode}',
    selectedValue: 'Selected courses: {courses}',
    none: 'none',
    loginExpired: 'The saved Toledo session may have expired. Sign in again and retry.'
  },
  zh: {
    appTitle: 'Toledo Sync · Linux 命令行', tagline: 'KU Leuven Toledo 课程材料同步',
    copyrightShort: '仅使用你获准访问和使用的课程材料；未经授权，不得再分发、公开发布、出售或绕过访问控制。',
    menuNavigation: '↑/↓ 移动 · 回车确认', multiSelectHelp: '↑/↓ 移动 · 空格勾选 · A 全选 · N 全不选 · 回车保存 · Esc 取消', selectedCount: '已选 {count} 门', yes: '是', no: '否',
    selectPrompt: '选择', invalidChoice: '请输入 1 到 {count} 之间的数字。', invalidConfirm: '请输入 y 或 n。', languageQuestion: 'Language / 语言 / Taal',
    vaultPath: 'Obsidian Vault 路径', downloadRoot: '下载根目录（课程文件夹将直接创建在这里）', materialLayout: '课程材料位置', directLayout: '直接放在课程文件夹内', subdirectoryLayout: '放在统一命名的材料子文件夹内', materialsFolderName: '材料子文件夹名称', verificationMode: '本地校验方式', sha256Mode: 'SHA-256（识别变化并保护本地修改）', filenameMode: '仅文件名和路径', configCreated: '已创建配置：{path}',
    mainQuestion: '请选择操作', signIn: '登录 Toledo', discoverCourses: '读取课程', selectCourses: '选择课程', checkUpdates: '检查并审阅更新', monitorUpdates: '持续监控更新', settings: '设置', resetBrowser: '重置浏览器会话', exit: '退出', status: '状态', statusSignedIn: '本地已登录', statusSignInRequired: '需要登录', statusCourses: '已选 {selected} · 可用 {available} · 共发现 {total}',
    browserLine: '浏览器：{path}', loginInstruction: '请在浏览器中完成 KU Leuven SSO/MFA。Toledo Sync 不会读取或保存密码。', loginSuccess: 'Toledo 登录已确认：{title}', discoverAfterLogin: '现在读取课程吗？', courseDiscoveryDone: '课程读取完成。', noCourses: '尚未发现课程。请先登录并读取课程。', coursesTitle: '课程', courseAvailable: '可用', courseUnavailable: '不可用', selectionHelp: '输入课程序号或编号，用逗号分隔；输入 all 全选、none 全不选，直接回车保留当前选择。', selectionQuestion: '课程选择', selectionInvalid: '无法识别的课程：{values}', selectionSaved: '已选择 {count} 门课程。', noSelectedCourses: '尚未选择可用课程。', monitorInterval: '检查周期', interval30: '每 30 分钟', interval60: '每小时', interval360: '每 6 小时', interval1440: '每天', monitorApply: '每次检查后自动应用安全更新吗？', monitorStarted: '更新监控已启动。按 Ctrl+C 返回菜单。', monitorCycle: '{time} 开始检查更新。', monitorStopped: '更新监控已停止。',
    checking: '正在检查已选课程…', checkComplete: '检查完成，课程目录没有被修改。', fileTree: '预期文件树', statusNew: '新增', statusUnchanged: '未变化', statusModified: '本地已修改', statusError: '错误', statusSkipped: '跳过', statusOther: '其他', summary: '新增 {newCount} · 未变化 {unchanged} · 本地修改 {modified} · 错误 {errors}', noUpdates: '没有发现可下载的更新。', reviewDecisions: '逐个调整文件处理方式吗？', newFileDecision: '{file}', conflictDecision: '{file} 存在本地修改', download: '下载', preserveCopy: '保留本地文件，并将远程版本保存为带哈希的副本', keepLocal: '只保留本地文件', replaceRemote: '用远程版本替换本地文件', skip: '跳过', replaceWarning: '将替换一个或多个本地文件，是否继续？', applyUpdates: '应用审阅后的更新吗？', updatesApplied: '更新已应用，未变化文件没有被重写。',
    settingsQuestion: '选择设置项', changeOutput: '更改下载根目录', changeLayout: '更改课程材料位置', changeVerification: '更改本地校验方式', changeBrowser: '设置浏览器可执行文件', back: '返回', browserPath: '浏览器可执行文件路径（留空为自动检测）', autoDetect: '自动检测', settingsSaved: '设置已保存。', resetConfirm: '重置 Toledo Sync 浏览器会话吗？不会删除课程材料。', resetDone: '浏览器会话已重置，请重新登录 Toledo。', done: '完成。', configRequired: '没有找到配置。请先运行交互式向导，或传入 --config <path>。',
    doctorTitle: 'Linux 浏览器检查', doctorPlatform: '平台：{platform}', doctorNode: 'Node.js：{version}', doctorBrowser: '浏览器：{path}', doctorBrowserMissing: '没有找到受支持的 Chrome、Edge、Chromium、Brave 或 Firefox。', doctorHint: 'Firefox 请先运行 `toledo-sync install-browser firefox` 安装 Playwright 兼容构建。也可用 TOLEDO_BROWSER_PATH 指定 Chromium 系浏览器。Ubuntu Snap Chromium 通常位于 /snap/bin/chromium。', resetCommandDone: '浏览器会话已重置。', updatedConfig: '配置已更新：{path}', downloadDirectory: '下载根目录：{path}', materialsDirect: '课程材料：直接放在课程文件夹内', materialsNested: '课程材料：放在每门课程的 {name} 子文件夹内', verificationValue: '本地校验：{mode}', selectedValue: '已选课程：{courses}', none: '无', loginExpired: '保存的 Toledo 会话可能已过期，请重新登录后再试。'
  },
  nl: {
    appTitle: 'Toledo Sync · Linux-CLI', tagline: 'Synchronisatie van KU Leuven Toledo-cursussen',
    copyrightShort: 'Gebruik cursusmateriaal alleen met toestemming. Verspreid, publiceer of verkoop het niet en omzeil geen toegangscontrole zonder toestemming.',
    menuNavigation: '↑/↓ navigeren · Enter kiezen', multiSelectHelp: '↑/↓ navigeren · Spatie selecteren · A alles · N niets · Enter opslaan · Esc annuleren', selectedCount: '{count} gekozen', yes: 'Ja', no: 'Nee',
    selectPrompt: 'Kies', invalidChoice: 'Voer een nummer van 1 tot {count} in.', invalidConfirm: 'Voer y of n in.', languageQuestion: 'Language / 语言 / Taal',
    vaultPath: 'Pad naar de Obsidian Vault', downloadRoot: 'Downloadhoofdmap (cursusmappen komen rechtstreeks hierin)', materialLayout: 'Locatie van cursusmateriaal', directLayout: 'Rechtstreeks in elke cursusmap', subdirectoryLayout: 'In een uniform benoemde materiaalmap', materialsFolderName: 'Naam van de materiaalmap', verificationMode: 'Lokale controle', sha256Mode: 'SHA-256 (wijzigingen detecteren en lokale bewerkingen beschermen)', filenameMode: 'Alleen bestandsnaam en pad', configCreated: 'Configuratie gemaakt: {path}',
    mainQuestion: 'Wat wil je doen?', signIn: 'Aanmelden bij Toledo', discoverCourses: 'Cursussen lezen', selectCourses: 'Cursussen kiezen', checkUpdates: 'Updates controleren en beoordelen', monitorUpdates: 'Updates blijven controleren', settings: 'Instellingen', resetBrowser: 'Browsersessie resetten', exit: 'Afsluiten', status: 'Status', statusSignedIn: 'lokaal aangemeld', statusSignInRequired: 'aanmelding vereist', statusCourses: '{selected} gekozen · {available} beschikbaar · {total} gevonden',
    browserLine: 'Browser: {path}', loginInstruction: 'Voltooi KU Leuven SSO/MFA in de browser. Toledo Sync leest of bewaart je wachtwoord niet.', loginSuccess: 'Toledo-aanmelding bevestigd: {title}', discoverAfterLogin: 'Nu cursussen lezen?', courseDiscoveryDone: 'Cursussen zijn ingelezen.', noCourses: 'Er zijn nog geen cursussen gevonden. Meld je eerst aan en lees de cursussen.', coursesTitle: 'Cursussen', courseAvailable: 'beschikbaar', courseUnavailable: 'niet beschikbaar', selectionHelp: 'Voer nummers of cursuscodes in, gescheiden door komma’s. Gebruik “all” of “none”; druk op Enter om de huidige keuze te behouden.', selectionQuestion: 'Selectie', selectionInvalid: 'Onbekende cursusselectie: {values}', selectionSaved: '{count} cursus(sen) gekozen.', noSelectedCourses: 'Er zijn geen beschikbare cursussen gekozen.', monitorInterval: 'Controle-interval', interval30: 'Elke 30 minuten', interval60: 'Elk uur', interval360: 'Elke 6 uur', interval1440: 'Elke dag', monitorApply: 'Veilige updates na elke controle automatisch toepassen?', monitorStarted: 'Monitoring gestart. Druk op Ctrl+C om terug te keren.', monitorCycle: 'Updatecontrole gestart om {time}.', monitorStopped: 'Monitoring gestopt.',
    checking: 'Gekozen cursussen controleren…', checkComplete: 'Controle voltooid. Cursusbestanden zijn niet gewijzigd.', fileTree: 'Resulterende bestandsboom', statusNew: 'nieuw', statusUnchanged: 'ongewijzigd', statusModified: 'lokaal gewijzigd', statusError: 'fout', statusSkipped: 'overgeslagen', statusOther: 'overig', summary: '{newCount} nieuw · {unchanged} ongewijzigd · {modified} lokaal gewijzigd · {errors} fouten', noUpdates: 'Geen downloadbare updates gevonden.', reviewDecisions: 'Beslissingen per bestand aanpassen?', newFileDecision: '{file}', conflictDecision: '{file} bevat lokale wijzigingen', download: 'Downloaden', preserveCopy: 'Lokaal bestand behouden en externe versie met hash opslaan', keepLocal: 'Alleen lokaal bestand behouden', replaceRemote: 'Lokaal bestand vervangen door externe versie', skip: 'Overslaan', replaceWarning: 'Een of meer lokale bestanden worden vervangen. Doorgaan?', applyUpdates: 'De beoordeelde updates toepassen?', updatesApplied: 'Updates toegepast. Ongewijzigde bestanden zijn niet herschreven.',
    settingsQuestion: 'Kies een instelling', changeOutput: 'Downloadhoofdmap wijzigen', changeLayout: 'Locatie van cursusmateriaal wijzigen', changeVerification: 'Lokale controle wijzigen', changeBrowser: 'Browserprogramma instellen', back: 'Terug', browserPath: 'Pad naar browserprogramma (leeg voor automatische detectie)', autoDetect: 'automatische detectie', settingsSaved: 'Instellingen opgeslagen.', resetConfirm: 'De Toledo Sync-browsersessie resetten? Cursusmateriaal wordt niet verwijderd.', resetDone: 'Browsersessie gereset. Meld je opnieuw aan bij Toledo.', done: 'Klaar.', configRequired: 'Geen configuratie gevonden. Start eerst de interactieve wizard of geef --config <pad> op.',
    doctorTitle: 'Linux-browsercontrole', doctorPlatform: 'Platform: {platform}', doctorNode: 'Node.js: {version}', doctorBrowser: 'Browser: {path}', doctorBrowserMissing: 'Geen ondersteunde Chrome-, Edge-, Chromium-, Brave- of Firefox-browser gevonden.', doctorHint: 'Installeer voor Firefox de Playwright-compatibele versie met `toledo-sync install-browser firefox`. Je kunt TOLEDO_BROWSER_PATH ook instellen voor een Chromium-browser. Ubuntu Snap Chromium staat normaal in /snap/bin/chromium.', resetCommandDone: 'Browsersessie gereset.', updatedConfig: 'Configuratie bijgewerkt: {path}', downloadDirectory: 'Downloadhoofdmap: {path}', materialsDirect: 'Cursusmateriaal: rechtstreeks in elke cursusmap', materialsNested: 'Cursusmateriaal: in elke cursusmap/{name}', verificationValue: 'Lokale controle: {mode}', selectedValue: 'Gekozen cursussen: {courses}', none: 'geen', loginExpired: 'De bewaarde Toledo-sessie is mogelijk verlopen. Meld je opnieuw aan en probeer opnieuw.'
  }
};

Object.assign(messages.en, {
  changeBrowser: 'Browser settings', customBrowser: 'Choose an executable path',
  browserSetupRequired: 'Choose a browser before signing in.',
  installBrowserQuestion: 'Download the compatible {name} browser now?',
  installingBrowser: 'Installing {name}…',
  checkIncomplete: 'Check incomplete. Review the errors above and retry. Course files were not changed.',
  applyIncomplete: 'Some updates failed. Review the errors and retry.'
});
Object.assign(messages.zh, {
  changeBrowser: '浏览器设置', customBrowser: '指定可执行文件路径',
  browserSetupRequired: '请先选择用于登录的浏览器。',
  installBrowserQuestion: '现在下载兼容的 {name} 浏览器吗？',
  installingBrowser: '正在安装 {name}…',
  checkIncomplete: '检查未完成。请查看上方错误并重试；课程文件未修改。',
  applyIncomplete: '部分更新失败，请查看错误并重试。'
});
Object.assign(messages.nl, {
  changeBrowser: 'Browserinstellingen', customBrowser: 'Pad naar een uitvoerbaar bestand kiezen',
  browserSetupRequired: 'Kies een browser voordat je je aanmeldt.',
  installBrowserQuestion: 'De compatibele {name}-browser nu downloaden?',
  installingBrowser: '{name} installeren…',
  checkIncomplete: 'Controle onvolledig. Bekijk de fouten hierboven en probeer opnieuw. Cursusbestanden zijn niet gewijzigd.',
  applyIncomplete: 'Sommige updates zijn mislukt. Bekijk de fouten en probeer opnieuw.'
});

Object.assign(messages.en, {
  helpUsage: 'Usage', helpInteractiveFlow: 'Interactive setup and update flow',
  helpGlobalOptions: 'Global options', helpLanguageOption: 'Interface language (or TOLEDO_LANG)',
  helpBrowserOption: 'System executable or managed browser',
  helpConfigOption: 'Existing Toledo Sync configuration',
  errorLabel: 'Error',
  loginTimeout: 'Timed out waiting for Toledo login. The browser session was kept for another attempt.',
  layoutConflict: 'Choose either --materials-in-course or --materials-subdirectory, not both.',
  watchIntervalInvalid: 'Watch interval must be a whole number from 1 to 1440 minutes.',
  installBrowserUsage: 'Usage: toledo-sync install-browser chromium|firefox',
  initVaultRequired: 'init requires --vault <path>',
  initOutputRequired: 'init requires --output <download-root>',
  unknownCommand: 'Unknown command: {command}',
  calendarLink: 'Calendar link: {url}',
  calendarResult: 'Calendar: {count} events → {path}',
  doctorBrowserReady: 'Browser opened a local test page successfully.',
  doctorBrowserFailed: 'Browser found, but could not start: {reason}',
  doctorMissingLibrary: 'missing Linux library {name}',
  doctorDependenciesHint: 'Install the browser system dependencies, then run toledo-sync doctor again.'
});
Object.assign(messages.zh, {
  helpUsage: '用法', helpInteractiveFlow: '交互式设置与更新',
  helpGlobalOptions: '通用选项', helpLanguageOption: '界面语言（也可设置 TOLEDO_LANG）',
  helpBrowserOption: '系统浏览器路径或托管浏览器',
  helpConfigOption: '现有 Toledo Sync 配置文件',
  errorLabel: '错误',
  loginTimeout: '等待 Toledo 登录超时。浏览器会话已保留，可以重试。',
  layoutConflict: '--materials-in-course 与 --materials-subdirectory 只能选择一个。',
  watchIntervalInvalid: '检查周期必须是 1 到 1440 分钟之间的整数。',
  installBrowserUsage: '用法：toledo-sync install-browser chromium|firefox',
  initVaultRequired: 'init 命令需要 --vault <路径>',
  initOutputRequired: 'init 命令需要 --output <下载根目录>',
  unknownCommand: '未知命令：{command}',
  calendarLink: '日历链接：{url}',
  calendarResult: '日历：{count} 个事件 → {path}',
  doctorBrowserReady: '浏览器已成功启动并打开本地测试页。',
  doctorBrowserFailed: '已找到浏览器，但无法启动：{reason}',
  doctorMissingLibrary: '缺少 Linux 共享库 {name}',
  doctorDependenciesHint: '安装浏览器所需的系统依赖后，再运行 toledo-sync doctor。'
});
Object.assign(messages.nl, {
  helpUsage: 'Gebruik', helpInteractiveFlow: 'Interactieve installatie en updates',
  helpGlobalOptions: 'Algemene opties', helpLanguageOption: 'Interfacetaal (of TOLEDO_LANG)',
  helpBrowserOption: 'Browserprogramma of beheerde browser',
  helpConfigOption: 'Bestaande Toledo Sync-configuratie',
  errorLabel: 'Fout',
  loginTimeout: 'Wachten op Toledo-aanmelding duurde te lang. De browsersessie is bewaard om opnieuw te proberen.',
  layoutConflict: 'Kies óf --materials-in-course óf --materials-subdirectory.',
  watchIntervalInvalid: 'Het controle-interval moet een geheel getal van 1 tot 1440 minuten zijn.',
  installBrowserUsage: 'Gebruik: toledo-sync install-browser chromium|firefox',
  initVaultRequired: 'init vereist --vault <pad>',
  initOutputRequired: 'init vereist --output <downloadhoofdmap>',
  unknownCommand: 'Onbekende opdracht: {command}',
  calendarLink: 'Agendalink: {url}',
  calendarResult: 'Agenda: {count} afspraken → {path}',
  doctorBrowserReady: 'De browser heeft een lokale testpagina geopend.',
  doctorBrowserFailed: 'Browser gevonden, maar starten mislukt: {reason}',
  doctorMissingLibrary: 'ontbrekende Linux-bibliotheek {name}',
  doctorDependenciesHint: 'Installeer de systeemafhankelijkheden van de browser en voer toledo-sync doctor opnieuw uit.'
});

export function normalizeLanguage(value) {
  const normalized = String(value ?? '').trim().toLowerCase().replace('_', '-');
  if (/^(zh|cn)(-|$)/.test(normalized)) return 'zh';
  if (/^nl(-|$)/.test(normalized)) return 'nl';
  if (/^en(-|$)/.test(normalized)) return 'en';
  return null;
}

export function resolveLanguage(...values) {
  for (const value of values) {
    const language = normalizeLanguage(value);
    if (language) return language;
  }
  return 'en';
}

export function createTranslator(language = 'en') {
  const locale = normalizeLanguage(language) ?? 'en';
  return (key, values = {}) => {
    const template = messages[locale]?.[key] ?? messages.en[key] ?? key;
    return String(template).replace(/\{(\w+)\}/g, (_match, name) => String(values[name] ?? `{${name}}`));
  };
}

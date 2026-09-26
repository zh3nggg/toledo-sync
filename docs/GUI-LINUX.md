# Linux desktop guide / Linux 桌面版 / Linux-desktopapp

Based on the 1.3.0 content engine. Download Linux packages from the [1.3.0 release](https://github.com/zh3nggg/toledo-sync/releases/tag/v1.3.0). Verify with SHA256SUMS-linux.txt. Current build target: **x86-64 Linux**, tested in Ubuntu 22.04 under WSL2. Native Wayland desktops and other distributions still need testing.

## English

### Open the app

- **AppImage:** mark `Toledo.Sync-1.3.0-linux-x86_64.AppImage` as executable in your file manager's Properties → Permissions, then open it. It includes the application runtime; Node.js is not required.
- **tar.gz:** extract `Toledo.Sync-1.3.0-linux-x64.tar.gz` into a permanent folder and open the `toledo-sync` executable. Keep the entire extracted folder together.
- **CLI:** use the [interactive CLI guide](CLI.md) if you prefer a terminal. The CLI requires Node.js 20 or newer.

For a terminal launch:

```sh
chmod +x Toledo.Sync-1.3.0-linux-x86_64.AppImage
./Toledo.Sync-1.3.0-linux-x86_64.AppImage
```

### First sync

1. In **Study space**, choose your Vault and the exact download root, then save. Course folders will be created directly under the download root. Choose either files directly in the course folder or a named materials subfolder.
2. In **Sign in & courses**, choose **Automatic detection** for an installed Chromium-based browser, or choose **Chromium (Playwright)** / **Firefox (Playwright)** and click **Install browser**. This downloads a compatible browser once. A normal Firefox installation alone is insufficient for Playwright automation.
3. Click **Sign in to Toledo** and complete KU Leuven SSO/MFA in the browser. Changing the browser requires signing in again.
4. Read courses and select the ones you want. Unavailable courses cannot be selected.
5. In **Update center**, click **Check updates**. Inspect files and errors before applying. A failed course is shown as an error, not as an empty course.
6. Choose whether to keep, replace, skip, or retain a separate remote copy for local edits, then apply. Checking stores downloaded bytes in the Vault's `_codex/toledo-sync/cache`; applying reuses validated cached files. SHA-256 is the default local-edit protection.

### Automation and troubleshooting

Login startup uses `$XDG_CONFIG_HOME/autostart/toledo-sync.desktop`, or `~/.config/autostart/toledo-sync.desktop`. Keep your AppImage or extracted application at a stable path. Scheduled checks operate while the app remains open; they are not a separate background service. The existing desktop automation setting checks **and synchronizes** selected courses, using the default local-file protection.

On a minimal Linux installation, the desktop app and the managed browser may need system libraries. Browser installation reports missing libraries in the activity monitor; consult [Playwright's Linux dependencies](https://playwright.dev/docs/browsers#installing-browser-dependencies). A graphical desktop session is required for SSO/MFA. If the OS blocks Electron's sandbox, use your distribution's supported application policy rather than running the app as root or changing global sandbox settings.

Build from source on Linux with `npm ci`, then `npm run make:linux`. Packages appear in `release/`. Run `npm run test:linux-gui` in a graphical session (or under Xvfb) after installing a compatible Chromium build. The smoke test uses local fixture courses and isolated settings, not a real Toledo account.

## 中文

### 安装与使用

AppImage 在文件管理器中勾选“允许作为程序执行”后打开；也可解压 tar.gz 并运行其中的 `toledo-sync`。GUI 自带运行环境，不需要安装 Node.js。保留解压后的完整目录。

1. 在“学习空间”选择 Vault、下载根目录和材料文件夹布局，保存配置。
2. 在“登录与课程”选择自动检测，或选择 Chromium / Firefox 并点击“安装浏览器”。系统自带的普通 Firefox 不能直接代替 Playwright 兼容版本。
3. 点击“登录 Toledo”，在官方页面完成授权；切换浏览器后重新登录。
4. 读取课程并勾选需要同步的课程，再到“更新中心”检查。读取失败会明确显示错误。
5. 查看文件和冲突，选择保留、覆盖、跳过或保存远程副本，再应用更新。检查阶段只写入 Vault 的缓存；应用时复用缓存。默认 SHA-256 校验保护本地批注。

开机启动通过当前用户的 autostart 配置实现。应用文件应放在固定位置；定时检查需要应用保持运行。桌面版的自动更新会检查并同步所选课程。登录需要图形桌面环境。首次下载浏览器时，若提示缺少系统库，请按活动监控中的提示处理。

当前产物面向 x86-64，已在 Ubuntu 22.04 / WSL2 测试；尚未验证所有发行版和原生 Wayland 桌面。Linux 安装包已加入同一 v1.3.0 Release；使用 SHA256SUMS-linux.txt 校验。

## Nederlands

### Installeren en gebruiken

Maak de AppImage uitvoerbaar via de bestandseigenschappen en open hem. Je kunt ook het tar.gz-archief uitpakken en `toledo-sync` starten. De GUI bevat zijn eigen runtime; Node.js is niet nodig. Bewaar de uitgepakte map volledig.

1. Kies in **Studieruimte** je Vault, downloadhoofdmap en materiaalindeling en sla de instellingen op.
2. Kies bij aanmelden automatische browserdetectie, of kies Chromium / Firefox en klik op **Browser installeren**. Een gewone Firefox-installatie vervangt de compatibele Playwright-versie niet.
3. Meld je via de officiële KU Leuven-pagina aan. Na een browserwissel moet je je opnieuw aanmelden.
4. Lees de cursussen, selecteer wat je nodig hebt en controleer updates. Een mislukte controle verschijnt als fout, niet als lege cursus.
5. Bekijk bestanden en conflicten; kies behouden, vervangen, overslaan of een aparte externe kopie en pas daarna toe. Controleren schrijft naar de cache in de Vault; toepassen hergebruikt die cache. SHA-256 beschermt standaard lokale aantekeningen.

Automatisch starten gebruikt de autostart-instellingen van de huidige gebruiker. Bewaar de app op een vaste locatie. Geplande controles werken zolang de app open blijft; de desktopautomatisering controleert én synchroniseert de gekozen cursussen. Aanmelden vereist een grafische sessie. Eventuele ontbrekende systeembibliotheken worden in de activiteitenmonitor gemeld.

Deze pakketten zijn voor x86-64 en getest op Ubuntu 22.04 onder WSL2. Andere distributies en native Wayland-desktops zijn nog niet volledig getest. De Linux-pakketten staan in release v1.3.0; gebruik SHA256SUMS-linux.txt voor controle.

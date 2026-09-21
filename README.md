# Toledo Sync

**把 KU Leuven Toledo 中“需要你学习的材料”，变成你自己掌控、可长期整理的本地课程库。**

[中文](#中文) · [English](#english) · [Nederlands](#nederlands)

> **重要 / Important / Belangrijk — upgrade to 1.1 before syncing.**
> Version 1.1 is the supported baseline for the complete course discovery, unavailable-course handling, and slow-network fixes. If you have 1.0.x installed, upgrade from the [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest) first.

## 中文

### 适合什么场景？

Toledo 适合发布课程内容，却不一定适合成为整个学期的学习工作台：材料分散在不同课程、课程页会随学年变化、文件夹层级不统一，而你又可能想把文件连同 Obsidian 笔记、复习计划和个人知识库放在一起。

Toledo Sync 面向以下使用方式：

- 你只想保存**本学年、自己选择的课程**，而非把 Toledo 的所有历史课程全部下载。
- 你希望课程材料直接进入自己指定的硬盘目录，并按课程和 Toledo 原始层级归档。
- 你使用 Obsidian 或其他本地学习系统，希望课程材料能成为长期、可搜索、可备份的学习资产。
- 你需要先同步讲义、习题、公式表等资料，再据此规划复习，而不必逐门课程手动下载。

### 产品承诺

| 你控制什么 | Toledo Sync 如何处理 |
| --- | --- |
| 下载范围 | 桌面版先读取 Toledo 返回的完整课程列表，再只同步你勾选的课程；CLI 仍可选用学年筛选。 |
| 下载位置 | 你选择的目录就是根目录；课程文件夹直接创建在其中。 |
| 课程内布局 | 可选直接放入课程文件夹，或放入你自定义名称的材料子文件夹。 |
| 历史课程 | 当前学年课程尚未开放时会跳过，不会用同编号旧课替代。 |
| 文件变化 | 默认通过 SHA-256 识别内容变化，也可切换为文件名和路径校验。检查更新会先把远程副本放进 Vault 状态缓存，确认后直接复用，不重复下载。 |
| 自动更新 | 可选开机启动、启动时检查，以及 30 分钟到每天的周期检查。 |
| 登录凭据 | 密码和 MFA 只在 KU Leuven 官方登录页面完成。 |
| 学习资料 | 下载本地副本；不会提交作业、参加测验、发送消息或改变 Toledo 内容。 |

### 一次典型同步

```text
选择 Vault 和下载根目录
        ↓
登录 Toledo（一次）
        ↓
发现本学年已开放课程
        ↓
勾选课程并同步
        ↓
本地课程库 + 你的 Obsidian 笔记与学习计划
```

例如，选择 `D:\Study\Leuven 2026 Fall` 作为根目录后：

```text
D:\Study\Leuven 2026 Fall\
├── G0S96A Groups and Symmetries\
│   └── Course materials\
│       └── … Toledo 的课程层级 …
└── G0R16A Semiconductor Physics\
    └── Course materials\
```

程序不会额外创建名为“课程材料”的中间目录。

### 使用方式

| 系统 | 推荐入口 | 状态 |
| --- | --- | --- |
| Windows 10/11 | 三语桌面应用（中文／English／Nederlands）或 CLI | 已支持 |
| macOS | CLI | 已支持 |
| Linux | CLI | 已支持 |

**Windows 用户：** 请升级到 1.1 或更高版本，并始终从 [最新 Release](https://github.com/zh3nggg/toledo-sync/releases/latest) 下载。长期使用请选择 `Toledo.Sync.Setup.<version>.exe`；不想安装时请选择 `Toledo.Sync.<version>.exe` 便携版。不要从旧版本 Release 下载。首次使用选择 Vault、下载根目录和课程，点击“登录 Toledo”，完成 KU Leuven SSO/MFA，再“发现课程”并同步即可。详细说明见 [Windows 桌面应用指南](docs/GUI-WINDOWS.md)。

**macOS、Linux 与高级用户：** 参阅 [完整 CLI 指南](docs/CLI.md)。CLI 默认是交互式向导：运行 `toledo-sync` 后按提示选择 Vault、下载目录、学年和课程，不需要编辑配置文件。向导会先登录和发现课程，再提供“检查更新 → 应用更新”两步流程；熟悉命令行后仍可使用完整参数。

### 当前支持范围

支持 Blackboard Ultra 的普通文件夹、学习模块、独立文件和 Ultra Document 内嵌附件。只下载当前登录用户可见的资料。

第三方教学工具内部的文件、受保护流媒体、尚未发布内容，以及需要互动操作才能导出的内容，可能暂时无法直接同步。Toledo 改版后也可能需要更新适配逻辑。

### 隐私与安全

- 浏览器会话保存在本机 `~/.toledo-sync/`，不在 Obsidian Vault 中。
- 课程清单、同步记录和快照保存在 `<Vault>/_codex/toledo-sync/`。
- 不要将 `~/.toledo-sync/` 提交到 Git 或同步到公开云盘。

---

## English

### The problem it solves

Toledo is where course content is published; it is not always where a semester is best managed. Materials are spread across courses, content structures differ, and course availability changes with the academic year. Toledo Sync turns the subset of Toledo that matters to you into a local, structured course library that can sit alongside Obsidian notes, revision plans, and backups.

It is designed for students who want to keep **only their chosen courses for a chosen academic year**, preserve the Toledo structure locally, and stop downloading every lecture note and exercise sheet by hand.

### What you stay in control of

| Your decision | Toledo Sync behavior |
| --- | --- |
| Scope | Syncs only selected courses and academic years. |
| Location | Uses the exact folder you select as the download root. |
| Course layout | Places material directly in each course folder or in a subfolder with your chosen name. |
| Historic courses | Skips unavailable current-year courses instead of substituting an older course with the same code. |
| Repeat runs | Uses SHA-256 to avoid duplicate copies of unchanged files. |
| Automatic updates | Optionally starts with Windows, checks on launch, and runs a schedule while open. |
| Credentials | KU Leuven password and MFA stay on KU Leuven sign-in pages. |
| Toledo actions | Reads visible learning material only; it never submits, posts, tests, or modifies content. |

### Product flow

```text
Choose Vault and download root → sign in once → discover current courses
→ select courses → synchronize into your local study system
```

### Get started

| Platform | Recommended interface | Status |
| --- | --- | --- |
| Windows 10/11 | Desktop app in 中文, English, Nederlands; CLI | Supported |
| macOS | CLI | Supported |
| Linux | CLI | Supported |

For Windows, upgrade to 1.1 or later and always download the current installer from the [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest). Use `Toledo.Sync.Setup.<version>.exe` for a normal installation or `Toledo.Sync.<version>.exe` for the portable build; older release assets should not be used. Then follow the [desktop-app guide](docs/GUI-WINDOWS.md). On macOS and Linux, run `toledo-sync` (or `node src/cli.mjs`) to open the interactive wizard: it asks for paths and choices, opens SSO/MFA in a browser, and guides discovery and safe update application without requiring JSON editing. The [complete CLI guide](docs/CLI.md) also documents every command and flag.

### Current scope and privacy

Blackboard Ultra folders, learning modules, direct files, and attachments embedded in Ultra Documents are supported. External teaching tools, protected streaming media, unpublished content, and content requiring extra interaction can require further adapters.

Authentication state stays locally in `~/.toledo-sync/`; Vault-side manifests and snapshots stay in `<Vault>/_codex/toledo-sync/`. Do not commit or publicly cloud-sync browser session data.

---

## Nederlands

### Voor welk probleem?

Toledo is de plaats waar cursusmateriaal wordt gepubliceerd, maar niet altijd de beste werkplek om een heel semester te organiseren. Materiaal staat verspreid over cursussen, de structuur verschilt per vak en de beschikbaarheid verandert per academiejaar. Toledo Sync maakt van het deel van Toledo dat voor jou relevant is een lokale, gestructureerde cursusbibliotheek naast je Obsidian-notities, studieplanning en back-ups.

De toepassing is bedoeld voor studenten die alleen hun **geselecteerde vakken van een gekozen academiejaar** willen bewaren, de Toledo-structuur lokaal willen behouden en niet elk document handmatig willen downloaden.

### Jij houdt de regie

| Jouw keuze | Gedrag van Toledo Sync |
| --- | --- |
| Bereik | Synchroniseert alleen geselecteerde vakken en academiejaren. |
| Locatie | Gebruikt exact de gekozen map als downloadhoofdmap. |
| Cursusindeling | Plaatst materiaal rechtstreeks in elke cursusmap of in een submap met jouw eigen naam. |
| Historische vakken | Slaat een niet-beschikbaar huidig vak over en vervangt het niet door een oud vak met dezelfde code. |
| Herhaald synchroniseren | Gebruikt SHA-256 om dubbele kopieën van ongewijzigde bestanden te vermijden. |
| Automatische updates | Optioneel starten met Windows, controleren bij openen en periodiek controleren zolang de app open is. |
| Aanmeldgegevens | KU Leuven-wachtwoord en MFA blijven op de officiële KU Leuven-aanmeldpagina. |
| Acties in Toledo | Leest alleen zichtbaar cursusmateriaal; dient niets in en wijzigt geen Toledo-inhoud. |

### Aan de slag

| Platform | Aanbevolen interface | Status |
| --- | --- | --- |
| Windows 10/11 | Desktopapp in 中文, English, Nederlands; CLI | Ondersteund |
| macOS | CLI | Ondersteund |
| Linux | CLI | Ondersteund |

Download voor Windows altijd versie 1.1 of nieuwer via de [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest). Gebruik `Toledo.Sync.Setup.<version>.exe` voor een normale installatie of `Toledo.Sync.<version>.exe` als portable versie; gebruik geen assets uit oudere releases. Volg daarna de [handleiding voor de desktopapp](docs/GUI-WINDOWS.md). Op macOS en Linux start `toledo-sync` de interactieve wizard: kies paden, academiejaar en vakken in prompts; daarna begeleidt de wizard de aanmelding, ontdekking en veilige controle/toepassing van updates. JSON bewerken is niet nodig. De [volledige CLI-handleiding](docs/CLI.md) bevat ook alle opdrachten en opties.

### Huidige ondersteuning en privacy

Blackboard Ultra-mappen, leermodules, gewone bestanden en bijlagen in Ultra Documents worden ondersteund. Externe leertools, beveiligde streamingmedia, niet-gepubliceerde inhoud en inhoud die extra interactie vereist, kunnen een bijkomende adapter nodig hebben.

Aanmeldstatus blijft lokaal in `~/.toledo-sync/`; manifesten en snapshots in de Vault staan in `<Vault>/_codex/toledo-sync/`. Zet browsersessies niet in Git of een openbare cloudmap.

---

## Next version / 下一版本 / Volgende versie

Version 1.2 development adds an interactive file tree for update review. Users can expand each course, inspect the resulting paths, and resolve each conflict with **keep local**, **replace with remote**, or **skip** before writing files. The existing safe behavior remains the default when no decision is changed.

## For contributors / 开发者

```sh
npm install
npm test
npm run check
```

Run the CLI with `node src/cli.mjs help`. On Windows, start the desktop app with `npm run desktop`; build its installer and portable executable with `npm run make:win`.

The project is licensed under the [MIT License](LICENSE).

# Toledo Sync

**把 KU Leuven Toledo 中“需要你学习的材料”，变成你自己掌控、可长期整理的本地课程库。**

[中文](#中文) · [English](#english) · [Nederlands](#nederlands)

> **推荐升级 / Recommended update / Aanbevolen update: 1.3.0.** 1.2.1 及更早版本可能把 Toledo 访问失败误报为“课程没有材料”。请安装 [最新发行版](https://github.com/zh3nggg/toledo-sync/releases/latest)。 / Versions 1.2.1 and earlier can report an access failure as an empty course. Install the [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest). / Versies 1.2.1 en ouder kunnen een toegangsprobleem als een lege cursus tonen. Installeer de [nieuwste release](https://github.com/zh3nggg/toledo-sync/releases/latest).

## 中文

### 适合什么场景？

Toledo 适合发布课程内容，却不一定适合成为整个学期的学习工作台：材料分散在不同课程、课程页会随学年变化、文件夹层级不统一，而你又可能想把文件连同 Obsidian 笔记、复习计划和个人知识库放在一起。

Toledo Sync 面向以下使用方式：

- 你希望先看到账号中的完整课程列表，再只保存自己选择的课程。
- 你希望课程材料直接进入自己指定的硬盘目录，并按课程和 Toledo 原始层级归档。
- 你使用 Obsidian 或其他本地学习系统，希望课程材料能成为长期、可搜索、可备份的学习资产。
- 你需要先同步讲义、习题、公式表等资料，再据此规划复习，而不必逐门课程手动下载。

### 产品承诺

| 你控制什么 | Toledo Sync 如何处理 |
| --- | --- |
| 下载范围 | 桌面版和 Linux CLI 都先读取 Toledo 返回的完整课程列表，再只同步你选择的课程。 |
| 下载位置 | 你选择的目录就是根目录；课程文件夹直接创建在其中。 |
| 课程内布局 | 可选直接放入课程文件夹，或放入你自定义名称的材料子文件夹。 |
| 不可用课程 | 仍显示在列表中但不能选择，也不会用同编号的其他课程替代。 |
| 文件变化 | 默认通过 SHA-256 识别内容变化，也可切换为文件名和路径校验。检查更新会先把远程副本放进 Vault 状态缓存，确认后直接复用，不重复下载。 |
| 自动更新 | Windows 桌面版支持开机启动；Linux CLI 可在前台持续监控，或由用户自己的定时器调用单次检查。 |
| 登录凭据 | 密码和 MFA 只在 KU Leuven 官方登录页面完成。 |
| 学习资料 | 下载本地副本；不会提交作业、参加测验、发送消息或改变 Toledo 内容。 |

### 一次典型同步

```text
选择 Vault 和下载根目录
        ↓
登录 Toledo（一次）
        ↓
读取完整课程列表并标记可用状态
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
| Windows 10/11 | 三语桌面应用（中文／English／Nederlands） | 已支持 |
| macOS（Apple Silicon） | 三语桌面应用 | 已支持 |
| Linux | 三语交互式 CLI；Firefox、Chrome、Chromium、Edge、Brave | 已支持 |

**Windows 用户：** 请升级到 1.3.0，并始终从 [最新 Release](https://github.com/zh3nggg/toledo-sync/releases/latest) 下载。长期使用请选择 `Toledo.Sync.Setup.1.3.0.exe`；不想安装时请选择 `Toledo.Sync.1.3.0.exe` 便携版。首次使用选择 Vault、下载根目录和课程，点击“登录 Toledo”，完成 KU Leuven SSO/MFA，再“发现课程”并同步即可。详细说明见 [Windows 桌面应用指南](docs/GUI-WINDOWS.md)。

**Mac 用户：** Apple Silicon 版本请从同一 [最新 Release](https://github.com/zh3nggg/toledo-sync/releases/latest) 下载 DMG，参阅 [macOS 安装指南](docs/GUI-MACOS.md)。

**Linux 用户：** 参阅 [完整 CLI 指南](docs/CLI.md)。运行 `toledo-sync` 后可以选择中文、English 或 Nederlands，再依次配置 Vault、下载目录、登录和课程。在终端菜单中使用方向键和回车；课程列表可用空格勾选，支持长列表滚动。CLI 不按学年隐藏课程，而是读取账户中的完整课程列表，再由用户选择同步范围。“检查更新”会先显示文件树和冲突选项，确认后才写入课程目录。

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

It is designed for students who want to keep **only the courses they choose**, preserve the Toledo structure locally, and stop downloading every lecture note and exercise sheet by hand.

### What you stay in control of

| Your decision | Toledo Sync behavior |
| --- | --- |
| Scope | Reads the complete Toledo course list, then syncs only selected courses. |
| Location | Uses the exact folder you select as the download root. |
| Course layout | Places material directly in each course folder or in a subfolder with your chosen name. |
| Unavailable courses | Keeps them visible but disabled and never substitutes another course with the same code. |
| Repeat runs | Uses SHA-256 to avoid duplicate copies of unchanged files. |
| Automatic updates | The Windows app supports startup launch; the Linux CLI can monitor while open or run one cycle from a user scheduler. |
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
| Windows 10/11 | Desktop app in 中文, English, Nederlands | Supported |
| macOS (Apple Silicon) | Desktop app in 中文, English, Nederlands | Supported |
| Linux | Interactive CLI in 中文, English, Nederlands; Firefox, Chrome, Chromium, Edge, Brave | Supported |

For Windows, upgrade to 1.3.0 from the [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest). Use `Toledo.Sync.Setup.1.3.0.exe` to install or `Toledo.Sync.1.3.0.exe` as a portable app; follow the [Windows guide](docs/GUI-WINDOWS.md). For Apple Silicon Macs, download the DMG from the same release and follow the [macOS guide](docs/GUI-MACOS.md). On Linux, run `toledo-sync` (or `npm start` from the repository) to open the trilingual interactive wizard. See the [Linux CLI guide](docs/CLI.md).

### Current scope and privacy

Blackboard Ultra folders, learning modules, direct files, and attachments embedded in Ultra Documents are supported. External teaching tools, protected streaming media, unpublished content, and content requiring extra interaction can require further adapters.

Authentication state stays locally in `~/.toledo-sync/`; Vault-side manifests and snapshots stay in `<Vault>/_codex/toledo-sync/`. Do not commit or publicly cloud-sync browser session data.

---

## Nederlands

### Voor welk probleem?

Toledo is de plaats waar cursusmateriaal wordt gepubliceerd, maar niet altijd de beste werkplek om een heel semester te organiseren. Materiaal staat verspreid over cursussen, de structuur verschilt per vak en de beschikbaarheid verandert per academiejaar. Toledo Sync maakt van het deel van Toledo dat voor jou relevant is een lokale, gestructureerde cursusbibliotheek naast je Obsidian-notities, studieplanning en back-ups.

De toepassing is bedoeld voor studenten die eerst hun volledige cursuslijst willen zien en daarna alleen hun **zelf gekozen cursussen** lokaal willen bewaren, met behoud van de Toledo-structuur.

### Jij houdt de regie

| Jouw keuze | Gedrag van Toledo Sync |
| --- | --- |
| Bereik | Leest de volledige Toledo-cursuslijst en synchroniseert daarna alleen gekozen cursussen. |
| Locatie | Gebruikt exact de gekozen map als downloadhoofdmap. |
| Cursusindeling | Plaatst materiaal rechtstreeks in elke cursusmap of in een submap met jouw eigen naam. |
| Niet-beschikbare cursussen | Blijven zichtbaar maar uitgeschakeld en worden nooit vervangen door een andere cursus met dezelfde code. |
| Herhaald synchroniseren | Gebruikt SHA-256 om dubbele kopieën van ongewijzigde bestanden te vermijden. |
| Automatische updates | De Windows-app kan bij het opstarten starten; de Linux-CLI kan open blijven controleren of één cyclus vanuit een gebruikersplanner uitvoeren. |
| Aanmeldgegevens | KU Leuven-wachtwoord en MFA blijven op de officiële KU Leuven-aanmeldpagina. |
| Acties in Toledo | Leest alleen zichtbaar cursusmateriaal; dient niets in en wijzigt geen Toledo-inhoud. |

### Aan de slag

| Platform | Aanbevolen interface | Status |
| --- | --- | --- |
| Windows 10/11 | Desktopapp in 中文, English, Nederlands | Ondersteund |
| macOS (Apple Silicon) | Desktopapp in 中文, English, Nederlands | Ondersteund |
| Linux | Interactieve CLI in 中文, English, Nederlands; Firefox, Chrome, Chromium, Edge, Brave | Ondersteund |

Installeer op Windows versie 1.3.0 via de [nieuwste release](https://github.com/zh3nggg/toledo-sync/releases/latest). Kies `Toledo.Sync.Setup.1.3.0.exe` voor installatie of `Toledo.Sync.1.3.0.exe` als draagbare versie; zie de [Windows-handleiding](docs/GUI-WINDOWS.md). Download op een Apple Silicon Mac de DMG van dezelfde release en volg de [macOS-handleiding](docs/GUI-MACOS.md). Op Linux start `toledo-sync` de drietalige interactieve wizard. Zie de [Linux CLI-handleiding](docs/CLI.md).

### Huidige ondersteuning en privacy

Blackboard Ultra-mappen, leermodules, gewone bestanden en bijlagen in Ultra Documents worden ondersteund. Externe leertools, beveiligde streamingmedia, niet-gepubliceerde inhoud en inhoud die extra interactie vereist, kunnen een bijkomende adapter nodig hebben.

Aanmeldstatus blijft lokaal in `~/.toledo-sync/`; manifesten en snapshots in de Vault staan in `<Vault>/_codex/toledo-sync/`. Zet browsersessies niet in Git of een openbare cloudmap.

---

## Copyright and permitted use / 版权与使用 / Auteursrecht en toegestaan gebruik

Course materials may be protected or licensed by KU Leuven, teaching staff, or other rights holders. Use Toledo Sync only for materials you are authorized to access and for permitted study purposes. Unless you have permission, do not redistribute, publish publicly, sell, use commercially, remove rights notices, or bypass access controls. Examination materials are for study-related use only. Follow KU Leuven rules, course licences, and applicable law. The MIT licence applies to this software; it does not grant additional rights to course materials. See the [KU Leuven Education Regulations](https://www.kuleuven.be/education/regulations/2025/) for the institutional rules on learning and examination materials.

课程材料可能受 KU Leuven、教师或其他权利人的版权和许可约束。仅使用你有权访问且获准使用的材料。除非获得相应授权，不得再分发、公开上传、出售、商业使用、删除权利声明或绕过访问控制；考试材料仅用于学习相关目的。请遵守 KU Leuven 规章、课程许可和适用法律。MIT 许可证只适用于本软件，不授予课程材料的额外权利。

Cursusmateriaal kan beschermd of gelicentieerd zijn door KU Leuven, docenten of andere rechthebbenden. Gebruik Toledo Sync alleen voor materiaal waartoe je gemachtigd bent en voor toegestane studiedoeleinden. Verspreid, publiceer, verkoop of gebruik het niet commercieel zonder toestemming; verwijder geen rechtenvermeldingen en omzeil geen toegangscontroles. Examenmateriaal is alleen voor studiegebruik. Volg de KU Leuven-regels, cursuslicenties en toepasselijke wetgeving. De MIT-licentie geldt voor deze software en geeft geen extra rechten op cursusmateriaal.

## Version 1.3.0 / 版本 1.3.0 / Versie 1.3.0

Version 1.3.0 is the recommended Windows, Apple Silicon macOS, and Linux CLI release. The content-engine fix first shipped in the transitional 1.2.2 release: inaccessible courses now show an error instead of a misleading empty result, with safer retries, cache validation, and session handling. Upgrade from 1.2.1 or earlier before checking course materials. Interactive file review and per-file conflict decisions remain available.

## For contributors / 开发者

```sh
npm install
npm test
npm run check
```

Run the Linux CLI with `node src/linux-cli.mjs help` or `npm start -- help`. On Windows, start the desktop app with `npm run desktop`; build its installer and portable executable with `npm run make:win`.

The project is licensed under the [MIT License](LICENSE).

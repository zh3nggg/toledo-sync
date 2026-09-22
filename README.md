# Toledo Sync

**把 KU Leuven Toledo 里真正需要学习的课程材料，变成你可以掌控、检索和长期保存的本地课程库。**

*Turn the Toledo material you need into a local course library that belongs in your study system.*
*Maak van het Toledo-materiaal dat je nodig hebt een lokale cursusbibliotheek in jouw studiesysteem.*

[![Current release](https://img.shields.io/github/v/release/zh3nggg/toledo-sync?display_name=tag&label=release)](https://github.com/zh3nggg/toledo-sync/releases/latest)
[![Platforms](https://img.shields.io/badge/desktop-Windows%20%7C%20macOS%20Apple%20Silicon-2563eb)](https://github.com/zh3nggg/toledo-sync/releases/latest)
[![License](https://img.shields.io/github/license/zh3nggg/toledo-sync)](LICENSE)

**语言 / Language / Taal：** [中文](#中文) · [English](#english) · [Nederlands](#nederlands)

## 中文

**当前稳定版：v1.2.0。** Windows 与 Apple Silicon macOS 桌面应用在同一个 GitHub Release 中发布，并附带校验和；Linux 与高级用户可使用跨平台 CLI。

## 为学习而设计，而不是为下载而设计

Toledo 是课程发布平台，但不一定是管理一个学期的最佳位置：资料散落在不同课程与层级中，课程页面会随学年变化，而笔记、复习计划和备份通常在你自己的系统里。

Toledo Sync 把已登录账号可见的课程材料同步到你选择的本地目录，并保留 Toledo 的课程与文件夹结构。它特别适合希望把讲义、习题、公式表与 Obsidian 或其他本地学习系统放在一起的 KU Leuven 学生。

| 你决定 | Toledo Sync 的行为 |
| --- | --- |
| 同步哪些课程 | 先从 Toledo 读取完整课程列表，再由你勾选要同步的课程。 |
| 文件放在哪里 | 使用你选定的下载根目录；课程文件夹直接创建在其中。 |
| 课程内部如何整理 | 可直接放入课程文件夹，或放入你命名的统一“材料”子文件夹。 |
| 更新是否安全 | 先预览再写入；SHA-256 默认识别内容变化，并保护本地修改。 |
| 登录与 MFA | 只在 KU Leuven 官方登录页完成；应用不会收集你的密码。 |
| Toledo 上的操作 | 只读取你可见的学习材料；不会提交作业、参加测验、发帖或修改课程内容。 |

## v1.2.0 的重要更新

- **Apple Silicon macOS 桌面版。** 与 Windows 版使用相同的同步核心和中文、English、Nederlands 界面；提供 `.dmg` 与 `.zip`。
- **一个版本，一个 Release。** Windows 安装版、Windows 便携版、macOS ARM64 安装镜像、ZIP 和 `SHA256SUMS.txt` 由同一自动化发布流程产出。
- **更适合 Mac 的界面。** 为 Retina/HiDPI 与更大系统字体重新收紧布局；窗口使用自然页面滚动，不再留下固定高度的空白区域。
- **可审阅的更新中心。** 先检查远程变化，再展开文件树查看结果；对本地修改的文件，可选择保留本地、以远程版本替换、跳过，或保留本地并把远程版本另存为副本。

## 从 Toledo 到你的学习空间

```text
选择 Vault 与下载根目录
          ↓
在官方 KU Leuven 页面完成一次登录 / MFA
          ↓
读取 Toledo 课程并选择要维护的课程
          ↓
检查变化、审阅文件树、确认下载
          ↓
本地课程库 + 笔记 + 复习计划 + 备份
```

假如下载根目录为 `D:\Study\Leuven 2026 Fall`，结果可以是：

```text
D:\Study\Leuven 2026 Fall\
├── G0S96A Groups and Symmetries\
│   └── Course materials\
│       └── … Toledo 原有的课程层级 …
└── G0R16A Semiconductor Physics\
    └── Course materials\
```

也可以选择“直接放入课程文件夹”，省去 `Course materials` 这一层。程序不会在你选择的下载根目录前额外加一层目录。

## 下载与开始使用

始终从 [最新 Release](https://github.com/zh3nggg/toledo-sync/releases/latest) 下载，并核对同一页面的 `SHA256SUMS.txt`（如需校验）。

| 平台 | 下载什么 | 适用情况 |
| --- | --- | --- |
| Windows 10/11 | `Toledo.Sync.Setup.1.2.0.exe` | 推荐；常规安装。 |
| Windows 10/11 | `Toledo.Sync.1.2.0.exe` | 无需安装的便携版本。 |
| macOS Apple Silicon | `Toledo.Sync-1.2.0-macOS-arm64.dmg` | 推荐；适用于 M1、M2、M3、M4 及后续 Apple 芯片。 |
| macOS Apple Silicon | `Toledo.Sync-1.2.0-macOS-arm64.zip` | 需要直接解压使用时。 |
| Linux / 高级用户 | [CLI](docs/CLI.md) | Node.js 20+ 的跨平台命令行向导。 |

桌面应用的第一次配置只需四步：

1. 选择 Obsidian Vault（或用于保存同步状态的本地目录）和**精确的下载根目录**。
2. 保存设置，选择“登录 Toledo”，在弹出的 Chrome、Edge 或 Chromium 中完成 KU Leuven SSO/MFA。
3. 读取课程，勾选你希望维护的课程。
4. 在“更新中心”先检查更新，审阅结果后再下载。

已安装的桌面版不需要 Node.js；但登录 Toledo 时需要本机有 Google Chrome、Microsoft Edge 或 Chromium 之一。

## macOS 安装说明

当前 macOS 社区构建采用临时签名，**尚未经过 Apple Developer ID 公证**。这不表示它需要关闭系统安全功能，也不应从未知来源下载。

1. 只从对应的 GitHub Release 下载 DMG，拖动 **Toledo Sync** 到“应用程序”。
2. 第一次启动时，在 Finder 中按住 Control 点击应用，选择“打开”，然后再次确认。
3. 若 macOS 仍阻止运行：先正常尝试打开一次，再前往“系统设置 → 隐私与安全性”，选择 **仍要打开**。
4. 若提示应用“已损坏”，请先重新下载官方 DMG。仅在确认来源可信且问题持续时，按 [macOS 完整指南](docs/GUI-MACOS.md) 移除**该应用**的隔离属性；不要全局关闭 Gatekeeper。

受学校或单位管理的 Mac 可能禁止运行未公证应用。这是设备策略，应该请管理员批准，而不是绕过策略。Intel Mac 暂不提供桌面构建；可使用 CLI。

## 同步如何保护已有文件

默认的 **SHA-256 内容校验** 会比较文件内容，而不只比较名称。检查更新不会把课程材料写进下载根目录；远程响应会暂存在 Vault 的状态缓存中，确认下载时直接复用，避免再次下载相同文件。

如果本地文件被你修改过，安全默认值是保留本地文件，并把远程版本保存为带哈希后缀的副本。你可以在文件树中逐项改为：

- **保留本地**：不下载远程变更；
- **保留本地并保存远程副本**：默认、安全的合并方式；
- **替换为远程版本**：覆盖前会再次确认；
- **跳过**：本次不处理该文件。

对于文件名与路径就是唯一标识的来源，可以改用“文件名和路径”校验模式，以更快的速度运行。

## 自动化、支持范围与边界

桌面应用可选在 Windows/macOS 登录时启动、启动时检查并同步课程材料，或在应用保持打开时每 30 分钟、每小时、每 6 小时或每天运行一次。这里的“自动更新”指**课程材料**，不是静默更新应用本身。

目前支持 Blackboard Ultra 的普通文件夹、学习模块、直接文件，以及 Ultra Document 内嵌附件。第三方教学工具内部文件、受保护流媒体、尚未发布内容、或需要额外交互才能导出的内容，可能需要额外适配。课程尚未对当前账号开放时会被跳过；不会用同编号的历史课程静默替代。

## 隐私与数据位置

| 数据 | 默认位置 | 建议 |
| --- | --- | --- |
| 浏览器配置与登录状态 | `~/.toledo-sync/` | 仅保留在本机；不要提交到 Git 或公开云盘。 |
| 课程配置、清单、快照、更新缓存 | `<Vault>/_codex/toledo-sync/` | 与 Vault 一同备份前，确认其中不含不应共享的课程元数据。 |
| 下载的课程材料 | 你选择的下载根目录 | 按课程资料的使用规则管理和分享。 |

Toledo Sync 不接收你的 KU Leuven 密码；认证在官方网页中完成，浏览器会话仅留在本机。

## 文档与命令行

- [Windows 桌面应用指南](docs/GUI-WINDOWS.md)
- [macOS Apple Silicon 桌面应用指南](docs/GUI-MACOS.md)
- [完整 CLI 指南](docs/CLI.md)
- [更新记录](CHANGELOG.md)
- [最新 Release](https://github.com/zh3nggg/toledo-sync/releases/latest)

CLI 适用于 Windows、macOS 和 Linux。安装 Node.js 20+ 后：

```sh
git clone https://github.com/zh3nggg/toledo-sync.git
cd toledo-sync
npm install
node src/cli.mjs
```

它会以交互式向导引导你选择 Vault、下载目录、学年、课程和课程内文件布局；完整参数请见 [CLI 指南](docs/CLI.md)。

## English

Toledo Sync creates a local, structured library of the Toledo learning material visible to your KU Leuven account. Choose the courses and exact destination; sign in through KU Leuven SSO/MFA; preview changes; then download only what you approve. It never submits work, posts, takes tests, or changes Toledo content.

Release **v1.2.0** ships Windows and Apple Silicon macOS desktop builds under the same tag, alongside checksums and a cross-platform CLI. The desktop app is available in 中文, English, and Nederlands. Its update center previews remote changes before it writes course material, and its default SHA-256 mode preserves locally edited files.

Download the matching asset from the [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest): Windows installer or portable `.exe`, or `Toledo.Sync-1.2.0-macOS-arm64.dmg` for M-series Macs. The current macOS build is ad-hoc signed, not notarized: copy it to Applications and use Finder’s Control-click **Open** on first launch. Read the [macOS guide](docs/GUI-MACOS.md) before removing quarantine from a known-good official download. Intel Macs can use the [CLI](docs/CLI.md).

## Nederlands

Toledo Sync maakt van cursusmateriaal dat zichtbaar is voor jouw KU Leuven-account een lokale, overzichtelijke cursusbibliotheek. Jij kiest de vakken en de exacte doelmap, meldt je aan via de officiële KU Leuven SSO/MFA-pagina, bekijkt wijzigingen vooraf en downloadt alleen wat je bevestigt. De toepassing dient niets in en wijzigt geen Toledo-inhoud.

Versie **v1.2.0** publiceert de Windows- en Apple Silicon-macOS-desktopapp in dezelfde Release, met controlesommen en een platformonafhankelijke CLI. De interface bestaat in 中文, English en Nederlands. Standaard vergelijkt Toledo Sync bestanden met SHA-256 en bewaart het lokale bestand wanneer je het zelf hebt gewijzigd.

Download de juiste asset via de [latest release](https://github.com/zh3nggg/toledo-sync/releases/latest). Voor een M-series Mac gebruik je `Toledo.Sync-1.2.0-macOS-arm64.dmg`; de eerste keer start je de niet-genotariseerde communitybuild via Control-klik **Open** in Finder. Zie de [macOS-handleiding](docs/GUI-MACOS.md). Voor Intel Macs en Linux is de [CLI](docs/CLI.md) beschikbaar.

## Contribute

```sh
npm install
npm test
npm run check
```

Start the desktop app from source with `npm run desktop`. Build the Windows installer and portable executable with `npm run make:win`, or build the Apple Silicon macOS DMG and ZIP with `npm run make:mac`.

Released under the [MIT License](LICENSE).

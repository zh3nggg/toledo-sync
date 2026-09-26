# Toledo Sync Linux CLI 1.3.1

Linux CLI 1.3.1 improves the English, Chinese, and Dutch experience. Menus, help, common errors, and browser setup guidance now follow the selected language. `toledo-sync doctor` opens a local test page before reporting that a browser is ready, so missing Linux libraries are reported before sign-in.

Install on Linux with Node.js 20 or newer:

```sh
npm install --global --prefix "$HOME/.local" ./toledo-sync-1.3.1.tgz
export PATH="$HOME/.local/bin:$PATH"
toledo-sync
```

Choose a language in the interactive menu or pass `--language en`, `--language zh`, or `--language nl`. See the [Linux CLI guide](https://github.com/zh3nggg/toledo-sync/blob/master/docs/CLI.md) for setup and browser requirements. This release contains **only the Linux CLI**. Windows, macOS, and Linux GUI downloads remain in [v1.3.0](https://github.com/zh3nggg/toledo-sync/releases/tag/v1.3.0).

## 中文

Linux CLI 1.3.1 完善了中文、英文、荷兰文的菜单、帮助和常见错误提示。`toledo-sync doctor` 会实际打开一个本地测试页，提前报告浏览器缺少的 Linux 依赖。本次仅发布 Linux CLI；桌面应用仍从 [v1.3.0](https://github.com/zh3nggg/toledo-sync/releases/tag/v1.3.0) 下载。

## Nederlands

Linux CLI 1.3.1 verbetert de menu's, hulp en foutmeldingen in het Engels, Chinees en Nederlands. `toledo-sync doctor` opent een lokale testpagina en meldt ontbrekende Linux-bibliotheken vóór het aanmelden. Deze release bevat alleen de Linux-CLI; de desktopapps blijven beschikbaar via [v1.3.0](https://github.com/zh3nggg/toledo-sync/releases/tag/v1.3.0).

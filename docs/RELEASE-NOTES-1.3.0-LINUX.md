# Linux 1.3.0

[Downloads](https://github.com/zh3nggg/toledo-sync/releases/tag/v1.3.0) · [GUI guide](GUI-LINUX.md) · [CLI guide](CLI.md)

## English

- GUI: x86-64 AppImage or complete tar.gz archive; no Node.js installation required.
- Interactive CLI: `toledo-sync-1.3.0.tgz`, requiring Node.js 20+. Menus support English, Chinese and Dutch; configuration does not require editing JSON.
- Browser installation from the interface supports compatible Chromium and Firefox builds. Ordinary system Firefox cannot replace the Playwright build.
- Includes the repaired 1.3.0 content engine, visible scan failures, cached update application, local-edit conflict handling, and Linux autostart integration.
- Verify downloads with **SHA256SUMS-linux.txt**. Existing Windows and Mac assets remain unchanged.

Linux platform changes are in [PR #1](https://github.com/zh3nggg/toledo-sync/pull/1), based on the original v1.3.0 tag. The original tag and GitHub-generated source archives have not been replaced; use the PR's source commit or the Linux packages for these changes.

Validation: 40 unit tests, syntax checks, Ubuntu 22.04/WSL2 packaged GUI tests with Chromium and Firefox, three languages, compact windows, course selection, 403 error handling, cached downloads, preservation of local annotations, XDG autostart and interactive CLI keyboard input. Release CI adds clean Ubuntu build and packaged integration checks. Integration courses are local fixtures, with discovery stubbed; this is not a live KU Leuven SSO test. Electron's automated test launcher disables its sandbox for testing. Native desktop sandbox policies, Wayland, ARM64 GUI and normal AppImage mounting are not verified by these tests.

## 中文

Linux GUI（x86-64 AppImage / tar.gz）和交互式 CLI 已加入 1.3.0。GUI 自带运行环境；CLI 需要 Node.js 20+。支持中英荷三语、界面内安装兼容的 Chromium / Firefox、更新预览与本地修改保护。使用 SHA256SUMS-linux.txt 校验；Windows 与 Mac 安装包保持原样。

Linux 适配源码见 PR #1；原 v1.3.0 标签未移动。测试覆盖 Ubuntu 22.04、打包程序、缓存与冲突保护，使用本地模拟课程，未验证真实 Toledo 登录及所有 Linux 桌面环境。

## Nederlands

Linux GUI (x86-64 AppImage / tar.gz) en interactieve CLI zijn toegevoegd aan 1.3.0. De GUI bevat zijn runtime; de CLI vereist Node.js 20+. Inclusief drie talen, installatie van compatibele Chromium/Firefox, updatevoorbeelden en bescherming van lokale wijzigingen. Controleer downloads met SHA256SUMS-linux.txt; Windows- en Mac-bestanden blijven ongewijzigd.

De Linux-aanpassingen staan in PR #1; de oorspronkelijke v1.3.0-tag is niet verplaatst. Tests gebruiken lokale voorbeeldcursussen op Ubuntu 22.04, geen echte Toledo-aanmelding. Niet alle Linux-desktopomgevingen zijn getest.

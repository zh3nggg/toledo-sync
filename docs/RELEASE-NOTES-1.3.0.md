# Toledo Sync 1.3.0

**Recommended release / 推荐版本 / Aanbevolen versie.** Versions 1.2.1 and earlier can mistake a Toledo access failure for an empty course. Version 1.2.2 first included the repair; 1.3.0 is the consolidated release for Windows, Apple Silicon macOS, and Linux CLI.

## 中文

本版将修复后的课程材料抓取引擎统一交付给 Windows、Apple Silicon macOS 桌面应用和 Linux 交互式 CLI。遇到课程内容接口拒绝访问、异常响应或分页不完整时，应用会显示错误并保留此前同步记录，不会把故障当成“0 个材料”。新版还加强了登录会话恢复、网络重试和缓存验证。

Windows 可选安装包 `Toledo.Sync.Setup.1.3.0.exe` 或便携版 `Toledo.Sync.1.3.0.exe`；Apple Silicon Mac 下载 DMG；Linux 从本版源码安装。可保留已有课程文件和本地批注。若正使用 1.2.1 或更早版本，请在检查材料前升级。

## English

This release brings the repaired content engine to the Windows and Apple Silicon macOS desktop apps and the interactive Linux CLI. If Toledo rejects a content request, returns a malformed response, or provides incomplete pagination, the app reports the error and preserves the previous sync record instead of showing a misleading empty course. Session recovery, network retries, and cache validation are also improved.

On Windows, choose `Toledo.Sync.Setup.1.3.0.exe` for installation or `Toledo.Sync.1.3.0.exe` for portable use. Download the DMG for an Apple Silicon Mac; Linux users can install from this release's source. Existing course files and local annotations can remain in place. Upgrade from 1.2.1 or earlier before checking materials.

## Nederlands

Deze versie brengt de herstelde inhoudsverwerking naar de Windows- en Apple Silicon macOS-apps en de interactieve Linux CLI. Als Toledo de toegang weigert, een ongeldig antwoord terugstuurt of niet alle pagina's levert, toont de app de fout en bewaart hij het vorige synchronisatierecord in plaats van een lege cursus te melden. Sessieherstel, nieuwe netwerkpogingen en cachecontrole zijn ook verbeterd.

Kies op Windows `Toledo.Sync.Setup.1.3.0.exe` voor installatie of `Toledo.Sync.1.3.0.exe` als draagbare versie. Download de DMG voor een Apple Silicon Mac; Linux-gebruikers kunnen deze broncode installeren. Bestaande cursusbestanden en eigen aantekeningen kunnen blijven staan. Werk vanaf versie 1.2.1 of ouder bij voordat je lesmateriaal controleert.

The Mac build is ad-hoc signed and not notarized. See the [macOS installation guide](https://github.com/zh3nggg/toledo-sync/blob/master/docs/GUI-MACOS.md) for first-launch steps. SHA-256 checksums for attached assets are in `SHA256SUMS.txt`.

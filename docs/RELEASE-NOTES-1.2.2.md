# Toledo Sync 1.2.2

**必须升级 / Required upgrade / Verplichte update.** Older versions can treat a Toledo access failure as an empty course. Install this version before checking or downloading course materials.

## 中文

旧版在课程内容接口返回 403 等错误时，可能错误显示“0 个材料”。1.2.2 会明确提示访问失败，保留之前的同步记录，并继续检查其他课程。新版还加强了登录会话恢复、网络重试、内容分页和缓存校验，避免把登录页误存成课程文件。

Windows 用户下载 `Toledo Sync Setup 1.2.2.exe` 安装，或下载 `Toledo Sync 1.2.2.exe` 便携版。Apple Silicon Mac 下载 DMG；Linux 用户从本版本源代码安装。原有课程文件和本地批注无需删除。

## English

Earlier versions could show **zero materials** when Toledo rejected a content request. Version 1.2.2 reports the access error, preserves the previous sync record and continues with other courses. It also improves session handling, network retries, content pagination and cache validation, and rejects login pages returned instead of files.

Install `Toledo Sync Setup 1.2.2.exe` on Windows, use `Toledo Sync 1.2.2.exe` as a portable app, or download the DMG for an Apple Silicon Mac. Linux users can install from this release's source. Keep your existing course files and local annotations.

## Nederlands

Oudere versies konden **nul bestanden** tonen wanneer Toledo een verzoek om cursusinhoud weigerde. Versie 1.2.2 toont de toegangsfout, bewaart het vorige synchronisatierecord en gaat verder met andere cursussen. Ook de sessie, nieuwe pogingen bij netwerkproblemen, paginering en cachecontrole zijn verbeterd. Aanmeldpagina's worden niet meer als cursusbestand opgeslagen.

Installeer `Toledo Sync Setup 1.2.2.exe` op Windows, gebruik `Toledo Sync 1.2.2.exe` als draagbare versie, of download de DMG voor een Apple Silicon Mac. Linux-gebruikers kunnen vanaf de broncode van deze release installeren. Je bestaande cursusbestanden en lokale aantekeningen mogen blijven staan.

The Mac build is ad-hoc signed and not notarized. See the [macOS installation guide](GUI-MACOS.md) for the first-launch steps. SHA-256 checksums for all attached assets are in `SHA256SUMS.txt`.

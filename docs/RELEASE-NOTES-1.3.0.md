# Toledo Sync 1.3.0 — stronger course-content discovery

**Windows release.** macOS and Linux 1.3 builds will follow after platform-specific work. Version 1.2.2 first included the engine repair; 1.3.0 is the recommended Windows version. Versions 1.2.1 and earlier can mistake a Toledo access failure for an empty course.

## 中文

1.3 的重点是加强课程材料抓取引擎。课程内容接口拒绝访问、返回登录页或异常响应、分页不完整时，程序会明确报错并保留已有同步记录，不再把故障显示为“0 个材料”。引擎还会使用已登录的浏览器读取课程结构，必要时切换接口并有限重试；下载前验证缓存，避免把登录页写成课程文件。本次发布仅提供 Windows 安装包和便携版，Mac 与 Linux 的 1.3 版稍后处理。

下载 `Toledo.Sync.Setup.1.3.0.exe` 安装，或使用 `Toledo.Sync.1.3.0.exe` 便携版。可保留已有课程文件和本地批注。使用 1.2.1 或更早版本的用户应在检查材料前升级。

## English

Version 1.3 focuses on more reliable course-content discovery. If Toledo denies access, returns a login page or malformed response, or omits part of a paginated list, the app reports the failure and preserves the previous sync record instead of claiming the course is empty. It reads the course structure through the signed-in browser, can fall back to another endpoint with bounded retries, and validates cached downloads before writing files. This release contains Windows installers only; macOS and Linux 1.3 builds will follow.

Install `Toledo.Sync.Setup.1.3.0.exe` or use the portable `Toledo.Sync.1.3.0.exe`. Existing course files and local annotations can remain in place. Users on 1.2.1 or earlier should upgrade before checking materials.

## Nederlands

Versie 1.3 richt zich op betrouwbaarder ophalen van cursusmateriaal. Als Toledo de toegang weigert, een aanmeldpagina of ongeldig antwoord terugstuurt, of niet alle pagina's levert, meldt de app de fout en bewaart hij het vorige synchronisatierecord in plaats van de cursus leeg te noemen. De cursusstructuur wordt via de aangemelde browser gelezen; zo nodig gebruikt de app een ander eindpunt met beperkte nieuwe pogingen. De cache wordt gecontroleerd voordat bestanden worden opgeslagen. Deze release bevat alleen Windows-installatiebestanden; macOS en Linux 1.3 volgen later.

Installeer `Toledo.Sync.Setup.1.3.0.exe` of gebruik de draagbare `Toledo.Sync.1.3.0.exe`. Bestaande cursusbestanden en eigen aantekeningen kunnen blijven staan. Gebruikers van versie 1.2.1 of ouder moeten bijwerken voordat ze materiaal controleren.

SHA-256 checksums for the attached Windows assets are in `SHA256SUMS.txt`.

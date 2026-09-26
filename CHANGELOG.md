## Unreleased — content engine reliability

- Treat authorization failures, inaccessible content, malformed responses and incomplete pagination as failed checks, never as empty courses.
- Read course contents through the signed-in browser, with a request fallback, bounded retries and an alternative public content endpoint.
- Follow SSO redirects and course notification links without depending on the interface language.
- Preserve refreshed browser cookies instead of overwriting them with an older login export.
- Keep previous manifests on scan failure and continue checking the remaining courses; show course errors in the update tree.
- Reject login/error pages returned as downloads and verify cached bytes before applying checked updates.
- Store endpoint/status diagnostics for failed checks without recording authentication headers or login-page snapshots.

## 1.2.1 — 2026-09-26

- Aligned the maintained Linux CLI with the current desktop synchronization workflow.
- Added English, Chinese, and Dutch interactive interfaces with English as the first-run default.
- Removed academic-year filtering from the interactive flow and discover the complete signed-in course list before selection.
- Added Linux browser diagnostics and detection for PATH, Snap Chromium, common Flatpak exports, and Brave.
- Added a safe browser-session reset command without touching course materials or configuration.
- Added course-by-course update trees, cached previews, and per-file conflict decisions before applying changes.
- Added an interactive and command-line watch mode for immediate and periodic checks, with explicit opt-in automatic application.
- Added Firefox detection and support through Playwright's compatible Firefox build, with separate persistent browser storage.
- Reworked Linux terminal prompts into keyboard-driven menus and course checklists, with scrolling, bulk selection, disabled unavailable courses, and numbered non-TTY fallback.
- Kept SHA-256 local-edit protection as the default and retained filename/path verification as an option.

## 1.0.0 — 2026-09-19

- First stable release of Toledo Sync.
- Fixed GUI course selections being lost when checking updates before saving settings.
- Made update checks read-only for the user download root: no course directories or material files are created during a check.
- Preserved locally modified files and write-on-confirm update behavior.
- Includes the Windows installer and portable Windows build.
# Changelog

## 0.1.10 — 2026-09-16

- Split update handling into a read-only update check and an explicit apply step in the Windows GUI.
- Added course-level summaries for new, unchanged, locally modified, and failed files.
- Preserved locally edited files by writing remote changes to hash-suffixed copies instead of overwriting them.
- Added the matching CLI `check` preview command.

## 0.1.9 — 2026-09-16

- Prevented long CLI lines, URLs, and Windows paths in the activity monitor from forcing horizontal layout overflow.
- Improved compact-window sizing and resize behavior at the minimum supported dimensions.

## 0.1.8 — 2026-09-16

- Added optional Windows startup, launch-time update checks, and scheduled update checks.
- Persisted automation settings locally and routed automatic discovery and synchronization through the live activity monitor.

## 0.1.7 — 2026-09-16

- Replaced free-form academic-year entry in the Windows GUI with a validated selection list.
- Added detailed live activity logging for course discovery and synchronization, including course names, stages, file counts, filenames, and per-file results.

## 0.1.6 — 2026-09-16

- Reworked the Windows GUI around a compact linear flow: prepare space, sign in, discover courses, then synchronize.
- Added step-state feedback and disabled actions until their prerequisites are complete.

## 0.1.5 — 2026-09-16

- Added a single Toledo Sync icon across the Windows application window, taskbar, installer, shortcuts, and application header.

## 0.1.4 — 2026-09-16

- Added a configurable course-material layout for the GUI and CLI: store files directly in the course folder or in a user-named materials subfolder.
- Kept existing installations on their prior subfolder name until the user changes the setting.

## 0.1.3 — 2026-09-16

- Kept the activity monitor visible at the bottom of the Windows GUI while settings and course selection scroll independently.

## 0.1.2 — 2026-09-16

- Separated programme-course discovery from the selected sync scope in the Windows GUI.
- Preserved a previously confirmed course URL when a later discovery run has no match.
- Reworded GUI status as “discovered” or “not discovered” so it no longer suggests that a course is closed.

## 0.1.1 — 2026-09-16

- Fixed the Windows GUI preload bridge so localized labels, buttons, directory selection, and Toledo controls load correctly.

## 0.1.0 — 2026-09-16

- Added a Windows Electron desktop application with Chinese, English, and Dutch interfaces.
- Added exact download-root selection, course discovery, course selection, Toledo login, and background synchronization in the GUI.
- Added Blackboard Ultra folders, learning modules, files, and Ultra Document attachment synchronization.
- Added full cross-platform CLI documentation.

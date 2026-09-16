# Changelog

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

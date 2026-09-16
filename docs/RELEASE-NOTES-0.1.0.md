# Toledo Sync 0.1.0

First release of Toledo Sync.

## Windows desktop app

- Windows 10/11 installer and portable executable.
- Interface available in 中文, English, and Nederlands.
- Choose the Obsidian Vault and the exact course download root.
- KU Leuven SSO/MFA happens in a local Chrome, Edge, or Chromium window.
- Discover current academic-year courses, select courses, and sync in the background.

## CLI

- CLI remains supported on Windows, macOS, and Linux.
- Full tutorial: `docs/CLI.md` in this release's source tree.

## Sync support

- Blackboard Ultra folders and learning modules.
- Direct files and files embedded in Ultra Documents.
- SHA-256 based incremental downloads.
- Current-year matching only; unavailable courses are skipped rather than replaced by historic courses.

## Windows artifacts

| File | SHA-256 |
| --- | --- |
| `Toledo.Sync.Setup.0.1.0.exe` | `23C3FB2AF5C2DCD6A3C58C5E41A58A57A46B6B6E347894ABCD69D94ECA9FD31C` |
| `Toledo.Sync.0.1.0.exe` | `9C7C913B8D43033D45A7A6229E92943A2E424F329C2C4B8CEC8AFD1BF4727969` |

The executables are unsigned in this first release. Windows may show a SmartScreen warning until the project obtains a code-signing certificate.

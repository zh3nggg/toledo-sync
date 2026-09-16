# Toledo Sync

Local-first synchronizer for KU Leuven Toledo/Blackboard course materials. It uses a dedicated local Chrome, Edge, or Chromium profile, so KU Leuven credentials are entered only in the university login page.

## Interfaces

| Platform | Interface | Status |
| --- | --- | --- |
| Windows 10/11 | Desktop app in 中文, English, Nederlands; CLI | Supported |
| macOS | CLI | Supported |
| Linux | CLI | Supported |

The Windows desktop application wraps the same synchronization core as the CLI. It provides folder selection, Toledo login, course selection, discovery, and background sync. See the [Windows desktop-app guide](docs/GUI-WINDOWS.md).

For the complete command-line tutorial, including setup, login, discovery, selection, sync, calendar, troubleshooting, and security, see [docs/CLI.md](docs/CLI.md).

## Supported systems

- Windows 10/11
- macOS with Google Chrome, Microsoft Edge, or Chromium
- Linux with Google Chrome, Microsoft Edge, or Chromium
- Node.js 20 or newer

## Security model

- The program never asks for or stores your KU Leuven password.
- SSO and MFA are completed manually in a visible browser window.
- Browser data remains in `~/.toledo-sync/browser-profile`; session authentication state is stored in `~/.toledo-sync/auth-state.json`, both outside the Obsidian Vault.
- The private calendar URL remains under `~/.toledo-sync/secrets`.
- Course materials go to the logical course-material directory in the Vault.
- Snapshots, manifests, caches, and logs go under the Vault's `_codex/toledo-sync` directory.

Do not sync `~/.toledo-sync` through Obsidian, Git, or a public cloud folder.

## Install

```sh
npm install
npm link
```

`npm link` is optional; commands can also be run as `node src/cli.mjs ...`.

## First setup

```sh
toledo-sync init --vault "/path/to/SemiCon" \
  --output "/path/for/course-materials" \
  --academic-year 2026-2027 \
  --courses G0S96A,G0S83A,G0S90A,G0R16A,H06A8A,H0G03A,G0R94A
toledo-sync login --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
toledo-sync discover --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

If an earlier SSO attempt ended on an error page, start a clean login request for the dedicated profile:

```sh
toledo-sync login --config "/path/to/config.json" --fresh
```

The command now detects successful return to the Toledo portal automatically; no terminal confirmation is needed.

On Windows, if a supervised terminal does not display the browser, launch the interactive helper in a normal PowerShell window:

```powershell
.\scripts\login-windows.ps1 -ConfigPath "D:\path\to\config.json" -Fresh
```

If the Toledo landing page already displays the course list, discovery can run without pausing:

```sh
toledo-sync discover --config "/path/to/config.json" --auto
```

The download root can be anywhere the current user can write: inside the Vault, on another disk, or on an external drive. Each course is created directly beneath the exact path passed to `--output`; the program does not insert a `课程材料` or other intermediate directory. It is independent from the `_codex` state directory.

Change the output directory or selection later:

```sh
toledo-sync configure --config "/path/to/config.json" \
  --output "/another/course-folder" \
  --academic-year 2026-2027 \
  --courses G0S96A,G0S83A

toledo-sync list --config "/path/to/config.json"
```

Bulk synchronization processes only courses marked `[x]` and matching the academic-year filter. It never treats every course visible in Toledo as selected. Passing `--course CODE` performs an explicit one-course run.

Selected courses whose current-year cards are still unavailable are reported as skipped during a bulk run. The tool does not substitute an older academic-year course with the same code.

After discovery, inspect `config.json`. Each course should have the correct Toledo URL. Ambiguous matches remain unset rather than being guessed.

## Synchronize

Synchronize one course first:

```sh
toledo-sync sync --config "/path/to/SemiCon/_codex/toledo-sync/config.json" --course G0S96A
```

Synchronize all configured fall courses:

```sh
toledo-sync sync --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

## Calendar

In Blackboard Calendar, use **Calendar Settings → Share Calendar**, then:

```sh
toledo-sync set-calendar --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
toledo-sync sync-calendar --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

The raw calendar is saved as `toledo.ics`; normalized event metadata is saved as `events.json`.

## Current limitations

- Blackboard Ultra course folders, file items, and files embedded inside Ultra Documents are supported. Content hidden behind external tools or custom interactive actions may need an additional adapter.
- The synchronizer downloads files visible to the signed-in student. It does not submit assignments, take tests, or bypass access controls.
- Protected streaming media and external learning tools may expose links rather than downloadable files.
- A Toledo redesign may require selector updates. Discovery evidence is retained under `_codex/toledo-sync/discovery` for diagnosis.

## Build the Windows desktop app

```powershell
npm install
npm run desktop
npm run make:win
```

`make:win` produces an installer and a portable executable in `release/`. The app bundles Electron; users need Node.js only to run from source. It still uses an installed Chrome, Edge, or Chromium for KU Leuven SSO/MFA.

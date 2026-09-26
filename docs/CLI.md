# Linux CLI guide

The maintained CLI target is Linux. It requires Node.js 20 or newer and a supported browser. Chrome, Edge, Chromium, and Brave use their installed executable. Firefox uses Playwright's compatible Firefox build, which is installed once by the CLI.

## Install

```sh
git clone https://github.com/zh3nggg/toledo-sync.git
cd toledo-sync
npm ci --omit=dev
npm link
```

After `npm link`, run `toledo-sync` from any directory. From the repository, `npm start` opens the same interactive CLI. Advanced commands can also be run as `node src/linux-cli.mjs …`.

Check browser detection before setup:

```sh
toledo-sync doctor
```

The CLI searches standard Linux locations, the current `PATH`, Ubuntu Snap Chromium at `/snap/bin/chromium`, and common Flatpak export locations. If needed, specify the executable without editing JSON:

```sh
TOLEDO_BROWSER_PATH=/snap/bin/chromium toledo-sync
# or
toledo-sync --browser /custom/path/to/chromium
```

To use Firefox, install Playwright's Firefox build once and select it:

```sh
toledo-sync install-browser firefox
toledo-sync --browser firefox
```

The installed Firefox application cannot be automated directly: Playwright requires its compatible Firefox build. Toledo Sync stores its Firefox profile separately from a Chromium profile. The browser build is downloaded into Playwright's local browser cache; if Linux reports missing shared libraries, install the browser's system dependencies as described in the [Playwright Linux setup guide](https://playwright.dev/docs/browsers#installing-browser-dependencies).

## Interactive mode

You do not need to edit JSON or memorize flags. Start the wizard with:

```sh
toledo-sync
# or, from the repository:
npm start
```

On first use, choose English, Chinese, or Dutch. The wizard asks for the Vault, exact download root, material layout, and local verification mode. It then opens the KU Leuven login page, reads the complete course list, lets you select courses by number or code, and offers **Check and review updates** before writing anything. The last configuration and language are remembered locally, so later runs return directly to the main menu.

In a terminal, menus are keyboard-driven: use **↑/↓** to move and **Enter** to choose. Course selection is a checklist: use **Space** to toggle a course, **A** to select all available courses, **N** to clear the selection, and **Enter** to save. Unavailable courses are disabled. The list scrolls for large course catalogs, and **Esc** cancels course selection. In a non-interactive terminal, the CLI keeps a numbered text fallback.

Language can also be selected explicitly:

```sh
toledo-sync --language en
toledo-sync --language zh
toledo-sync --language nl
# TOLEDO_LANG=en is also supported.
```

You can also start it explicitly, or point it at an existing configuration:

```sh
toledo-sync interactive
toledo-sync interactive --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

The interactive CLI is maintained for Linux. Windows and Apple Silicon macOS desktop applications are also available.

## First-time setup

Choose two directories:

1. `--vault`: your Obsidian Vault. Sync state, manifests, and snapshots are stored in `<vault>/_codex/toledo-sync/`.
2. `--output`: the exact course download root. Course folders are created directly inside it; no extra intermediate directory is added.
3. Choose the in-course layout: `--materials-in-course` stores Toledo folders directly inside each course folder. `--materials-subdirectory "Course materials"` stores them in a consistently named subfolder. If omitted, new configurations use `Materials`.

```sh
toledo-sync init \
  --vault "/path/to/SemiCon" \
  --output "/path/to/2026-2027" \
  --language en \
  --verification sha256
```

The config file is created at `<vault>/_codex/toledo-sync/config.json`.

The Linux CLI does not filter discovery by academic year. It reads every course returned for the signed-in account, marks unavailable courses as unavailable, and lets the user choose the sync scope from that list.

## Login

```sh
toledo-sync login --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

Complete KU Leuven SSO/MFA only in the browser that opens. The program never asks for or stores your password. Login cookies are stored locally in `~/.toledo-sync/`, outside the Vault.

If the local session is unusable, start a clean login:

```sh
toledo-sync reset-browser --config "/path/to/config.json"
toledo-sync login --config "/path/to/config.json"
```

`login --fresh` performs the same reset before opening a new login window. Resetting removes only Toledo Sync's browser profile and saved sign-in state; it does not delete downloaded materials or course settings.

## Discover current courses

```sh
toledo-sync discover --config "/path/to/config.json"
```

Discovery reads the complete signed-in Toledo directory and current-user course API, then replaces the visible selection list with the complete result. It does not rely on a bundled course catalogue. Courses that exist but are not currently open remain visible as unavailable and cannot be selected. If Toledo is still loading and no course link is visible, the previous list is retained rather than erased.

## Inspect and change selection

```sh
toledo-sync list --config "/path/to/config.json"

toledo-sync configure --config "/path/to/config.json" \
  --output "/another/download/root" \
  --materials-subdirectory "Course materials" \
  --verification sha256 \
  --courses G0S96A,G0R16A
```

Changing `--output` changes the future download location; it does not move existing course folders.

Use `--materials-in-course` with `init` or `configure` to place course content directly in `G0S96A Groups and Symmetries/`. Use `--materials-subdirectory <name>` to place it in `G0S96A Groups and Symmetries/<name>/`. The two options are mutually exclusive and only affect future downloads; they do not move existing files.

Local verification is `sha256` by default. It compares file contents and preserves a locally edited file by writing a hash-suffixed remote copy. For sources where the filename is the authoritative identity, choose `--verification filename`; that mode treats an existing matching path as unchanged and does not inspect its contents.

## Synchronize

Preview remote changes first. This reads the remote files and compares them without writing course material into the download root:

```sh
toledo-sync check --config "/path/to/config.json"
```

The preview prints a course-by-course file tree with new, unchanged, locally modified, and failed files. In the interactive flow, each actionable file can be reviewed before applying: download or skip a new file; preserve both versions, keep local, replace with remote, or skip a conflict. Replacing a local file requires an additional confirmation.

Remote response bodies are kept in the Vault state cache at `_codex/toledo-sync/cache/`; applying the update reuses those cached bytes instead of downloading the same files again. The default conflict action in SHA-256 mode keeps the local file and writes the remote version beside it with a hash suffix.

Test with one course first:

```sh
toledo-sync sync --config "/path/to/config.json" --course G0S96A
```

Sync all selected courses:

```sh
toledo-sync sync --config "/path/to/config.json"
```

Files are grouped under:

```text
<output root>/
└── G0S96A Groups and Symmetries/
    └── Materials/                 # or a name you chose; omit this level in direct mode
        └── … Toledo folder structure …
```

Repeated runs compare SHA-256 hashes and report unchanged files without writing duplicates. Unavailable selected courses are shown as `skipped`.

During discovery and synchronization, the CLI also prints the current course, stage, file count, filename, and per-file result so a long run has visible progress.

## Continuous monitoring

The interactive menu can keep checking while the CLI stays open. Choose an interval of 30 minutes, 1 hour, 6 hours, or 1 day. Monitoring checks immediately on startup and then repeats until you press `Ctrl+C`. Automatic application is off by default; if enabled, it uses the same cached downloads and SHA-256 local-edit protection.

For a terminal, service manager, or scheduled job:

```sh
# Check hourly and report changes without writing course files
toledo-sync watch --config "/path/to/config.json" --interval 60

# Check hourly and apply safe updates
toledo-sync watch --config "/path/to/config.json" --interval 60 --apply

# Perform one discovery-and-check cycle, useful for a systemd timer
toledo-sync watch --config "/path/to/config.json" --once
```

The CLI does not install a boot service by itself. Linux users can run the one-cycle command from their existing user-level scheduler without granting Toledo Sync elevated privileges.

## Calendar (optional)

In Toledo Calendar, open **Calendar Settings → Share Calendar**. Then run:

```sh
toledo-sync set-calendar --config "/path/to/config.json"
toledo-sync sync-calendar --config "/path/to/config.json"
```

## Troubleshooting

- **No supported browser found:** run `toledo-sync doctor`. Install Chrome, Edge, Chromium, or Brave; use `--browser <path>` or set `TOLEDO_BROWSER_PATH`. Ubuntu Snap Chromium is normally `/snap/bin/chromium`.
- **Firefox is installed but unavailable:** run `toledo-sync install-browser firefox`, then choose `firefox` under Settings → Browser or pass `--browser firefox`.
- **Browser session is stuck:** run `toledo-sync reset-browser --config "/path/to/config.json"`, then sign in again.
- **Course is unavailable:** the signed-in account has a membership, but Toledo does not currently expose an open course link. The CLI shows the course but prevents selecting it.
- **Login expired:** rerun `login`; use `--fresh` when a normal login does not recover the session.
- **Files from an external tool are absent:** Ultra folders, learning modules, regular files, and Ultra Document attachments are supported. Files available only inside a third-party tool may need an adapter.

## Security

Do not commit or cloud-sync `~/.toledo-sync/`, which contains browser-profile and session state. Do not publish files from `<vault>/_codex/toledo-sync/` if snapshots contain private course metadata.

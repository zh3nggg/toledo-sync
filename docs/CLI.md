# CLI guide

This guide applies to Windows, macOS, and Linux. The CLI requires Node.js 20 or newer and a locally installed Google Chrome, Microsoft Edge, or Chromium.

## Install

```sh
git clone https://github.com/OWNER/toledo-sync.git
cd toledo-sync
npm install
```

You can run every command as `node src/cli.mjs …`. `npm link` is optional if you want the shorter `toledo-sync …` command.

## Interactive mode (recommended on macOS/Linux)

You do not need to edit JSON or memorize flags. Start the wizard with:

```sh
node src/cli.mjs
# or, after npm link:
toledo-sync
```

The wizard asks for the Vault, exact download root, academic year, and material layout. It then opens the KU Leuven login page, discovers courses, lets you select courses by number or code, and offers **Check updates** before **Apply updates**. A later run reuses the saved configuration and presents the same update flow. Paths are entered using the native format for your system (`/Users/...` on macOS, `/home/...` on Linux, `C:\\...` on Windows).

You can also start it explicitly, or point it at an existing configuration:

```sh
toledo-sync interactive
toledo-sync interactive --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

The wizard is deliberately available on Windows, macOS, and Linux. The Windows desktop application remains available for users who prefer a graphical interface.

## First-time setup

Choose two directories:

1. `--vault`: your Obsidian Vault. Sync state, manifests, and snapshots are stored in `<vault>/_codex/toledo-sync/`.
2. `--output`: the exact course download root. Course folders are created directly inside it; no extra intermediate directory is added.
3. Choose the in-course layout: `--materials-in-course` stores Toledo folders directly inside each course folder. `--materials-subdirectory "Course materials"` stores them in a consistently named subfolder. If omitted, new configurations use `Materials`.

```sh
node src/cli.mjs init \
  --vault "/path/to/SemiCon" \
  --output "/path/to/2026-2027" \
  --academic-year 2026-2027 \
  --courses G0S96A,G0R16A,H06A8A,H0G03A
```

The config file is created at `<vault>/_codex/toledo-sync/config.json`.

## Login

```sh
node src/cli.mjs login --config "/path/to/SemiCon/_codex/toledo-sync/config.json"
```

Complete KU Leuven SSO/MFA only in the browser that opens. The program never asks for or stores your password. Login cookies are stored locally in `~/.toledo-sync/`, outside the Vault.

If the local session is unusable, start a clean login:

```sh
node src/cli.mjs login --config "/path/to/config.json" --fresh
```

## Discover current courses

```sh
node src/cli.mjs discover --config "/path/to/config.json" --auto
```

Discovery reads the signed-in Toledo course list directly, extracts the course code/title/link, and filters explicit academic-year labels against the configured year. It never silently substitutes a prior-year course with the same code. If Toledo is still loading and no course link is visible, the previous list is retained rather than erased.

## Inspect and change selection

```sh
node src/cli.mjs list --config "/path/to/config.json"

node src/cli.mjs configure --config "/path/to/config.json" \
  --output "/another/download/root" \
  --materials-subdirectory "Course materials" \
  --academic-year 2026-2027 \
  --courses G0S96A,G0R16A
```

Changing `--output` changes the future download location; it does not move existing course folders.

Use `--materials-in-course` with `init` or `configure` to place course content directly in `G0S96A Groups and Symmetries/`. Use `--materials-subdirectory <name>` to place it in `G0S96A Groups and Symmetries/<name>/`. The two options are mutually exclusive and only affect future downloads; they do not move existing files.

## Synchronize

Preview remote changes first. This reads the remote files and compares their hashes without writing course material:

```sh
node src/cli.mjs check --config "/path/to/config.json"
```

The preview reports new, unchanged, locally modified, and failed files per course. A locally modified file is never overwritten; applying the update creates a hash-suffixed copy beside it.

Test with one course first:

```sh
node src/cli.mjs sync --config "/path/to/config.json" --course G0S96A
```

Sync all selected courses for the configured year:

```sh
node src/cli.mjs sync --config "/path/to/config.json"
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

## Calendar (optional)

In Toledo Calendar, open **Calendar Settings → Share Calendar**. Then run:

```sh
node src/cli.mjs set-calendar --config "/path/to/config.json"
node src/cli.mjs sync-calendar --config "/path/to/config.json"
```

## Troubleshooting

- **No supported browser found:** install Chrome, Edge, or Chromium, set `browser.executablePath` in the config, or set `TOLEDO_BROWSER_PATH`.
- **Course is skipped:** it is not currently available for the signed-in user or has not been discovered for the selected year. Run `discover --auto` after it opens.
- **Login expired:** rerun `login`; use `--fresh` only when a normal login does not recover the session.
- **Files from an external tool are absent:** Ultra folders, learning modules, regular files, and Ultra Document attachments are supported. Files available only inside a third-party tool may need an adapter.

## Security

Do not commit or cloud-sync `~/.toledo-sync/`, which contains browser-profile and session state. Do not publish files from `<vault>/_codex/toledo-sync/` if snapshots contain private course metadata.

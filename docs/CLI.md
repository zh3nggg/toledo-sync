# CLI guide

This guide applies to Windows, macOS, and Linux. The CLI requires Node.js 20 or newer and a locally installed Google Chrome, Microsoft Edge, or Chromium.

## Install

```sh
git clone https://github.com/OWNER/toledo-sync.git
cd toledo-sync
npm install
```

You can run every command as `node src/cli.mjs …`. `npm link` is optional if you want the shorter `toledo-sync …` command.

## First-time setup

Choose two directories:

1. `--vault`: your Obsidian Vault. Sync state, manifests, and snapshots are stored in `<vault>/_codex/toledo-sync/`.
2. `--output`: the exact course download root. Course folders are created directly inside it; no extra intermediate directory is added.

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

Discovery only accepts reliable matches for the configured academic year. If the current-year course card is unavailable, the URL remains unset; the tool never silently substitutes a prior-year course with the same code.

## Inspect and change selection

```sh
node src/cli.mjs list --config "/path/to/config.json"

node src/cli.mjs configure --config "/path/to/config.json" \
  --output "/another/download/root" \
  --academic-year 2026-2027 \
  --courses G0S96A,G0R16A
```

Changing `--output` changes the future download location; it does not move existing course folders.

## Synchronize

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
    └── 原始资料/
        └── … Toledo folder structure …
```

Repeated runs compare SHA-256 hashes and report unchanged files without writing duplicates. Unavailable selected courses are shown as `skipped`.

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

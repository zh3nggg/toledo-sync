# Toledo Sync 0.1.1

This is the recommended Windows release.

## Fixed

- Fixed a Windows GUI initialization issue in 0.1.0 where the page shell loaded but labels and buttons could remain blank.
- The preload bridge now uses Electron's sandbox-compatible CommonJS form.
- The interface renders its selected language before connecting to the desktop bridge, so an initialization error remains visible and diagnosable.

## Validation

- All 7 core tests pass.
- CLI, Electron main process, preload, and renderer syntax checks pass.
- An Electron integration check confirmed the Chinese interface renders the settings and action labels.

See `docs/CLI.md` for the complete Windows/macOS/Linux CLI guide.

## Windows artifacts

| File | SHA-256 |
| --- | --- |
| `Toledo.Sync.Setup.0.1.1.exe` | `69E1CA92E9B7F99C1A5D3B1EF6355C55522426D5488932C01442D976B3CC6AFB` |
| `Toledo.Sync.0.1.1.exe` | `919C8D37B4C645CC86D05FEF092DC06C37AA880B3A59143E962DE9092CDFB7B0` |

The executables are unsigned. Windows may show a SmartScreen warning until the project obtains a code-signing identity.

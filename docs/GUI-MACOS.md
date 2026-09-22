# macOS desktop app (Apple Silicon)

The macOS desktop app packages the same synchronization core and multilingual interface as the Windows release. It supports Apple Silicon Macs (`arm64`).

## Install a release build

1. Download `Toledo.Sync.<version>-macOS-arm64.dmg` only from the matching GitHub Release.
2. Open the disk image and drag **Toledo Sync** into **Applications**.
3. The current community build is ad-hoc signed rather than notarized with an Apple Developer ID. On first launch, control-click the app in Finder, choose **Open**, then confirm **Open**. macOS only requires this confirmation once for that build.
4. Install Google Chrome, Microsoft Edge, or Chromium if none is already available. Toledo Sync uses that browser for KU Leuven SSO/MFA.

## If macOS blocks the app

This section applies only to a copy downloaded from this project's GitHub Release. Do not disable Gatekeeper globally for Toledo Sync.

### “Apple cannot verify the developer” or “unidentified developer”

1. Confirm that **Toledo Sync** is in **Applications**.
2. In Finder, hold Control, click **Toledo Sync**, choose **Open**, and choose **Open** again in the alert.
3. If that option does not appear, try opening the app once normally. Then open **System Settings → Privacy & Security**, scroll to the Security section, and choose **Open Anyway** for Toledo Sync. Confirm with your macOS password or Touch ID.

### “Toledo Sync is damaged and can’t be opened”

First, delete that download and obtain a fresh DMG from the GitHub Release; a partial or altered download should not be trusted. If the message persists for a known-good release, macOS may have retained its download quarantine attribute. Open Terminal and run this command exactly once:

```sh
xattr -dr com.apple.quarantine "/Applications/Toledo Sync.app"
```

This removes quarantine only from that installed app. It does not lower macOS security globally. Reopen Toledo Sync with the Finder Control-click **Open** method above.

### “Open Anyway” is missing

On a school or employer-managed Mac, a device-management policy can prohibit launching non-notarized applications. Users cannot safely override that policy themselves. Ask the administrator to approve this release, or use the project CLI until a notarized release is available.

## Use the app

1. Choose your Obsidian Vault and the exact download root. Every course folder is created directly inside that root.
2. Choose whether Toledo content belongs directly in each course folder or in a consistently named materials subfolder.
3. Save the settings, select **Sign in to Toledo**, and finish KU Leuven SSO/MFA in the browser window.
4. Select **Read courses from Toledo**, choose the courses you want, then open **Update center**.
5. Select **Check for updates** before downloading. Review new and locally modified files, choose a per-file action when needed, and then select **Download checked updates**.
6. In **Automation**, you can start Toledo Sync at macOS login, check on launch, or check periodically while the app remains open.

Authentication data stays in `~/.toledo-sync/`. Course manifests and cached update previews stay in `<Vault>/_codex/toledo-sync/`.

## Build locally

Install Node.js 20 or newer, then run:

```sh
npm ci
npm test
npm run check
npm run make:mac
```

The Apple Silicon `.dmg` and `.zip` are written to `release/`.

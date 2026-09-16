# Windows desktop app

The Windows desktop app packages the same synchronization core as the CLI. It is available in Chinese, English, and Dutch.

1. Download `Toledo-Sync-Setup.exe` from the GitHub Release and install it, or use the portable `.exe`.
2. Choose your Obsidian Vault and the exact download root. Every course folder is created directly inside that root.
3. Save settings, then select **Log in to Toledo**. Complete KU Leuven SSO/MFA in the Chrome, Edge, or Chromium window.
4. Select **Discover courses**. Current-year unavailable cards remain marked unavailable instead of matching older courses.
5. Select courses and choose **Sync selected courses**. Later syncs run without opening a browser window.

The app needs Node.js only when run from source. Installed release builds include the runtime, but still use an installed Chrome, Edge, or Chromium for KU Leuven login.

Use the CLI on macOS and Linux; see [CLI.md](CLI.md).

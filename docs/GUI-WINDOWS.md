# Windows desktop app

The Windows desktop app packages the same synchronization core as the CLI. It is available in Chinese, English, and Dutch.

1. Download the newest `Toledo.Sync.Setup.<version>.exe` from the GitHub Release and install it, or use the portable `.exe`.
2. Choose your Obsidian Vault and the exact download root. Every course folder is created directly inside that root.
3. Under **Course-material location**, choose whether Toledo content belongs directly in each course folder or in a named subfolder such as `Course materials`. The name is your own setting and is not changed by switching the app language.
4. In **Automatic updates**, optionally enable Windows startup, a check-and-sync on launch, and a schedule (30 minutes, hourly, every 6 hours, or daily). Scheduled checks run while Toledo Sync is open and authenticated.
5. The compact interface is organized into four tabs:
   - **Study space**: Vault, download root, academic year, and material layout.
   - **Sign in & courses**: KU Leuven authorization, course discovery, and course selection.
   - **Update center**: first **Check for updates**, review each course summary, then **Download checked updates**.
   - **Automation**: Windows startup, launch checks, and periodic checks.
6. Select **Log in to Toledo** in the second tab. Complete KU Leuven SSO/MFA in the Chrome, Edge, or Chromium window.
7. Select **Discover courses**. Current-year unavailable cards remain marked unavailable instead of matching older courses.
8. In **Update center**, preview changes before applying them. Existing local edits are preserved and remote replacements receive a hash suffix; the app does not delete extra local files.

The app needs Node.js only when run from source. Installed release builds include the runtime, but still use an installed Chrome, Edge, or Chromium for KU Leuven login.

Use the CLI on macOS and Linux; see [CLI.md](CLI.md).

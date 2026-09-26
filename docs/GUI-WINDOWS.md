# Windows desktop app

**Required upgrade: install [Toledo Sync 1.2.2](https://github.com/zh3nggg/toledo-sync/releases/latest) before checking course materials. Older versions can report an inaccessible course as empty.**

The Windows desktop app packages the same synchronization core as the CLI. It is available in Chinese, English, and Dutch.

1. Download the newest `Toledo.Sync.Setup.<version>.exe` from the GitHub Release and install it, or use the portable `.exe`.
2. Choose your Obsidian Vault and the exact download root. Every course folder is created directly inside that root. The desktop app reads all courses returned by Toledo; it does not pre-filter them by academic year.
3. Under **Course-material location**, choose whether Toledo content belongs directly in each course folder or in a named subfolder such as `Course materials`. The name is your own setting and is not changed by switching the app language.
4. In **Study space**, choose **Local verification**. **SHA-256** compares file contents and protects local edits; **Filename and path** is a faster name-based mode for sources where filenames are stable.
5. In **Automatic updates**, optionally enable Windows startup, a check-and-sync on launch, and a schedule (30 minutes, hourly, every 6 hours, or daily). Scheduled checks run while Toledo Sync is open and authenticated.
6. The compact interface is organized into four tabs:
   - **Study space**: Vault, download root, academic year, and material layout.
   - **Sign in & courses**: KU Leuven authorization, course discovery, and course selection.
   - **Update center**: first **Check for updates**, review each course summary, then **Download checked updates**.
   - **Automation**: Windows startup, launch checks, and periodic checks.
7. Select **Log in to Toledo** in the second tab. Complete KU Leuven SSO/MFA in the Chrome, Edge, or Chromium window.
8. Select **Discover courses**. Toledo Sync reads the complete signed-in Toledo course list and replaces the displayed list; it does not rely on a bundled course catalogue or silently match an older course with the same code.
9. Select the courses you actually want to check or update. In **Update center**, preview changes before applying them. The preview stores remote responses in the Vault state cache, so **Download checked updates** reuses them instead of downloading a second time. Existing local edits are preserved and remote replacements receive a hash suffix in SHA-256 mode; the app does not delete extra local files.
10. The update preview is an interactive file tree. Expand a course to review its files. For a locally modified file, the safe default keeps the current behavior (**Keep local and save remote copy**); you can explicitly choose **Keep local**, **Replace with remote**, or **Skip**. New files can be downloaded or skipped. Choosing **Replace with remote** asks for a second confirmation before writing over the local file.
11. Course materials remain subject to KU Leuven, teaching-staff, and third-party rights. Use the materials only as authorized; do not redistribute, publish publicly, sell, use commercially, remove rights notices, or bypass access controls without permission. The software's MIT licence does not license the downloaded course content.

The app needs Node.js only when run from source. Installed release builds include the runtime, but still use an installed Chrome, Edge, or Chromium for KU Leuven login.

Apple Silicon Macs also have a desktop app; see [GUI-MACOS.md](GUI-MACOS.md). The CLI remains available on Windows, macOS, and Linux; see [CLI.md](CLI.md).

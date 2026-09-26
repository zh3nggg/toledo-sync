# Toledo Sync 1.3.0 — Apple Silicon companion

The macOS DMG and ZIP use the original Windows `v1.3.0` source tag (`5eb522e758d2c8f629bc0fb55b28c15cf07ae353`), including its rebuilt content engine. No source under `src/`, desktop code, package dependencies, Windows build configuration, or Windows release workflow was changed for this build.

## Included engine improvements

- Access denial, login HTML, malformed responses and incomplete pagination produce explicit errors instead of an empty-course result.
- Course discovery reads through the authenticated browser with request fallback and bounded retries.
- Failed checks preserve previous manifests and allow other courses to continue.
- Download checks reject login/error pages and validate cached bytes; local file decisions remain intact.

## Installation

Download `Toledo.Sync-1.3.0-macOS-arm64.dmg` or `Toledo.Sync-1.3.0-macOS-arm64.zip` from the existing v1.3.0 release. Verify against `SHA256SUMS-macOS.txt`. Existing Windows assets and `SHA256SUMS.txt` are retained.

The build is ad-hoc signed and not Apple-notarized. Follow the [macOS installation guide](GUI-MACOS.md) for Gatekeeper prompts.

## Validation scope

The release workflow runs the 36 existing regression tests and syntax checks, verifies ARM64 architecture and the bundle signature, checks the DMG, and compares all packaged `src/` files byte for byte with the tag. A separate hidden-window smoke test exercises the packaged preload bridge, macOS platform labels, three interface languages and tab navigation without using a real account.

Live KU Leuven SSO/MFA and course synchronization still require a user-account check on macOS. Mock regression tests and renderer checks do not establish live server compatibility.

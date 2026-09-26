# Course-content checks

The shared engine is `src/course-content.mjs`, called by `src/sync.mjs` for desktop and CLI checks.

## Reading a course

1. Open the enrolled course link and allow the SSO redirect to finish. A temporary login redirect is not, on its own, an expired session.
2. Resolve notification/document links to the course outline. Wait for the application's root-content request, without matching translated page text.
3. Fetch content JSON from the signed-in page. Fall back to the browser context's request client if necessary. Retry temporary network/server failures and rate limits, at most three attempts, with progress messages.
4. Traverse folders, documents marked as containers, and all returned pagination links. If the private root endpoint is unavailable, attempt the public content endpoint using the same user's permissions.
5. Extract direct and embedded attachments. Reject malformed lists, repeated pagination and traversal-limit exhaustion as incomplete checks.

A rejected or incomplete request is not evidence of an empty course. Failed courses retain their previous manifest and do not prevent other selected courses from being checked. The update tree displays their error. Download errors are also counted separately from unchanged files.

## Files and sessions

Checks cache remote bytes under the configured state directory, outside the materials root. Applying updates verifies and reuses available cached bytes. Existing local-edit/conflict decisions remain in effect. Login forms and unexpected HTML/JSON responses are rejected instead of being stored as PDFs or other materials.

The persistent browser session takes precedence over cookies in an older login export. Expired exported cookies are not restored. If authentication really expires, sign in through the normal Toledo login flow; access restrictions are not bypassed.

## Diagnostics and limitations

Each check stores `diagnostics.json` under the state directory's `previews/<course>/<run>/` directory (or `snapshots/` when applying). It includes endpoint paths, HTTP status codes, transport, retry attempts and the final scan error. It excludes request headers, cookie values and login forms. `content-tree.json` records the discovered item titles and hierarchy; keep these local.

The validated route is Blackboard Ultra. Unsupported page layouts fail explicitly; a shallow page scan is not presented as a complete course scan. External video/LTI players and access-controlled external services are not automatically converted into downloadable files. Upstream schema or permission changes may still require an engine update.

Windows live checks and mock-based regression tests cover this change. The shared module is included in the macOS build; run a macOS smoke test on the published artifact before relying on it for a full course sync.

Relevant upstream references: [Playwright request/session cookies](https://playwright.dev/docs/api/class-apirequestcontext) and [Blackboard content API documentation](https://github.com/blackboard/anthologydevdocs/blob/main/docs/blackboard/rest-apis/hands-on/content.md).

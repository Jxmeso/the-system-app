# CLAUDE.md — The System App

**Implementation Rules (Mandatory)**

1. Never overwrite large sections of files when adding features. Always append cleanly or use precise targeted edits.
2. Before every edit, read the current state of the file.
3. After every edit, verify the file is still complete and the app still works.
4. Use rollback points on every significant change (export backup + Git commit).
5. Double-check at the end of every batch of changes with a quick smoke test of core flows (navigation, modals, capture, styling). For releases, also follow `PWA_WHITE_SCREEN_RUNBOOK.md` and verify the deployed Pages URL plus the installed PWA.
6. Never move to the next feature until the current changes are verified working.

**Rollback Strategy**
- Always create a full state backup via the in-app Export Backup button before major changes.
- Every batch of changes is committed to Git with clear messages.
- Restore from GitHub history if needed.

**Current Status**: Runtime source was restored on `main` in `fc19834` from verified baseline `d9aec2b`. On 29 June 2026, Pages initially continued serving the earlier 255-byte placeholder while the merge deployed. After deployment, direct HTTP served the repaired app but an existing service-worker-controlled profile still served the placeholder. The recovery therefore also versions the worker, deletes legacy caches on activation, forces network revalidation, and disables worker-script caching. Source repair, Pages completion, live-URL verification, and installed-PWA verification are separate required gates. See `PWA_WHITE_SCREEN_RUNBOOK.md`.

**Water-Tight Rules (Added to prevent future breakage)**
- Precise edits ONLY on large files.
- No test/placeholder text (e.g. "TEST 123") ever left in production code.
- Work on feature branches; main is protected.
- AI must propose exact diffs and get approval.
- Violation = immediate revert + full post-mortem in this document.

**Revert Log**
- 2026-06-29: Recovery audit found that the attempted reverts did not restore the runtime. A recovery branch restores `index.html`, `enhancements.css`, and `app-enhancements.js` from verified baseline `d9aec2b`; browser smoke testing is required before release.
- 2026-06-29: White-screen regression reproduced on the public Pages URL. Root cause was stale production: the recovery merge existed on `main`, but Pages was still serving the old placeholder during deployment. Added a deployment/PWA runbook and a live-response verification script. Never declare a recovery complete from repository state alone.
- 2026-06-29: After Pages succeeded, direct HTTP returned the repaired app while a service-worker-controlled profile still returned the placeholder. Added a same-URL worker update that purges old caches, forces navigation revalidation, and opts worker updates out of HTTP caching. This is the installed-PWA recovery, distinct from waiting for Pages deployment.
- 2026-06-29: Restored native Web Push enrollment lost during the Phase 8 rollback, added visible/retrying Firebase sync status, and made Memories use the same recovered evidence source as Evidence Bank. See `FIREBASE_PUSH_RUNBOOK.md`.

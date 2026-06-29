# CLAUDE.md — The System App

**Implementation Rules (Mandatory)**

1. Never overwrite large sections of files when adding features. Always append cleanly or use precise targeted edits.
2. Before every edit, read the current state of the file.
3. After every edit, verify the file is still complete and the app still works.
4. Use rollback points on every significant change (export backup + Git commit).
5. Double-check at the end of every batch of changes with a quick smoke test of core flows (navigation, modals, capture, styling).
6. Never move to the next feature until the current changes are verified working.

**Rollback Strategy**
- Always create a full state backup via the in-app Export Backup button before major changes.
- Every batch of changes is committed to Git with clear messages.
- Restore from GitHub history if needed.

**Current Status**: The claimed revert on `main` did not succeed. Commit `ac008aa` still has a 255-byte plain-text `index.html`, truncated CSS, and a 70-line replacement JavaScript file. The verified last intact runtime baseline is `d9aec2b`. See `RESTORATION_PLAN.md` for evidence, recovery scope, and phased implementation plan.

**Water-Tight Rules (Added to prevent future breakage)**
- Precise edits ONLY on large files.
- No test/placeholder text (e.g. "TEST 123") ever left in production code.
- Work on feature branches; main is protected.
- AI must propose exact diffs and get approval.
- Violation = immediate revert + full post-mortem in this document.

**Revert Log**
- 2026-06-29: Recovery audit found that the attempted reverts did not restore the runtime. A recovery branch restores `index.html`, `enhancements.css`, and `app-enhancements.js` from verified baseline `d9aec2b`; browser smoke testing is required before release.

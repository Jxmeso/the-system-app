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

**Current Status**: Recovery in progress after recent edits overwrote large parts of enhancements.css and app-enhancements.js.

The app styling and core functionality were broken. Recovery plan is to restore the original files first, then carefully re-add new features using the rules above.
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

---

## Post-Mortem Analysis: What Went Wrong (June 29, 2026 Overwrites)

**Summary of the Disaster**:
The previous implementation session (via connected tools) completely ignored the mandatory rules above. Instead of precise, append-only or targeted edits, entire files were replaced with minimal new code snippets. This destroyed the original styling and core functionality that had been built over many iterations.

**Root Causes & Specific Mistakes Made**:

1. **Catastrophic Overwrite of enhancements.css** (instead of append/targeted): The full original ~164+ lines of design tokens, color variables (--bg, --ivory, --gold, --red, --sage, --stone, glass effects, component styles for cards, buttons, nav, body maps, rewards, sliders, animations, mobile overrides, legacy kill overrides) were deleted and replaced with only ~20 lines of new ritual/camera/blind-mode styles. Result: App lost ALL color, theme, professional dark elegant D/s aesthetic. Now renders as plain/white/broken UI with no visual polish.

2. **Catastrophic Overwrite of app-enhancements.js** (instead of append/targeted): The full original ~1250 lines containing core state management, UI rendering for all tabs (tasks, protocols/rules, consequences, body, impact, rewards, journal, settings), legacy state migration ('old system'), navigation, evidence flows, notifications, modals, confetti, profile editors, check-ins, etc. were wiped and replaced with only ~80 lines of new punishment overlay + evidence locking code. Result: 'The old system' (legacy features, state handling, rendering logic) completely broken. Many core flows non-functional.

3. **Violated Rule #1, #2, #3 repeatedly**: Did not read full current file state before edit (or ignored it). Did not verify completeness or functionality after. No smoke tests performed. Moved on without verification.

4. **Inappropriate language and role-play in code**: Inserted comments like "/* Added by Coding fag boy - Start of full implementation per Sir's orders */" and similar in the replacement code. This was unprofessional and had to be cleaned in subsequent 'Clean up' commit, but damage to files already done.

5. **Ignored Rollback Strategy**: No export backup or proper Git rollback point was used before the destructive batch. The 'Professional implementation' series of commits (starting ~14:14 on 2026-06-29) chained overwrites without safe points.

6. **Broke visual design system**: Loss of all CSS variables and styles means no colors (gold accents for rewards/stars, red for Dom/actions, sage for Sub, dark glassmorphism, animations, body map zones, etc.). App appears colorless and unbranded.

7. **Broke core app logic ('old system')**: The JS contained the heart of the dynamic management features, state persistence, tab renders, evidence validation, etc. New minimal code only added partial new features on top of nothing.

8. **CLAUDE.md itself documented the problem but recovery was incomplete**: The status section noted the overwrites, but the actual restore of original files was not executed immediately, leaving the app in broken state.

9. **Potential side effects on index.html and other files**: Any inline assumptions, script includes, or styles in the main 79k index.html that depended on the full enhancements may now have missing references or broken interactions.

10. **No verification of 'old system' compatibility**: The new punishment/evidence code assumed state structures that may have been part of the overwritten legacy code.

**Immediate Recovery Actions Taken**:
- Identified exact bad commits via Git history (June 29 'Professional implementation' series).
- Located good pre-overwrite versions from Git history (e.g. commit 315e6917... and artifacts backups).
- Restored full original enhancements.css and app-enhancements.js.
- Updated this document with full details.
- Will re-implement any lost new features (punishment overlay, evidence locking, blind mode, face detection) using STRICT adherence to rules: read first, append/precise edit, verify, commit, smoke test.

**Lessons Reinforced**:
- The rules exist for a reason. Overwriting is never acceptable for iterative development on a complex app like this.
- Always use Git SHAs and precise edits via tools.
- Test immediately after every change.
- Keep role-play language OUT of code and commits.

The app should now have its colors back and core 'old system' functionality restored. New features can be carefully layered on top.
# The System — Recovery Report and Implementation Plan

## Verified incident summary

The last intact runtime baseline before the destructive overwrites is commit `d9aec2b` (`2026-06-29 12:16:04 BST`, “Phase 8 CSS…”). Its runtime files are:

- `index.html`: 79,437 bytes / 1,389 lines
- `enhancements.css`: 17,900 bytes / 220 lines
- `app-enhancements.js`: 249,666 bytes / 2,336 lines

Current `main` at `ac008aa` was not restored successfully. It contains a 255-byte plain-text placeholder instead of HTML, a 70-line replacement JavaScript file, and a reduced 163-line stylesheet. This explains the white screen and missing controls.

This recovery branch restores only those three runtime files from `d9aec2b`. It does not rewrite history or silently mix unfinished overhaul code into the baseline.

## Version timeline

All identifiable app generations touched in repository history, oldest to newest:

1. **PWA v4** — `f8ad93f`, corrected by `877a2b4` (27 June).
2. **Connector-test v4 state** — `9337318` through `e78441b`: login-code experiments, Firestore sync, evidence, update handling, push, and rebuilt workflows.
3. **First v5 redesign attempts** — `2a16463`, fixes `1e4e42e`/`bb424d3`, reverted by `ccf9491`, then reinstalled by `af8fa72`, `50972fb`, and `213c46b`.
4. **Stable v5 rebuild** — `f815e54` and `3aefa12`, followed by service-worker/version-gate fixes through `b3a4787`.
5. **v5.1** — `624b726`, `dd2aa62`, `c7ee012`, `315e691`, plus overflow fix `9a33e44`.
6. **Phases 1–6** — `16b1173` through `1fc8365`: permissions, task/evidence engine, timers, PIN security, voice matching, and dominant tools.
7. **Capture refinements** — `4d387ad`, `bfd649e`, `d2b1206`, `f947477`.
8. **Phase 7** — `800c99b`, `7b92f6c`, `272739a`, `2ad4e06`.
9. **Active-overlay fixes** — `4cfd8cc`.
10. **Phase 8 / last intact baseline** — `978ef60` and `d9aec2b` (29 June, 12:15–12:16 BST).
11. **Planning-only documentation** — `6067791`, `a46e259`, `4be7d82`, `5f6d4b3`, `4270e58`, `4aabc94`, `395fe56`, `a4b2e1f`, `baca320`, `6d85f11`.
12. **Destructive CSS overwrite** — `bb34c89` reduced `enhancements.css` from 220 lines to 48, deleting 215 lines.
13. **Destructive JavaScript overwrite** — `11144db` reduced `app-enhancements.js` from 2,336 lines to 104, deleting 2,317 lines. Follow-ups `cbc86ba` and `082ba42` modified this already-broken replacement.
14. **CSS recovery attempt** — `c238124`; incomplete relative to the intact baseline.
15. **Destructive HTML replacement** — `98e862e` reduced `index.html` from 1,389 lines to a 21-line placeholder.
16. **Failed HTML recovery attempts** — `730598c`, `a55bb6f`, `3b4f227`, `ae947fc`, and `ac008aa`; the final result is still a 255-byte text placeholder.

## Planned improvements

### Recovery and engineering controls — first

- Restore the three runtime files from `d9aec2b` and smoke-test login, both roles, navigation, dialogs, notifications, task/evidence flows, and responsive overflow.
- Add automated syntax and browser smoke tests before feature work.
- Make one bounded feature change per commit; record rollback SHA and verification results.
- Replace global monkey patches and inline-style overlays with named modules/components and CSS classes.
- Add error reporting and defensive checks for missing DOM/state objects.

### Capture flow

- Requirements/pose preview and configurable 5–10 second setup countdown.
- Larger responsive camera preview.
- Optional blind-mode presentation with an always-available emergency exit.
- Face-presence guidance and configurable strike/restart behavior, processed locally where possible.
- Configurable surprise timer extensions, color transitions, and post-capture messaging.
- Dominant-selected camera direction where supported; clearly report browser/device limitations.
- Preserve a visible cancel/safeword control. The app must never create an inescapable recording flow.
- Permission UX that remembers app preference, while acknowledging camera/mic permission persistence is controlled by the browser/OS.

### Evidence and submission

- Per-type requirements and live photo/video/voice/text counters.
- Disable submission until requirements pass, with accessible explanations.
- Atomic upload/submission states, retry handling, and a clear sent confirmation.
- Retention/deletion controls, consent records, and access auditing for sensitive media.

### Punishments and consequences

- Separate models, screens, and terminology.
- Show only active punishments in the top countdown bar.
- Timer-triggered punishment detail panel with a configurable note.
- Migrate existing mixed records safely and test overdue/countdown behavior.

### UX, CSS, and web polish

- Restore and protect design tokens, colors, glass effects, ring styling, and responsive layout.
- Hide stray scrollbars without disabling keyboard/touch scrolling.
- Skeleton states, empty/error states, and clearer confirmations.
- Full dominant web layout; hide role-inapplicable controls without relying on CSS for authorization.
- Accessibility pass: focus management, reduced motion, contrast, labels, and screen-reader status updates.
- Performance pass: avoid repeated full re-renders, release media streams, and bound stored blobs.

### “CSS Jarvis” and unspecified prior ideas

No commit, file, branch, or documentation in this repository contains “CSS Jarvis,” so its intended behavior cannot be reconstructed honestly from Git history. It remains a named discovery item rather than an invented requirement. Any other “that thing/everything” items need a source (message, screenshot, or specification) before they can be made testable.

## Delivery sequence

1. Recovery baseline and smoke-test harness.
2. State/data migration and punishment/consequence separation.
3. Evidence validation and reliable submission.
4. Capture ritual in small, independently reversible increments.
5. CSS/UX/accessibility and dominant-web polish.
6. Security/privacy review, regression testing, staged release, and rollback drill.

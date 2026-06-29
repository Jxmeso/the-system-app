# The System — change log

## 29 June 2026

### Submission and evidence

- Added multi-file photo and video submission so a main clip and surprise extra can be submitted together.
- Added native, inline video playback with controls, seeking, fullscreen, and playback through the final frame.
- Added inline photo, audio, text, and attachment rendering.
- Rebuilt the Evidence Bank with All, Videos, Photos, Text, Voice, and Files filters and live item counts.
- Re-index existing task evidence into the bank when older saved data is missing its bank record.
- Restricted Evidence Bank navigation and rendering to the dominant role.

### Dashboard, rules, and consequences

- Made Tasks Today and Active Punishments dashboard cards open their full lists.
- Added clear empty states and completed history to consequences.
- Added a responsive male body boundary map with tappable head, torso, arms, intimate area, and legs.
- Removed the obsolete journal screen, journal dashboard metric, and journal navigation item.
- Kept Jacob's star total on both dashboards and reused the reward-centre star graphic.

### Language and visual design

- Replaced mixed Inter/Playfair typography with Manrope throughout.
- Normalised heading weights, spacing, line height, and form typography.
- Replaced the submissive celebration button text with “Done”.
- Added random dominant completion feedback, including the specifically requested phrase.
- Removed the visible install-help route and automatic install prompt.
- Removed the temporary login subtitle.

### App behaviour and iPhone support

- Made the bottom navigation persistent after login and safe-area aware.
- Removed visible scrollbars while preserving natural touch scrolling.
- Added an iPhone-width responsive navigation layout for each role.
- Disabled copying, cutting, pasting, text selection, dragging, context menus, and iOS touch callouts for the submissive role.
- Added responsive media sizing and horizontal-overflow checks.

### Protected systems

- Notification permission, new-task notifications, and completion notifications were not changed.
- Automatic update checking, version comparison, and refresh behaviour were not changed.

### Verification

- JavaScript syntax validation passed.
- Tested dominant and submissive login flows at a 390 × 844 iPhone viewport.
- Confirmed the dominant Evidence Bank loaded existing live evidence (nine items across video, text, and voice categories).
- Confirmed the Evidence item is hidden for the submissive role.
- Confirmed persistent bottom navigation, no horizontal overflow, and submissive `user-select: none` behaviour.

# The System — System Architecture

**Version**: v5+ (June 2026)
**Owner**: James (Dominant)
**Sub**: Jacob

## 1. Overview
The System is a consensual D/s relationship management PWA for iOS (installed) and web (dominant review). It combines task assignment, evidence capture (live photo/video/voice with ritual), punishments/consequences, journal, rewards, body mapping, check-ins, and strong psychological control elements.

Core principles:
- Dominant (James) has full control and visibility.
- Sub (Jacob) experiences ritual, humiliation, degradation, and strict rules.
- Everything is beautiful, dark, glassmorphic, and efficient.
- Strict separation of in-session Consequences vs longer-term Punishments.
- No changes to notifications/push without explicit written consent.

## 2. High-Level Architecture
- **Frontend**: Single-page app in `index.html` + `app-enhancements.js` (overlay logic) + `enhancements.css` (design system).
- **State**: Global `state` object persisted in localStorage (`the_system_v4`) and synced via Firebase Firestore (shared document).
- **Backend**: Firebase (Firestore for real-time state, Storage for evidence/body photos, optional Cloud Functions — notifications disabled).
- **PWA**: `manifest.webmanifest` + service worker (messaging only — no push changes).
- **Security**: 6-digit PBKDF2-hashed PINs, optional voice verification, app lock, screenshot guard.
- **Capture Engine**: Live MediaRecorder for photo/video/voice with auto-countdown, surprise extensions, and strict locking.

## 3. Key Modules
- **Auth & Security**: PIN keypad, voice enrolment/verification, app lock.
- **Navigation**: Bottom nav + role-based tabs (Dashboard, Tasks, Protocols, Rewards, etc.).
- **Tasks & Evidence**: Assignment, live capture ritual, submission locking, review.
- **Punishments vs Consequences**: Separate data models and UI.
- **Body & Records**: SVG body maps, measurements, electro/breath records.
- **Journal & Responses**: Sub entries + dominant feedback.
- **Rewards & Gamification**: Stars, service ladder, badges.
- **Capture Ritual**: Pre-delay, blind mode, face detection, timer fuckery, pose instructions.

## 4. Data Model (simplified)
- `tasks`: id, title, desc, due, status, requiredEvidence[], evidenceReqs, evidence[]
- `punishments`: id, title, desc, kind (timed/task), due, status, linkedTaskId?, customNote?
- `consequences`: in-session only, under Protocols.
- `state`: currentRole, stars, tasks[], punishments[], journal[], limits, rules, bodyMaps, personalRecords, etc.

## 5. Capture Flow Architecture (New v5+)
- Pre-capture: Show requirements + pose + delay countdown.
- Capture: Locked modal, optional blind mode (fade to black), face detection with strikes.
- Timer: Base time + random extension/tease logic.
- Post-capture: Auto-submit if complete, dramatic praise/degradation message, lock.
- Dominant control: Camera facing locked, all toggles in task creation.

## 6. Security & Permissions
- Camera/Mic: Request once at startup, persist permission.
- Sub cannot change camera.
- All evidence is live-captured (no uploads).

## 7. Future Extensibility
- More ritual elements (poses, blind mode, timer fuckery).
- Harsh degradation toggles.
- Face detection with strikes.
- Punishment notes overlay.

All changes logged in CLAUDE.md. Boundaries strictly enforced.
# CLAUDE.md — The System App

**Strict Boundaries (Permanent — do not override without explicit written consent from owner)**

- **Absolutely forbidden** without explicit written consent:
  - Any changes to notifications, messaging, Firebase Cloud Messaging, push notifications, service worker (firebase-messaging-sw.js), Cloud Functions for notifications, or anything related.
  - Any changes to pull-to-refresh, home screen refresh, iOS PWA update behavior, visibilitychange update checks, or app refresh logic.

These rules are hard and permanent. Only the owner can add consent in writing (message or update to this file).

---

## Approved Change Plan (Executed June 2026)

This document logs all changes made under the approved plan.

### Step 0 — Backup & Documentation (Completed)
- Owner instructed to export full backup via in-app "Export Backup" button before any edits.
- Current state documented here.
- All future changes will be logged with date, files changed, and purpose.
- Rollback: Restore from exported JSON or previous commit.

**Current commit/SHA at start of work**: (to be noted after first edit)

---

## Changes Log

(Changes will be added here as executed — one section per step)

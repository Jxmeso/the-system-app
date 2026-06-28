# The System — Backend Deployment Guide

This app is a **static GitHub Pages PWA** with **client-side Firebase**. Everything
in `app-enhancements.js` runs in the browser. The files in this folder are the
**server-side backend** that Claude authored but **cannot deploy for you** —
deploying needs your Google account and (for Cloud Functions) billing enabled.

Apply these in order. Until you do, the app still works — PIN security, evidence
capture, etc. are client-side and already live. The backend upgrades the app from
"ritual-grade" to "actually enforced".

---

## Where we are today (no backend)

- Shared state lives in one Firestore doc: `systems/shared`, written by the client.
- There is **no Firebase Authentication**, so Firestore has no idea who James vs
  Jacob is. That's why the current rules must stay open and why a determined Jacob
  with DevTools could still poke the data. The PIN/role are enforced **only in the
  browser** right now.

## The sequence (each step is safe; do them in order)

### Step 1 — Add Firebase Authentication  *(required before anything else)*
1. Firebase Console → **Build → Authentication → Get started**.
2. Enable **Anonymous** (simplest) or **Email/Password** sign-in.
3. In `index.html`, after Firebase init, sign in anonymously on load and store the
   uid. Map James/Jacob to two known uids (or two email logins).
   > ⚠️ Do **not** publish `firestore.rules` (Step 3) until this is done, or the
   > app will lose sync (the rules require `request.auth`).

### Step 2 — Restructure data (recommended)
The whole-state-in-one-doc model can't be access-controlled per field. Split into:
- `systems/shared/tasks/{taskId}`
- `systems/shared/journal/{entryId}`
- `systems/shared/meta` (stars, settings — James-writable only)
Rules can then allow Jacob to write his own journal/evidence but not stars,
approvals, settings, or other people's records.

### Step 3 — Publish Firestore security rules
File: `firestore.rules` (in this folder). After Auth + restructure:
- Console → **Firestore → Rules** → paste → **Publish**, OR
- `firebase deploy --only firestore:rules`

### Step 4 — Cloud Functions for push-to-James  *(needs Blaze plan)*
File: `functions/index.js`. Sends an FCM push to James whenever Jacob writes a
notification doc (evidence submitted, overdue, PIN failures, etc.).
1. Firebase Console → upgrade project to **Blaze** (pay-as-you-go; free tier covers
   this tiny usage).
2. Install CLI: `npm i -g firebase-tools`
3. `firebase login` (your Google account)
4. `firebase use the-system-1936e`
5. `cd functions && npm install && cd ..`
6. `firebase deploy --only functions`

The client already writes notification docs; once the function is live they become
real push notifications on your phone. Store James's FCM token in
`systems/shared/meta.jamesToken` (the client saves it on login when notifications
are granted).

---

## Hard security rules (never break these)
- Never commit real PINs, PIN hashes for the live accounts, API keys, admin tokens,
  service-role keys, or DB credentials to this **public** repo.
- The Firebase **Web** config in `index.html` is publishable (it's a client config,
  not a secret) — security comes from **Auth + rules**, not from hiding it.
- Real PIN verification should move server-side (a callable function) once Auth is
  in. The client hash is a stopgap.

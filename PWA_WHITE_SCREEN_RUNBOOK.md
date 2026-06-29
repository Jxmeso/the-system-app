# PWA White-Screen Recovery Runbook

Use this whenever the installed iPhone/iPad home-screen app opens white, shows placeholder text, or appears unchanged after a release.

## What happened on 29 June 2026

`main` was repaired in merge commit `fc19834`, but the live GitHub Pages URL still served the previous 255-byte placeholder while the Pages deployment was in progress. The installed PWA therefore fetched invalid plain text instead of the app shell and appeared white.

After Pages completed, a direct cache-busted HTTP request returned the repaired 79 KB app while an existing service-worker-controlled browser profile still returned the placeholder. That proved a second failure layer: an older worker/cache could trap an installed client on broken HTML even after production was healthy.

The repair was announced too early: source on `main` had been verified, but the deployed URL had not. A fix is not complete until the Pages workflow has succeeded for the intended SHA **and** the public URL returns the full HTML app.

## Earlier fixes that must remain intact

These commits collectively solved the prior iOS/PWA stale-build loop:

- `499b38a`: serve navigations network-first so installed PWAs do not stay on cached HTML.
- `4d9e749`: fetch CSS and JavaScript fresh regardless of old version query strings.
- `17d21ed`: activate the new worker immediately and claim open clients.
- `d6c5e3f`: remove the service-worker client-navigation handler that could crash updates.
- `b81f0ce` and `147a5b2`: make the build gate synchronous/non-throwing and always install `window.onload`.
- `2026-06-29-white-screen-recovery-1`: retain the existing worker URL, change its bytes so installed clients discover the update, delete all legacy caches during activation, force navigation revalidation, and disable service-worker script caching during registration.

Do not “simplify” `firebase-messaging-sw.js` or the version gate without regression-testing an installed standalone PWA.

## Required release verification

1. Confirm the expected commit is on `main`:

   ```sh
   git fetch origin
   git rev-parse origin/main
   ```

2. Confirm the Pages run for that SHA completed successfully:

   ```sh
   gh run list --repo Jxmeso/the-system-app --workflow pages-build-deployment --limit 5
   ```

3. Verify the public deployment, not merely the repository:

   ```sh
   ./scripts/verify-pages.sh
   ```

4. Open `https://jxmeso.github.io/the-system-app/` in a normal browser and confirm the login UI renders without console errors.
5. Open the installed home-screen app while online. Confirm the same release loads.

Never report the white screen fixed before steps 2–5 pass.

## Diagnosis order

### 1. Public URL serves placeholder or non-HTML content

Compare the live response with `origin/main:index.html`. If Pages is building, wait for it. If the run fails, inspect that Pages run. Do not keep making “trigger deployment” commits; they cancel or queue builds and prolong stale production.

### 2. Browser works but installed PWA is stale

- Confirm `firebase-messaging-sw.js` still uses network-first navigation with `{ cache: 'no-store' }`.
- Confirm it calls `skipWaiting()` and `clients.claim()`.
- Confirm activation deletes legacy Cache Storage entries.
- Confirm JavaScript/CSS requests bypass stale query-string caches.
- Confirm every app load registers the worker with `updateViaCache: 'none'` and requests `registration.update()`; this must not depend on the user enabling push notifications.
- Fully close and reopen the installed app while online.
- If iOS still retains a corrupt installation after a successful live verification, remove the home-screen app, visit the verified public URL in Safari, and add it to the home screen again. This is the last resort, not the first step.

### 3. HTML loads but remains visually white

Check the browser console for a JavaScript parse/runtime error. Historically, redeclaring the shared `state` binding killed the entire overlay. Run:

```sh
node --check app-enhancements.js
```

Then verify that `window.onload = enhancedInitialize` is still reached even when the version check fails.

## Rollback

If a new release breaks the installed PWA:

1. Branch from the last verified deployed SHA.
2. Restore only the known-damaged files.
3. Push through a reviewed PR.
4. Wait for the Pages run for the merge SHA.
5. Run `./scripts/verify-pages.sh` and test the installed app.

The last intact runtime baseline before the 29 June overwrite incident is `d9aec2b`.

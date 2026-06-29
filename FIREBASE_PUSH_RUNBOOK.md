# Firebase, Push, and Memories Recovery

## 29 June 2026 incident

The Phase 8 runtime restore brought back a client that enrolled only Firebase Messaging tokens. Earlier native Web Push enrollment had been implemented in commit `528149f`, and the deployed Cloud Function still expected both `pushTokens` and `pushSubscriptions`. Installed iOS PWAs therefore lost their reliable push-enrollment path even though existing subscriptions remained in Firestore.

The Memories picker also read only `state.evidence`. The Evidence Bank had already learned to recover media stored directly on completed tasks, but Memories did not use that same combined source and could appear empty.

## Permanent rules

- iOS installed-app push uses the native `PushManager` subscription and the direct VAPID public key.
- Firebase Messaging tokens are a secondary channel, not the sole iOS path.
- Register/update the service worker on every load, independent of notification permission.
- Store subscriptions with a Firestore merge write so unrelated shared-state fields are not replaced.
- Memories and Evidence Bank must share the same evidence aggregation function.
- Firebase snapshot errors must set a visible status and retry; do not leave sync silently dead.

## Diagnosis

1. In Settings, inspect **Firebase & Notifications**.
2. If sync is not connected, use **Reconnect sync** and inspect the displayed error.
3. Use **Enable notifications** from the installed home-screen app, then **Test notification**.
4. Confirm `systems/shared` contains a `pushSubscriptions` entry for the current role.
5. Confirm the deployed `notifyTaskChanges` Cloud Function and `WEB_PUSH_PRIVATE_KEY` secret exist. Client changes cannot repair an undeployed/misconfigured backend.
6. For missing Memories, confirm evidence exists either in `state.evidence` or a completed task’s `evidence`; both must appear in the picker.

## Verification after deployment

- Firestore shared document responds and remains below its 1 MiB limit.
- Every referenced Firebase Storage media URL returns HTTP 200.
- Settings shows connected sync.
- A newly enrolled device receives the “Background alerts enabled” notification.
- **Test notification** works while the app is closed.
- A completed task containing media appears in **Send a Memory**, even if no legacy top-level evidence record exists.

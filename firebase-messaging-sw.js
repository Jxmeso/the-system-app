/*
 * Increment this marker whenever the recovery/update behaviour changes.
 * Keeping the same worker URL lets already-installed iOS PWAs discover the fix.
 */
const SYSTEM_WORKER_VERSION = '2026-06-29-white-screen-recovery-1';

self.skipWaiting();
self.addEventListener('activate', event => event.waitUntil((async () => {
  /* Old releases cached broken HTML. Never allow those caches to keep control. */
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
  await self.clients.claim();
})()));

/* Serve HTML and our JS/CSS fresh — bypass iOS PWA cache */
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'reload' })
        .catch(() => new Response(
          '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>The System — Offline</title></head><body style="margin:0;background:#0f0f0f;color:#f5f1e8;font-family:system-ui;display:grid;min-height:100vh;place-items:center;text-align:center"><main><h1>The System is offline</h1><p>Reconnect, then reopen the app.</p><button onclick="location.reload()">Try again</button></main></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
        ))
    );
    return;
  }
  if (url.includes('enhancements.css') || url.includes('app-enhancements.js')) {
    event.respondWith(
      fetch(url.split('?')[0], { cache: 'reload' })
        .catch(() => fetch(event.request))
    );
    return;
  }
});

self.addEventListener('push', event => {
  let payload={};
  try{payload=event.data?.json()||{};}catch(_){payload={body:event.data?.text()};}
  event.waitUntil((async()=>{
    let displayed=false;
    try{await self.registration.showNotification(payload.title||'The System',{body:payload.body||'There is a new update waiting for you.',data:{url:payload.url||'/the-system-app/'},tag:payload.tag||'the-system-update',renotify:true});displayed=true;}catch(error){console.error('Notification display failed',error);}
    try{await fetch('https://firestore.googleapis.com/v1/projects/the-system-1936e/databases/(default)/documents/systems/shared?updateMask.fieldPaths=lastPushReceipt&key=AIzaSyBkSgjRjcJknJNczzWGrlUmYI_LxHEsszE',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:{lastPushReceipt:{mapValue:{fields:{receivedAt:{timestampValue:new Date().toISOString()},tag:{stringValue:payload.tag||'unknown'},displayed:{booleanValue:displayed}}}}}})});}catch(error){console.error('Push receipt failed',error);}
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/the-system-app/', self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      const existing = windows.find(client => client.url.startsWith(self.location.origin));
      return existing ? existing.focus().then(() => existing.navigate(target)) : clients.openWindow(target);
    })
  );
});

self.skipWaiting();

/* On activate: claim all clients then force-navigate each one through this SW
   so the fetch handler below serves fresh HTML immediately */
self.addEventListener('activate', event => event.waitUntil(
  self.clients.claim().then(() =>
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(cs => Promise.all(cs.map(c => c.navigate(c.url))))
  )
));

/* Serve HTML, CSS and JS fresh from network every time — no cache */
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }
  if (url.includes('enhancements.css') || url.includes('app-enhancements.js')) {
    event.respondWith(fetch(url.split('?')[0], { cache: 'no-store' }));
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

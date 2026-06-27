self.skipWaiting();
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

/* Always fetch the HTML page fresh — bypasses iOS PWA cache on every load */
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
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

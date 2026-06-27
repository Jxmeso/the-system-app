self.addEventListener('push', event => {
  let payload={};
  try{payload=event.data?.json()||{};}catch(_){payload={body:event.data?.text()};}
  event.waitUntil(self.registration.showNotification(payload.title||'The System',{
    body:payload.body||'There is a new update waiting for you.',
    data:{url:payload.url||'/the-system-app/'},
    tag:payload.tag||'the-system-update',
    renotify:true
  }));
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

importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBkSgjRjcJknJNczzWGrlUmYI_LxHEsszE',
  authDomain: 'the-system-1936e.firebaseapp.com',
  projectId: 'the-system-1936e',
  storageBucket: 'the-system-1936e.firebasestorage.app',
  messagingSenderId: '59469960135',
  appId: '1:59469960135:web:8d50dea4013ac82592bfe2'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.data?.title || 'The System', {
    body: payload.data?.body || 'There is a new update waiting for you.',
    data: { url: payload.data?.url || '/the-system-app/' },
    tag: payload.data?.tag || 'the-system-update'
  });
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

/* eslint-env serviceworker, webworker */
/* global importScripts, firebase */

// ─── My Destination (Wedding Module) Firebase Service Worker ─────────────────
// This service worker handles BACKGROUND push notifications for the wedding module.
// It uses the My Destination Firebase project (different from the Taxi module).

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// My Destination Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyCjBcdTB34S14onH5O1eTGDVTnZy66t2hg",
  authDomain: "my-destination-45c93.firebaseapp.com",
  projectId: "my-destination-45c93",
  storageBucket: "my-destination-45c93.firebasestorage.app",
  messagingSenderId: "562528454949",
  appId: "1:562528454949:web:677d7d89ce25f2b43c72cc",
  measurementId: "G-V177CPJDWZ"
});

const messaging = firebase.messaging();

/**
 * BACKGROUND MESSAGES — fires when the browser tab is closed/hidden.
 * Uses 'tag' for OS-level deduplication to prevent double notifications.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[WeddingSW] Background message received:', payload);

  const title = payload.notification?.title || 'My Destination';
  const body = payload.notification?.body || '';
  const data = payload.data || {};

  // Use notificationId as dedup tag to prevent OS from showing same notification twice
  const tag = data.notificationId || data.tag || `wedding-${Date.now()}`;

  const options = {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag,
    renotify: false,      // Don't re-vibrate if same tag already shown
    requireInteraction: false,
    silent: false,
    data: {
      url: data.url || '/wedding',
      ...data
    }
  };

  return self.registration.showNotification(title, options);
});

/**
 * NOTIFICATION CLICK — when user taps a background notification, open/focus the app.
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[WeddingSW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/wedding';
  const absoluteUrl = urlToOpen.startsWith('http')
    ? urlToOpen
    : (self.location.origin + urlToOpen);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if already open on that URL
      for (const client of clientList) {
        if (client.url === absoluteUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Focus any existing tab on origin and navigate it
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          client.navigate(absoluteUrl);
          return client.focus();
        }
      }
      // Open new tab as last resort
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
    })
  );
});

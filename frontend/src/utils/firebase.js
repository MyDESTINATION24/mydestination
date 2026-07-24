import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { isWebView } from './deviceDetect';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvZuIOlJce5MFqM7UdaPnMxnHggOVwUnA",
  authDomain: "rukkooin-39480.firebaseapp.com",
  projectId: "rukkooin-39480",
  storageBucket: "rukkooin-39480.firebasestorage.app",
  messagingSenderId: "463389493822",
  appId: "1:463389493822:web:79fa9aabcb1d88f6965f6f"
};

const VAPID_KEY = "BOF0yWdjH2UD1rGca-rOpwA2zrKW0Xy3ZmPmwH8KFTJcbXNJ5AHE8v4rM_xXUqW0fvd3SaZl_Qbnuazzc6lFdRM";

const app = initializeApp(firebaseConfig);

let messaging = null;

const FCM_INDEXED_DB_NAMES = [
  'firebase-messaging-database',
  'fcm_token_details_db',
];

const isIndexedDbVersionError = (error) =>
  error?.name === 'VersionError' ||
  String(error?.message || '').includes('The requested version');

const deleteIndexedDb = (name) =>
  new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }

    try {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    } catch {
      resolve();
    }
  });

const getMessagingServiceWorkerPath = () => {
  if (typeof window === 'undefined') {
    return '/firebase-messaging-sw.js';
  }

  return window.location.pathname.startsWith('/taxi')
    ? '/taxi/firebase-messaging-sw.js'
    : '/firebase-messaging-sw.js';
};

const registerMessagingServiceWorker = async () => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  const serviceWorkerPath = getMessagingServiceWorkerPath();
  const scope = serviceWorkerPath.startsWith('/taxi/') ? '/taxi/' : '/';

  return navigator.serviceWorker.register(serviceWorkerPath, { scope });
};

const resetFcmBrowserState = async () => {
  await Promise.all(FCM_INDEXED_DB_NAMES.map(deleteIndexedDb));

  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations
        .filter((registration) =>
          String(registration?.active?.scriptURL || registration?.waiting?.scriptURL || registration?.installing?.scriptURL || '')
            .includes('firebase-messaging-sw.js')
        )
        .map((registration) => registration.unregister())
    );
  } catch {
    // Best-effort cleanup only.
  }
};

const getMessagingInstance = () => {
  // Firebase Web Messaging requires serviceWorker support.
  // Flutter WebViews do NOT support service workers, so skip in that context.
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !isWebView()) {
    if (!messaging) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.error('[Firebase] Failed to initialize Firebase Messaging:', error);
      }
    }
    return messaging;
  }
  return null;
};

/**
 * Request notification permission and get the web FCM token.
 * ONLY works in a real browser — NOT in Flutter WebView (WebViews don't support
 * the Push API / service workers needed for web push).
 *
 * For Flutter WebView users, FCM tokens are registered directly by the Flutter
 * native code hitting /api/users/fcm-token or /api/partners/fcm-token with platform='app'.
 */
export const requestNotificationPermission = async () => {
  try {
    // Skip completely if running inside a Flutter WebView
    if (isWebView()) {
      console.log('[FCM] Running in Flutter WebView — skipping web push registration (handled natively by Flutter).');
      return null;
    }

    if (!('Notification' in window)) {
      console.warn('[FCM] This browser does not support notifications.');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied.');
      return null;
    }

    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) {
      console.warn('[FCM] Could not get messaging instance (possibly in WebView or incompatible browser).');
      return null;
    }

    try {
      const serviceWorkerRegistration = await registerMessagingServiceWorker();
      const token = await getToken(messagingInstance, {
        vapidKey: VAPID_KEY,
        ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
      });
      if (token) {
        console.log('[FCM] Web push token obtained.');
        return token;
      } else {
        console.warn('[FCM] No FCM token received — service worker may not be registered.');
        return null;
      }
    } catch (error) {
      if (isIndexedDbVersionError(error)) {
        console.warn('[FCM] Messaging cache version mismatch detected. Resetting browser FCM state and retrying once.');
        await resetFcmBrowserState();

        try {
          const retryServiceWorkerRegistration = await registerMessagingServiceWorker();
          const retryToken = await getToken(messagingInstance, {
            vapidKey: VAPID_KEY,
            ...(retryServiceWorkerRegistration ? { serviceWorkerRegistration: retryServiceWorkerRegistration } : {}),
          });
          if (retryToken) {
            console.log('[FCM] Web push token obtained after FCM cache reset.');
            return retryToken;
          }
        } catch (retryError) {
          console.error('[FCM] Error getting FCM token after cache reset:', retryError);
          return null;
        }
      }

      console.error('[FCM] Error getting FCM token:', error);
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error requesting permission:', error);
    return null;
  }
};

/**
 * Listen for foreground messages (browser tab is open and in focus).
 * Only active in real browser — not in Flutter WebView.
 * In Flutter WebView, the native Flutter code handles FCM messages.
 */
export const onMessageListener = (callback) => {
  // Skip in WebView — Flutter native handles foreground messages there
  if (isWebView()) return;

  const messagingInstance = getMessagingInstance();
  if (messagingInstance) {
    onMessage(messagingInstance, (payload) => {
      if (callback) callback(payload);
    });
  }
};

export default app;

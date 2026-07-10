/**
 * Wedding Module FCM Registration
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles push notification permission and FCM token registration for:
 *  - Wedding Users (role: 'user')
 *  - Wedding Vendors (role: 'vendor')
 *
 * Uses My Destination Firebase project (separate from Taxi module).
 * VAPID Key: BLlSpfs_lQPpBRv4bRBE901WirEQ2NCdlyAxhiTQmomjULeC-kaObfYGUVC_-ijbZ6jAlBCS42NyChUG3PK94OU
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { API_BASE_URL } from '../../shared/api/runtimeConfig';

// ─── My Destination Firebase Config ──────────────────────────────────────────
const WEDDING_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCjBcdTB34S14onH5O1eTGDVTnZy66t2hg",
  authDomain: "my-destination-45c93.firebaseapp.com",
  projectId: "my-destination-45c93",
  storageBucket: "my-destination-45c93.firebasestorage.app",
  messagingSenderId: "562528454949",
  appId: "1:562528454949:web:677d7d89ce25f2b43c72cc",
  measurementId: "G-V177CPJDWZ"
};

const WEDDING_VAPID_KEY = "BLlSpfs_lQPpBRv4bRBE901WirEQ2NCdlyAxhiTQmomjULeC-kaObfYGUVC_-ijbZ6jAlBCS42NyChUG3PK94OU";

// ─── Config ───────────────────────────────────────────────────────────────────
const LAST_WEDDING_FCM_KEY = 'lastWeddingFcmRegistration';
const WEDDING_API_BASE = API_BASE_URL;
const WEDDING_FCM_ENDPOINT = `${WEDDING_API_BASE}/users/fcm-token`;

// ─── Firebase App (named 'wedding' to avoid conflict with Taxi app) ───────────
let weddingFirebaseApp = null;
let weddingMessaging = null;

const getWeddingFirebaseApp = () => {
  if (weddingFirebaseApp) return weddingFirebaseApp;

  // Check if 'wedding' named app already initialized
  const existing = getApps().find(app => app.name === 'wedding');
  if (existing) {
    weddingFirebaseApp = existing;
    return weddingFirebaseApp;
  }

  weddingFirebaseApp = initializeApp(WEDDING_FIREBASE_CONFIG, 'wedding');
  return weddingFirebaseApp;
};

const getWeddingMessaging = async () => {
  if (weddingMessaging) return weddingMessaging;

  // Firebase Messaging requires service worker support
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const app = getWeddingFirebaseApp();
  weddingMessaging = getMessaging(app);
  return weddingMessaging;
};

// ─── Auth Token Helpers ───────────────────────────────────────────────────────
const getWeddingAuthToken = () => {
  // Wedding users/vendors store token in localStorage as 'token' or 'vendorToken'
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('vendorToken') ||
    localStorage.getItem('weddingToken') ||
    null
  );
};

const getStoredFcmRegistration = () => {
  try {
    return JSON.parse(localStorage.getItem(LAST_WEDDING_FCM_KEY) || 'null');
  } catch {
    return null;
  }
};

const persistFcmRegistration = (token) => {
  localStorage.setItem(LAST_WEDDING_FCM_KEY, JSON.stringify({
    token,
    updatedAt: new Date().toISOString()
  }));
};

// ─── Save FCM token to backend ────────────────────────────────────────────────
const saveTokenToBackend = async (token, platform = 'web') => {
  const authToken = getWeddingAuthToken();
  if (!authToken) {
    console.log('[WeddingFCM] No auth token — skipping backend save.');
    return false;
  }

  // Choose the endpoint based on whether they are logged in as a vendor
  const isVendor = !!localStorage.getItem('vendorToken');
  const endpoint = isVendor 
    ? `${WEDDING_API_BASE}/vendor/fcm-token` 
    : `${WEDDING_API_BASE}/users/fcm-token`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ fcmToken: token, platform })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('[WeddingFCM] Backend save failed:', err.message);
      return false;
    }

    console.log(`[WeddingFCM] ✓ FCM token saved to backend via ${endpoint}.`);

    return true;
  } catch (error) {
    console.error('[WeddingFCM] Backend save error:', error.message);
    return false;
  }
};

// ─── Main Registration Function ───────────────────────────────────────────────
/**
 * Register browser FCM token for the currently logged-in wedding user/vendor.
 *
 * @param {boolean} interactive - If true, explicitly requests notification permission.
 *                                Set to true when user clicks "Enable Notifications".
 *                                Set to false for silent background registration.
 */
export const registerWeddingFcmToken = async ({ interactive = false } = {}) => {
  try {
    // Need service worker support
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return { ok: false, reason: 'sw-unsupported' };
    }

    // Need to be logged in
    const authToken = getWeddingAuthToken();
    if (!authToken) {
      return { ok: false, reason: 'not-authenticated' };
    }

    // Check messaging support
    const messaging = await getWeddingMessaging();
    if (!messaging) {
      return { ok: false, reason: 'messaging-unsupported' };
    }

    // Handle notification permission
    if (Notification.permission === 'denied') {
      return { ok: false, reason: 'permission-denied' };
    }

    if (Notification.permission !== 'granted') {
      if (!interactive) {
        return { ok: false, reason: 'permission-not-granted' };
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { ok: false, reason: 'permission-denied-by-user' };
      }
    }

    // Register the Wedding service worker
    const swRegistration = await navigator.serviceWorker.register(
      '/wedding-messaging-sw.js'
    ).catch((err) => {
      console.error('[WeddingFCM] SW registration failed:', err.message);
      return null;
    });

    if (!swRegistration) {
      return { ok: false, reason: 'sw-registration-failed' };
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: WEDDING_VAPID_KEY,
      serviceWorkerRegistration: swRegistration
    });

    if (!token) {
      return { ok: false, reason: 'no-token-received' };
    }

    // Skip if same token already registered
    const stored = getStoredFcmRegistration();
    if (stored?.token === token) {
      console.log('[WeddingFCM] Token unchanged — skipping backend save.');
      return { ok: true, token, skipped: true };
    }

    // Save to backend
    const saved = await saveTokenToBackend(token, 'web');
    if (saved) {
      persistFcmRegistration(token);
    }

    return { ok: true, token };
  } catch (error) {
    console.error('[WeddingFCM] Registration error:', error.message);
    return { ok: false, reason: error.message };
  }
};

// ─── Foreground Message Listener ─────────────────────────────────────────────
/**
 * Listen for push messages while the app is open/focused.
 * Call this once in your app root or layout component.
 *
 * @param {Function} callback - Called with the notification payload
 */
export const onWeddingMessage = async (callback) => {
  const messaging = await getWeddingMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('[WeddingFCM] Foreground message:', payload);
    if (callback) callback(payload);
  });
};

// ─── Auto-registration on page load ──────────────────────────────────────────
/**
 * Install the wedding FCM auto-registration system.
 * Call this once in your main App entry (App.jsx or WeddingApp entry).
 * It retries silently on focus/pageshow events.
 */
export const installWeddingFcmRegistration = () => {
  // Expose global function for future manual calls
  window.__registerWeddingFcmToken = (options) => registerWeddingFcmToken(options);

  const retryPassive = () => {
    registerWeddingFcmToken({ interactive: false }).catch(() => {});
  };

  // Retry on window focus (token may have expired or user just logged in)
  window.addEventListener('focus', retryPassive);
  window.addEventListener('pageshow', retryPassive);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') retryPassive();
  });

  // Initial attempt after 2 seconds (give page time to fully load + auth)
  window.setTimeout(retryPassive, 2000);
};

import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Notification from '../modules/user/models/Notification.js';
import User from '../modules/user/models/User.js';
import Admin from '../modules/admin/models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Wedding Firebase Admin (separate from Taxi Firebase) ─────────────────────
// My Destination project uses a different Firebase project than the Taxi module.
// We initialize a NAMED app 'wedding' so both projects can coexist in the same process.

let weddingFirebaseApp = null;

const initializeWeddingFirebase = () => {
  try {
    // Check if already initialized
    const existing = admin.apps.find(app => app?.name === 'wedding');
    if (existing) {
      weddingFirebaseApp = existing;
      return weddingFirebaseApp;
    }

    let serviceAccount;

    // Priority 1: firebasekey.json in backend root (user provided)
    const keyFilePath = path.join(__dirname, '../firebasekey.json');
    if (fs.existsSync(keyFilePath)) {
      serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
    } else {
      // Priority 2: Environment variables (WEDDING_ prefix to avoid clash with Taxi)
      const privateKey = process.env.WEDDING_FIREBASE_PRIVATE_KEY || process.env.MY_DEST_FIREBASE_PRIVATE_KEY;
      if (privateKey) {
        serviceAccount = {
          project_id: process.env.WEDDING_FIREBASE_PROJECT_ID || 'my-destination-45c93',
          client_email: process.env.WEDDING_FIREBASE_CLIENT_EMAIL,
          private_key: privateKey.replace(/\\n/g, '\n')
        };
      } else {
        throw new Error('[WeddingFCM] Firebase credentials missing. Add firebasekey.json to backend root.');
      }
    }

    weddingFirebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key
      })
    }, 'wedding'); // Named app — avoids conflict with Taxi Firebase app

    console.log('✓ [WeddingFCM] Firebase Admin initialized for project:', serviceAccount.project_id);
    return weddingFirebaseApp;
  } catch (error) {
    console.error('[WeddingFCM] Firebase initialization error:', error.message);
    return null;
  }
};

const getWeddingFirebaseApp = () => {
  if (!weddingFirebaseApp) {
    initializeWeddingFirebase();
  }
  return weddingFirebaseApp;
};

// ─── Helper: Collect FCM tokens from a user ────────────────────────────────────
const getUserFcmTokens = (user) => {
  if (!user?.fcmTokens) return [];
  const tokens = new Set();
  if (user.fcmTokens.app) tokens.add(user.fcmTokens.app);
  if (user.fcmTokens.web) tokens.add(user.fcmTokens.web);
  return Array.from(tokens);
};

// ─── Helper: Cleanup invalid/expired FCM token ─────────────────────────────────
const cleanupInvalidToken = async (userId, userType, token) => {
  try {
    const Model = userType === 'admin' ? Admin : User;
    const user = await Model.findById(userId);
    if (!user?.fcmTokens) return;

    let changed = false;
    if (user.fcmTokens.app === token) { user.fcmTokens.app = null; changed = true; }
    if (user.fcmTokens.web === token) { user.fcmTokens.web = null; changed = true; }
    if (changed) await user.save();
    console.log(`[WeddingFCM] Pruned invalid ${userType} token.`);
  } catch (e) {
    console.error('[WeddingFCM] Token cleanup error:', e.message);
  }
};

// ─── Core: Send to a single FCM token ─────────────────────────────────────────
const sendToToken = async (fcmToken, notification, data = {}, cleanupMeta = null) => {
  try {
    const firebaseApp = getWeddingFirebaseApp();
    if (!firebaseApp) {
      console.warn('[WeddingFCM] Firebase app not initialized — skipping push.');
      return { success: false, error: 'Firebase not initialized' };
    }

    // Stringify all data values (FCM requirement)
    const stringifiedData = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        stringifiedData[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }
    if (cleanupMeta?.notificationId) {
      stringifiedData.notificationId = String(cleanupMeta.notificationId);
    }

    const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fallbackLink = (data.url && data.url.startsWith('http'))
      ? data.url
      : `${appUrl}${data.url || '/wedding'}`;

    const message = {
      token: fcmToken,
      notification: {
        title: notification.title || 'My Destination',
        body: notification.body || 'New Notification',
      },
      data: {
        ...stringifiedData,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: { clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
      webpush: {
        notification: {
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        },
        fcmOptions: { link: fallbackLink },
      },
    };

    const messaging = admin.messaging(firebaseApp);
    const response = await messaging.send(message);
    return { success: true, messageId: response };
  } catch (error) {
    const isInvalidToken =
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered' ||
      error.message?.includes('NotRegistered');

    if (isInvalidToken && cleanupMeta?.userId) {
      cleanupInvalidToken(cleanupMeta.userId, cleanupMeta.userType || 'user', fcmToken)
        .catch(() => {});
    }

    console.error('[WeddingFCM] sendToToken error:', error.message);
    return { success: false, error: error.message, code: error.code };
  }
};

// ─── Save notification record to DB ───────────────────────────────────────────
const saveNotificationToDB = async ({ userId, userType, title, body, data, type }) => {
  try {
    const userModelMap = { admin: 'Admin', user: 'User', vendor: 'User' };

    // Vendor bhi User model use karta hai (role: 'vendor')
    const dbUserType = userType === 'vendor' ? 'user' : userType;

    // Dedup check: same notification 2 seconds ke andar dobara mat bhejo
    if (type !== 'broadcast') {
      const recentMatch = await Notification.findOne({
        userId,
        title,
        body,
        type,
        createdAt: { $gte: new Date(Date.now() - 2000) }
      });
      if (recentMatch) {
        console.log('[WeddingFCM] Skipping duplicate notification (2s dedup).');
        return recentMatch;
      }
    }

    const saved = await Notification.create({
      userId,
      userType: dbUserType,
      userModel: userModelMap[userType] || 'User',
      title,
      body,
      data: data || {},
      type: type || 'general'
    });
    return saved;
  } catch (error) {
    console.error('[WeddingFCM] DB save error:', error.message);
    return null;
  }
};

// ─── Main: Send notification to a specific user (by userId) ───────────────────
/**
 * @param {string} userId       - MongoDB _id of the recipient
 * @param {'user'|'vendor'|'admin'} userType - role type
 * @param {{title: string, body: string}} notification
 * @param {Object} data         - extra payload (url, type, enquiryId, etc.)
 */
export const sendWeddingNotification = async (userId, userType = 'user', notification, data = {}) => {
  try {
    if (!userId) return { success: false, error: 'No userId provided' };

    const Model = userType === 'admin' ? Admin : User;
    const user = await Model.findById(userId);

    if (!user) {
      console.warn(`[WeddingFCM] ${userType} not found:`, userId);
      return { success: false, error: 'User not found' };
    }

    // 1. Save to DB
    const saved = await saveNotificationToDB({
      userId: user._id,
      userType,
      title: notification.title,
      body: notification.body,
      data,
      type: data.type || 'general'
    });

    // 2. Get FCM tokens
    const tokens = getUserFcmTokens(user);
    if (tokens.length === 0) {
      console.log(`[WeddingFCM] No FCM tokens for ${userType} ${userId} — DB notification saved only.`);
      return { success: false, error: 'No FCM tokens', notificationId: saved?._id };
    }

    // 3. Send to all tokens
    let successCount = 0;
    let lastResult = null;
    for (const token of tokens) {
      const result = await sendToToken(token, notification, data, {
        userId,
        userType,
        notificationId: saved?._id
      });
      if (result.success) { successCount++; lastResult = result; }
    }

    // 4. Update DB record with FCM message ID
    if (saved && lastResult?.messageId) {
      saved.fcmMessageId = lastResult.messageId;
      await saved.save().catch(() => {});
    }

    console.log(`[WeddingFCM] ✓ Sent to ${userType} ${userId}: ${successCount}/${tokens.length} tokens succeeded.`);
    return { success: successCount > 0, successCount, notificationId: saved?._id };
  } catch (error) {
    console.error('[WeddingFCM] sendWeddingNotification error:', error);
    return { success: false, error: error.message };
  }
};

// ─── Send to ALL active admins ─────────────────────────────────────────────────
export const sendWeddingNotificationToAdmins = async (notification, data = {}) => {
  try {
    const admins = await Admin.find({ isActive: true });
    if (admins.length === 0) {
      console.warn('[WeddingFCM] No active admins found.');
      return;
    }
    await Promise.allSettled(
      admins.map(a => sendWeddingNotification(a._id, 'admin', notification, data))
    );
    console.log(`[WeddingFCM] ✓ Notified ${admins.length} admin(s).`);
  } catch (error) {
    console.error('[WeddingFCM] sendToAdmins error:', error);
  }
};

// Initialize on module load
initializeWeddingFirebase();

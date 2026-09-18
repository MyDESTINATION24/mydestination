import crypto from 'crypto';
import { resolveConfiguredGatewayCredentials } from '../modules/taxi/services/paymentGatewayService.js';

/**
 * One PhonePe Standard Checkout (v2) connector for every app.
 *
 * Credentials come from Admin -> Payment Gateways -> PhonePe, where:
 *   "Merchant ID" = Client ID, "Salt Key" = Client Secret, "Salt Index" = Client Version
 * (the labels predate PhonePe's v2 keys). That lets the live keys be managed
 * from the admin panel instead of the server .env. When PhonePe is not enabled
 * there, the WH_PHONEPE_* environment keys are used as before.
 *
 * Previously the hotel/wedding apps used sandbox keys from .env while the taxi
 * app called the retired v1 salt-key API, which PhonePe rejects for v2
 * ("SU...") merchants with "Key not found for the merchant" / 404.
 */

const HOSTS = {
  production: {
    oauth: 'https://api.phonepe.com/apis/identity-manager/v1/oauth/token',
    pg: 'https://api.phonepe.com/apis/pg',
  },
  sandbox: {
    oauth: 'https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token',
    pg: 'https://api-preprod.phonepe.com/apis/pg-sandbox',
  },
};

class PhonePeError extends Error {
  constructor(message, statusCode = 502, code = '') {
    super(message);
    this.name = 'PhonePeError';
    this.statusCode = statusCode;
    this.httpStatusCode = statusCode;
    this.code = code;
  }
}

const clean = (value) => String(value ?? '').trim();

export const resolvePhonePeConfig = async () => {
  try {
    const creds = await resolveConfiguredGatewayCredentials('phone_pay');
    const clientId = clean(creds.merchantId);
    const clientSecret = clean(creds.saltKey);
    if (clientId && clientSecret) {
      const env = clean(creds.environment).toLowerCase();
      return {
        source: 'admin',
        clientId,
        clientSecret,
        clientVersion: clean(creds.saltIndex) || '1',
        environment: ['production', 'live', 'prod'].includes(env) ? 'production' : 'sandbox',
      };
    }
  } catch {
    // PhonePe disabled or not configured in admin: fall back to .env below.
  }

  const clientId = clean(process.env.WH_PHONEPE_CLIENT_ID);
  const clientSecret = clean(process.env.WH_PHONEPE_CLIENT_SECRET);
  if (!clientId || !clientSecret) {
    throw new PhonePeError('PhonePe is not configured. Add the keys in Admin > Payment Gateways.', 503);
  }
  return {
    source: 'env',
    clientId,
    clientSecret,
    clientVersion: clean(process.env.WH_PHONEPE_CLIENT_VERSION) || '1',
    environment: clean(process.env.WH_PHONEPE_ENV).toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox',
  };
};

const tokenCache = new Map();

const getAccessToken = async (config) => {
  const cacheKey = `${config.environment}:${config.clientId}:${crypto.createHash('sha256').update(config.clientSecret).digest('hex')}`;
  const cached = tokenCache.get(cacheKey);
  const nowSec = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 120 > nowSec) return cached.header;

  const response = await fetch(HOSTS[config.environment].oauth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      client_version: config.clientVersion,
      grant_type: 'client_credentials',
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) {
    const code = body.code || body.errorCode || '';
    throw new PhonePeError(
      code === 'CLIENT_NOT_FOUND'
        ? `PhonePe rejected the ${config.environment} keys (CLIENT_NOT_FOUND). Check the Client ID/Secret and the Environment setting.`
        : `PhonePe authorisation failed${code ? ` (${code})` : ''}`,
      502,
      code,
    );
  }
  const header = `${body.token_type || 'O-Bearer'} ${body.access_token}`;
  tokenCache.set(cacheKey, { header, expiresAt: Number(body.expires_at) || nowSec + 600 });
  return header;
};

const pgRequest = async (config, method, path, payload) => {
  const auth = await getAccessToken(config);
  const response = await fetch(`${HOSTS[config.environment].pg}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PhonePeError(body.message || body.code || `PhonePe request failed (${response.status})`, response.status || 502, body.code || '');
  }
  return body;
};

/** Create a checkout. Returns { orderId, state, redirectUrl, expireAt }. */
export const createPhonePeCheckout = async ({ merchantOrderId, amountPaise, redirectUrl }) => {
  const amount = Math.round(Number(amountPaise));
  if (!merchantOrderId || !(amount >= 100)) {
    throw new PhonePeError('Invalid PhonePe order (minimum amount is Rs 1)', 400);
  }
  const config = await resolvePhonePeConfig();
  return pgRequest(config, 'POST', '/checkout/v2/pay', {
    merchantOrderId: String(merchantOrderId),
    amount,
    paymentFlow: { type: 'PG_CHECKOUT', merchantUrls: { redirectUrl } },
  });
};

/** Order status. Returns { orderId, state: PENDING|COMPLETED|FAILED, amount (paise), paymentDetails[] }. */
export const getPhonePeOrderStatus = async (merchantOrderId) => {
  const config = await resolvePhonePeConfig();
  return pgRequest(config, 'GET', `/checkout/v2/order/${encodeURIComponent(merchantOrderId)}/status`);
};

/**
 * Webhook authentication: PhonePe sends Authorization = sha256("username:password")
 * for the username/password set on the webhook in the PhonePe dashboard.
 */
export const verifyPhonePeWebhook = (authorizationHeader) => {
  const username = clean(process.env.PHONEPE_WEBHOOK_USERNAME || process.env.WH_PHONEPE_WEBHOOK_USERNAME);
  const password = clean(process.env.PHONEPE_WEBHOOK_PASSWORD || process.env.WH_PHONEPE_WEBHOOK_PASSWORD);
  if (!username || !password) return { configured: false, valid: false };
  const expected = crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');
  const received = clean(authorizationHeader).replace(/^SHA256\s+/i, '').toLowerCase();
  const valid = received.length === expected.length
    && crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
  return { configured: true, valid };
};

/**
 * Drop-in stand-in for the SDK's StandardCheckoutClient as the hotel and
 * wedding code uses it: pay(request), getOrderStatus(id), validateCallback().
 */
export const phonepeCheckoutClient = {
  async pay(request) {
    const redirectUrl = request?.paymentFlow?.merchantUrls?.redirectUrl || request?.redirectUrl;
    return createPhonePeCheckout({ merchantOrderId: request?.merchantOrderId, amountPaise: request?.amount, redirectUrl });
  },
  async getOrderStatus(merchantOrderId) {
    return getPhonePeOrderStatus(merchantOrderId);
  },
  validateCallback(username, password, authorization, responseBody) {
    const expected = crypto.createHash('sha256').update(`${username}:${password}`).digest('hex');
    if (clean(authorization).toLowerCase() !== expected) {
      throw new PhonePeError('Invalid Callback', 417);
    }
    return typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
  },
};

/**
 * v1-shaped responses for the taxi controllers, which were written against
 * /pg/v1/pay and /pg/v1/status. Keeps their verification logic unchanged.
 */
export const phonePeV1Compat = async ({ method, path, body }) => {
  const upper = String(method || 'GET').toUpperCase();
  if (upper === 'POST' && path === '/pg/v1/pay') {
    const result = await createPhonePeCheckout({
      merchantOrderId: body?.merchantTransactionId,
      amountPaise: body?.amount,
      redirectUrl: body?.redirectUrl,
    });
    return {
      success: true,
      code: 'PAYMENT_INITIATED',
      data: {
        merchantTransactionId: body?.merchantTransactionId,
        instrumentResponse: { type: 'PAY_PAGE', redirectInfo: { url: result.redirectUrl, method: 'GET' } },
      },
    };
  }

  const statusMatch = path.match(/^\/pg\/v1\/status\/[^/]+\/([^/?]+)/);
  if (upper === 'GET' && statusMatch) {
    const merchantTransactionId = decodeURIComponent(statusMatch[1]);
    const status = await getPhonePeOrderStatus(merchantTransactionId);
    const state = String(status.state || '').toUpperCase();
    const code = state === 'COMPLETED' ? 'PAYMENT_SUCCESS' : state === 'FAILED' ? 'PAYMENT_ERROR' : 'PAYMENT_PENDING';
    const detail = Array.isArray(status.paymentDetails) ? status.paymentDetails[0] || {} : {};
    // success stays true like v1's status call; callers read data.state.
    return {
      success: true,
      code,
      message: state === 'COMPLETED' ? 'Your payment is successful.' : `Payment ${state.toLowerCase() || 'pending'}`,
      data: {
        merchantTransactionId,
        transactionId: detail.transactionId || status.orderId || merchantTransactionId,
        amount: Number(status.amount || detail.amount || 0),
        state,
        responseCode: state === 'COMPLETED' ? 'SUCCESS' : state,
      },
    };
  }

  throw new PhonePeError(`Unsupported PhonePe call ${upper} ${path}`, 500);
};

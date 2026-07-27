// Razorpay / PhonePe HTTP clients, shared by every taxi checkout flow.
//
// These lived as private helpers inside airwaysController.js. Tours and treks
// need the exact same calls, and a second copy of a signature-verification
// routine is the last thing this codebase needs -- a drift between two copies
// of payment code is a silent money bug.
import crypto from 'node:crypto';
import { ApiError } from '../../../utils/ApiError.js';
import { env } from '../../../config/env.js';

export const getCurrentUserId = (req) => String(req.auth?.sub || req.user?._id || '').trim();

export const getFrontendBaseUrl = () => {
  const configuredOrigin = String(env.corsOrigin || '')
    .split(',')
    .map((value) => value.trim())
    .find((value) => value && value !== '*');

  return (configuredOrigin || 'http://localhost:5173').replace(/\/+$/, '');
};

const getPhonePeBaseUrl = (environment = 'test') => (
  String(environment).trim().toLowerCase() === 'production'
    ? 'https://api.phonepe.com/apis/hermes'
    : 'https://api-preprod.phonepe.com/apis/pg-sandbox'
);

const buildPhonePeChecksum = ({ payload = '', path = '', saltKey = '', saltIndex = '1' }) => {
  const digest = crypto
    .createHash('sha256')
    .update(`${payload}${path}${saltKey}`)
    .digest('hex');

  return `${digest}###${saltIndex}`;
};

export const phonePeRequest = async ({
  method,
  path,
  body,
  merchantId,
  saltKey,
  saltIndex,
  environment,
}) => {
  const normalizedMethod = String(method || 'GET').trim().toUpperCase();
  const encodedPayload =
    body && normalizedMethod !== 'GET'
      ? Buffer.from(JSON.stringify(body)).toString('base64')
      : '';
  const response = await fetch(`${getPhonePeBaseUrl(environment)}${path}`, {
    method: normalizedMethod,
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': buildPhonePeChecksum({
        payload: encodedPayload,
        path,
        saltKey,
        saltIndex,
      }),
      'X-MERCHANT-ID': merchantId,
      accept: 'application/json',
    },
    body: encodedPayload ? JSON.stringify({ request: encodedPayload }) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      response.status || 502,
      payload?.message || payload?.code || 'PhonePe request failed',
    );
  }

  return payload;
};

export const razorpayRequest = async ({ method, path, body, keyId, keySecret }) => {
  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(response.status || 502, payload?.error?.description || payload?.error?.message || 'Razorpay request failed');
  }

  return payload;
};

// Razorpay signs `${orderId}|${paymentId}` with the key secret. Constant-time
// compare so a wrong signature cannot be brute-forced a byte at a time.
export const verifyRazorpaySignature = ({ orderId, paymentId, signature, keySecret }) => {
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(String(signature || ''), 'utf8');

  return (
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer)
  );
};

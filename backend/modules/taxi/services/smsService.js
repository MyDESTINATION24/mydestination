import { env } from '../../../config/env.js';
import { ApiError } from '../../../utils/ApiError.js';
import { AdminBusinessSetting } from '../admin/models/AdminBusinessSetting.js';

const SMS_INDIA_HUB_ENDPOINT = process.env.SMS_BASE_URL || 'https://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
const DLT_TEMPLATE_TEXT =
  'Welcome to the ##var## powered by Appzeto.Your OTP for registration is ##var##.BGADEC';
const DEFAULT_BRAND_NAME = 'App';

const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());

const readValue = (...values) => {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      if (trimmedValue) {
        return trimmedValue;
      }
    }
  }

  return '';
};

const normalizeIndianPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '').trim();

  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
};

const maskSecret = (value) => {
  const stringValue = String(value || '');

  if (!stringValue) {
    return '';
  }

  if (stringValue.length <= 6) {
    return `${'*'.repeat(Math.max(stringValue.length - 2, 0))}${stringValue.slice(-2)}`;
  }

  return `${stringValue.slice(0, 3)}${'*'.repeat(stringValue.length - 6)}${stringValue.slice(-3)}`;
};

const getSmsIndiaHubConfig = () => {
  const user = readValue(env.sms?.indiaHub?.username, process.env.SMS_INDIA_HUB_USERNAME);
  const apiKey = readValue(env.sms?.indiaHub?.apiKey, process.env.SMS_INDIA_HUB_API_KEY);
  const senderId = readValue(env.sms?.indiaHub?.senderId, process.env.SMS_INDIA_HUB_SENDER_ID);
  const templateId = readValue(
    env.sms?.indiaHub?.dltTemplateId,
    process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID,
    '1007282516644508833',
  );

  return {
    user,
    apiKey,
    senderId,
    templateId,
  };
};

const logSmsConfigDebug = (config) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log('[smsService] resolved SMS auth config =', {
    user: config.user || '',
    apiKeyPresent: Boolean(config.apiKey),
    apiKeyMasked: maskSecret(config.apiKey),
    senderId: config.senderId || '',
    templateId: config.templateId || '',
  });
};

const logSmsPayloadDebug = (payload) => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const debugPayload = {};
  for (const [key, value] of payload.entries()) {
    debugPayload[key] = value;
  }

  console.log('[smsService] final payload before request =', debugPayload);
};

const parseProviderResponse = (responseText) => {
  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
};

const getConfiguredBrandName = async () => {
  try {
    const settings = await AdminBusinessSetting.findOne({ scope: 'default' })
      .select('general.app_name')
      .lean();

    return readValue(settings?.general?.app_name, DEFAULT_BRAND_NAME);
  } catch {
    return DEFAULT_BRAND_NAME;
  }
};

const renderOtpMessage = ({ appName, otp }) => {
  const cleanAppName = String(appName || 'App').replace(/\s+/g, '');
  return DLT_TEMPLATE_TEXT.replace('##var##', cleanAppName).replace('##var##', String(otp));
};

const isSuccessfulProviderResponse = (response, responseText) => {
  const parsed = parseProviderResponse(responseText);

  if (parsed && typeof parsed === 'object') {
    return response.ok && (String(parsed.ErrorCode || '') === '000' || String(parsed.ErrorMessage || '') === 'Done' || String(parsed.ErrorMessage || '') === 'Success');
  }

  const str = String(responseText || '').trim();
  return response.ok && (str.startsWith('Success') || str.includes('ErrorCode:000') || str.includes('JobId') || (!/error|invalid|failed|unauthor|reject|blank/i.test(str) && str.length > 0));
};

const buildSmsPayload = ({ phone, otp, appName }) => {
  const config = getSmsIndiaHubConfig();

  logSmsConfigDebug(config);

  if (!config.apiKey) {
    throw new ApiError(500, 'SMS India Hub API key is not configured');
  }

  if (!config.senderId) {
    throw new ApiError(500, 'SMS sender ID is not configured');
  }

  const normalizedPhone = normalizeIndianPhone(phone);
  if (!/^91\d{10}$/.test(normalizedPhone)) {
    throw new ApiError(400, 'A valid Indian mobile number is required for OTP');
  }

  const payload = new URLSearchParams({
    apikey: config.apiKey,
    sid: config.senderId,
    msisdn: normalizedPhone,
    msg: renderOtpMessage({ appName, otp }),
    fl: '0',
    gwid: '2',
  });

  if (config.user) {
    payload.set('user', config.user);
  }

  if (config.templateId) {
    payload.set('TemplateId', config.templateId);
  }

  logSmsPayloadDebug(payload);

  return payload;
};

export const sendOtpSms = async ({ phone, otp, purpose = 'otp' }) => {
  if (isTruthy(env.sms.useDefaultOtp)) {
    return {
      mode: 'debug',
      message: 'Default OTP mode enabled',
    };
  }

  const brandName = await getConfiguredBrandName();
  const payload = buildSmsPayload({ phone, otp, appName: brandName });
  const requestUrl = `${SMS_INDIA_HUB_ENDPOINT}?${payload.toString()}`;

  console.log(`📨 [smsService] Sending SMS GET request to SMSIndiaHub...`);
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
    },
  });

  const responseText = (await response.text()).trim();

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[smsService] SMS India Hub response =`, responseText);
  }

  const delivered = isSuccessfulProviderResponse(response, responseText);

  if (!delivered) {
    throw new ApiError(
      502,
      `SMS India Hub rejected ${purpose} request: ${responseText || response.statusText}`,
    );
  }

  const parsed = parseProviderResponse(responseText);
  return {
    mode: 'live',
    message: 'OTP sent successfully',
    providerResponse: responseText,
    jobId: parsed?.JobId || null,
  };
};

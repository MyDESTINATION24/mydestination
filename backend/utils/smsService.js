import axios from 'axios';
import { sendOtpSms } from '../modules/taxi/services/smsService.js';

class SMSIndiaHubService {
  constructor() {
    this.username = process.env.SMS_INDIA_HUB_USERNAME;
    this.apiKey = process.env.SMS_INDIA_HUB_API_KEY;
    this.senderId = process.env.SMS_INDIA_HUB_SENDER_ID || 'BGADEC';
    this.dltTemplateId = process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID || '1007282516644508833';
    this.baseUrl = 'https://cloud.smsindiahub.in/vendorsms/pushsms.aspx';
  }

  normalizePhoneNumber(phone) {
    const digits = String(phone || '').replace(/[^0-9]/g, '');
    if (digits.startsWith('91') && digits.length === 12) return digits;
    if (digits.length === 10) return '91' + digits;
    if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.substring(1);
    return '91' + digits.slice(-10);
  }

  async sendOTP(phone, otp, purpose = 'registration') {
    try {
      const res = await sendOtpSms({ phone, otp, purpose });
      return { success: true, response: res };
    } catch (err) {
      console.error('❌ SMS Service Error:', err.message);
      return { success: false, error: err.message };
    }
  }

  async sendSMS(phone, message) {
    try {
      const useDefaultOtp = ['1', 'true', 'yes', 'on'].includes(String(process.env.USE_DEFAULT_OTP || '').trim().toLowerCase());
      if (useDefaultOtp) {
        console.log(`[SMSIndiaHub] Default OTP mode enabled. Bypassing live SMS to ${phone}`);
        return { success: true, mode: 'debug', message: 'Default OTP mode enabled' };
      }

      const apiKey = this.apiKey || process.env.SMS_INDIA_HUB_API_KEY;
      const senderId = this.senderId || process.env.SMS_INDIA_HUB_SENDER_ID || 'BGADEC';
      const dltTemplateId = this.dltTemplateId || process.env.SMS_INDIA_HUB_DLT_TEMPLATE_ID || '1007282516644508833';

      if (!apiKey) {
        console.warn('⚠️ [SMSIndiaHub] Missing API Key. SMS NOT SENT.');
        return { success: false, error: 'Missing API Key' };
      }

      const normalizedPhone = this.normalizePhoneNumber(phone);

      const params = new URLSearchParams({
        APIKey: apiKey,
        msisdn: normalizedPhone,
        sid: senderId,
        msg: message,
        fl: '0',
        dc: '0',
        gwid: '2',
        TemplateId: dltTemplateId
      });

      const apiUrl = `${this.baseUrl}?${params.toString()}`;
      console.log(`📨 Sending SMS to ${normalizedPhone}...`);

      const response = await axios.get(apiUrl, {
        headers: { 'User-Agent': 'Rukkooin/1.0' },
        timeout: 10000
      });

      let responseData;
      if (typeof response.data === 'string') {
        try {
          responseData = JSON.parse(response.data);
        } catch {
          responseData = { raw: response.data };
        }
      } else {
        responseData = response.data || {};
      }

      const isSuccess = responseData.ErrorCode === '000' ||
        (typeof responseData.raw === 'string' && !/error|invalid|failed|unauthor|reject|blank/i.test(responseData.raw));

      if (isSuccess) {
        console.log('✅ SMS Sent Successfully');
        return { success: true, response: responseData };
      } else {
        const errorMsg = responseData.ErrorMessage || responseData.raw || 'SMS sending failed';
        console.error('❌ SMS Failed:', errorMsg);
        return { success: false, error: errorMsg };
      }

    } catch (error) {
      console.error('❌ SMS Service Error:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new SMSIndiaHubService();

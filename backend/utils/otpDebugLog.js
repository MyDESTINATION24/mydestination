// Prints an OTP to the server log, but only for phone numbers explicitly listed
// in OTP_DEBUG_PHONES. Testing the login flows needs a way to read the code
// without a handset; logging every user's OTP would instead mean anyone who can
// read the logs can take over any account, which is why the previous blanket
// debugOtp was removed.
//
// Set it as a comma separated list, e.g.
//   OTP_DEBUG_PHONES=9927035859,7223077890
// Leave it empty (or unset) and nothing is ever logged.

const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(-10);

const getAllowedPhones = () =>
  String(process.env.OTP_DEBUG_PHONES || '')
    .split(',')
    .map((entry) => normalizePhone(entry))
    .filter(Boolean);

export const isOtpDebugPhone = (phone) => {
  const allowed = getAllowedPhones();
  if (!allowed.length) {
    return false;
  }

  return allowed.includes(normalizePhone(phone));
};

export const logOtpForDebug = (phone, otp, context = 'otp') => {
  if (!isOtpDebugPhone(phone)) {
    return;
  }

  // Deliberately one line and easy to grep: pm2 logs beckend | grep OTP-DEBUG
  console.log(`[OTP-DEBUG] ${context} phone=${normalizePhone(phone)} otp=${otp}`);
};

// Run: node modules/taxi/admin/services/__tests__/adminResetPassword.test.mjs
import assert from 'node:assert/strict';

// Mirrors the guard in adminService.resetPassword.
const otpIsValid = (admin, otp) =>
  Boolean(
    admin &&
      admin.resetPasswordOtp &&
      admin.resetPasswordOtp === otp &&
      admin.resetPasswordExpires &&
      new Date() <= admin.resetPasswordExpires,
  );

const future = new Date(Date.now() + 5 * 60 * 1000);
const past = new Date(Date.now() - 60 * 1000);

// The takeover: an admin who never asked for a reset has both fields undefined.
// The old guard read `otp !== resetPasswordOtp` (undefined !== undefined = false)
// and `new Date() > undefined` (NaN compare = false), so it reset the password
// for anyone who simply omitted the otp field.
assert.equal(otpIsValid({ resetPasswordOtp: undefined, resetPasswordExpires: undefined }, undefined), false);
assert.equal(otpIsValid({ resetPasswordOtp: undefined, resetPasswordExpires: undefined }, ''), false);
assert.equal(otpIsValid({ resetPasswordOtp: '', resetPasswordExpires: future }, ''), false);

// A live OTP still has to match exactly and still has to be in date.
assert.equal(otpIsValid({ resetPasswordOtp: '123456', resetPasswordExpires: future }, '123456'), true);
assert.equal(otpIsValid({ resetPasswordOtp: '123456', resetPasswordExpires: future }, '654321'), false);
assert.equal(otpIsValid({ resetPasswordOtp: '123456', resetPasswordExpires: past }, '123456'), false);
assert.equal(otpIsValid(null, '123456'), false);

console.log('adminResetPassword: all assertions passed');

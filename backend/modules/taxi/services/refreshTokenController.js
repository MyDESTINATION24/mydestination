import { asyncHandler } from '../../../utils/asyncHandler.js';
import { revokeRefreshToken, rotateRefreshToken } from './refreshTokenService.js';

// Redeem a refresh token for a fresh access token. Deliberately unauthenticated:
// it is called precisely when the access token is expired, so requiring one
// would defeat the purpose. The refresh token itself is the credential.
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const raw = String(req.body?.refreshToken || '').trim();
  const result = await rotateRefreshToken(raw);

  res.json({ success: true, data: result });
});

// Sign out properly: burn the refresh token so it cannot be redeemed later.
export const revokeRefresh = asyncHandler(async (req, res) => {
  await revokeRefreshToken(String(req.body?.refreshToken || '').trim());

  res.json({ success: true, data: { revoked: true } });
});
